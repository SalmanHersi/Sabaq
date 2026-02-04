# Quran LMS

## Stack
- Next.js 16 (App Router)
- Clerk (auth + email verification)
- Convex (data + functions)
- Vercel (hosting)

## Local development
1) Pull dev envs:
```
vercel env pull .env.local --environment=development
```

2) Run the app:
```
npm run dev
```

## Environments
- Dev/Preview use dev Clerk + dev Convex
- Prod should use prod Clerk + prod Convex

See:
- docs/environment-setup.md
- docs/production-checklist.md
