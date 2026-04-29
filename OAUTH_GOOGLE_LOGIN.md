# Google OAuth Login — Implementation Analysis & Plan

**Scope:** Add "Sign in / Sign up with Google" to the altamoda web app, **for B2C users only**. B2B users must continue using the regular email + password registration (which requires admin approval) and the regular email + password login.

**Author:** Analysis prepared 2026-04-29
**Branch:** `feature/google-apple-login`
**Status (code):** ✅ Implemented — schema migrated, providers wired, UI updated, i18n added. Typechecks clean.
**Status (deploy):** ⏳ Awaiting Google Cloud Console credentials (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`). See **Appendix A** for the step-by-step walkthrough.
**Apple "Sign in with Apple":** Intentionally **out of scope** for this iteration (requires $99/yr Apple Developer Program). Documented as a future follow-up in §9.

---

## 1. Executive Summary

The codebase is already very well prepared for this feature:

- NextAuth.js v5 (`next-auth@5.0.0-beta.30`) is installed and active.
- `@auth/prisma-adapter` is wired up in `src/lib/auth.ts`.
- The login page already shows **non-functional** Google and Facebook buttons that currently `alert("comingSoon")` (`src/app/account/login/page.tsx:241-250`).
- `.env.example` already contains placeholder env vars for Google: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- The user model already has `role` (`b2c | b2b | admin`) and `status` (`active | pending | suspended`) enums in `prisma/schema.prisma:111-133`, which is exactly what we need to enforce the "B2C only" rule.

**Therefore, the work is mostly:**

1. Configure the Google provider in NextAuth.
2. Adapt the Prisma schema to allow OAuth users (nullable `password_hash`, add NextAuth's `Account` table).
3. Add B2C-only enforcement in the `signIn` callback.
4. Wire the existing UI button to `signIn("google")`.
5. Provision OAuth credentials in Google Cloud Console.

There is **no need** to migrate to a different auth library, swap session strategy, or rewrite the login page from scratch.

---

## 2. Cost Analysis — Free

### 2.1 Google OAuth — Free
- **Google Identity / OAuth 2.0** is **completely free**, with no quota cost for sign-in flows.
- You only need a Google Cloud project (free tier).
- The OAuth consent screen requires verification only if requesting **sensitive scopes** (Gmail, Drive, etc.). For login we use `openid email profile` — these are **non-sensitive**, so verification is **not required**, and there is **no per-user cost**.
- **Action items have no cost:** creating a Cloud project, configuring the OAuth consent screen, generating Client ID + Client Secret.

### 2.2 NextAuth.js — Free
- `next-auth` is open-source (ISC license). No license fee, no per-MAU cost.
- Sessions are issued as JWTs signed with `AUTH_SECRET` and stored in HTTP-only cookies — no third-party identity provider service is required.

### 2.3 Total recurring cost for this feature
| Item | Cost |
|------|------|
| Google OAuth | **Free** |
| NextAuth.js | **Free** |
| Database (already paid) | No additional cost |
| **Total new recurring cost** | **$0** |

> Apple "Sign in with Apple" would have added **$99/year** (Apple Developer Program). Skipped for now — see §9.

---

## 3. How Google OAuth Works (Quick Reference)

The flow is the standard Authorization Code flow with PKCE:

1. User clicks "Continue with Google" on `/account/login`.
2. Frontend calls NextAuth's `signIn("google")`. NextAuth redirects the browser to Google's authorization endpoint with our `client_id` and a redirect back to `/api/auth/callback/google`.
3. User authenticates with Google and consents to share `email`, `name`, `picture`.
4. Google redirects back to `https://altamoda.rs/api/auth/callback/google?code=…`.
5. Our NextAuth route handler exchanges the `code` for an `id_token` server-side using our `client_secret`.
6. NextAuth runs our `signIn` callback — this is where we enforce **"B2C only"** and **block B2B emails**.
7. NextAuth runs the Prisma adapter to upsert a `User` row and an `Account` row (linking the Google `sub` to our user) — first-time sign-in = registration, returning sign-in = login.
8. NextAuth issues our JWT session cookie with `id`, `role`, `status`, etc. (already implemented in `src/lib/auth.config.ts:12-26`).
9. Browser is redirected to `/account` (or wherever they came from).

---

## 4. Requirements

### 4.1 Functional requirements

1. B2C users can register **and** log in with Google.
2. B2B users must **not** be able to register or log in via Google. If a user with `role = "b2b"` already exists with the same email, the OAuth attempt must be rejected with a clear, translated message ("Please log in with your B2B email and password.").
3. New OAuth signups are created with `role = "b2c"`, `status = "active"`, `password_hash = null`.
4. If a B2C user previously registered with email + password and later signs in with Google using the same email, the accounts must be **linked** (same `User`, additional `Account` row), provided Google returns a verified email (it always does for Workspace + Gmail accounts).
5. Existing email + password login must keep working unchanged for B2C and B2B.
6. The B2B registration form must keep working unchanged and must keep enforcing `status = "pending"` + admin approval.
7. After a successful OAuth sign-in, the user lands on `/account` (or the original `callbackUrl` if any).
8. OAuth-only users (no password) must still be able to set a password later via "Forgot password" / "Set password" flow (out of scope for this PR but the schema must allow it; nullable `password_hash`).

### 4.2 Non-functional / security requirements

1. `AUTH_SECRET` must be set in production and rotated independently of the Google client secret.
2. The Google client secret must live in `.env` (server-only) — never exposed to the client bundle.
3. The existing rate limiter on `/api/auth/[...nextauth]` (`authRateLimiter`, 10/15min, see `src/app/api/auth/[...nextauth]/route.ts:8-10`) must remain enabled — it already protects OAuth callbacks too.
4. The `signIn` callback must do a fresh DB lookup (not trust the JWT), so a B2B account's status is checked at OAuth time.
5. CSRF protection: NextAuth handles `state` and `PKCE` automatically — do not disable.
6. Cookie flags: NextAuth defaults are `HttpOnly`, `SameSite=Lax`, `Secure` in production — do not weaken.

### 4.3 Provider-side prerequisites

| Item | Where | Owner |
|------|-------|-------|
| Google Cloud project | console.cloud.google.com | altamoda admin |
| OAuth consent screen (External, "Production") | Google Cloud Console | altamoda admin |
| OAuth Client ID (Web application) | Google Cloud Console → Credentials | altamoda admin |
| Authorized JavaScript origins | `https://altamoda.rs`, `http://localhost:3000` | altamoda admin |
| Authorized redirect URIs | `https://altamoda.rs/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google` | altamoda admin |

---

## 5. Architecture & Data Model Changes

### 5.1 Prisma schema changes (required)

NextAuth's Prisma adapter expects the standard `Account`, `Session`, and `VerificationToken` tables. Looking at the current schema (`prisma/schema.prisma:111-133`), the `User` model exists but the auxiliary tables are **not** present yet (because we've been using JWT sessions + Credentials provider only).

