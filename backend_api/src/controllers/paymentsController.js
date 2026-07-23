// paymentsController.js
// The core marketplace money flow using "separate charges and transfers":
//   1. create-intent : client pays -> funds are HELD on the platform balance
//   2. release        : platform TRANSFERS the full amount to the provider's
//                       connected account (when the job is marked completed)
//
// No platform service fee is taken (full amount goes to the provider).
// TEST MODE: with sk_test_ keys, no real money moves.

const stripe = require("../utils/stripe");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/payments/create-intent
// Body: { application_id }
// The logged-in user must be the CLIENT (listing owner). Creates a held
// PaymentIntent for the accepted application and a Payment row (status HELD
// once paid). Returns the client secret for the frontend Payment Element.
async function createPaymentIntent(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { application_id } = req.body;
    if (application_id === undefined) {
      return res.status(400).json({ error: "application_id is required" });
    }

    // Load the application with its listing and the provider (who gets paid).
    const application = await prisma.application.findUnique({
      where: { id: application_id },
      include: { listing: true, provider: true },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Only the listing owner (client) can pay.
    if (application.listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // The application must be accepted before payment.
    if (application.status !== "ACCEPTED") {
      return res.status(400).json({ error: "Application must be accepted before payment" });
    }

    // The provider must have finished Stripe Connect onboarding to receive funds.
    if (!application.provider.stripeAccountId) {
      return res.status(400).json({
        error: "The provider hasn't set up payouts yet, so they can't be paid.",
      });
    }

    // Don't allow paying twice for the same application.
    const existing = await prisma.payment.findFirst({
      where: {
        applicationId: application.id,
        status: { in: ["HELD", "RELEASED"] },
      },
    });
    if (existing) {
      return res.status(400).json({ error: "This job has already been paid for" });
    }

    // Amount in cents. Listing price is a Decimal; convert to a whole-cent integer.
    const amount = Math.round(Number(application.listing.price) * 100);
    if (!amount || amount < 50) {
      // Stripe's minimum charge is 50 cents.
      return res.status(400).json({ error: "Listing price is too low to charge" });
    }

    // transfer_group links this charge to the later transfer to the provider.
    const transferGroup = `listing_${application.listingId}_app_${application.id}`;

    // Reuse an existing PENDING payment for this application instead of creating
    // a duplicate every time the pay modal opens. This avoids stray PENDING rows
    // that can shadow the real payment later.
    const pending = await prisma.payment.findFirst({
      where: { applicationId: application.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (pending && pending.stripePaymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(pending.stripePaymentIntentId);
        // Only reuse if it's still awaiting payment (not canceled/succeeded).
        if (["requires_payment_method", "requires_confirmation"].includes(existingIntent.status)) {
          return res.status(200).json({
            clientSecret: existingIntent.client_secret,
            paymentId: pending.id,
            amount: pending.amount,
          });
        }
      } catch {
        // If retrieval fails, fall through and create a fresh intent.
      }
    }

    // Create the PaymentIntent on the PLATFORM account (no transfer_data here) so
    // the funds are HELD on our balance until we explicitly release them.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      transfer_group: transferGroup,
      // Allow card payments but NOT redirect-based methods, so the whole flow
      // stays on our page (no off-site redirects to manage).
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        listingId: String(application.listingId),
        applicationId: String(application.id),
        providerId: String(application.providerId),
        clientId: String(req.user.userId),
      },
    });

    // Record the payment as PENDING until the webhook (or a later check) confirms
    // it succeeded. We store enough to release funds later.
    const payment = await prisma.payment.create({
      data: {
        listingId: application.listingId,
        applicationId: application.id,
        clientId: req.user.userId,
        providerId: application.providerId,
        amount,
        currency: "usd",
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        transferGroup,
      },
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount,
    });
  } catch (error) {
    console.error("createPaymentIntent error:", error.message);
    return res.status(500).json({ error: "Could not start payment" });
  }
}

// POST /api/payments/:id/release
// Releases HELD funds to the provider (full amount, no platform fee). Only the
// client who paid may release. Called when the job is marked completed.
async function releasePayment(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const paymentId = Number(req.params.id);
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { provider: true },
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Only the client who made the payment can release it.
    if (payment.clientId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // Must currently be HELD (paid but not yet released).
    if (payment.status !== "HELD") {
      return res.status(400).json({
        error: `Cannot release a payment that is ${payment.status}. It must be HELD.`,
      });
    }

    if (!payment.provider.stripeAccountId) {
      return res.status(400).json({ error: "Provider has no connected account to receive funds" });
    }

    // Transfer the full amount to the provider's connected account. Linking
    // source_transaction to the charge means Stripe waits until the charge funds
    // are available and won't fail for insufficient platform balance.
    const transfer = await stripe.transfers.create({
      amount: payment.amount,
      currency: payment.currency,
      destination: payment.provider.stripeAccountId,
      transfer_group: payment.transferGroup,
      metadata: { paymentId: String(payment.id) },
    });

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "RELEASED", stripeTransferId: transfer.id },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("releasePayment error:", error.message);
    return res.status(500).json({ error: "Could not release payment" });
  }
}

