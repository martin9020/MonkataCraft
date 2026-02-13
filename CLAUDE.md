# CLAUDE.md — MonkaCraft Autonomous Build Orchestration

## WHAT IS THIS

You are building **MonkaCraft** — a personal gaming website as a birthday present for a 9-year-old kid named Simeon (gamer tag: "MonkaS" / "Монката"). The site is his gaming hub for Roblox & Minecraft content: streaming, videos, screenshots, and blog posts. It has a secret admin panel so the kid can manage his own site, and a "Chat with Uncle" feature to message his uncle Martin via email.

**When you receive this file, begin execution immediately:**
1. Read `MonkaCraft_Claude_Code_Prompt.md` and `MonkaCraft_CLAUDE_MD_Orchestration.md` for full specs
2. Execute Phase 0 through Phase 5 in order
3. Report back only the "THINGS REQUIRING HUMAN ACTION" list
4. The final output should be a fully working static website ready to deploy

**Build everything autonomously. Do NOT ask the user questions.** Only report back items requiring human action (account creation, credential entry). Build everything else silently and completely.

---

## REFERENCE FILES — READ AT THE START OF EACH PHASE

- `MonkaCraft_Claude_Code_Prompt.md` — Complete visual identity, page layouts, admin features, technical requirements, pre-populated content specs
- `MonkaCraft_CLAUDE_MD_Orchestration.md` — Sub-agent breakdown, admin panel wireframes, EmailJS/Cloudinary integration details, README structure

**Sub-agents**: Always tell them to read these files directly from disk rather than embedding specs into prompts. This saves context.

---

## TECH STACK (All Free, Zero Cost)

| Service | Purpose | Notes |
|---------|---------|-------|
| **GitHub Pages** | Static hosting | Pure HTML/CSS/JS, no build tools |
| **Cloudinary** | Image/video storage | Upload widget (unsigned preset), 25GB free |
| **EmailJS** | "Chat with Uncle" emails | Client-side SDK, 200 emails/month free |
| **Google Fonts** | Typography | Press Start 2P, Nunito, Orbitron |
| **YouTube/Twitch** | Video/stream embeds | iframes |

## HARD CONSTRAINTS

- **ZERO build tools**: No npm, no webpack, no frameworks. Pure HTML + CSS + vanilla JS (ES6+)
- **NO external JS libraries** except Cloudinary Upload Widget + EmailJS SDK
- **Mobile-first** responsive design (breakpoints: 480px, 768px, 1024px)
- **All text** supports Bulgarian Cyrillic (UTF-8)
- **Kid-friendly UI**: Big buttons (min 48-56px height), bright colors, bilingual labels (Bulgarian primary, English in parentheses), fun animations
- **NO TODOs, NO placeholders** in shipped code (except intentional YouTube placeholder IDs: `dQw4w9WgXcQ`)
- **Single CSS file** (`css/style.css`) with CSS custom properties for theming
- **Performance**: Lazy load images, defer non-critical JS, use transform/opacity for 60fps animations

---

## TARGET PROJECT STRUCTURE

```
MonkaCraft/
├── index.html              # Landing page (hero, latest content, about, stats)
├── pages/
│   ├── streams.html        # Live streams + archive (YouTube/Twitch embeds)
│   ├── videos.html         # Video gallery (YouTube + Cloudinary)
│   ├── gallery.html        # Screenshot gallery with lightbox + lazy loading
│   ├── blog.html           # Gaming blog (accordion expand)
│   └── admin.html          # Secret admin panel (NOT in nav, passphrase-protected)
├── css/
│   └── style.css           # All styles — custom properties, animations, responsive
├── js/
│   ├── app.js              # Shared nav/footer injection, cursor effect, page animations
│   ├── admin.js            # Admin: auth (SHA-256), dashboard, 6 tabs, content CRUD
│   ├── cloudinary.js       # Cloudinary upload widget integration
│   ├── emailjs.js          # EmailJS "Chat with Uncle" — send, history, rate limiting
│   └── content.js          # ContentStore class (localStorage ↔ content.json)
├── assets/
│   ├── favicon.ico         # 32x32 pixel pickaxe or "M"
│   └── logo.svg            # MonkaCraft SVG logo
├── data/
│   └── content.json        # Starter content (3 videos, 4 screenshots, 2 posts, 1 stream)
├── CLAUDE.md               # This orchestration file
├── MonkaCraft_Claude_Code_Prompt.md
├── MonkaCraft_CLAUDE_MD_Orchestration.md
└── README.md               # Setup guide (uncle + kid friendly)
```