We need:

1. **`User`** — modify:
   - `password_hash` → make **nullable**. OAuth users will not have a password.
   - Add `emailVerified DateTime?` (NextAuth standard column; useful for security checks).
   - Keep `role`, `status` exactly as-is.
2. **`Account`** — new table. Stores one row per (user, provider). For one user signed in with Google → 1 row. For email+password user → 0 rows.
3. **`Session`** — **NOT NEEDED** because we keep `strategy: "jwt"` (`src/lib/auth.config.ts:8`). The Prisma adapter will not create session rows when JWT strategy is used. Skipping this table is a deliberate choice for performance and matches current setup.
4. **`VerificationToken`** — only needed if we ever add the Email magic-link provider. **Recommendation: omit** for this PR; add later if needed.

#### 5.1.1 New Prisma model — `Account`

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String                                // "oauth"
  provider          String                                // "google"
  providerAccountId String  @map("provider_account_id")   // Google sub
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}
```

#### 5.1.2 Modified `User`

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String?    @map("password_hash")          // ← now nullable
  emailVerified DateTime? @map("email_verified")          // ← new
  name         String
  phone        String?
  role         UserRole   @default(b2c)
  status       UserStatus @default(active)
  avatarUrl    String?    @map("avatar_url")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt      @map("updated_at")

  // existing relations …
  accounts     Account[]                                  // ← new
}
```

