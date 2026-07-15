# Reflection #1

Pod Members: **Ariane Doris Umuhire, Ardelia Putridaryana, Zainab Adeola**

## Reflection Questions

* Name at least one successful thing this week.

 We successfully implemented Google OAuth authentication and added authentication persistence with protected routes. This was a major milestone because it secures our platform and ensures that only logged-in users can access features like creating listings and bookmarking. We also completed the listings backend (with filters and search functionality), the bookmark feature, and wired the backend to the frontend. The team worked well together, with everyone contributing commits throughout the week.

* What were some challenges you and/or your group faced this week?

 We ran into several technical challenges this sprint. Ardelia had merge conflicts that took time to resolve, especially when merging the listings and bookmark features. We also discovered that our seed data didn't match the fields in our data model — for example, some sample listings were missing required fields like `skills_required` or `location`, which caused errors when we tried to test the API. Additionally, we realized we were missing some UI components in our original Figma designs, like the AuthSuccess and AuthFailure pages, which we had to design and implement mid-sprint.

* Did you finish all of your tasks in your sprint plan for this week? If you did not finish all of the planned tasks, how would you prioritize the remaining tasks on your list?  (i.e over planned, did not know how to implement certain features, miscommunication from the team, had to pivot from original plans, etc.)

 Yes, we finished all of our planned tasks for Sprint 1. We completed authentication (including Google OAuth), listings CRUD with search/filter, bookmarks, protected routes, seed data updates, and the frontend landing page. Each team member was able to contribute features — Zainab focused on auth and UI, Ardelia worked on listings and bookmarks, and Ariane built out the user backend. The scope was ambitious but realistic.

* Did the resources provided to you help prepare you in planning and executing your capstone project sprint this week? Be specific, what resources did you find particularly helpful or which tasks did you need more support on?

 Yes, the resources were helpful. The `project_plan.md` template kept us organized — we referenced the API Contracts section every time we built a new route, and the Data Model section helped us catch the mismatch between our seed data and schema. Claude was very useful for implementing Figma designs into React components and for generating boilerplate Express routes. We used Figma heavily this week to design the landing page, auth modals, and topbar. One area we needed more support on was understanding how to structure protected routes in React Router — we had to research and experiment before getting it working correctly.

* Which features and user stories would you consider “at risk”? How will you change your plan if those items remain “at risk”?

 The **user profile search feature** (User Story AI 4: “As a client, I want to see a list of braiders that match my style”) is at risk because we haven't started the AI agent implementation yet, and search depends on having the agent working. If it remains at risk in Sprint 2, we will prioritize building a simpler version first — a basic keyword search using the existing `/api/listings?search=` endpoint — before adding the AI-powered matching. We may also need to push the full AI agent chat interface to Sprint 3 and focus Sprint 2 on getting the core matching logic working on the backend.
