# Product Requirements Document: Quran LMS

## Project Overview

**Product Name:** Quran LMS (Al-Hikmah Learning Center)
**Version:** 1.0 MVP
**Last Updated:** January 20, 2026
**Target Launch:** 2-4 weeks

---

## Executive Summary

A streamlined Learning Management System for Islamic education centers to track students' Quran memorization (Hifz) progress. The MVP focuses on making session recording fast (<30 seconds) for teachers while providing basic progress tracking for students and parents.

**Product Type:** Startup MVP
**Deployment:** Hybrid (single center now, architected for future multi-tenancy)
**Initial Scale:** 50-200 students
**Beta Partner:** Specific Islamic center lined up for pilot

---

## Target Users (Priority Order)

1. **Teachers** (PRIMARY) - Instructors conducting recitation sessions
2. **Super Admins** - Center administrators managing users and settings
3. **Students** - Learners viewing their memorization progress
4. **Parents** - Guardians monitoring children's progress

---

## Core MVP Features

### 1. Authentication (Magic Link)
- **Passwordless authentication** via email magic links
- No password reset flow needed
- Role-based access control (Admin, Teacher, Student, Parent)
- Account creation hierarchy: Admin creates teachers → Teachers create students

### 2. Session Recording (Teacher Primary Flow)
**Goal: Complete session in under 30 seconds**

- **Verse Selection:** Quick recent selection - show student's last session location, one tap to continue
- **Grading System:**
  - Pass/Fail (required) - Did the student pass?
  - Quality Rating (auto-calculated from mistake count):
    - 0 mistakes = Excellent
    - 1-2 mistakes = Good
    - 3+ mistakes = Needs Improvement
- **Mistake Tracking:** Two types only for simplicity:
  - **Forgot Ayah:** Click the ayah number to mark entire verse as forgotten
  - **Word Mistake:** Click any word to mark it as a mistake
- **Mistake Counter:** Automatically updated based on marked mistakes, or manually adjustable
- **Notes:** Optional text field
- **Quran Text:** Optional toggle to show/hide Arabic verses with interactive mistake marking
- **Session Types:** New Memorization, Revision
- **No editing:** Sessions can only be voided, not edited after recording

### 3. Student Progress Dashboard
- **Visual Surah Grid:** All 114 Surahs with color-coded completion status
- **Gamification (MVP):**
  - Daily/weekly streaks
  - Milestone badges (Juz completion, Surah completion)
- **Growth-Framed Stats:** "You moved up 10% this week" (not rank-based)
  - Show encouraging stats only (top 50%)
  - Progress-focused messaging for struggling students
- **Basic Statistics:** Verses memorized, Surahs completed, current streak

### 4. Parent Portal
- **Linking:** Teachers and admins can generate/send parent access links
- **Visibility:** Summary only - progress and grades, not detailed mistakes or teacher notes
- **Multi-child support:** Parents can link to multiple children

### 5. Admin Dashboard
- **User Management:** Create teachers, view all students
- **Basic Stats:** Total students, sessions this week, completion rates
- **Teacher Management:** View teacher list and their assigned students

### 6. Assignments
- **Flexible/Custom:** Teacher defines any task with instructions
- **Fields:** Title, description/instructions, due date, assigned student(s)
- **Status:** Pending, In Progress, Completed, Overdue

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 16 with React 19, TailwindCSS
- **Backend:** Next.js API Routes + Convex
- **Database:** Convex
- **Hosting:** Vercel (app) + Convex (data)
- **Authentication:** Clerk
- **Validation:** Zod + React Hook Form

### Hosting & Budget
- **Budget:** $0 (free tiers only)
- **App Hosting:** Vercel free tier
- **Database:** Convex free tier

### Quran Data
- **Storage:** Pre-populated in database (all 114 Surahs, 6,236 verses)
- **Display:** Arabic text with optional toggle in session recording

---

## Design System: Contemporary Islamic Heritage

### Brand Ethos
"Quiet Luxury meets Sacred Geometry" - bridging traditional Islamic artistry with modern, minimal SaaS aesthetics. Prioritizes legibility, cultural depth, and paper-like digital tactility.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Parchment White | `#F9F9F7` | Main app background |
| Cream Paper | `#F2F0EB` | Cards, sidebar panels |
| Ink Black | `#1A1A1A` | Primary text (soft charcoal) |
| Oxblood Red | `#8C4A45` | Primary actions, emphasis |
| Majorelle Navy | `#2C3E50` | Headers, navigation |
| Antique Gold | `#C5A065` | Borders, active indicators |
| Sage Green | `#6B8E23` | Success states, growth metrics |
| Stone Grey | `#9CA3AF` | Placeholders, disabled states |
| Faint Line | `#E5E7EB` | Subtle borders |

### Typography
- **Headings:** High-contrast serif (Quadraat, Garamond)
- **Body:** Humanist sans-serif (Gill Sans, Lato)
- **Decorative:** Traditional Kufic/Thuluth for logos

### Visual Style
- Clean minimal with subtle Islamic geometric patterns (3-5% opacity)
- Matte paper grain texture on cards
- Generous spacing, comfortable density
- Cards: 8px border radius, ultra-soft shadows
- Buttons: 4px border radius, oxblood primary

### Accessibility
- Not a priority for MVP (basic usability only)

