# Reflection #3

Pod Members: **Ardelia, Zainab, Doris**

## Reflection Questions

* Name at least one successful thing this week.

 One successful thing this week was getting the AI chatbot feature working and deployed to production. After several attempts debugging token limit issues and adjusting the `max_completion_tokens` parameter, we successfully got the AI chat responding to user queries on the deployed site. We also made significant progress on mobile responsiveness, fixing how images fit on smaller screens and improving the overall UI across different device sizes. Additionally, we fixed critical bugs in the Stripe payment flow and the create listing feature (by properly passing `.env` variables), which improved the stability of our core marketplace functionality. These wins demonstrate that we're not just building new features — we're also hardening what we've already built.

* What were some challenges you and/or your group faced this week?

 Our biggest challenge this week was debugging issues that behaved differently between local development and the deployed production site. The AI chatbot worked fine locally but kept failing on Render with token limit errors, which took multiple deploy cycles to diagnose and fix — we had to experiment with different `max_completion_tokens` values (increasing from the default to 2000) before finding a configuration that worked reliably in production. Similarly, the create listing form broke on the deployed site because environment variables weren't being passed correctly, requiring us to restructure how we referenced `.env` parameters. Another challenge was coordinating UI fixes across three people — we all noticed different visual bugs (image sizing, text overflow, button styling, spacing issues) and had to merge carefully to avoid undoing each other's fixes. The mobile responsiveness work in particular touched many shared components, so we had to test thoroughly on both mobile and desktop after each merge to catch regressions.

* Did you finish all of your tasks in your sprint plan for this week? If you did not finish all of the planned tasks, how would you prioritize the remaining tasks on your list?  (i.e over planned, did not know how to implement certain features, miscommunication from the team, had to pivot from original plans, etc.)

 We finished most of our Sprint 3 tasks but had to pivot several times to address production bugs and deployment issues that weren't in the original plan. We completed the AI chatbot feature, improved mobile responsiveness, fixed the Stripe payment flow, added the category scroll feature, and made substantial UI improvements across the site. However, some tasks took longer than expected because production bugs forced us to shift priorities — for example, we spent unplanned time fixing the create listing `.env` issue and debugging the AI chat token limits on the deployed site, which delayed some of the polish work we had planned for other features. If we had tasks remaining, we would prioritize in this order: (1) critical bugs that break core user flows (payments, auth, listing creation), (2) features that are partially implemented and need completion (AI chat reliability, role switching), (3) UI polish and mobile responsiveness improvements, and (4) stretch features like advanced search or additional AI capabilities. The lesson here is that once you deploy to production, you have to budget time for fixing issues that only appear in the real environment — local development can't catch everything.

* Did the resources provided to you help prepare you in planning and executing your capstone project sprint this week? Be specific, what resources did you find particularly helpful or which tasks did you need more support on?

 The resources were helpful this week, especially for debugging production issues. Claude was particularly useful for diagnosing the token limit error in the AI chat — it helped us understand that `max_completion_tokens` needed to be set explicitly and guided us through testing different values. The Stripe documentation from Sprint 2 continued to pay off when we had to revisit the payment flow to fix bugs. Our planning documents (especially the API contracts in `project_plan.md`) were helpful for coordinating UI changes — knowing exactly what data shape to expect from the backend prevented confusion when multiple people were editing the frontend. However, we could have used more support on two areas: (1) environment variable management and secrets handling in deployed environments (Render) versus local development — a guide on this would have saved us time debugging the `.env` issue, and (2) debugging strategies for production-only bugs, like using remote logging and setting up better error reporting so we can diagnose issues without having to re-deploy repeatedly. A resource on production debugging workflows would be very valuable heading into Sprint 4.

* Which features and user stories would you consider “at risk”? How will you change your plan if those items remain “at risk”?

 **What the spec audit during the bug bash surfaced:**
 [**Team: Add your bug bash findings here** — what gaps did you find between your documented behavior in `project_plan.md` and the actual behavior of the app? For example: API endpoints that don't match the spec, missing error handling, UI flows that work differently than documented, features marked as “done” but partially broken. Document the specific issues you found and how you addressed them. Also note if your Spec Reconciliation — Bug Bash section is committed to the repo.]
 
 **Going into Sprint 4, is your master spec accurate?**
 [**Team: Add status here** — is `project_plan.md` up to date with all the features you actually built? Which sections need updating? For example: Do your API contracts still match your routes? Are the user flows accurate? Is the data model current? List what's accurate and what needs revision.]
 
 **At-risk features and user stories:**
 Based on our Sprint 3 experience, we consider these features “at risk” going into Sprint 4:
 
 1. **AI chatbot reliability and advanced AI features (AI 1, AI 2, AI 3, AI 4)** — The basic chat works now, but we're still seeing inconsistent responses and we haven't fully validated that it handles edge cases (empty queries, nonsensical input, high request volume). The advanced AI features like AI-powered price suggestions and style matching are still unimplemented or partially working. If these remain at risk, we'll keep the manual fallbacks (browse/search without AI) as the primary path and treat AI as an enhancement, not a requirement.
 
 2. **Mobile responsiveness completeness** — We fixed many mobile UI bugs this sprint, but we haven't systematically tested every page and user flow on mobile devices. If this stays at risk, we'll prioritize getting the core user flows (browse listings, view detail, create listing, complete payment) working perfectly on mobile before polishing secondary pages.
 
 3. **Role switching and provider onboarding edge cases** — From Sprint 2 we know this feature is fragile (database sync issues, shared file conflicts). If it stays at risk, we'll ensure the “sign up as Both” path is rock-solid and treat “add a role later” as a stretch goal.
 
 4. **Production environment stability** — This sprint taught us that production bugs (environment variables, token limits, deployment config) can consume unexpected time. For Sprint 4, we'll build in more buffer time for production testing and deploy early in the sprint rather than at the end, so we catch deployment issues before the deadline.
 
 Our plan change: In Sprint 4 we'll shift from feature building to **feature hardening**. Instead of adding new capabilities, we'll focus on making existing features reliable, completing partial implementations, fixing known bugs, and ensuring the deployed site matches our spec. We'll also allocate at least 20% of sprint time specifically for production testing and bug fixes, rather than assuming everything will work the first time.
