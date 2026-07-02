## MVP Sprint Plan — Side Hustle

### Week 5
- Planning the sprints
- Narrowing down features
- Finalizing `user_stories.md` and wireframes

---

### Sprint 1 — Week 6 (Setup Application)

**Goal 1:** The app exists, and users can sign up and log in as a client or worker.  
**Goal 2:** Build the home page.

**Tasks for Goal 1**
- Project setup (`React` frontend, `Node/Express` backend, `PostgreSQL` database)
- Database schema: `users` table with role field (`client` / `worker`)
- Auth: register, login, logout (`JWT` or sessions)
- Basic navigation shell (header + routing)
- Protected routes based on role

**Tasks for Goal 2**
- Set up buttons to switch between pages
- Create initial design layout/placement
- Add dummy data for listings

**Done When**
- **Goal 1:** July 8, 2026
- **Goal 2:** July 10, 2026

---

### Sprint 2 — Week 7 (User Profile & Listings)

**Goal 1:** Complete user profile.  
**Goal 2:** Complete listings.

**Tasks for Goal 1**
- Provider profile page (bio, skills, rate, availability toggle)
- Client profile page (same core structure as provider)
- Client can create a post (plus button flow)
- Edit profile functionality
- Profile details: skills, listing count, review section (clickable), profile pic, name, location

**Tasks for Goal 2**
- Listing card component (title, category, price, worker name/photo)
- Browse/search listings page with category filter
- Individual listing detail page
- Client can post a new job listing
- Listings linked to the worker who created them

**Done When**
- **Sprint 2 complete:** July 17, 2026

---

### Sprint 3 — Week 8 (Chat, Reviews, Skills, AI)

**Goal 1:** Complete chat, review, and skills page.  
**Goal 2:** Complete AI search/matching features.

**Tasks for Goal 1**
- Direct messaging between client and worker
- Conversation list view (inbox)
- Review form after a job is marked complete
- Display reviews on worker profile with average rating
- Review count linked/clickable from profile
- Skills page showing resume and previous work

**Tasks for Goal 2**
- AI matching endpoint that takes a job post and returns ranked worker recommendations
- Recommended workers displayed on job post page
- Worker notified of jobs matching listed skills
- Filter/sort listings by AI relevance score
- Test matching accuracy with dummy data

**Done When**
- **Goal 1:** July 22, 2026
- **Goal 2:** July 24, 2026

---

### Sprint 4 — Week 9 (Test & Stabilize)

**Goal:** Full app flow works without breaking: a client can post a job, find a worker, message them, and leave a review.

**Tasks**
- End-to-end testing of client flow (sign up -> post job -> get matches -> message worker)
- End-to-end testing of worker flow (sign up -> build profile -> apply/get matched -> receive review)
- Fix auth edge cases (expired tokens, wrong role access)
- Polish error states (empty feeds, failed API calls, no search results)
- Mobile responsiveness pass on all main pages

**Done When**
- **Sprint 4 complete:** July 31, 2026

---

### Sprint 5 — Week 10 (Demo Prep & Final Touches)

**Goal:** App is presentable, stable, and tells a clear story for demo day.

**Tasks**
- Seed database with realistic demo data (workers, listings, reviews, messages)
- Polish UI (consistent spacing, colors, fonts)
- Prepare demo walkthrough script/recording
- Deploy to a live URL (`Render`, `Railway`, or similar)
- Final check: all stories in `user_stories.md` are covered or documented as cut

**Done When**
- **Demo walkthrough runs without errors start-to-finish:** August 5, 2026

---

## MVP Definition

### Core features included
- **Authentication:** User signup/login/logout with role-based access (`client`, `provider`)
- **Profile Management:** Create and edit client/provider profiles
- **Listings:** Clients create/manage job listings; providers browse listings
- **Search & Discovery:** Filter/search listings by category/location
- **Messaging:** Direct client-provider chat for job coordination
- **Reviews:** Clients leave reviews after completion; ratings shown on provider profiles
- **AI Matching:** AI suggests relevant providers/listings based on job and skills

### Features intentionally cut
- In-app payments/escrow
- Video calling
- Advanced analytics dashboard
- Multi-language localization
- Full notification center (push + email + SMS)
- Provider verification/KYC workflow

### Known limitations
- AI matching quality depends on limited MVP data
- Messaging is basic (no attachments, no read receipts)
- No payment processing in MVP
- Limited moderation/reporting tools
- Some edge cases may still require manual QA before demo