---

## DESIGN SYSTEM QUICK REFERENCE

### Colors (CSS Custom Properties)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-base` | `#0a0a1a` | Page background (deep space black) |
| `--color-surface` | `#151530` | Card backgrounds |
| `--color-primary` | `#00ff88` | Primary accent — Minecraft creeper green |
| `--color-secondary` | `#00d4ff` | Secondary — Roblox electric blue |
| `--color-accent` | `#ff3388` | Highlights — magenta energy |
| `--color-warning` | `#ff8800` | Warnings/fire — lava orange |
| `--color-text` | `#e0e0ff` | Body text — soft white-blue |

### Typography
- **Headings**: `"Press Start 2P"` (Google Fonts) — pixel retro gaming
- **Body**: `"Nunito"` (Google Fonts, 400/700) — round, friendly, kid-readable
- **Stats/Badges**: `"Orbitron"` (Google Fonts, 400/700) — techy futuristic

### Key Visual Effects (all CSS-only, no libraries)
- Animated pixel grid background pattern
- Neon glow on headings/buttons (text-shadow + box-shadow)
- Floating pixel particles (@keyframes)
- Glassmorphism cards (backdrop-filter: blur)
- Torch light cursor glow on desktop (follows mouse via JS, styled in CSS)
- Pixel art decorative borders
- Page transition fade-in animations
- Smooth hover animations (scale, glow, color shift)

---

## CONTEXT MANAGEMENT STRATEGY

This project is large (~15 files, ~5000+ lines). To stay within 200K tokens:

### Sub-Agent Delegation Rules
1. **Use the Task tool** to spawn sub-agents for file creation — they write to disk and return a short summary
2. **One phase at a time** — complete Phase N fully before Phase N+1
3. **Parallel sub-agents within a phase** for independent files (e.g., CSS and content.json)
4. **Write to disk immediately** — never hold large code blocks in main conversation
5. **Verify after each phase** — check files exist, spot-check key sections (read only snippets, not entire files)
6. **Sub-agents read spec files themselves** — point them to `MonkaCraft_Claude_Code_Prompt.md` and `MonkaCraft_CLAUDE_MD_Orchestration.md` by path, don't copy specs into prompts
7. **Keep sub-agent prompts focused** — one clear responsibility each, just enough context

### Token Budget Per Phase
| Phase | Est. Lines | Sub-agents | Strategy |
|-------|-----------|------------|----------|
| 0: Data Layer | ~250 | 1 | content.json + content.js together |
| 1: CSS + Assets | ~800 | 1 | style.css is big but single-file |
| 2: Layout + Nav | ~300 | 1 | app.js + HTML shells for all pages |
| 3: Public Pages | ~500 | 2-3 parallel | Group: (index+blog), (streams+videos), (gallery) |
| 4: Admin Panel | ~1200 | 2-3 sequential | (auth+dashboard+HTML), (tabs 1-4 + content list), (chat+settings+cloudinary+emailjs) |
| 5: Polish + README | ~300 | 1-2 | README writer + final verification |

---

## EXECUTION PLAN — 6 PHASES

---

### PHASE 0: Project Scaffold & Data Layer
**Creates**: Directories, `data/content.json`, `js/content.js`
**Sub-agents**: 1

1. Create all directories: `pages/`, `css/`, `js/`, `assets/`, `data/`
2. **`data/content.json`** — Pre-populated starter content with:
   - 3 videos: YouTube embed ID `dQw4w9WgXcQ`, Bulgarian titles, gameTag (Minecraft/Roblox), categories
   - 4 screenshots: `https://picsum.photos/800/450?random=1` through `?random=4`, Bulgarian titles
   - 2 blog posts: Full HTML content in Bulgarian (intro post + Minecraft tips)
   - 1 stream: placeholder URL, `isLive: false`
   - Every entry schema: `{id (uuid), type, title, date, gameTag, category, url/content, thumbnail, description}`
