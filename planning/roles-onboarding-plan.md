# Roles, Onboarding & Views — Team Work Plan

**Team:** Zainab · Ardelia · Doris
**Goal:** Let users sign up as **Client**, **Provider**, or **Both**; onboard providers with extra questions; land each user in the correct view; show providers under categories in the client view; and make experiences look like Instagram-style posts.

---

## 1. The Big Picture (what we're building)

```
Sign up ──▶ Pick role (Client / Provider / Both)
                    │
        ┌───────────┴────────────┐
     Client                  Provider / Both
     (done)                       │
                          Onboarding pages ask:
                          • service category
                          • location
                          • resume (optional)
                          • experience (optional)
                          • bio
                                  │
                                  ▼
              Land in the view you signed up for
                                  │
   ┌──────────────────────────────┴───────────────────────────┐
Client view:                                     Provider view:
• Toggle says "Sign up as a provider"            • Toggle says "Sign up as a client"
  if you're client-only                            if you're provider-only
• Click a category → see PROVIDERS                • normal listings feed
  who do that service                            
• Experiences show as Instagram-style posts      
  (name + profile pic)                           
```

---

## 2. Why the work is dependent (read this first)

Everything sits on **one missing thing**: the `User` table has **no role field yet**. The
`getProviders` endpoint even says so in a comment:

> *"For now every user is treated as a provider. Later, when users can choose to be a provider
> or a client, we'll filter on that flag here."*

So all three tasks need the `role` field to exist. If we all start editing at once, we'll
collide on the same three files: `schema.prisma`, `authController.js`, and `App.jsx`.

```
              ┌────────────────────────────────┐
              │   role field on User (schema)   │  ← EVERYTHING needs this first
              └────────────────────────────────┘
                     │                    │
        ┌────────────┘                    └──────────────┐
   Zainab (¶1)                                       Ardelia (¶2)
   writes role at signup                        reads role to route + toggle
   + onboarding pages                           filters providers by role + category
                                                          │
                                                     Doris (¶3)
                                            experience posts need each experience
                                            to include the poster's name + profile pic
```

---

## 3. The Fix: agree on "contracts" first, THEN work in parallel

A **contract** is the shape of shared data we all agree on *before* writing code. Once we agree,
each person can build against the known shape — even before the other person's code is merged
(by using fake/hardcoded data temporarily). This is what lets 3 people work at once without
blocking each other.

### Kickoff meeting (~30 min, all three of us). Decide & write down:

1. **The `role` field** — name + values.
   Proposed: `role String @default("CLIENT")` holding `"CLIENT" | "PROVIDER" | "BOTH"`.
   *(Owner: Zainab — she writes the migration.)*

2. **What the user object returns.** `makeUserPublic` (in `authController.js`) and the profile
   endpoints must include: `role`, `firstName`, `lastName`, `profilePicture`.
   *(Ardelia AND Doris both depend on this.)*

3. **`GET /api/users/providers`** — what it accepts and returns.
   Proposed: accepts `?category=CLEANING`; returns users whose `role` is `PROVIDER` or `BOTH`
   and who match that service. *(Owner: Ardelia.)*