### Internationalization
- UI: English only
- Content: Arabic Quran text displays correctly (RTL)

---

## User Flows

### Teacher: Record Session (Primary Flow)
```
1. Open app → See student list
2. Tap student → See their last session location
3. One tap "Continue from here" OR adjust verse range
4. [Optional] Toggle to view Quran text
5. Student recites...
6. Tap Pass/Fail
7. Tap Quality: Excellent/Good/Needs Improvement
8. [Optional] Enter mistake count
9. [Optional] Add note
10. Tap Save → Done (<30 seconds)
```

### Student: View Progress
```
1. Login via magic link
2. See dashboard with:
   - Streak counter (current streak, best streak)
   - Visual Surah grid (green=done, blue=in progress, gray=not started)
   - Recent sessions list
   - Milestone badges earned
   - Growth stat ("You're up 5% this month!")
```

### Parent: Monitor Child
```
1. Click link from teacher/admin
2. Create account (or login if existing)
3. Account auto-linked to child
4. See child's dashboard (summary view):
   - Progress overview
   - Recent grades (Pass/Fail + Quality)
   - Streak status
   - No detailed mistakes or teacher notes
```

### Admin: Manage Center
```
1. Login → Admin dashboard
2. View stats: Total students, weekly sessions, completion rates
3. Manage teachers: Create, view, deactivate
4. Teachers manage their own students
```

---

## Data Model (Key Entities)

### User
- id, email, name, role (ADMIN, TEACHER, STUDENT, PARENT)
- Associated profiles based on role

### RecitationSession
- student, recordedBy (teacher)
- surah, startVerse, endVerse
- passed (boolean), quality (EXCELLENT, GOOD, NEEDS_IMPROVEMENT)
- mistakeCount (integer)
- notes (optional text)
- sessionType (NEW_MEMORIZATION, REVISION)
- voided (boolean), voidedAt, voidedBy
- createdAt

### StudentProgress
- student, surah
- memorizedVerses (ranges)
- status (NOT_STARTED, IN_PROGRESS, MEMORIZED)
- averageQuality, sessionCount

### Streak
- student
- currentStreak, longestStreak
- lastActiveDate

### Milestone
- student
- type (JUZ_COMPLETE, SURAH_COMPLETE, STREAK_7, STREAK_30, etc.)
- achievedAt
- metadata (which juz/surah)

### Assignment
- teacher, student
- title, instructions, dueDate
- status (PENDING, IN_PROGRESS, COMPLETED, OVERDUE)

### ParentStudent (linking)
- parent, student
- linkedAt, linkedBy

---

## Business Rules

### Session Recording
- Sessions cannot be edited after creation, only voided
- Voiding requires reason and is audited
- Teacher configurable: what happens when student fails (defined per teacher)

### Student-Teacher Relationship
- Students can have multiple equal teachers (no primary)
- Any assigned teacher can record sessions for a student
- All historical sessions preserved regardless of teacher changes

### Streaks
- Streak increments when student has at least one session in a day
- Streak resets after 1 day of inactivity
- Display: Current streak and longest streak

### Gamification (Growth-Framed)
- Show percentile only when encouraging (top 50%)
- Never show negative rankings
- Focus on: "You improved by X" not "You rank #Y"

---

## Features Deferred to Post-MVP

| Feature | Reason |
|---------|--------|
| Notifications (email/in-app) | Added complexity, not core to validation |
| Data export (CSV, PDF reports) | Can do manually via database initially |
| Anti-cheating/flagging | Trust teachers initially |
| Offline mode | Assume stable connection for beta |
| Real-time updates | Polling/refresh sufficient for MVP |
| Full gamification (XP, leaderboards) | Streaks + milestones sufficient |
| Tajweed-specific mistake tracking | Two types (Forgot Ayah, Word Mistake) sufficient for MVP |
| Multi-center tenancy | Design for it, don't build yet |
| Custom grading scales | Default system for MVP |
| Audio recitation playback | Text display sufficient |

---

## Success Metrics (MVP)

1. **Teacher adoption:** Teachers complete 80%+ of sessions in app (vs paper)
2. **Session speed:** Average session recording time <60 seconds
3. **Student engagement:** 50%+ of students check progress weekly
4. **Parent engagement:** 30%+ of parents link accounts and check monthly
5. **Data accuracy:** Teachers report data matches their expectations

---

## Open Questions for Beta

1. Is the 3-level quality rating (Excellent/Good/Needs Improvement) granular enough?
2. What specific milestone badges are most motivating for students?
3. Do teachers want to see aggregate class stats or just individual students?
4. Is the parent summary view sufficient or do they want more detail?

---

## Appendix: Screen Inventory (MVP)

### Public
- `/login` - Magic link login page

### Admin (`/admin/*`)
- `/admin` - Dashboard with stats
- `/admin/teachers` - Teacher list and creation
- `/admin/students` - All students view

### Teacher (`/teacher/*`)
- `/teacher` - Dashboard with student list
- `/teacher/students/[id]` - Student detail + session recording
- `/teacher/sessions` - Session history (optional for MVP)

### Student (`/student/*`)
- `/student` - Progress dashboard with grid, streaks, milestones

### Parent (`/parent/*`)
- `/parent` - Child selection (if multiple)
- `/parent/child/[id]` - Child progress summary view

---

*Document ready for implementation. All major decisions captured.*