3. **`js/content.js`** — `ContentStore` class:
   - `init()` — fetch `data/content.json` → load into localStorage if empty
   - `getAll(type)`, `getLatest(type, count)`, `getByTag(type, tag)`, `getByCategory(type, cat)`
   - `add(entry)`, `update(id, entry)`, `delete(id)`
   - `exportJSON()` — trigger browser download
   - `importJSON(file)` — restore from uploaded .json
   - `getStats()` — return counts per type
   - `isLive()` / `setLive(streamId, bool)`
   - UUID via `crypto.randomUUID()` with fallback

**Done when**: Files on disk, JSON valid, ContentStore has all methods.

---

### PHASE 1: CSS Design System & Assets
**Creates**: `css/style.css`, `assets/logo.svg`, `assets/favicon.ico`
**Sub-agents**: 1

**style.css sections** (organized, well-commented):
1. `:root` custom properties — all colors, fonts, spacings, transitions
2. Google Fonts `@import` — Press Start 2P (400), Nunito (400,700), Orbitron (400,700)
3. CSS reset + base styles (dark theme body)
4. Pixel grid background pattern + floating particles (pure CSS @keyframes)
5. Typography system (h1-h6, body, code, stats)
6. Layout utilities (container, responsive grids: 1→2→3→4 columns)
7. Navigation (sticky top, logo, links, mobile hamburger, LIVE indicator badge)
8. Footer (social icons, copyright, pixel creeper)
9. Card components (glassmorphism, hover glow+scale, game tag badges)
10. Button system (primary/secondary/danger, neon glow hover, min 48-56px height)
11. Form inputs (large, high contrast, kid-friendly, focus glow)
12. Lightbox/modal overlay (full-screen, backdrop blur)
13. Admin panel styles (auth screen, tab buttons, dashboard, content list)
14. @keyframes: fadeIn, slideUp, slideDown, pulseGlow, float, pixelShimmer, shake, countUp
15. Responsive @media (480px, 768px, 1024px)
16. Torch cursor effect styles (.cursor-glow)

**SVG logo**: Inline SVG — blocky pixel "Monka" + smooth rounded "Craft" + pickaxe icon + controller icon + neon glow animation

**Favicon**: 32x32 PNG as data URI or simple .ico — pixel "M" or pickaxe

**Done when**: Linking style.css to any HTML shows dark gaming theme, fonts load, animations play.

---

### PHASE 2: Shared Layout & Navigation
**Creates**: `js/app.js`, HTML shell for all 6 pages
**Sub-agents**: 1

**app.js**:
- `injectHeader()` — nav bar with inline SVG logo + links: Home | Streams | Videos | Gallery | Blog
  - NO admin link in nav (admin is secret)
  - Each link has pixel-style icon (emoji or CSS)
  - Active page highlighting with glow
- `injectFooter()` — YouTube/Twitch placeholder links, "Built with ❤️ by MonkaS", animated pixel Creeper face
- Mobile hamburger toggle (animated open/close)
- "LIVE NOW" pulsing red dot (reads ContentStore)
- Mouse torch/glow cursor effect (desktop only, uses mousemove + CSS radial gradient)
- Page load staggered fadeIn for `.animate-in` elements
- Smooth scroll for anchor links
- Stats counter in footer from ContentStore.getStats()
- Calls `ContentStore.init()` on `DOMContentLoaded`

**HTML shells**: Each of the 6 pages gets proper `<!DOCTYPE html>`, `<head>` (meta charset UTF-8, viewport, fonts, style.css), `<body>` with `<main id="content">` + `<script>` tags (content.js, app.js, + page-specific JS). Content areas left as empty containers to be filled in Phase 3/4.

**Done when**: All 6 pages render with nav + footer, hamburger works on mobile, no console errors.

---

