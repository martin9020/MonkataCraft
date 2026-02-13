# CLAUDE.md — MonkaCraft Build Orchestration

> This file is the master process guide. Place it in the project root.  
> Claude Code reads CLAUDE.md automatically and uses it to plan its work.  
> It breaks the build into sequential sub-tasks (sub-agents) so each piece is built, tested, and verified before moving to the next.

---

## PROJECT OVERVIEW

**Project**: MonkaCraft — a personal gaming website for a 9-year-old kid (Simeon / "MonkaS" / "Монката")  
**Hosting**: GitHub Pages (static, free)  
**Media Storage**: Cloudinary (free tier, 25GB)  
**Email Service**: EmailJS (free tier, 200 emails/month)  
**Budget**: $0 — everything must be free  
**Design Reference**: See `MonkaCraft_Claude_Code_Prompt.md` for full design specs

---

## FREE SERVICES STACK

Before building, understand the full free-tier stack:

| Service | Purpose | Free Tier | Setup Required |
|---------|---------|-----------|----------------|
| **GitHub Pages** | Static site hosting | Unlimited for public repos | Create repo, enable Pages |
| **Cloudinary** | Image/video storage + upload widget | 25GB storage, 25GB bandwidth/mo | Account + unsigned upload preset |
| **EmailJS** | Send emails from client-side JS | 200 emails/month, 2 templates | Account + email template + service |
| **Google Fonts** | Typography | Unlimited | Just link in HTML |
| **YouTube/Twitch** | Video/stream embeds | Unlimited embeds | Just paste URLs |

---

## BUILD ORDER — SUB-AGENT TASKS

Execute these tasks IN ORDER. Each sub-agent must complete fully before the next begins. After each sub-agent, verify the output works correctly.

---

### 🔴 SUB-AGENT 0: Project Scaffold & Data Layer
**Priority**: FIRST — everything depends on this  
**Files to create**: Project folders, `data/content.json`, `js/content.js`

**Tasks**:
1. Create the full directory structure:
```
monkacraft/
├── index.html
├── pages/
│   ├── streams.html
│   ├── videos.html
│   ├── gallery.html
│   ├── blog.html
│   └── admin.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── admin.js
│   ├── cloudinary.js
│   ├── emailjs.js        ← NEW: handles "Chat with ЧИЧИ"
│   └── content.js
├── assets/
│   └── (favicon, logo)
├── data/
│   └── content.json
├── CLAUDE.md              ← this file
└── README.md
```

2. Create `data/content.json` with ALL pre-populated starter content (see main prompt for details: 3 videos, 4 screenshots, 2 blog posts, 1 stream entry)

3. Create `js/content.js` — the data access layer:
   - `ContentStore` class/module
   - `init()` — loads content.json into localStorage on first visit
   - `getAll(type)` — returns all entries of a type (video/screenshot/post/stream)
   - `getLatest(type, count)` — returns N newest entries
   - `getByTag(type, tag)` — filter by game tag
   - `add(entry)` — add new content (admin use)
   - `update(id, entry)` — edit content (admin use)
   - `delete(id)` — remove content (admin use)
   - `exportJSON()` — download all content as .json file
   - `importJSON(file)` — restore from .json file
   - `getStats()` — returns counts by type
   - Each entry must have: `id` (uuid), `type`, `title`, `date`, `gameTag`, `category`, `content/url`, `thumbnail`

4. Verify: open browser console, load content.js, confirm all CRUD operations work.

**✅ Done when**: content.json exists with starter data, ContentStore works in console.

---

### 🟡 SUB-AGENT 1: CSS Foundation & Design System
**Priority**: Second — all pages share one stylesheet  
**Files to create**: `css/style.css`, inline SVG logo