#### 5.1.3 Migration plan

```bash
npx prisma migrate dev --name google_oauth_accounts
```

This will:
- Make `password_hash` nullable (no data loss — existing values preserved).
- Add `email_verified` column.
- Create `accounts` table with FK to `users(id)`.

⚠️ Verify locally that no application code does `user.passwordHash.length` or similar without a null check. The Credentials provider already has it:
- `src/lib/auth.ts:28` — `bcrypt.compare(password, user.passwordHash)` — must guard with `if (!user.passwordHash) return null;` before this call so OAuth users can't try to log in via the password form.

### 5.2 Files to add or modify

| File | Status | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | **modify** | Add `Account` model, modify `User` model |
| `prisma/migrations/<ts>_google_oauth_accounts/migration.sql` | **new (auto-gen)** | Generated by `prisma migrate dev` |
| `.env.example` | **(no change needed)** | Google placeholders already exist |
| `.env` (local + prod) | **modify (manually)** | Real secrets — never commit |
| `src/lib/auth.ts` | **modify** | Register Google provider, add `signIn` callback enforcing B2C-only |
| `src/lib/auth.config.ts` | **(no change)** | Provider list lives in `auth.ts` |
| `src/app/account/login/page.tsx` | **modify** | Wire existing Google button to `signIn("google")`; remove `alert("comingSoon")`; render `?error=` query |
| `src/i18n/locales/sr.json`, `en.json`, etc. | **modify** | Add new translation keys (`auth.oauthB2bBlocked`, `auth.oauthGenericError`, …) |
| `src/types/next-auth.d.ts` | **already correct** | No changes; existing module augmentation already covers `role`/`status` |

### 5.3 Files NOT to touch

- `src/middleware.ts` — already correct.
- `src/app/api/users/route.ts` — keep B2B registration flow as-is.
- `src/app/api/users/check-status/route.ts` — keep as-is.
- `src/lib/validations/user.ts` — keep as-is.
- `src/lib/auth-helpers.ts` — keep `requireAuth` as-is; it works for OAuth users too because session shape is identical.
- The existing Facebook button — leave it alone (still alerts "coming soon"); we are not adding Facebook in this PR.

---

## 6. The "B2C-only" Enforcement Logic — The Critical Bit

This is the heart of the feature. There are **three** distinct cases at OAuth `signIn` time:

| Case | What we see in DB | Decision |
|------|-------------------|----------|
| **A.** No user with this email | `User` doesn't exist | Create user with `role = "b2c"`, `status = "active"`. **Allow.** |
| **B.** User exists, `role = "b2c"` | Match by email, link `Account` to existing user | **Allow.** Update `emailVerified` if missing. |
| **C.** User exists, `role = "b2b"` or `"admin"` | Match by email, but role is not B2C | **Reject** with translated error. |

We implement this in NextAuth's `signIn` callback inside `src/lib/auth.ts`:

```ts
async signIn({ user, account }) {
  if (account?.provider === "credentials") return true; // unchanged path

  if (account?.provider === "google") {
    const email = user.email?.toLowerCase();
    if (!email) return "/account/login?error=OAuthMissingEmail";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.role !== "b2c") {
      return "/account/login?error=OAuthB2bBlocked";
    }
    if (existing && existing.status === "suspended") {
      return "/account/login?error=AccountSuspended";
    }
    return true; // adapter will create/link
  }
  return false;
}
```

> Returning a string from `signIn` redirects the browser to that URL with the error query parameter. The login page will read `?error=` and surface a translated message.

### 6.1 Email-verification requirement

Google returns `email_verified: true` for verified Gmail and Workspace accounts. The Prisma adapter sets `emailVerified` on the User row automatically when the provider returns a verified email. We additionally do not allow OAuth signups without an email (case `OAuthMissingEmail` above) — this is belt-and-braces.

### 6.2 Account-linking safety

NextAuth v5 has the `allowDangerousEmailAccountLinking: true` option per-provider. **Only enable it for providers that return a verified email.** Google does ✅ — so we enable it. This is what allows automatic merging of an existing email+password B2C account with a new Google account on the same email.