4. **Experience API response** — must include the poster:
   `experience.user = { firstName, lastName, profilePicture }`.
   Check `experienceController.js` — if it doesn't already `include` the user, that's a small
   backend add. *(Owner: Doris, with Zainab's help if needed.)*

5. **Onboarding: when is the user created?**
   **Decision → Option A (recommended):** `register` creates the account (with `role`) and logs
   the user in. The onboarding pages then call the existing `PUT /api/users/:id` to fill in
   provider fields one step at a time.
   *Why: reuses the update endpoint we already have, each page is a small save, and an abandoned
   onboarding still leaves a usable account.*

6. **Onboarding route names** (so Zainab & Ardelia don't collide in `App.jsx`).
   Proposed: `/onboarding/role`, `/onboarding/provider`.

---

## 4. Who does what

### 🟣 Zainab — ¶1: Role selection + provider onboarding

**Ship in two PRs so you unblock the others fast.**

**PR 1 (do this first — unblocks everyone):**
- Add `role` field to `User` in `backend_api/prisma/schema.prisma` + run the migration.
- Add `role` to `makeUserPublic` in `backend_api/src/controllers/authController.js`.
- Update `register` to save the chosen `role`.

**PR 2 (the onboarding wizard):**
- Add a role-pick step to `frontend_ui/src/components/AuthModal/AuthModal.jsx`.
- New onboarding pages (new folder, e.g. `components/Onboarding/`) that ask providers for:
  service category, location, resume (optional), experience (optional), bio.
- Each page saves via `PUT /api/users/:id` (fields already exist: `skills`, `location`,
  `resumeUrl`, `bio`).
- Coordinate route names with Ardelia (she owns `App.jsx` routing).

**Files:** `schema.prisma`, `authController.js`, `AuthModal.jsx`, new `Onboarding/` components,
+ small route additions in `App.jsx` (agree with Ardelia).

---

### 🔵 Ardelia — ¶2: Right view + toggle + category→providers

- **Land in the right view:** in `frontend_ui/src/App.jsx`, use `currentUser.role` to set
  `userMode` after signup (in `handleAuthSuccess`).
- **Smarter toggle:** change `toggleUserMode` so a single-role user sees *"Sign up as a
  provider / client"* instead of silently switching.
- **Category → providers:** clicking a category in
  `frontend_ui/src/components/CategoryGrid/CategoryGrid.jsx` should show **providers** for that
  service, not listings. Touches `CategoryGrid.jsx`, the `HomePage` logic in `App.jsx`, and the
  `getProviders` filter in `backend_api/src/controllers/userController.js` (filter by role +
  category).

**You own `App.jsx`** — the file all three of us touch. Zainab & Doris keep their `App.jsx`
edits minimal and check with you first.

**Files:** `App.jsx`, `CategoryGrid.jsx`, `userController.js` (getProviders), `api/users.js`.

---

### 🟢 Doris — ¶3: Instagram-style experience posts

- Reshape experience cards in `frontend_ui/src/components/HomeView/HomeView.jsx` from the
  current grid tiles into **post-style cards** showing the poster's **name + profile picture**
  (like Instagram), plus the image and title.
- Make sure the experience API returns the poster — confirm/add `user` include in
  `backend_api/src/controllers/experienceController.js` (contract #4).
- Style in `HomeView.css` (or a new component if the card gets big).

**Files:** `HomeView.jsx`, `HomeView.css`, `experienceController.js` (if include is missing).

---

## 5. Merge order (avoid conflicts)

1. **Zainab's PR 1** (schema + `role` in user object) merges **first**. This unblocks everyone.
2. Ardelia and Doris **rebase on `main`**, then merge in any order.
3. Zainab's PR 2 (onboarding) merges when ready.

---

## 5a. Avoiding merge conflicts (IMPORTANT — read together)

**Good news:** 7 of our files have a single owner and will NEVER conflict. The whole risk is
just **two files**. Here's the full map:

| File | Who touches it | Risk |
|------|----------------|------|
| `frontend_ui/src/App.jsx` | Zainab (onboarding routes) + Ardelia (routing/toggle) | 🔴 HIGH |
| `backend_api/src/controllers/userController.js` | Zainab (`role` in selects) + Ardelia (`getProviders`) | 🟡 MEDIUM |
| `backend_api/src/controllers/experienceController.js` | Doris (+ Zainab if she helps) | 🟢 LOW |
| `schema.prisma`, `authController.js`, `AuthModal.jsx`, new `Onboarding/` folder | **Zainab only** | ✅ none |
| `CategoryGrid.jsx`, `api/users.js` | **Ardelia only** | ✅ none |
| `HomeView.jsx`, `HomeView.css` | **Doris only** | ✅ none |

### The rules that prevent conflicts

**🔴 App.jsx → Ardelia owns it. Zainab does NOT edit it.**
Instead, Zainab tells Ardelia the route names she needs (`/onboarding/role`,
`/onboarding/provider`) and which component renders each. Ardelia adds those `<Route>` lines as
part of her routing work. Zainab only builds the onboarding *components* in her own new
`Onboarding/` folder — which nobody else touches. → Only one person ever edits App.jsx = no conflict.

**🟡 userController.js → different functions, Zainab merges first.**
Zainab adds `role: true` to the `select` objects at the top (~line 6) as part of PR 1.
Ardelia only edits the `getProviders` function (~line 149). Different functions, far apart, and
Zainab's change is already merged before Ardelia starts → git auto-merges cleanly.

**🟢 experienceController.js → Doris owns it.**
If she needs backend help, she pairs with Zainab rather than both editing it separately.

**Shared-file summary:**
- `schema.prisma` + `authController.js` → Zainab's, before anyone else edits them.
- `App.jsx` → Ardelia only.
- `userController.js` → Zainab does the selects (PR 1) first, then Ardelia does `getProviders`.
- `experienceController.js` → Doris only.

### The one habit that prevents 90% of conflicts

**Zainab's PR 1 merges first → everyone runs `git pull` / rebases on `main` before continuing.**
Because the foundational changes are already on `main`, Ardelia and Doris start from a codebase
that already has them, so they're never editing the same lines Zainab edited.

---

## 6. How to work in parallel BEFORE code is merged

You don't have to wait for each other — build against the agreed contracts using fake data:

- **Ardelia:** hardcode `currentUser.role = "PROVIDER"` locally to build the toggle/routing UI.
  Swap for real data once Zainab's PR 1 lands.
- **Doris:** hardcode a fake `experience.user = { firstName: "Jane", profilePicture: "..." }`
  to build the post card. Swap for the real include once it's added.

When the real data arrives, you just delete the fake line. Nothing else changes.

---

## 7. Quick test checklist (per your project's debugging flow)

- Start backend (`backend_api`) and frontend (`frontend_ui`).
- Sign up as **Client**, **Provider**, and **Both** — confirm each lands in the right view.
- As a provider, finish onboarding and confirm the fields saved (check the profile).
- In client view, click a category → confirm a list of **providers** appears.
- As a client-only user, click the toggle → confirm it says *"Sign up as a provider"*.
- Confirm experiences render as posts with name + profile pic.
- Watch the terminal and browser console for errors at each step.
