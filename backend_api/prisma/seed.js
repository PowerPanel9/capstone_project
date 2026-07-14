// seed.js
// Fills the database with starter listings so the app has real data to show.
// Run it with:  npm run seed      (or)   npx prisma db seed
//
// It is safe to run repeatedly: it clears the seeded listings/users first, then
// re-creates them, so you always end up with exactly this set (no duplicates).
//
// The fields are written to match the Prisma `Listing` schema directly:
//   price is a number, skillsRequired is an array, imageUrl is the photo,
//   category is a real ListingCategory enum value, and each listing is owned
//   by a real User row (userId FK).

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// On-theme side-hustle listings that map cleanly to the ListingCategory enum.
// Each `poster` becomes a User who owns the listing.
const seedListings = [
  {
    title: "Weekend Lawn Mowing & Yard Cleanup",
    category: "GARDENING",
    poster: { firstName: "Marcus", lastName: "Chen", location: "Lincoln, NE" },
    price: 40,
    description:
      "Need someone reliable to mow the front and back lawn, trim the edges, and bag the clippings every other weekend. Small yard, should take about an hour.",
    skillsRequired: ["Lawn Care", "Landscaping"],
    imageUrl:
      "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=900&h=480&fit=crop&auto=format",
  },
  {
    title: "Deep Clean for 2-Bedroom Apartment",
    category: "CLEANING",
    poster: { firstName: "Sarah", lastName: "Mills", location: "Omaha, NE" },
    price: 90,
    description:
      "Looking for a thorough deep clean before a move-out: kitchen, two bathrooms, floors, and windows. Supplies provided. Flexible on timing this week.",
    skillsRequired: ["Deep Cleaning", "Move-Out Cleaning"],
    imageUrl: null,
  },
  {
    title: "After-School Math Tutor (7th Grade)",
    category: "TUTORING",
    poster: { firstName: "Jordan", lastName: "Lee", location: "Remote" },
    price: 30,
    description:
      "Seeking a patient tutor to help my 7th grader with pre-algebra twice a week over video call. Goal is to build confidence before end-of-year exams.",
    skillsRequired: ["Math", "Pre-Algebra", "Tutoring"],
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&h=480&fit=crop&auto=format",
  },
  {
    title: "Fix a Leaky Kitchen Sink",
    category: "PLUMBING",
    poster: { firstName: "Emily", lastName: "Park", location: "Lincoln, NE" },
    price: 75,
    description:
      "The pipe under my kitchen sink has a slow leak and the faucet drips. Need someone with plumbing experience to diagnose and repair. Parts can be reimbursed.",
    skillsRequired: ["Plumbing", "Pipe Repair"],
    imageUrl: null,
  },
  {
    title: "Saturday Evening Babysitter for Two Kids",
    category: "BABYSITTING",
    poster: { firstName: "Priya", lastName: "Nair", location: "Bellevue, NE" },
    price: 60,
    description:
      "Need a trustworthy babysitter for our 4- and 6-year-old on Saturday evening (5-10pm). Dinner is prepped; mostly playtime and bedtime routine.",
    skillsRequired: ["Childcare", "First Aid"],
    imageUrl:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=900&h=480&fit=crop&auto=format",
  },
  {
    title: "Help Moving a Couch and Boxes",
    category: "MOVING",
    poster: { firstName: "Tom", lastName: "Garcia", location: "Omaha, NE" },
    price: 50,
    description:
      "Moving a few blocks away and need an extra set of hands for a couch, a mattress, and about 15 boxes. Truck is already rented — just need muscle for two hours.",
    skillsRequired: ["Heavy Lifting", "Moving"],
    imageUrl: null,
  },
];

// Turn "..@seed.local" emails so we can find and clear our seed users later.
function seedEmail(poster) {
  return `${poster.firstName}.${poster.lastName}@seed.local`.toLowerCase();
}

async function main() {
  console.log("Seeding database...");

  // ----- Reset: remove previously seeded data so re-running stays clean -----
  // We only touch rows created by this seed (users with @seed.local emails and
  // their listings), so real user/listing data is left alone.
  const seedEmails = seedListings.map((item) => seedEmail(item.poster));
  const seedUsers = await prisma.user.findMany({
    where: { email: { in: seedEmails } },
  });
  const seedUserIds = seedUsers.map((u) => u.id);

  if (seedUserIds.length > 0) {
    // Delete listings first (they reference users via a foreign key).
    await prisma.listing.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
    console.log(`  cleared ${seedUserIds.length} previous seed user(s) and their listings`);
  }

  // ----- Create fresh users + listings -----
  for (const item of seedListings) {
    const user = await prisma.user.create({
      data: {
        firstName: item.poster.firstName,
        lastName: item.poster.lastName,
        location: item.poster.location,
        email: seedEmail(item.poster),
        password: "seed-password", // placeholder; these are demo accounts
      },
    });

    await prisma.listing.create({
      data: {
        title: item.title,
        category: item.category,
        description: item.description,
        price: item.price,
        skillsRequired: item.skillsRequired,
        imageUrl: item.imageUrl,
        location: item.poster.location,
        userId: user.id,
      },
    });

    console.log(`  + "${item.title}" (${item.category}, owner: ${user.firstName} ${user.lastName})`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