> If we don't enable it, NextAuth will throw `OAuthAccountNotLinked` and the user will be redirected with that error — which is fine UX-wise but requires us to teach the user to log in with email+password and link manually. **Recommended: enable.**

---

## 7. Step-by-Step Implementation Plan

> Future-Claude: this section is the executable plan. Each step is independent enough to commit separately.

### Step 1 — Provision Google OAuth credentials (manual, ~10 min)

1. Go to https://console.cloud.google.com/.
2. Create project `altamoda-prod` (and optionally `altamoda-dev`).
3. Navigate to **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: `Altamoda`.
   - Support email: support@altamoda.rs (or admin email).
   - App logo: upload altamoda logo (square, ≥120×120 px).
   - Authorized domains: `altamoda.rs`.
   - Developer contact: admin email.
   - Scopes: `openid`, `email`, `profile` (no sensitive scopes — no verification needed).
   - Publishing status: **In production** (after testing in Testing mode first).
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Altamoda Web`.
   - Authorized JavaScript origins:
     - `https://altamoda.rs`
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `https://altamoda.rs/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret** — paste into `.env`:
   ```env
   AUTH_GOOGLE_ID="…"
   AUTH_GOOGLE_SECRET="…"
   ```

### Step 2 — Verify `.env.example`

`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` already exist in `.env.example` (lines 8-9). No edit required, but optionally add a comment:

```env
# OAuth — Google (free; create at https://console.cloud.google.com)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

### Step 3 — Modify Prisma schema

Edit `prisma/schema.prisma`:

1. On `User`:
   - Change `passwordHash String @map("password_hash")` → `passwordHash String? @map("password_hash")`.
   - Add `emailVerified DateTime? @map("email_verified")`.
   - Add `accounts Account[]` to relations.
2. Add the `Account` model from §5.1.1.

Then run:

```bash
npx prisma migrate dev --name google_oauth_accounts
npx prisma generate
```

Verify migration SQL only contains:
- `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;`
- `ALTER TABLE "users" ADD COLUMN "email_verified" TIMESTAMP(3);`
- `CREATE TABLE "accounts" (…);`
- The unique index and FK.

### Step 4 — Update `src/lib/auth.ts`

