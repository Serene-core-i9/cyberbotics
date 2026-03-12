CYBERBOTICS v2 — Full Feature Build
=====================================

NEW IN THIS VERSION
-------------------
✅ Guest vs Logged-In Content Gating
   - Beginner lessons L01–L04 visible to all
   - L05–L06 blurred/locked with "Sign up" overlay
   - Intermediate + Advanced panels gated behind full-screen lock
   - All "Go Deeper" external links hidden for guests

✅ Extended Lessons with External Links
   - Every lesson card now has "// GO DEEPER" section
   - Curated links: official docs, YouTube tutorials, TryHackMe, HackTheBox, etc.
   - Links are locked for guests, unlocked after sign-in

✅ Progress Tracking
   - "✓ MARK DONE" button on every lesson (logged-in only)
   - Per-level progress bar shows X / 6 lessons completed
   - Progress saved to localStorage (persists across sessions)

✅ Enhanced Quiz
   - Intermediate + Advanced quiz levels locked for guests
   - 💡 Hint system (logged-in only) — -5 pts per hint
   - Explanations shown after every answer
   - Scores auto-saved to Supabase after round completion
   - 🏆 Leaderboard for each difficulty level (logged-in only)
   - Guest banner prompts sign-up in quiz section

SETUP (unchanged from v1)
--------------------------
1. cd cyberbotics/backend
2. npm install
3. node server.js
4. Open index.html with Live Server on port 5500

BACKEND ENDPOINTS
-----------------
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/scores          (auth required)
GET  /api/scores/me       (auth required)
GET  /api/scores/top/:level  (public)
GET  /api/health
