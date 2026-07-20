// seed.js
// Fills the database with starter data (users, listings, applications, messages, etc.)
// Run it with:  npm run seed      (or)   npx prisma db seed
//
// It is safe to run repeatedly: it clears the seeded data first (users with @seed.local emails),
// then re-creates them, so you always end up with exactly this set (no duplicates).

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Load seed data from JSON files
const dataDir = path.join(__dirname, "..", "src", "data");

const seedUsers = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedUsers.json"), "utf-8")
);

const seedListings = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedListings.json"), "utf-8")
);

const seedApplications = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedApplications.json"), "utf-8")
);

const seedMessages = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedMessages.json"), "utf-8")
);

const seedAgentConversations = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedAgentConversations.json"), "utf-8")
);

const seedReviews = JSON.parse(
  fs.readFileSync(path.join(dataDir, "seedReviews.json"), "utf-8")
);

// Turn poster info into email for lookups
function seedEmail(poster) {
  return `${poster.firstName}.${poster.lastName}@seed.local`.toLowerCase();
}

async function main() {
  console.log("Seeding database...");

  // ----- Reset: remove previously seeded data -----
  // Find all seed users (emails ending with @seed.local)
  const allSeedEmails = [
    ...seedUsers.map((u) => u.email),
    ...seedListings.map((item) => seedEmail(item.poster)),
  ];

  const seedUserRecords = await prisma.user.findMany({
    where: { email: { in: allSeedEmails } },
  });

  const seedUserIds = seedUserRecords.map((u) => u.id);

  if (seedUserIds.length > 0) {
    // Delete related data first (foreign key constraints)
    await prisma.agentConversation.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.message.deleteMany({
      where: {
        OR: [
          { userIdFrom: { in: seedUserIds } },
          { userIdTo: { in: seedUserIds } },
        ],
      },
    });
    await prisma.application.deleteMany({ where: { providerId: { in: seedUserIds } } });
    // Find seed users' listings so we can also clear bookmarks/applications that
    // NON-seed (real) users made against them — otherwise deleting those
    // listings below would violate the bookmark/application foreign keys.
    const seedListingRecords = await prisma.listing.findMany({
      where: { userId: { in: seedUserIds } },
      select: { id: true },
    });
    const seedListingIds = seedListingRecords.map((l) => l.id);

    await prisma.bookmark.deleteMany({
      where: {
        OR: [
          { userId: { in: seedUserIds } },
          { listingId: { in: seedListingIds } },
        ],
      },
    });
    await prisma.application.deleteMany({ where: { listingId: { in: seedListingIds } } });
    await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: { in: seedUserIds } },
          { revieweeId: { in: seedUserIds } },
        ],
      },
    });
    await prisma.listing.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
    console.log(`  cleared ${seedUserIds.length} previous seed user(s) and their data`);
  }

  // ----- Create provider users (for applications) -----
  console.log("\nCreating provider users...");
  const createdProviders = {};

  for (const userData of seedUsers) {
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        authProvider: userData.authProvider,
        bio: userData.bio,
        skills: userData.skills,
        location: userData.location,
        imageUrl: userData.imageUrl,
        resumeUrl: userData.resumeUrl,
        certificationUrl: userData.certificationUrl,
      },
    });

    createdProviders[user.email] = user;
    console.log(`  + ${user.firstName} ${user.lastName} (${user.email})`);
  }

  // ----- Create listing owners + listings -----
  console.log("\nCreating listings and their owners...");
  const createdListings = {};

  for (const item of seedListings) {
    // Create the listing owner (poster) if not already created
    const posterEmail = seedEmail(item.poster);
    let owner = createdProviders[posterEmail];

    if (!owner) {
      owner = await prisma.user.create({
        data: {
          firstName: item.poster.firstName,
          lastName: item.poster.lastName,
          location: item.poster.location,
          email: posterEmail,
          password: "seed-password",
          authProvider: "local",
        },
      });
      createdProviders[posterEmail] = owner;
      console.log(`  + ${owner.firstName} ${owner.lastName} (listing owner)`);
    }

    // Create the listing
    const listing = await prisma.listing.create({
      data: {
        title: item.title,
        category: item.category,
        customCategory: item.customCategory || null,
        description: item.description,
        price: item.price,
        skillsRequired: item.skillsRequired,
        imageUrl: item.imageUrl,
        location: item.poster.location,
        userId: owner.id,
      },
    });

    createdListings[item.title] = listing;
    console.log(`  + "${item.title}" (${item.category}, owner: ${owner.firstName})`);
  }

  // ----- Create applications -----
  console.log("\nCreating applications...");
  for (const app of seedApplications) {
    const provider = createdProviders[app.providerEmail];
    const listing = createdListings[app.listingTitle];

    if (!provider) {
      console.warn(`  ! Provider not found: ${app.providerEmail}`);
      continue;
    }

    if (!listing) {
      console.warn(`  ! Listing not found: ${app.listingTitle}`);
      continue;
    }

    await prisma.application.create({
      data: {
        providerId: provider.id,
        listingId: listing.id,
        status: app.status,
      },
    });

    console.log(`  + ${provider.firstName} applied to "${listing.title}" (${app.status})`);
  }

  // ----- Create messages -----
  console.log("\nCreating messages...");
  for (const msg of seedMessages) {
    const sender = createdProviders[msg.fromEmail];
    const recipient = createdProviders[msg.toEmail];

    if (!sender) {
      console.warn(`  ! Sender not found: ${msg.fromEmail}`);
      continue;
    }

    if (!recipient) {
      console.warn(`  ! Recipient not found: ${msg.toEmail}`);
      continue;
    }

    await prisma.message.create({
      data: {
        userIdFrom: sender.id,
        userIdTo: recipient.id,
        content: msg.content,
        imageUrl: msg.imageUrl,
      },
    });

    console.log(`  + Message: ${sender.firstName} → ${recipient.firstName}`);
  }

  // ----- Create agent conversations -----
  console.log("\nCreating agent conversations...");
  for (const conv of seedAgentConversations) {
    const user = createdProviders[conv.userEmail];

    if (!user) {
      console.warn(`  ! User not found: ${conv.userEmail}`);
      continue;
    }

    await prisma.agentConversation.create({
      data: {
        userId: user.id,
        messages: conv.messages,
        actionTaken: conv.actionTaken,
      },
    });

    console.log(`  + Agent conversation for ${user.firstName} (${conv.actionTaken})`);
  }

  // ----- Create reviews -----
  console.log("\nCreating reviews...");

  // Some reviews may point at a REAL account that the seed didn't create
  // (e.g. a developer's own account). If an email isn't in createdProviders,
  // fall back to looking the user up in the database by email.
  async function resolveUser(email) {
    if (createdProviders[email]) return createdProviders[email];
    const found = await prisma.user.findUnique({ where: { email } });
    if (found) createdProviders[email] = found; // cache for reuse
    return found || null;
  }

  for (const rev of seedReviews) {
    const reviewer = await resolveUser(rev.reviewerEmail);
    const reviewee = await resolveUser(rev.revieweeEmail);

    if (!reviewer) {
      console.warn(`  ! Reviewer not found: ${rev.reviewerEmail}`);
      continue;
    }

    if (!reviewee) {
      console.warn(`  ! Reviewee not found: ${rev.revieweeEmail}`);
      continue;
    }

    await prisma.review.create({
      data: {
        stars: rev.stars,
        title: rev.title,
        description: rev.description,
        imageUrl: rev.imageUrl || null,
        reviewerId: reviewer.id,
        revieweeId: reviewee.id,
      },
    });

    console.log(`  + ${reviewer.firstName} reviewed ${reviewee.firstName} (${rev.stars}★)`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