Register the Google provider and add the `signIn` callback. Sketch:

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // … existing implementation, but add a guard:
      async authorize(creds) {
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.passwordHash) return null;       // ← OAuth-only users can't password-login
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        if (user.status === "suspended") return null;
        if (user.status === "pending") return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider !== "google") return false;

      const email = user.email?.toLowerCase();
      if (!email) return "/account/login?error=OAuthMissingEmail";

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.role !== "b2c") {
          return "/account/login?error=OAuthB2bBlocked";
        }
        if (existing.status === "suspended") {
          return "/account/login?error=AccountSuspended";
        }
      }
      // First-time OAuth signups: adapter creates User; the schema defaults already set role=b2c, status=active.
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Belt-and-braces: force role/status for OAuth-created users.
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "b2c", status: "active" },
      });
    },
  },
});
```

> **Important** — keep `session: { strategy: "jwt" }` in `auth.config.ts`. The Prisma adapter still works for `Account` linkage with JWT sessions; only the `Session` table is skipped.

### Step 5 — Update the login page UI

In `src/app/account/login/page.tsx`:

1. Import `signIn` from `next-auth/react`.
2. Replace the `onClick={() => alert(t("auth.comingSoon"))}` on the Google button (around line 245) with:
   ```ts
   onClick={() => signIn("google", { callbackUrl: "/account" })}
   ```
3. Hide the Google button when `registerType === "b2b"` and `activeTab === "register"`. Show a small text instead: *"B2B accounts must register with email and password and await approval."*
4. Read `?error=` from the URL on mount (use `useSearchParams`) and display a translated message:
   - `OAuthB2bBlocked` → "This email is registered as a B2B account. Please log in with your email and password."
   - `OAuthMissingEmail` → "Your Google account did not return an email. Please use email registration."
   - `AccountSuspended` → existing suspended-message logic.
   - `OAuthAccountNotLinked` (NextAuth built-in) → "An account with this email already exists. Please log in with your password and link your Google account from the profile page." *(Less likely with `allowDangerousEmailAccountLinking: true`, but covers race conditions.)*
5. **Leave the Facebook button as-is** (still alerts "Coming Soon"). Apple is not added in this PR.

### Step 6 — i18n keys

Add to every locale file under `auth.*`:

```json
{
  "auth": {
    "continueWithGoogle": "Continue with Google",
    "oauthB2bBlocked": "This email is registered as a B2B account. Please sign in with your password.",
    "oauthMissingEmail": "Your Google account did not provide an email address. Please use email registration.",
    "oauthGenericError": "Sign-in failed. Please try again.",
    "b2bMustUseEmail": "B2B accounts must register with email and password."
  }
}
```

### Step 7 — Testing plan

#### 7.1 Manual smoke tests (local + staging)
- [ ] B2C login with Google → new user → lands on `/account` → DB has `User` (role=b2c, status=active, password_hash=null) + `Account` row.
- [ ] B2C login with Google again (returning) → same user, no duplicate `Account` row.
- [ ] Existing email+password B2C user logs in with Google on the same email → adapter links accounts → 1 `User`, 1 `Account` row, password_hash preserved.
- [ ] B2B-existing-email tries Google login → redirected to `/account/login?error=OAuthB2bBlocked` → toast/modal visible.
- [ ] Suspended B2C tries Google login → blocked.
- [ ] Email+password login still works.
- [ ] B2B email+password registration still requires admin approval.
- [ ] Logout works for OAuth users.
- [ ] Session cookie has `HttpOnly`, `Secure`, `SameSite=Lax` in production.

#### 7.2 Automated tests
- [ ] Unit test the `signIn` callback's three branches (no user / B2C / B2B) — mock `prisma`.
- [ ] Existing Playwright smoke for email+password login should still pass — run `pnpm exec playwright test`.

#### 7.3 Security checks
- [ ] `AUTH_SECRET` set and ≥ 32 bytes random.
- [ ] Google client secret not in repo (`git grep AUTH_GOOGLE_SECRET` returns nothing in tracked files).
- [ ] `.env` in `.gitignore` (it already is).
- [ ] Rate limit still active on `/api/auth/[...nextauth]` callbacks.

### Step 8 — Deployment / release

1. Add prod env vars to Vercel (or hosting provider) — `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, ensure `AUTH_URL=https://altamoda.rs`.
2. Run `npx prisma migrate deploy` on production DB (handled by build pipeline if already configured).
3. Verify Google's redirect URI matches the production URL exactly (trailing slash, http vs https — exact-match).
4. Roll out behind a feature flag if desired (e.g., env var `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`) so the button is hidden until ready.
5. Monitor `/api/auth/callback/google` 4xx/5xx rates for 24 hours post-launch.

### Step 9 — Documentation update

- Update `README.md` with a short "Authentication" section listing supported providers and which user types they apply to.
- Update `docs/ARCHITECTURE.md` (if it covers auth) with the OAuth additions.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Existing B2B user has same email as their personal Google account → blocked & confused | Medium | Medium | Clear translated message + "Use email login" CTA; document in FAQ |
| Email-account-linking edge case (provider returns unverified email) | Low | High (account takeover) | Google verifies email by default; we still gate on `email_verified` in callback |
| NextAuth v5 beta breaking change | Medium | Medium | Pin `next-auth@5.0.0-beta.30` until GA; revisit before upgrading |
| User has two B2C accounts (email and Google) before merging logic existed | Low | Low | `allowDangerousEmailAccountLinking: true` will merge them on next login |
| Increased registration spam via OAuth | Medium | Low | Existing rate limit on `/api/auth/*` covers OAuth too; add admin alert if signups spike |

---

## 9. Out of Scope (Possible Follow-ups)

