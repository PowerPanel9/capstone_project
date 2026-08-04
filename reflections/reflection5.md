# Reflection #5

Pod Members: **Zainab Adeola, Ariane Doris Umuhire, Ardelia Putridaryana**

## Reflection Questions

* **How was the pacing of the capstone project? (i.e too slow, just right, too fast)**

The pacing felt fast, especially in the later sprints when we were building the AI features alongside payments and image uploads at the same time. The first two sprints gave us enough time to plan and lay groundwork, but Sprints 3 and 4 compressed a lot of new technology (Stripe, S3, Claude API, Prisma) into a short window. Looking back, we probably would have scoped the payment feature out of the core MVP and shipped it as an extension — it added complexity that slowed down the AI feature work, which was the main differentiator of our app.

* **To what extent did your plan change over the course of development? Knowing that you know now, what would you do differently if you were starting over?**

Our plan changed significantly in a few specific areas:

1. **LocationIQ was cut.** We originally planned to store location as coordinates and use LocationIQ for address autocomplete and proximity search. We dropped it when the production API key required a credit card. We replaced it with plain text location search, which works well enough for a demo but means no real geolocation.

2. **`is_client` boolean became a `UserRole` enum.** We realized a boolean couldn't represent users who are both clients and providers, so we switched to `CLIENT`, `PROVIDER`, and `BOTH`.

3. **The Experience model was added mid-project.** Story 9 ("display previous work") was vague in the plan. We built a full `Experience` model with images, category, and description — this was not scoped initially but became important to the provider profile.

4. **Payments went much deeper than planned.** We planned to "use Stripe," but implementing the escrow model (hold funds → release on completion) plus Stripe Connect provider onboarding plus webhooks was a multi-week effort we underestimated.

5. **Four AI features shipped instead of one.** The original plan described one chatbot. By the end we had: the chatbot, price intelligence, personalized feed, and AI applicant ranking — each as a separate service. This was the right call architecturally.

If we were starting over, we would: (a) lock the data model earlier and not change column names mid-sprint, (b) skip payments in the core MVP and treat it as a stretch feature, (c) plan the AI services as four distinct features from day one instead of discovering them during implementation.

* **How helpful were the labs and weekly assignments in preparing you to create a capstone project? Be specific, what topics do you still have questions about that may or may not have been covered?**

The labs were very helpful for the core PERN stack: Express routing, React state, PostgreSQL queries, and connecting frontend to backend. They gave us a strong foundation for the majority of the project.

Topics we still have questions about:

- **ORM vs. raw SQL tradeoffs.** We chose Prisma and it worked well, but we are not sure when you would prefer raw SQL in a real production codebase and what the performance differences are.
- **File upload patterns.** The labs used URLs, not actual file uploads. Building the S3 upload flow from scratch with multer and presigned URLs required a lot of research outside the course material.
- **Stripe webhooks and idempotency.** Handling payment lifecycle events reliably (what if a webhook fires twice?) was not covered anywhere in the labs, and it took real debugging to get right.
- **OAuth flows.** Google OAuth works differently from JWT-only auth, and the callback/redirect pattern was confusing at first. A lab on this would have saved significant time.

* **When planning for the capstone project, which resources were the most helpful? (i.e mentors, instructors & TAs, ideation process, pod syncs, wireframes, sprint planning, bug bash, practice demo day, etc.)**

The most helpful resources were:

- **Sprint planning sessions** — Breaking features into sprints forced us to prioritize and prevented scope creep in the early weeks.
- **Wireframes** — Having agreed-on screens before writing code reduced back-and-forth about what a component should look like or do.
- **Mentors and TAs during bug bash** — The bug bash was the most valuable single session. Getting external eyes on the app caught three bugs in one afternoon that we had been looking at for days without seeing.
- **Pod syncs** — Regular check-ins kept all three of us aligned on who owned which feature and prevented merge conflicts from piling up.

The practice demo day was also useful — seeing the demo in a presentation context made us cut two features that worked but were confusing to explain, which made the final demo cleaner.