// GET /api/payments/listing/:listingId
// Returns the payment (if any) for a listing, so the frontend can show whether
// it's been paid / released. Visible to the client or the paid provider.
async function getPaymentForListing(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const listingId = Number(req.params.listingId);

    // Prefer a COMPLETED payment (HELD/RELEASED) if one exists — a listing can
    // have leftover PENDING rows from create-intent calls that were never paid,
    // and those shouldn't hide a real completed payment.
    let payment = await prisma.payment.findFirst({
      where: { listingId, status: { in: ["HELD", "RELEASED"] } },
      orderBy: { createdAt: "desc" },
    });
    // Fall back to the most recent payment of any status (e.g. still PENDING).
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { listingId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!payment) {
      return res.status(200).json(null); // no payment yet — not an error
    }

    // Only the client or the provider involved may view it.
    if (payment.clientId !== req.user.userId && payment.providerId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("getPaymentForListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// POST /api/payments/:id/invoice
// Generates a RECEIPT for an already-paid job as a Stripe invoice marked
// "paid out of band" (the money was already collected via the Payment Element,
// so this creates a paper trail without charging the client again).
// Only the client on the payment may generate it. Returns the hosted invoice URL.
async function generateInvoice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const paymentId = Number(req.params.id);
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { listing: true, client: true },
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Only the client who paid can generate the receipt.
    if (payment.clientId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // Only makes sense once the payment actually happened.
    if (payment.status !== "HELD" && payment.status !== "RELEASED") {
      return res.status(400).json({ error: "No completed payment to invoice yet" });
    }

    // If we already made a receipt, just return it (don't duplicate).
    if (payment.invoiceUrl) {
      return res.status(200).json({ invoiceUrl: payment.invoiceUrl, stripeInvoiceId: payment.stripeInvoiceId });
    }

    // Ensure the client has a Stripe Customer (invoices attach to a customer).
    let customerId = payment.client.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payment.client.email,
        name: `${payment.client.firstName} ${payment.client.lastName}`.trim(),
        metadata: { appUserId: String(payment.client.id) },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: payment.client.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create the (empty) invoice first, then attach the job as a line item
    // explicitly to THIS invoice. Creating the item with an explicit `invoice`
    // id guarantees it lands on this invoice before we finalize it (otherwise
    // the invoice can finalize empty at $0).
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      auto_advance: false,
      metadata: { paymentId: String(payment.id) },
    });

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: payment.amount,
      currency: payment.currency,
      description: `Payment for "${payment.listing.title}"`,
    });

    // Finalize (locks it + generates the hosted page). Then, unless Stripe has
    // already marked it paid, mark it paid out of band — the client already paid
    // via card, so we never charge them again.
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    let paidInvoice = finalized;
    if (finalized.status !== "paid") {
      paidInvoice = await stripe.invoices.pay(finalized.id, { paid_out_of_band: true });
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeInvoiceId: paidInvoice.id,
        invoiceUrl: paidInvoice.hosted_invoice_url,
      },
    });

    return res.status(200).json({
      invoiceUrl: updated.invoiceUrl,
      stripeInvoiceId: updated.stripeInvoiceId,
    });
  } catch (error) {
    console.error("generateInvoice error:", error.message);
    return res.status(500).json({ error: "Could not generate invoice" });
  }
}

module.exports = {
  createPaymentIntent,
  releasePayment,
  getPaymentForListing,
  generateInvoice,
};