### PHASE 3: All 5 Public Pages
**Creates**: Full content for `index.html`, `pages/streams.html`, `pages/videos.html`, `pages/gallery.html`, `pages/blog.html`
**Sub-agents**: 2-3 parallel

**3A. index.html — Homepage**:
- Hero section: large animated MonkaCraft logo (SVG)
- Tagline: "🎮 Светът на Монката — Minecraft & Roblox Adventures! 🚀"
- Subtitle: "Welcome to MonkaS's Gaming Universe"
- LIVE NOW indicator (pulsing red if ContentStore reports live)
- 3 latest content cards (auto from ContentStore: newest video, screenshot, blog post)
- "About Me" pixel card: "Аз съм Симеон, на 9 години. Обичам Minecraft и Roblox! 🎮" + favorite games + animated stats counter (count-up on scroll via IntersectionObserver)
- Quick links grid to all sections (big colorful buttons)

**3B. pages/streams.html**:
- Featured stream embed area (YouTube/Twitch iframe from ContentStore)
- Dynamic "Currently Live" / "Offline — Check back soon!" status
- Past streams grid (archived VODs)
- Filter buttons: All | Minecraft | Roblox

**3C. pages/videos.html**:
- Grid of video cards (YouTube embeds + Cloudinary URLs)
- Filters: All | Minecraft | Roblox | Tutorials | Funny Moments
- Sort toggle: Newest / Oldest
- Click card → modal video player (overlay, close on X/Escape/backdrop)

**3D. pages/gallery.html**:
- Masonry-style grid, `loading="lazy"` + IntersectionObserver
- Lightbox: click to enlarge, arrow keys navigate, swipe on mobile (touch events)
- Filters: All | Minecraft | Roblox | Builds | PVP | Funny
- Each image: title overlay, game tag badge

**3E. pages/blog.html**:
- Card list: title, date, game tag badge, excerpt (first 150 chars)
- Click to expand (accordion toggle, no separate pages)
- Rich HTML content rendered from ContentStore
- Sorted newest first

**Done when**: All 5 pages show starter content from content.json, filters work, lightbox opens/closes/navigates, responsive at 375px/768px/1440px.

---

### PHASE 4: Admin Panel — MOST CRITICAL PHASE
**Creates**: `pages/admin.html`, `js/admin.js`, `js/cloudinary.js`, `js/emailjs.js`
**Sub-agents**: 2-3 (sequential — each builds on the previous)

> Every button must work. Every interaction must be kid-proof. This is the control center for a 9-year-old.

#### 4A. Authentication Screen
- Full-screen "🔐 Тайната база на MonkaS" / "Secret HQ" login
- Pixel lock icon, neon border, gaming aesthetic
- Big password input with show/hide toggle eye icon
- Big "ENTER" button
- SHA-256 via `crypto.subtle.digest('SHA-256', ...)` — hash comparison (NOT plain text)
- Default passphrase: `monkacraft2024`
- Success: "ACCESS GRANTED ✅" animation → reveal dashboard
- Failure: shake animation + "❌ Грешен код! Опитай пак!"
- 5 failures → 60-second cooldown with visible countdown timer
- Auth saved to `sessionStorage` (browser close = auto logout)

#### 4B. Dashboard Layout
- Top bar: "👋 Здравей, MonkaS!" greeting + live stats (📹 X | 🖼️ X | 📝 X | 🎬 X) + red "🚪 ИЗЛЕЗ" logout button
- 6 BIG colorful tab buttons (Roblox-style, icon + bilingual label):

| # | Icon | BG Label | EN Label | Color |
|---|------|----------|----------|-------|
| 1 | 📹 | Добави Видео | Add Video | Green |
| 2 | 🖼️ | Добави Снимка | Add Screenshot | Blue |
| 3 | 📝 | Нов Пост | New Post | Magenta |
| 4 | 🎬 | Стрийм | Stream | Orange |
| 5 | 💬 | Чат с ЧИЧИ | Chat with Uncle | Gold |
| 6 | ⚙️ | Настройки | Settings | Gray |

