# Environment Setup

This project uses Clerk for auth and Convex for data. Production and development
should be isolated with separate keys and deployments.

## Current posture (MVP)
- Clerk: Development instance only (test keys)
- Convex: Separate dev + prod deployments
- Vercel:
  - Production uses prod Convex + dev Clerk keys (temporary)
  - Preview/Development uses dev Convex + dev Clerk keys

## Recommended production split
Create separate Clerk and Convex environments and wire them into Vercel:

### Convex
- Development deployment: dev:aware-schnauzer-520
- Production deployment: prod:merry-lynx-527

### Clerk
- Development instance: test keys
- Production instance: live keys

## Vercel env mapping (target state)
- Production:
  - CONVEX_DEPLOYMENT=prod:merry-lynx-527
  - NEXT_PUBLIC_CONVEX_URL=https://merry-lynx-527.convex.cloud
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
  - CLERK_SECRET_KEY=sk_live_...
  - CLERK_WEBHOOK_SECRET=whsec_...
  - QURAN_CLIENT_ID=...
  - QURAN_CLIENT_SECRET=...

- Preview + Development:
  - CONVEX_DEPLOYMENT=dev:aware-schnauzer-520
  - NEXT_PUBLIC_CONVEX_URL=https://aware-schnauzer-520.convex.cloud
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  - CLERK_SECRET_KEY=sk_test_...
  - CLERK_WEBHOOK_SECRET=whsec_...
  - QURAN_CLIENT_ID=...
  - QURAN_CLIENT_SECRET=...

## Local dev
- Pull dev envs into .env.local:
  - vercel env pull .env.local --environment=development