- **Apple "Sign in with Apple"** — deferred. Costs $99/yr for Apple Developer Program. Worth revisiting if/when a native iOS app is built (Apple requires it on App Store apps that offer other social logins). The Prisma `Account` schema and `signIn` callback added in this PR will accept Apple later with minimal extra work — just add the Apple provider config and one more branch in the `signIn` callback.
- **Facebook OAuth** — env vars exist but not requested in this feature.
- "Set a password" flow for OAuth-only users (so they can also use email login later).
- Profile page UI to **link / unlink** Google to an existing account.
- Email magic-link provider.
- 2FA / TOTP for admins.
- Migration of existing B2B users to OAuth (intentionally excluded — B2B keeps password-only).

---

## 10. Quick Reference — Files Touched

```
prisma/schema.prisma                          (modified — Account model, User changes)
prisma/migrations/<ts>_google_oauth_accounts/ (new — generated)
.env.example                                  (optional — add comment)
src/lib/auth.ts                               (modified — Google provider, signIn callback)
src/app/account/login/page.tsx                (modified — wire button, error display, hide for B2B tab)
src/i18n/locales/*.json                       (modified — new keys)
README.md                                     (modified — auth section)
docs/ARCHITECTURE.md                          (optional — update)
OAUTH_GOOGLE_LOGIN.md                         (this document)
```

No new API routes are required — NextAuth's existing `/api/auth/[...nextauth]` handles all OAuth callbacks automatically once the provider is registered.

---

## 11. Cost Recap

| Item | One-time | Recurring |
|------|----------|-----------|
| Google OAuth setup | 0 | 0 |
| NextAuth.js library | 0 | 0 |
| Engineering effort (estimate) | ~0.5–1 dev-day | ~0 (low maintenance) |
| **Total** | ~0.5–1 dev-day | **$0** |

---

## 12. Sign-off Checklist (Before Merging)

- [ ] Prisma migration reviewed and applied to staging.
- [ ] Google login works end-to-end on staging.
- [ ] B2B emails are blocked from OAuth on staging (verified with a real B2B test account).
- [ ] Existing email+password login still works on staging.
- [ ] All translation keys added in every locale.
- [ ] No secrets in git history (`git log -p | grep -i secret` clean).
- [ ] Production env vars set in hosting provider.
- [ ] Production redirect URI matches exactly.
- [ ] FAQ / Help page updated explaining "Why can't I sign in to my B2B account with Google?".

---

*End of plan. Future-Claude: when executing, follow §7 step-by-step in order. Do not skip Step 3 (schema migration) before Step 4 (provider config) — the adapter will fail at runtime without the `accounts` table.*

---

## Appendix A — Google Cloud Console Walkthrough (manual setup)

This is the step-by-step guide to provision the OAuth Client ID + Secret that `auth.ts` needs. Code is already deployed; this appendix is the only manual work left.

**You will need before starting:**
- Access to a Google account (any Gmail account works, even a personal one).
- A real **support email** that can answer user questions (e.g. `info@altamoda.rs`). Google shows it to users on the consent screen and may email it for policy issues. Don't use a throwaway address — it must be a mailbox someone monitors.
- A real **developer contact email** (can be the same as support email, or a different one for engineering).
- ~10 minutes.

**Where you are right now:** You've reached the *Google Auth Platform → OAuth overview* page (URL pattern `https://console.cloud.google.com/auth/overview`) inside a Google Cloud project. The page shows "Google auth platform not configured yet" with a **Get started** button.

> Note on UI: Google has rebranded the old "OAuth consent screen" to **"Google Auth Platform"**. Functionally identical. Older guides on the internet may use the old terminology — they refer to the same screens.

### A.1 — Get started wizard

Click **Get started**. A multi-step form appears.

#### A.1.1 — App information
| Field | Value |
|-------|-------|
| App name | `Altamoda` |
| User support email | The real mailbox you can answer support questions from |

Click **Next**.

#### A.1.2 — Audience
Pick **External**.
*(Internal is only available if your Google account belongs to a Google Workspace organization, and would limit sign-ins to that domain only. We want any Gmail user.)*

Click **Next**.

#### A.1.3 — Contact information
| Field | Value |
|-------|-------|
| Email addresses | Developer / engineering email (Google will email here for policy/quota notices) |

Click **Next**.

#### A.1.4 — Finish
Tick the box agreeing to **Google API Services User Data Policy**.

Click **Continue → Create**.

You'll be returned to the Auth Platform overview, now showing your app as configured but in **Testing** publishing status.