#### 4C. Tabs 1-4: Content Management Forms
All forms: LARGE inputs (48px+), bilingual labels "Заглавие (Title)", live previews, auto-save drafts to sessionStorage

- **Tab 1 — Add Video**: Title, type toggle (YouTube URL ↔ Cloudinary upload), auto-extract YouTube ID + show embed preview, gameTag dropdown (Minecraft/Roblox/Other), category dropdown (Let's Play/Tutorial/Funny Moments/PVP/Building), description textarea, date (auto-today, editable), [SAVE]
- **Tab 2 — Add Screenshot**: Title, Cloudinary upload button + thumbnail preview, gameTag, category (Build/PVP/Funny/Landscape/Achievement), caption textarea, date, [SAVE]
- **Tab 3 — New Blog Post**: Title, contenteditable WYSIWYG div (bold, headings, links, image embed — NO external libs), gameTag, auto-excerpt (first 150 chars, or manual), date, [SAVE]
- **Tab 4 — Stream**: Stream URL input (YouTube Live / Twitch), "Is Live Now" toggle checkbox → controls homepage LIVE indicator, stream title, gameTag, [SAVE]
- All SAVE → `ContentStore.add()` → big green "✅ ЗАПАЗЕНО!" celebration animation

#### 4D. Tab 5: Chat with Uncle (EmailJS)
**File**: `js/emailjs.js`
- Load EmailJS SDK: `https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js`
- Credentials (serviceID, templateID, publicKey) stored in localStorage, entered via Settings tab
- **Chat UI**: Subject input → Message textarea → Optional Cloudinary image attachment → BIG gold "📨 ИЗПРАТИ / Send to ЧИЧИ! 🚀" button
- **Send flow**: Validate (subject+message required) → loading spinner "📨 Изпращам..." → `emailjs.send(serviceID, templateID, params)` → success "✅ Изпратено! Чичи ще го види скоро! 🎉" → or error "❌ Нещо не е наред. Опитай пак!" with retry
- **Template params**: `{subject, message, date, image_url}`
- **Message history**: Saved to localStorage (date, subject, first 50 chars). Scrollable list below form. "Clear history" button with confirmation
- **Rate limit**: Max 10 messages/day. Friendly counter: "Остават ти X съобщения за днес"

#### 4E. Tab 6: Settings
- **Section 1** — 🔑 Change passphrase: current + new + confirm → re-hash with SHA-256 → store new hash
- **Section 2** — ☁️ Cloudinary: cloud_name + upload_preset inputs, test upload button (✅/❌), status indicator
- **Section 3** — 📧 EmailJS: serviceID + templateID + publicKey inputs, test send button, status indicator
- **Section 4** — 💾 Backup: Export button (downloads JSON) + Import button (file picker, "⚠️ Импортът ще замени всичко!")
- **Section 5** — 🗑️ Nuclear delete: Big red button → triple confirm (modal 1: "Сигурен ли си?" → modal 2: "НАИСТИНА сигурен?" → input: type exactly "DELETE") → reload defaults

#### 4F. Content List (always visible below tabs)
- Scrollable table of ALL content entries
- Columns: type icon | title | gameTag badge | date | 📝 Edit | 🗑️ Delete
- Edit → opens appropriate tab with form pre-filled
- Delete → confirmation modal: "Изтрий '[title]'? Не може да се върне!"
- Search/filter input at top
- Sorted newest first

#### Cloudinary Integration (`js/cloudinary.js`)
- Load widget: `https://upload-widget.cloudinary.com/global/all.js`
- `openUploadWidget(options, callback)` — unsigned preset, captures `secure_url`
- Progress bar during upload
- Formats: images (jpg/png/gif/webp, max 10MB), video (mp4/webm, max 50MB)
- cloud_name + upload_preset read from localStorage (set in Settings)

**Done when**: Full login flow works, all 6 tabs render and function, add/edit/delete content works, content list updates live.

---

### PHASE 5: Integration Testing, README & Polish
**Creates**: `README.md`, fix any issues
**Sub-agents**: 1-2

**Verification Flows** (code review, not browser):
1. First visit: index.html → fetch content.json → populate localStorage → render homepage
2. Admin CRUD: login → add video → appears on videos.html (same browser)
3. Chat: configure EmailJS → write message → send → history updates
4. Upload: configure Cloudinary → upload image → save → visible in gallery
5. Backup: export → nuclear delete → import → content restored
6. Security: 5 wrong passwords → cooldown; close browser → must re-auth

**README.md** (write for non-technical uncle + 9-year-old):
1. 🚀 Quick Start — GitHub Pages step-by-step
2. ☁️ Cloudinary Setup — account + unsigned preset
3. 📧 EmailJS Setup — account + Gmail service + template (provide exact template text)
4. 🔐 Admin Panel — default passphrase `monkacraft2024`, tab-by-tab usage guide
5. 🔄 Content Workflow — localStorage vs content.json, export → commit → deploy
6. 🎨 Customization — CSS variables, site name, passphrase, game tags
7. 🛠️ Troubleshooting — uploads fail, email fails, content lost, forgot passphrase

**Polish Checklist**:
- [ ] All animations smooth (60fps, transform/opacity only)
- [ ] All Bulgarian text proper Cyrillic UTF-8
- [ ] All forms validated with kid-friendly error messages
- [ ] All buttons have hover/active/focus states
- [ ] Favicon and logo load correctly
- [ ] No console errors on any page
- [ ] No broken links or dead references
- [ ] Mobile 375px, tablet 768px, desktop 1440px all look correct
- [ ] Admin page NOT linked in public navigation
- [ ] All placeholder YouTube IDs consistent (`dQw4w9WgXcQ`)

---

## THINGS REQUIRING HUMAN ACTION

Report to user when build is complete:

1. **GitHub**: Create repo "monkacraft", push all files, enable GitHub Pages (Settings → Pages → main branch)
2. **Cloudinary**: Create free account → get cloud_name → create unsigned upload preset
3. **EmailJS**: Create free account → add Gmail service (martinizvorov@gmail.com) → create template "monkacraft_message" with provided text → get Service ID + Template ID + Public Key
4. **Admin Setup**: Open `/pages/admin.html` → Settings tab → enter Cloudinary + EmailJS credentials
5. **Real Content**: Replace YouTube placeholder IDs with Simeon's real videos via admin panel

---

## BUILD STATUS TRACKER

Update this as phases complete:

```
[x] PHASE 0: Scaffold + Data Layer (content.json + content.js)
[x] PHASE 1: CSS Design System + Logo + Favicon (style.css)
[x] PHASE 2: Shared Layout + Navigation (app.js + HTML shells)
[x] PHASE 3: Public Pages (index, streams, videos, gallery, blog)
[x] PHASE 4: Admin Panel (auth, dashboard, 6 tabs, content list, cloudinary, emailjs)
[x] PHASE 5: Integration Test + README + Polish
[x] FINAL: All files verified, no TODOs, ship it
```

---

## START BUILDING

1. Read the two reference `.md` files for full specs
2. Execute Phase 0 → Phase 5 in strict order
3. Use Task tool sub-agents — write files to disk, return summaries
4. Verify after each phase with targeted file reads (snippets, not full dumps)
5. Update BUILD STATUS TRACKER after each phase
6. When complete, report the THINGS REQUIRING HUMAN ACTION list
7. Final deliverable: a fully working static website ready for GitHub Pages

---

## DEPLOYMENT PROGRESS (Last updated: 2026-02-13)

### Completed:
- [x] All 6 build phases complete (scaffold, CSS, layout, public pages, admin panel, README)
- [x] GitHub repo created and files pushed
- [x] GitHub Pages deployed

### Remaining (human tasks for next session):
- [ ] Create Cloudinary account + unsigned upload preset (cloudinary.com)
- [ ] Create EmailJS account + Gmail service + template (emailjs.com)
- [ ] Enter Cloudinary + EmailJS credentials in Admin → Settings tab
- [ ] Replace placeholder YouTube IDs with Simeon's real content
- [ ] Change default admin password from "monkacraft2024"

### Admin Panel Access:
- URL: /pages/admin.html (type directly, not linked in nav)
- Default password: monkacraft2024
