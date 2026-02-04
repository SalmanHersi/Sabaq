# Production Checklist

## 1) Domains
- Add a custom domain in Vercel (required by Clerk prod)
- Verify DNS
- Set primary domain in Vercel

## 2) Clerk production instance
- Create Production instance in Clerk
- Configure sign-in methods
- Enable email verification
- Configure sender domain (recommended)
- Add webhook endpoint:
  - https://<prod-domain>/api/webhooks/clerk

## 3) Convex production deployment
- Ensure prod deployment exists (prod:merry-lynx-527)
- Verify schema + migrations

## 4) Vercel envs
- Set production envs to prod Clerk + prod Convex
- Set preview/dev envs to dev Clerk + dev Convex

## 5) Data + access
- Verify admin user and role seeding
- Confirm teacher/student onboarding flow

## 6) Observability
- Add error tracking (Sentry or similar)
- Add uptime monitoring

## 7) Final smoke test
- Admin invites a teacher
- Teacher signs up + verifies email
- Student sessions, assignments, and Quran viewer work