### A.2 — Branding (optional but recommended)

Left sidebar → **Branding**. Fill in:

| Field | Value |
|-------|-------|
| App logo | Square ≥ 120×120 px PNG, ≤ 1 MB. The altamoda square mark works (the same logo used in `public/`). |
| Application home page | `https://altamoda.rs` |
| Application privacy policy link | `https://altamoda.rs/faq` (or the dedicated privacy URL once it exists) |
| Application terms of service link | `https://altamoda.rs/faq` (or the terms URL once it exists) |
| Authorized domains | Add `altamoda.rs` (no `https://`, just the domain). |

Click **Save**. Logo + links will appear on the Google consent screen users see.

> If you don't have these URLs ready yet, you can skip Branding for now and come back. OAuth will still work in Testing mode without them. They are required only when you publish to **Production** (see A.6).

### A.3 — Audience (test users while in Testing mode)

Left sidebar → **Audience**.

While the app is in **Testing** publishing status, only **test users** you list here can sign in via Google. Add up to 100 emails (Gmail or any provider). At minimum, add yourself and anyone who needs to QA.

Click **+ Add users** → paste emails → **Save**.

> If a non-listed user tries to sign in during Testing mode, Google shows them a "Access blocked: Altamoda has not completed the Google verification process" error. That is expected during Testing.

### A.4 — Create the OAuth Client ID

Left sidebar → **Clients** → **+ Create client**.

| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `Altamoda Web` *(this name is internal — only you see it in the console)* |

Under **Authorized JavaScript origins**, click **+ Add URI** and enter each on its own line:
- `http://localhost:3000`
- `https://altamoda.rs`

Under **Authorized redirect URIs**, click **+ Add URI** and enter each on its own line:
- `http://localhost:3000/api/auth/callback/google`
- `https://altamoda.rs/api/auth/callback/google`

> ⚠️ The redirect URI must match **exactly** — including http/https, trailing slash (none), and casing. NextAuth always uses the path `/api/auth/callback/google`. Don't put a trailing slash.

Click **Create**.

A modal appears with **Client ID** and **Client Secret**. Both are long random strings.

- **Client ID** ends with `.apps.googleusercontent.com`. Safe to expose in URLs.
- **Client Secret** is a shorter string. **Never commit this to git, never paste it in chats.**