**Tasks**:
1. Build complete `style.css` with:
   - CSS custom properties (all colors, fonts, spacings, transitions)
   - Google Fonts imports: Press Start 2P, Nunito, Orbitron
   - CSS reset/normalize
   - Dark gaming theme base (#0a0a1a background)
   - Neon glow utility classes (.glow-green, .glow-blue, .glow-magenta)
   - Navigation styles (sticky top, mobile hamburger)
   - Card component styles (glassmorphism, hover effects)
   - Button styles (primary, secondary, danger — all with glow hover)
   - Grid layouts (responsive: 1col mobile → 2col tablet → 3-4col desktop)
   - Lightbox/modal styles
   - Form input styles (large, kid-friendly, high contrast)
   - Animation keyframes: fadeIn, slideUp, pulseGlow, float, pixelShimmer
   - Pixel grid background pattern (CSS only)
   - Floating particles animation (CSS only)
   - Page-specific section styles
   - Admin panel specific styles
   - Responsive breakpoints: 480px, 768px, 1024px
   - Print-safe styles (hide nav/effects on print)

2. Create inline SVG logo for MonkaCraft (blocky + smooth hybrid)

3. Create `assets/favicon.ico` — a simple pixel pickaxe or "M" (can be a 32x32 PNG served as favicon)

**✅ Done when**: Opening any HTML page with style.css linked shows the dark gaming theme, fonts load, animations work.

---

### 🟢 SUB-AGENT 2: Shared Layout & Navigation (app.js)
**Priority**: Third — shared across all pages  
**Files to create/edit**: `js/app.js`, all HTML pages get header/footer

**Tasks**:
1. Build `js/app.js`:
   - Inject shared header (nav + logo) and footer into all pages via JS
   - Mobile hamburger menu toggle
   - Active page highlighting in nav
   - "LIVE NOW" indicator (reads `isLive` from ContentStore)
   - Torch/glow cursor effect on desktop (subtle light follows mouse)
   - Smooth scroll behavior
   - Page load animations (staggered fade-in for main content)
   - Stats counter for footer (total videos, screenshots, etc.)

2. Navigation links: Home | Streams | Videos | Gallery | Blog
   - NO link to admin.html in public nav
   - Each nav item has a pixel-style icon (use emoji or CSS shapes)

3. Footer: YouTube + Twitch placeholder links, "Built with ❤️ by MonkaS", animated pixel creeper

**✅ Done when**: All 5 public pages show consistent nav/footer, mobile menu works, LIVE indicator works.

---

### 🔵 SUB-AGENT 3: Public Pages (index, streams, videos, gallery, blog)
**Priority**: Fourth — the visitor-facing content  
**Files to create/edit**: All 5 public HTML pages + their JS logic in app.js

**Build each page fully**:

#### 3a. index.html — Homepage
- Hero with animated MonkaCraft logo + Bulgarian/English taglines
- LIVE NOW indicator
- 3 latest content cards (auto from ContentStore)
- "About Me" pixel card with Simeon's info
- Quick links grid to sections
- Fun counter animation (numbers count up on scroll)

#### 3b. pages/streams.html — Streams
- Featured stream embed (reads from ContentStore)
- Live/Offline status
- Past streams grid (YouTube embeds)
- Filter buttons: All | Minecraft | Roblox

#### 3c. pages/videos.html — Videos  
- Video grid (YouTube embeds + Cloudinary videos)
- Filter: All | Minecraft | Roblox | Tutorials | Funny Moments
- Sort: Newest / Oldest
- Click → modal player

#### 3d. pages/gallery.html — Screenshots
- Masonry grid with lazy loading
- Lightbox viewer (click, arrow keys, swipe on mobile)
- Filters by game and category
- Images from Cloudinary URLs

#### 3e. pages/blog.html — Blog
- Card list of posts
- Click to expand (accordion)
- Supports rich HTML content
- Sorted newest first

**✅ Done when**: All 5 pages load, display starter content, filters work, lightbox works, responsive on mobile.

---

### 🟣 SUB-AGENT 4: Admin Panel — THE CORE TASK
**Priority**: Fifth — this is the most complex and important piece  
**Files to create/edit**: `pages/admin.html`, `js/admin.js`, `js/cloudinary.js`, `js/emailjs.js`

> ⚠️ THIS SUB-AGENT IS THE MOST CRITICAL. The admin panel is how a 9-year-old child manages his entire website. Every pixel, every button, every interaction must be crystal clear and impossible to mess up.

---

#### 4A. Authentication Screen

When admin.html loads, show a full-screen "Secret HQ Access" screen:
- Fun gaming aesthetic (pixel lock icon, neon border)
- Title: "🔐 Тайната база на MonkaS" / "Secret HQ"
- Big password input field (show/hide toggle)
- Big "ENTER" button
- Passphrase stored as SHA-256 hash (use Web Crypto API: `crypto.subtle.digest`)
- Default passphrase: `monkacraft2024`
- On success: cool "ACCESS GRANTED ✅" animation → reveal admin dashboard
- On failure: shake animation + "❌ Грешен код! Опитай пак!" 
- After 5 failures: 60-second cooldown with countdown timer
- Auth state saved to sessionStorage (browser close = logout)

---

#### 4B. Admin Dashboard Layout

After login, show a kid-friendly dashboard with:

**Top Bar**: 
- "👋 Здравей, MonkaS!" greeting
- Stats: 📹 X Videos | 🖼️ X Screenshots | 📝 X Posts | 🎬 X Streams
- Big red "🚪 ИЗЛЕЗ" (Logout) button

**Main Area — BIG TAB BUTTONS across the top**:
Each tab is a large, colorful, icon-heavy button (think Roblox UI):

| Tab | Icon | Label (BG) | Label (EN) | Color |
|-----|------|------------|------------|-------|
| 1 | 📹 | Добави Видео | Add Video | Green |
| 2 | 🖼️ | Добави Снимка | Add Screenshot | Blue |
| 3 | 📝 | Нов Пост | New Post | Magenta |
| 4 | 🎬 | Стрийм | Stream | Orange |
| 5 | 💬 | Чат с ЧИЧИ | Chat with Uncle | Gold/Yellow |
| 6 | ⚙️ | Настройки | Settings | Gray |

**Below tabs**: The active tab's form/content

**Bottom section**: Content list (all entries, with edit/delete per item)

---

#### 4C. Tab 1-4: Content Management

(See main MonkaCraft_Claude_Code_Prompt.md for full details on these tabs)

Key principles for ALL content forms:
- LARGE input fields (min 48px height)
- LARGE buttons (min 56px height, full-width on mobile)
- LABELS in Bulgarian with English in parentheses: "Заглавие (Title)"
- Bright colors for action buttons: green for Save, blue for Upload, red for Delete
- Show live preview where possible (YouTube embed preview, image thumbnail)
- Auto-save draft to sessionStorage (kid types, accidentally closes tab → content preserved)
- Success feedback: big green "✅ ЗАПАЗЕНО!" animation after every save
- Error feedback: clear red message explaining what's wrong, not technical jargon

---

#### 4D. Tab 5: 💬 "ЧАТ С ЧИЧИ" (Chat with Uncle) — NEW FEATURE

> This is a special messaging feature. When Simeon wants to talk to his uncle (Martin), he types a message here and it gets sent as an email to martinizvorov@gmail.com.

**Architecture — EmailJS (100% free, client-side)**:

EmailJS allows sending emails directly from JavaScript without a backend. Free tier: 200 emails/month — more than enough for a kid chatting with his uncle.

**Setup (document in README.md)**:
1. Go to https://www.emailjs.com → Sign up free
2. Add Gmail service: Email Services → Add Service → Gmail → connect martinizvorov@gmail.com
3. Create email template:
   - Template name: "monkacraft_message"
   - Subject: "💬 MonkaS ти пише: {{subject}}"
   - Body:
     ```
     Ново съобщение от MonkaS! 🎮
     
     Тема: {{subject}}
     
     {{message}}
     
     ---
     Изпратено от MonkaCraft Admin Panel
     Дата: {{date}}
     ```
   - To: martinizvorov@gmail.com
4. Get: Service ID, Template ID, Public Key
5. Enter these in Admin → Settings tab

**Implementation** (`js/emailjs.js`):

```
Load EmailJS SDK: https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js
```

EmailJS credentials stored in localStorage (entered via Settings tab, just like Cloudinary).

**The Chat UI**:

Design it to look like a fun chat/messaging screen:

```
┌──────────────────────────────────────────┐
│  💬 ЧАТ С ЧИЧИ  /  Chat with Uncle      │
│─────────────────────────────────────────│
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 📋 Тема (Subject):                │  │
│  │ [Big input field               ]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ✏️ Съобщение (Message):            │  │
│  │ ┌──────────────────────────────┐  │  │
│  │ │                              │  │  │
│  │ │   Big textarea               │  │  │
│  │ │   min 150px height           │  │  │
│  │ │                              │  │  │
│  │ └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 📸 Прикачи снимка (optional):     │  │
│  │ [Upload to Cloudinary button]     │  │
│  │ (shows thumbnail preview)         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         ╔══════════════╗           │  │
│  │         ║  📨 ИЗПРАТИ  ║           │  │
│  │         ║  Send to     ║           │  │
│  │         ║  ЧИЧИ! 🚀    ║           │  │
│  │         ╚══════════════╝           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 📬 Изпратени съобщения (History):  │  │
│  │ ┌──────────────────────────────┐  │  │
│  │ │ ✅ "Кога ще играем?" - 13.02 │  │  │
│  │ │ ✅ "Виж какво построих" - 12  │  │  │
│  │ └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Features**:
- Subject: text input, placeholder "Какво искаш да кажеш на Чичи?"
- Message: textarea, placeholder "Напиши тук..."
- Optional image attach: uses the same Cloudinary upload widget → if attached, include the image URL in the email body
- BIG animated "ИЗПРАТИ" (Send) button — arrow icon, gold/yellow color, bouncy hover
- On send:
  1. Validate: subject and message required (show friendly error if empty)
  2. Show loading spinner: "📨 Изпращам..." 
  3. Call EmailJS `emailjs.send(serviceID, templateID, templateParams)`
  4. On success: Big celebration animation "✅ Изпратено! Чичи ще го види скоро! 🎉"
  5. On failure: "❌ Нещо не е наред. Опитай пак!" with retry button
  6. Save sent message to localStorage history (date, subject, first 50 chars of message)
- Message history: scrollable list of previously sent messages (read from localStorage)
  - Each entry shows: ✅ icon, subject, date
  - "Clear history" button (with confirmation)
- Rate limiting: Max 10 messages per day (kid safety — prevent spam). Show friendly counter: "Остават ти X съобщения за днес"

**Email template params sent to EmailJS**:
```javascript
{
  subject: "Кога ще играем Minecraft?",
  message: "Чичи, кога ще влезеш да играем? Построих нещо яко!",
  date: "13.02.2026, 15:30",
  image_url: "https://res.cloudinary.com/xxx/image/upload/v123/screenshot.jpg" // or "No image attached"
}
```

---

#### 4E. Tab 6: ⚙️ Settings

Settings page with these sections:

**Section 1: 🔑 Смяна на парола (Change Passphrase)**
- Current passphrase input
- New passphrase input  
- Confirm new passphrase input
- Save button → re-hashes and stores new hash

**Section 2: ☁️ Cloudinary настройки**
- Cloud Name input field
- Upload Preset input field  
- Test button → tries a small upload, shows ✅ or ❌
- Status indicator: "🟢 Свързан" or "🔴 Не е настроен"

**Section 3: 📧 EmailJS настройки (for Chat with ЧИЧИ)**
- Service ID input field
- Template ID input field
- Public Key input field
- Test button → sends a test email, shows ✅ or ❌
- Status indicator: "🟢 Готов за чат" or "🔴 Не е настроен"

**Section 4: 💾 Backup & Restore**
- "📥 Експорт (Download Backup)" → downloads content.json
- "📤 Импорт (Restore Backup)" → file picker for .json
- Warning text: "⚠️ Импортът ще замени всичко!"

**Section 5: 🗑️ Изчисти всичко (Nuclear Option)**
- Big red button: "Изтрий ВСИЧКО"
- Triple confirmation:
  1. Modal: "Сигурен ли си? / Are you sure?"
  2. Modal: "НАИСТИНА сигурен? / REALLY sure?"
  3. Input: "Напиши DELETE за потвърждение" → must type exactly "DELETE"
- After clearing: reloads default content.json

---

#### 4F. Content List (Bottom of Admin)

Always visible below the tabs:
- Scrollable table/list of ALL content entries
- Columns: Type icon | Title | Game Tag | Date | Actions
- Actions: 📝 Edit | 🗑️ Delete
- Edit → opens the appropriate tab with form pre-filled
- Delete → confirmation modal: "Изтрий '[title]'? Не може да се върне!"
- Search/filter bar at top of list
- Sorted newest first

---

### ⚫ SUB-AGENT 5: Integration Testing & Polish
**Priority**: LAST — verify everything works together  

**Tasks**:
1. **Flow test: First-time visitor**
   - Open index.html → content.json loads into localStorage → homepage shows starter content
   - Navigate to each page → content displays correctly
   - Mobile responsive → hamburger menu works
   - Gallery lightbox → works with keyboard and swipe

2. **Flow test: Admin content management**
   - Go to /pages/admin.html → login screen appears
   - Enter "monkacraft2024" → dashboard loads
   - Add a video → appears on videos.html immediately
   - Add a screenshot → appears on gallery.html
   - Write a blog post → appears on blog.html
   - Edit an entry → changes reflect
   - Delete an entry → gone from public pages

3. **Flow test: Chat with ЧИЧИ**
   - Configure EmailJS credentials in Settings
   - Send test email from Settings → verify it arrives
   - Go to Chat tab → write message → send → verify email arrives at martinizvorov@gmail.com
   - Attach image → verify Cloudinary URL appears in email
   - Send 10 messages → verify daily limit kicks in
   - Check message history shows all sent items

4. **Flow test: Cloudinary uploads**
   - Configure Cloudinary in Settings
   - Upload image in Screenshots tab → preview shows → save → visible on gallery
   - Upload video in Videos tab → save → playable on videos page

5. **Flow test: Backup/Restore**
   - Add several content entries
   - Export → download JSON file
   - Clear all content → site shows defaults
   - Import the JSON file → all custom content restored

6. **Flow test: Security**
   - Wrong passphrase 5 times → cooldown activates
   - Close browser → sessionStorage cleared → must re-enter passphrase
   - Public pages have no edit/delete buttons visible
   - Admin.html not linked in any navigation

7. **Polish checklist**:
   - [ ] All animations smooth (60fps, no jank)
   - [ ] All Bulgarian text is correct Cyrillic (UTF-8)
   - [ ] All forms have validation with kid-friendly error messages
   - [ ] All buttons have hover/active states
   - [ ] Favicon loads
   - [ ] Logo displays correctly
   - [ ] No console errors
   - [ ] No broken links
   - [ ] Mobile layout at 375px width looks good
   - [ ] Tablet layout at 768px looks good
   - [ ] Desktop layout at 1440px looks good
   - [ ] Lighthouse performance score > 85
   - [ ] All placeholder YouTube IDs are consistent

---

## README.md STRUCTURE

The README must cover everything a non-technical uncle + 9-year-old kid need:

### 1. 🚀 Quick Start (5 minutes)
Step-by-step: create GitHub account → new repo → upload files → enable Pages → site is live

### 2. ☁️ Cloudinary Setup (5 minutes)
Screenshots/descriptions: create account → get cloud name → create unsigned upload preset → enter in admin Settings

### 3. 📧 EmailJS Setup for "Chat with ЧИЧИ" (5 minutes)
Step-by-step:
1. Go to emailjs.com → Sign Up (free)
2. Email Services → Add Service → Gmail → authorize martinizvorov@gmail.com
3. Email Templates → Create New:
   - Name: monkacraft_message  
   - To: martinizvorov@gmail.com
   - Subject: `💬 MonkaS ти пише: {{subject}}`
   - Body: (provide exact template text)
4. Copy Service ID, Template ID from dashboard
5. Account → Public Key → copy
6. Enter all 3 values in Admin → Settings → EmailJS section

### 4. 🔐 Using the Admin Panel
- Default password: `monkacraft2024`
- How to add each content type (with descriptions)
- How to chat with uncle
- How to export/import backups

### 5. 🔄 Content Workflow for Other Visitors
Explain: content added in admin is in YOUR browser's localStorage. To make it visible for everyone:
1. Admin → Settings → Export JSON
2. Replace `data/content.json` in the GitHub repo with the exported file
3. Commit & push → GitHub Pages rebuilds → everyone sees the updated content

### 6. 🎨 Customization Guide
- Changing site name
- Changing colors (CSS variables)
- Changing passphrase
- Adding new game tags

### 7. 🛠️ Troubleshooting
- "Images won't upload" → check Cloudinary config
- "Email won't send" → check EmailJS config
- "Content disappeared" → import last backup
- "Forgot passphrase" → edit the hash in admin.js (provide instructions)

---

## IMPORTANT CONSTRAINTS

- ❌ NO npm, NO build tools, NO frameworks
- ❌ NO server-side code (everything runs in the browser)
- ❌ NO paid services (everything has a free tier)
- ❌ NO external JS libraries EXCEPT: Cloudinary Upload Widget + EmailJS SDK
- ✅ Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- ✅ Mobile-first responsive design
- ✅ All text supports Bulgarian Cyrillic (UTF-8)
- ✅ Kid-friendly UI: big buttons, bright colors, clear labels, fun animations
- ✅ Uncle-proof setup: clear README, copy-paste configurations

---

## EXECUTION CHECKLIST

When starting the build, follow this exact order:

```
[ ] Read MonkaCraft_Claude_Code_Prompt.md for full design specs
[ ] SUB-AGENT 0: Scaffold + data layer + content.json
[ ] SUB-AGENT 1: CSS design system + logo + favicon  
[ ] SUB-AGENT 2: Shared layout + navigation + app.js
[ ] SUB-AGENT 3: All 5 public pages with full functionality
[ ] SUB-AGENT 4: Admin panel (auth + dashboard + all tabs + chat + settings)
[ ] SUB-AGENT 5: Integration testing + polish + README.md
[ ] Final: Verify all files exist, no TODOs, no broken features
```

Every file must be COMPLETE. No placeholders, no "TODO: implement later", no stub functions. Build it like you're shipping it today.
