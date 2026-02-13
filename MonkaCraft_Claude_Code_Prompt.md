# Claude Code Prompt — MonkaCraft Gaming Hub

> Copy-paste this entire prompt into Claude Code CLI. It contains everything needed to build the complete project.

---

## THE PROMPT (copy from here ↓)

```
Build a complete static gaming website called "MonkaCraft" for a 9-year-old kid named Simeon (gamer tag: "MonkaS" / "Монката"). The site is his personal gaming hub for Roblox & Minecraft content — streaming, videos, screenshots, and blog posts. It will be hosted on GitHub Pages (free static hosting).

## PROJECT STRUCTURE

Create a clean project structure:

```
monkacraft/
├── index.html          # Main landing page
├── pages/
│   ├── streams.html    # Live stream embeds + stream archive
│   ├── videos.html     # Video gallery (YouTube embeds + direct uploads)
│   ├── gallery.html    # Screenshot/image gallery with lightbox
│   ├── blog.html       # Gaming blog/news posts
│   └── admin.html      # Secret admin panel (passphrase-protected)
├── css/
│   └── style.css       # All styles (single file, well-organized)
├── js/
│   ├── app.js          # Main app logic, navigation, theme
│   ├── admin.js        # Admin panel logic (upload, manage content)
│   ├── cloudinary.js   # Cloudinary upload widget integration
│   └── content.js      # Content data store (JSON-based)
├── assets/
│   ├── favicon.ico
│   └── logo.svg        # MonkaCraft logo (create as inline SVG)
├── data/
│   └── content.json    # All content entries (videos, images, posts, streams)
└── README.md           # Setup instructions for GitHub Pages + Cloudinary
```

## DESIGN REQUIREMENTS — "Gaming Portal" Aesthetic

### Theme: Hybrid Gaming Universe
Mix Minecraft's blocky pixel aesthetic with Roblox's colorful modern style, wrapped in a neon-glow gaming atmosphere. This should feel like a kid's dream gaming portal.

### Visual Identity:
- **Color palette**: 
  - Dark base: #0a0a1a (deep space black)
  - Primary neon green: #00ff88 (Minecraft creeper green)
  - Secondary electric blue: #00d4ff (Roblox vibe)
  - Accent magenta: #ff3388 (energy/highlights)
  - Warning orange: #ff8800 (lava/fire accents)
  - Surface: #151530 (card backgrounds)
  - Text: #e0e0ff (soft white-blue)

- **Typography**: 
  - Headings: "Press Start 2P" from Google Fonts (pixel/retro gaming font)
  - Body text: "Nunito" from Google Fonts (round, friendly, very readable for kids)
  - Accent/badges: "Orbitron" (techy/futuristic for stats and counters)

- **Visual effects** (CSS-only, no heavy libraries):
  - Animated pixel grid background (subtle CSS pattern)
  - Neon glow effects on headings and buttons (CSS text-shadow + box-shadow)
  - Floating pixel particles animation (pure CSS)
  - Cards with glassmorphism effect (backdrop-filter: blur)
  - Smooth hover animations on all interactive elements (scale, glow, color shift)
  - Page transition fade-in animations
  - A "torch light" cursor glow effect that follows mouse on desktop
  - Pixel art decorative borders on sections

- **Logo**: Create an inline SVG "MonkaCraft" logo combining:
  - Blocky Minecraft-style letters for "Monka"
  - Smooth Roblox-style letters for "Craft"
  - A small pickaxe + game controller icon integrated into the design
  - Neon glow animation on the logo

### Layout:
- **Navigation**: Sticky top navbar with pixel-style icons for each section. Mobile hamburger menu. Active page indicator with glow effect.
- **Footer**: Social links (YouTube, Twitch — use placeholder URLs), "Built with ❤️ by MonkaS", animated pixel Creeper face.
- **Responsive**: Mobile-first design. Works perfectly on phones (Simeon will likely share with friends on their phones). Breakpoints at 480px, 768px, 1024px.

## PAGE DETAILS

### 1. index.html — Home / Landing Page
- Hero section with large animated "MonkaCraft" logo
- Tagline: "🎮 Светът на Монката — Minecraft & Roblox Adventures! 🚀" (keep Bulgarian text)
- Below tagline: "Welcome to MonkaS's Gaming Universe" (English subtitle)
- "LIVE NOW" indicator (reads from content.json — shows red pulsing dot if isLive: true)
- 3 latest content cards (auto-pulled from content.json — newest video, screenshot, blog post)
- "About Me" mini section: fun pixel-art style card with:
  - "Аз съм Симеон, на 9 години. Обичам Minecraft и Roblox! 🎮"
  - Favorite games list with pixel icons
  - A fun stats counter: "Videos: X | Screenshots: X | Adventures: ∞"
- Quick links grid to all sections

### 2. pages/streams.html — Streams
- Featured stream embed area (YouTube Live or Twitch embed via iframe)
- "Currently Live" / "Offline — Check back soon!" dynamic status
- Archive section: grid of past stream VODs (YouTube embeds from content.json)
- Each stream card shows: thumbnail, title, date, game tag (Minecraft/Roblox)
- Filter buttons: All | Minecraft | Roblox

### 3. pages/videos.html — Videos
- Grid layout of video cards
- Supports two types:
  a) YouTube embed links (stored as URLs in content.json)
  b) Direct video files uploaded to Cloudinary (stored as Cloudinary URLs)
- Each card: thumbnail (auto from YouTube or Cloudinary), title, date, game tag, description
- Filter: All | Minecraft | Roblox | Tutorials | Funny Moments
- Sort: Newest first / Oldest first
- Lightbox/modal for playing videos without leaving the page

### 4. pages/gallery.html — Screenshot Gallery
- Masonry-style grid of gaming screenshots
- Images hosted on Cloudinary
- Lightbox viewer: click to enlarge, arrow keys to navigate, swipe on mobile
- Each image has: title, game tag, date, optional caption
- Filter: All | Minecraft | Roblox | Builds | PVP | Funny
- Lazy loading for performance

### 5. pages/blog.html — Blog / News
- Simple blog layout: cards with title, date, game tag, excerpt
- Click to expand full post (accordion style, no separate pages)
- Supports basic formatting: headings, paragraphs, bold, links, embedded images
- Posts stored as HTML strings in content.json

### 6. pages/admin.html — SECRET Admin Panel

**THIS IS CRITICAL — READ CAREFULLY:**

The admin panel is how Simeon manages ALL content on the site. It must be:
- KID-FRIENDLY: Big buttons, clear labels in both Bulgarian and English, colorful UI
- PROTECTED: Hidden behind a passphrase (NOT visible in source code as plain text)

#### Access Control:
- When visiting admin.html, show a fun "Enter Secret Code" screen with a password input
- The passphrase is stored as a SHA-256 hash in the code (NOT plain text)
- Default passphrase: "monkacraft2024" (document this in README.md)
- On correct entry: save auth state to sessionStorage (expires when browser closes)
- On wrong entry: fun "Access Denied! 🚫" animation, max 5 attempts then 60s cooldown
- The admin page should NOT be linked anywhere in the public navigation — Simeon accesses it by typing /pages/admin.html directly

#### Admin Features:

**A) Content Manager Dashboard**
Show counts: Total Videos | Total Screenshots | Total Blog Posts | Total Streams

**B) Add New Content — Tabbed interface:**

Tab 1: "📹 Add Video"
- Title (text input)
- Type: YouTube Link / Upload Video
  - If YouTube: paste URL field → auto-extract video ID → show preview
  - If Upload: Cloudinary upload widget button → uploads to Cloudinary → saves URL
- Game tag: dropdown (Minecraft / Roblox / Other)
- Category: dropdown (Let's Play / Tutorial / Funny Moments / PVP / Building)
- Description (textarea)
- Date (auto-filled with today, editable)
- [SAVE] button → adds to content.json structure in localStorage

Tab 2: "🖼️ Add Screenshot"
- Title (text input)
- Upload button → Cloudinary upload widget → saves image URL
- Show upload preview
- Game tag dropdown
- Category dropdown (Build / PVP / Funny / Landscape / Achievement)
- Caption (optional textarea)
- Date (auto-filled)
- [SAVE] button

Tab 3: "📝 Add Blog Post"
- Title (text input)
- Simple WYSIWYG-style editor (bold, headings, links, image embed — build with contenteditable div, no external library)
- Game tag dropdown
- Excerpt (auto-generated from first 150 chars, or manual override)
- Date (auto-filled)
- [SAVE] button

Tab 4: "🎬 Add/Update Stream"
- Stream URL (YouTube Live or Twitch channel URL)
- Toggle: "Is Live Now" checkbox → controls the pulsing live indicator on homepage
- Stream title
- Game tag
- [SAVE] button

Tab 5: "⚙️ Settings"
- Change admin passphrase (requires current passphrase)
- Export all content as JSON file (download backup)
- Import content from JSON file (restore backup)
- Clear all content (with triple confirmation: "Are you sure?" → "Really sure?" → "Type DELETE to confirm")

**C) Content List / Edit / Delete**
- Below the tabs: scrollable list of ALL content entries
- Each entry shows: type icon, title, date, game tag
- Edit button → opens the entry in the appropriate tab form pre-filled
- Delete button → confirmation modal ("Delete [title]? This cannot be undone!")
- Entries sorted newest first

#### Data Storage Architecture:

Since this is static hosting (GitHub Pages), use this approach:
1. **localStorage** as the primary content database
2. **content.json** file in the repo as the INITIAL/DEFAULT content (pre-populated starter content — see below)
3. On first visit, app.js loads content.json into localStorage if localStorage is empty
4. After that, all reads come from localStorage
5. Admin panel writes to localStorage
6. The Export/Import feature in Settings is the backup/restore mechanism
7. **Media files** (images, videos) are stored on Cloudinary — only the URLs are saved in localStorage

**IMPORTANT**: All public pages (index, streams, videos, gallery, blog) read from localStorage. The admin panel writes to localStorage. This means content added via admin is immediately visible on the public pages (same browser). For other visitors, they see the default content.json until Simeon exports his localStorage and commits it as the new content.json to the repo.

Document this workflow clearly in README.md.

## CLOUDINARY INTEGRATION

### Setup (document in README.md):
1. Create free Cloudinary account at cloudinary.com
2. Get cloud name, upload preset (unsigned)
3. In admin Settings tab: fields to enter cloud_name and upload_preset
4. These are saved to localStorage

### Upload Widget:
- Use Cloudinary's Upload Widget (https://upload-widget.cloudinary.com/global/all.js)
- Unsigned upload preset (no API secret needed — safe for client-side)
- On successful upload: capture the secure_url and save it to the content entry
- Show upload progress bar
- Support image formats: jpg, png, gif, webp
- Support video formats: mp4, webm
- Max file size: 50MB for video, 10MB for images

## PRE-POPULATED STARTER CONTENT

Include realistic starter content in content.json so the site doesn't look empty:

### 3 Sample Videos:
1. Title: "Minecraft Survival — Ден 1! 🏠" | YouTube embed: use ID "dQw4w9WgXcQ" as placeholder | Tag: Minecraft | Category: Let's Play
2. Title: "Roblox Obby Challenge с приятели! 🏃" | YouTube embed: use ID "dQw4w9WgXcQ" as placeholder | Tag: Roblox | Category: Funny Moments  
3. Title: "Как да си направиш EPIC Minecraft къща 🏰" | YouTube embed: use ID "dQw4w9WgXcQ" as placeholder | Tag: Minecraft | Category: Tutorial

### 4 Sample Screenshots:
Use placeholder images from https://picsum.photos/800/450?random=1 (through ?random=4)
1. Title: "Моята Minecraft база! 🏰" | Tag: Minecraft | Category: Build
2. Title: "Roblox Adopt Me — моите питомци 🐶" | Tag: Roblox | Category: Funny
3. Title: "PVP победа — 10 kills! ⚔️" | Tag: Minecraft | Category: PVP
4. Title: "Залез в Minecraft — красиво! 🌅" | Tag: Minecraft | Category: Landscape

### 2 Sample Blog Posts:
1. Title: "Започвам канал! 🎉" | Content: Introductory blog post in Bulgarian about starting the gaming channel, excitement about sharing Minecraft and Roblox adventures
2. Title: "Топ 5 Minecraft съвета за начинаещи 💡" | Content: A fun listicle with 5 Minecraft beginner tips in Bulgarian

### 1 Sample Stream:
- Title: "Minecraft Survival — строим замък! 🏰"
- URL: placeholder YouTube URL
- isLive: false

## TECHNICAL REQUIREMENTS

- **Zero build tools**: No npm, no webpack, no frameworks. Pure HTML + CSS + JS.
- **Single CSS file**: Well-organized with CSS custom properties (variables) for theming
- **Vanilla JavaScript**: ES6+ modules where appropriate, but keep it simple
- **Performance**: 
  - Lazy load images (loading="lazy" + IntersectionObserver for gallery)
  - Defer non-critical JS
  - Efficient CSS animations (transform/opacity only for smooth 60fps)
- **Accessibility**: Proper semantic HTML, alt tags, keyboard navigation, focus states
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge — last 2 versions)
- **No external JS libraries** except Cloudinary Upload Widget
- **Google Fonts**: Load only Press Start 2P (400), Nunito (400, 700), Orbitron (400, 700)

## README.md

Write a comprehensive README.md with:

1. **Quick Start** — How to deploy on GitHub Pages (step by step, kid-friendly with uncle's help)
2. **Cloudinary Setup** — Account creation, getting cloud name and upload preset
3. **How to Use the Admin Panel** — Step by step with the default passphrase
4. **Content Workflow** — How to add content, export/import, and commit updates
5. **Customization** — How to change the site name, colors, passphrase
6. **Troubleshooting** — Common issues and fixes
7. **Architecture** — Brief explanation of how the data flows (localStorage + content.json + Cloudinary)

## QUALITY STANDARDS

- Every page must look AMAZING — this is a gift for a 9-year-old, make it exciting!
- Animations should be smooth and delightful, not distracting
- The admin panel must be bulletproof — a kid should not accidentally delete everything
- All Bulgarian text must use proper Cyrillic (UTF-8)
- Test all JavaScript logic mentally — no broken features
- CSS should be clean, using custom properties, and well-commented
- The site should feel fast, even on mobile

Build the COMPLETE project — every file, every feature, fully working. Do not leave any TODOs or placeholders in the code (except the YouTube video IDs which are intentionally placeholder). Every button must work, every animation must be implemented, every page must be complete.
```

---

## USAGE NOTES

### How to use this prompt:

1. Open terminal, navigate to your project folder
2. Run `claude` to start Claude Code
3. Paste the entire prompt above (between the ``` markers)
4. Let it build — it will create all files
5. Review and test locally (open index.html in browser)

### After building, deploy:

1. Create GitHub repo "monkacraft"
2. Push all files
3. Enable GitHub Pages (Settings → Pages → Branch: main)
4. Site live at: `https://[username].github.io/monkacraft`

### Cloudinary setup:

1. Go to cloudinary.com → Sign up free
2. Dashboard → Copy "Cloud Name"
3. Settings → Upload → Add upload preset → Set to "Unsigned"
4. Enter these in the admin panel Settings tab

### Changing the passphrase:

Default admin passphrase: `monkacraft2024`
Change it in the admin Settings tab after first login.