Click **Download JSON** if you want a backup. Otherwise just copy both values now — you can return to **Clients → [your client name]** later to retrieve the Client ID, but the secret is only fully shown at creation. (You can always rotate by clicking *Reset Secret* if it's lost.)

### A.5 — Paste credentials into local `.env`

Open `/Users/lukacerovic/Desktop/altamodaUIUX/altamoda/.env` and add:

```env
AUTH_GOOGLE_ID="<paste Client ID here, ends with .apps.googleusercontent.com>"
AUTH_GOOGLE_SECRET="<paste Client Secret here>"
```

If those keys already exist with empty values, replace the empty strings.

**Make sure these env vars are also set:**
```env
AUTH_SECRET="..."          # any secure random string, ≥32 bytes
AUTH_URL="http://localhost:3000"
```

Save the file.

> `.env` is already in `.gitignore` — verify with `git check-ignore .env` (should print `.env` and exit 0). Never commit it.

### A.6 — Restart the dev server and test

```bash
# Kill any running next dev process, then:
npm run dev
```

Env changes only load at boot. A hot reload won't pick them up.

Visit `http://localhost:3000/account/login`. Click **Continue with Google**.

**The four smoke tests:**

| # | Scenario | How to set up | Expected result |
|---|----------|---------------|-----------------|
| 1 | New B2C signup via Google | Use a Gmail address that is not in the DB. (You added it as a test user in A.3.) | Lands on `/account`. DB row in `users` table with `role='b2c'`, `status='active'`, `password_hash=NULL`, `email_verified` set. New row in `accounts` table linking your Google `sub` to the user. |
| 2 | Returning B2C login | Sign out, then click Continue with Google again with the same Gmail. | Same user reused. No new row in `accounts`. Lands on `/account`. |
| 3 | Email+password ↔ Google linking | Register a B2C account via the email form first, then sign in with Google using the same email. | Same `users` row reused, `password_hash` preserved, **new** `accounts` row added. |
| 4 | B2B email blocked | In your DB, find a B2B user (or run the B2B registration flow), note the email. Click Continue with Google with that exact email. | Redirected back to `/account/login?error=OAuthB2bBlocked`. Error modal shows the translated B2B-blocked message. URL `?error=` is stripped after display. |

**Useful SQL to verify (Postgres):**
```sql
-- Inspect the new user
SELECT id, email, role, status, password_hash, email_verified FROM users WHERE email = 'your.gmail@example.com';

-- See the linked OAuth account
SELECT user_id, provider, provider_account_id, scope FROM accounts;
```

### A.7 — Publish from Testing to Production

This is **only** required when you're ready to allow any Google user (not just listed test users) to sign in. For local dev and staging it's fine to stay in Testing mode.

Left sidebar → **Audience** → **Publishing status: Testing** → click **Publish app** → confirm.

For our scopes (`openid email profile` — non-sensitive), Google does **not** require verification. The app goes straight to Production. The only gate is that Branding (A.2) must be complete: real privacy policy URL, real terms URL, app logo. Without those, Google will block publishing.

> If you ever change to a sensitive scope (Drive, Gmail, etc.), Google will require a verification process taking days/weeks. We deliberately stay on non-sensitive scopes to avoid this.

### A.8 — Production deployment env vars

When deploying to your hosting provider (Vercel / your VPS / etc.):

1. Set the following environment variables in the hosting dashboard:
   ```
   AUTH_GOOGLE_ID=<same value as local>
   AUTH_GOOGLE_SECRET=<same value as local>
   AUTH_URL=https://altamoda.rs
   AUTH_SECRET=<production-only secret, NOT the same as local>
   ```
2. Confirm the production redirect URI `https://altamoda.rs/api/auth/callback/google` is in the Google Client's Authorized redirect URIs (you added it in A.4 — verify it's still there).
3. Run `npx prisma migrate deploy` against the production DB so the `accounts` table and nullable `password_hash` migration are applied. *(Already in `npm run build`, so this happens automatically on Vercel-style deploys.)*

### A.9 — Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Click button, see Google's "Error 400: redirect_uri_mismatch" | Redirect URI in Google Console doesn't exactly match `{AUTH_URL}/api/auth/callback/google` | Re-check A.4 — exact match, no trailing slash, http vs https |
| Click button, see Google's "Error 401: invalid_client" | Client ID or Secret wrong / not loaded | Check `.env`, restart dev server |
| Click button, get redirected to `/account/login?error=Configuration` | NextAuth couldn't read `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Same — env not loaded; restart dev server |
| Sign-in succeeds but lands on `/account/login?error=OAuthAccountNotLinked` | The same email already exists with a different OAuth provider, or `allowDangerousEmailAccountLinking` was disabled | Should not happen with current code — but if it does, sign in with email+password first, then try Google |
| Sign-in succeeds but the user has `role='admin'` or `role='b2b'` after | Bug in `signIn` callback | Should be impossible — file an issue and check `src/lib/auth.ts` |
| "Access blocked: Altamoda has not completed the Google verification process" | You're testing with a Gmail not on the test-user list while still in Testing mode | Add the Gmail to A.3, or publish to Production (A.7) |
| `prisma generate` fails after pulling changes | Migration not applied | Run `npx prisma migrate deploy` then `npx prisma generate` |

### A.10 — Rotating credentials (security incident)

If `AUTH_GOOGLE_SECRET` is ever leaked (committed to git, pasted in a chat, etc.):

1. Google Cloud Console → **APIs & Services** → **Credentials** → click your OAuth client → **Reset Secret**.
2. Update the secret in your local `.env` and your hosting provider's env vars.
3. No user-facing impact — existing sessions continue working because they're JWT-signed with `AUTH_SECRET`, not the Google secret.

`AUTH_SECRET` rotation is more disruptive (invalidates all active sessions) — only rotate if it's also been leaked.

---

*End of Appendix A. Once `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are in `.env` and the dev server is restarted, the feature is fully functional locally.*
