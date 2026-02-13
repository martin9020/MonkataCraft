# MonkaCraft

**Personal gaming hub for MonkaS -- Minecraft & Roblox content!**

A kid-friendly website where Simeon (MonkaS) can share gaming videos, screenshots, blog posts, and live streams. It has a secret admin panel, a "Chat with Uncle" feature, and a cool dark-neon gaming look.

Built with plain HTML, CSS, and JavaScript. No fancy tools needed -- just upload to GitHub and you are live!

---

## Table of Contents

1. [Quick Start (GitHub Pages)](#-quick-start-github-pages-deployment)
2. [Cloudinary Setup (Image Uploads)](#-cloudinary-setup-image--video-uploads)
3. [EmailJS Setup (Chat with Uncle)](#-emailjs-setup-chat-with-uncle-feature)
4. [Using the Admin Panel](#-using-the-admin-panel)
5. [Content Workflow](#-content-workflow-how-visitors-see-your-content)
6. [Customization](#-customization)
7. [Troubleshooting](#-troubleshooting)
8. [Architecture (for Curious Uncles)](#-architecture-for-curious-uncles)

---

## Quick Start (GitHub Pages Deployment)

This gets your site live on the internet in about 5 minutes. No payment, no credit card -- everything is free.

### Step 1 -- Create a GitHub Account

1. Open your browser and go to **https://github.com**
2. Click **Sign up**
3. Pick a username, enter your email, create a password, and follow the steps
4. Verify your email address (check your inbox for a confirmation link)

### Step 2 -- Create a New Repository

1. Once logged in, click the **+** button in the top-right corner and choose **New repository**
2. Name it **monkacraft** (all lowercase, one word)
3. Make sure **Public** is selected (GitHub Pages only works with public repos on the free plan)
4. Do NOT check "Add a README file" -- we already have one
5. Click **Create repository**

### Step 3 -- Upload All Project Files

**Option A -- Drag and Drop (easiest):**
1. On the new empty repository page, click **uploading an existing file**
2. Open the MonkaCraft folder on your computer
3. Select ALL files and folders inside it (Ctrl+A) and drag them into the browser upload area
4. Wait for everything to upload (it may take a minute)
5. Scroll down and click **Commit changes**

**Option B -- Using Git (if you know how):**
```
cd MonkaCraft
git init
git add .
git commit -m "Initial MonkaCraft upload"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/monkacraft.git
git push -u origin main
```

### Step 4 -- Enable GitHub Pages

1. In your repository, click **Settings** (the gear icon tab at the top)
2. In the left sidebar, click **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, choose **main** and leave the folder as **/ (root)**
5. Click **Save**

### Step 5 -- Wait and Visit Your Site

1. Wait about 1-2 minutes for GitHub to build your site
2. Refresh the Settings > Pages screen -- you will see a green banner with your site URL
3. Your site is now live at: **https://YOUR_USERNAME.github.io/monkacraft**

Bookmark that link! That is your website now.

---

## Cloudinary Setup (Image & Video Uploads)

Cloudinary stores the images and videos that get uploaded through the admin panel. It is free -- no credit card needed.

### Step 1 -- Create an Account

1. Go to **https://cloudinary.com**
2. Click **Sign Up for Free**
3. Fill in your name, email, and a password
4. You will land on the Cloudinary Dashboard after signing in

### Step 2 -- Copy Your Cloud Name

1. On the Dashboard, you will see a box called **Cloud Name** (it looks something like "dxyz1abc2")
2. Copy that value -- you will need it in Step 4

### Step 3 -- Create an Unsigned Upload Preset

1. Click the **Settings** gear icon in the bottom-left of the Cloudinary dashboard
2. Click **Upload** in the left sidebar
3. Scroll down to **Upload presets** and click **Add upload preset**
4. Change **Signing Mode** from "Signed" to **Unsigned**
5. Give it a name you will remember (for example, "monkacraft_uploads")
6. Click **Save**
7. Copy the preset name -- you will need it in Step 4

### Step 4 -- Enter Credentials in Admin Panel

1. Open your MonkaCraft site in the browser
2. Go to the admin panel by typing **/pages/admin.html** at the end of your site URL
   - Example: `https://YOUR_USERNAME.github.io/monkacraft/pages/admin.html`
3. Log in with the default password: **monkacraft2024**
4. Click the **Settings** tab (the gray gear button)
5. Find the **Cloudinary** section
6. Paste your **Cloud Name** into the Cloud Name field
7. Paste your **Upload Preset** name into the Upload Preset field
8. Click **Save** and then click the **Test** button to make sure it works
9. If you see a green checkmark, you are all set!

---

## EmailJS Setup (Chat with Uncle Feature)

The "Chat with Uncle" tab in the admin panel lets Simeon send messages that arrive as emails. This uses a free service called EmailJS. No credit card needed.

### Step 1 -- Create an EmailJS Account

1. Go to **https://www.emailjs.com**
2. Click **Sign Up** and create a free account (you can use your Google account)

### Step 2 -- Add an Email Service

1. After logging in, click **Email Services** in the left sidebar
2. Click **Add New Service**
3. Choose **Gmail**
4. Click **Connect Account** and sign in with the Gmail address where you want to RECEIVE messages
5. Click **Create Service**
6. You will see a **Service ID** (something like "service_abc123") -- copy it and save it somewhere

### Step 3 -- Create an Email Template

1. Click **Email Templates** in the left sidebar
2. Click **Create New Template**
3. Fill in the template like this:

   - **Template Name**: monkacraft_message
   - **To Email**: (your email address -- the one you connected in Step 2)
   - **Subject line**: `💬 MonkaS ти пише: {{subject}}`
   - **Content / Body** (paste this exactly):

   ```
   Ново съобщение от MonkaS! 🎮

   Тема: {{subject}}

   {{message}}

   ---
   Изпратено от MonkaCraft Admin Panel
   Дата: {{date}}
   Снимка: {{image_url}}
   ```

4. Click **Save**
5. Copy the **Template ID** shown on that page (something like "template_xyz789")

### Step 4 -- Get Your Public Key

1. Click on **Account** in the left sidebar (or your profile icon)
2. Find **Public Key** (it is a long string of letters and numbers)
3. Copy it

### Step 5 -- Enter Credentials in Admin Panel

1. Open your MonkaCraft site and go to the admin panel (`/pages/admin.html`)
2. Log in and click the **Settings** tab
3. Find the **EmailJS** section
4. Paste these three values:
   - **Service ID** (from Step 2)
   - **Template ID** (from Step 3)
   - **Public Key** (from Step 4)
5. Click **Save** then click **Test** to send a test email
6. Check your email inbox -- if you got the test message, everything is working!

---

## Using the Admin Panel

The admin panel is the secret control center where Simeon manages the entire website.

### How to Get There

- Go to `/pages/admin.html` on your site
- This page is NOT linked anywhere on the public site -- you have to type the URL directly
- Example: `https://YOUR_USERNAME.github.io/monkacraft/pages/admin.html`

### Logging In

- The default password is: **monkacraft2024**
- **Change your password** right away! Go to Settings tab and update it
- If you enter the wrong password 5 times, you have to wait 60 seconds before trying again
- When you close the browser, you will be logged out automatically (for safety)

### The 6 Tabs

Once you log in, you will see 6 big colorful buttons at the top:

| Button | What It Does |
|--------|-------------|
| **Add Video** (green) | Add YouTube links or upload videos. Paste a YouTube URL and it shows a preview. Pick the game (Minecraft/Roblox) and category (Tutorial, Funny Moments, etc.). |
| **Add Screenshot** (blue) | Upload a screenshot image to Cloudinary. Add a title, pick the game, and choose a category. A thumbnail preview appears after upload. |
| **New Post** (magenta) | Write a blog post with a built-in text editor. You can make text bold, add headings, and include links. |
| **Stream** (orange) | Set a YouTube Live or Twitch stream URL. Toggle the "Is Live" switch to show a pulsing LIVE indicator on the homepage. |
| **Chat with Uncle** (gold) | Send a message to uncle Martin. Write a subject and message, optionally attach a screenshot, and hit Send! |
| **Settings** (gray) | Change password, set up Cloudinary and EmailJS, export/import backups, or reset everything. |

### Content List

Below the tabs there is a list of ALL content on the site. From here you can:
- Search for any entry by name
- Click the pencil icon to **edit** an entry (it opens the right tab with the form filled in)
- Click the trash icon to **delete** an entry (it will ask you to confirm first)

---

## Content Workflow (How Visitors See Your Content)

This is important to understand, so read carefully!

### How It Works

- When you add content in the admin panel, it gets saved in **your browser's memory** (called localStorage)
- This means only YOU see the changes on YOUR computer/browser
- Other people visiting your website see the **default starter content** from the `data/content.json` file

### Making Your Content Visible to Everyone

To publish your changes so all visitors see them:

1. Open the **Admin Panel** and go to the **Settings** tab
2. Click **Export (Download Backup)** -- this downloads a `.json` file with all your content
3. Go to your **GitHub repository** in the browser
4. Navigate to the `data` folder and click on `content.json`
5. Click the **pencil icon** (Edit this file)
6. Select all the text (Ctrl+A) and delete it
7. Open the downloaded `.json` file in Notepad, copy everything (Ctrl+A, Ctrl+C)
8. Paste it into the GitHub editor (Ctrl+V)
9. Click **Commit changes** at the bottom
10. Wait about 1-2 minutes -- GitHub Pages will rebuild and now everyone sees your content!

### Always Keep Backups

- Export your content regularly using Settings > Export
- If something goes wrong, you can always restore from a backup using Settings > Import
- The import button will replace everything with what is in the backup file, so be careful

---

## Customization

### Change Colors

Open the file `css/style.css` and look for the `:root` section near the top. You will see lines like this:

```css
:root {
  --color-base: #0a0a1a;       /* Page background (deep space black) */
  --color-surface: #151530;     /* Card backgrounds */
  --color-primary: #00ff88;     /* Main accent - green */
  --color-secondary: #00d4ff;   /* Second accent - blue */
  --color-accent: #ff3388;      /* Highlights - magenta */
  --color-warning: #ff8800;     /* Warnings - orange */
  --color-text: #e0e0ff;        /* Body text - soft white-blue */
}
```

Change the hex color codes to whatever colors you like. Save the file and push to GitHub.

### Change Site Name

- The logo is an SVG file at `assets/logo.svg` -- you can edit it with any text editor
- Page titles are inside each `.html` file in the `<title>` tag

### Change Password

1. Go to the Admin Panel > Settings tab
2. Enter your current password, then your new password twice
3. Click Save

If you forget the password entirely, see the Troubleshooting section below.

### Add Game Tags

The dropdown options for game tags (Minecraft, Roblox, Other) are defined in `pages/admin.html`. Open that file in a text editor and search for `<option>` tags inside the game tag dropdowns to add more options.

---

## Troubleshooting

### "Images won't upload"

- Open the Admin Panel > Settings tab
- Make sure Cloudinary Cloud Name and Upload Preset are filled in
- Click the Test button to verify the connection
- Make sure your Cloudinary upload preset is set to **Unsigned** (not Signed)
- Check that you have not exceeded Cloudinary's free tier limits

### "Email won't send"

- Open the Admin Panel > Settings tab
- Make sure all three EmailJS fields are filled in: Service ID, Template ID, Public Key
- Click the Test button
- Go to emailjs.com and make sure your template has the correct variable names: `{{subject}}`, `{{message}}`, `{{date}}`, `{{image_url}}`
- Make sure the Gmail service is still connected (sometimes Google disconnects it)

### "Content disappeared"

- Your content is stored in the browser. If you cleared browser data or switched browsers, it may be gone
- If you have a backup `.json` file, go to Admin > Settings > Import and upload it
- If you do not have a backup, your site will show the default starter content

### "Forgot password"

If you cannot remember your admin password:

1. Open the file `js/admin.js` in a text editor
2. Find the line near the top that says `DEFAULT_HASH = '...'`
3. Go to an online SHA-256 generator (search "SHA-256 online" on Google)
4. Type your new desired password and generate the hash
5. Replace the hash value in `admin.js` with the new hash
6. Also clear your browser's localStorage for the site (open browser DevTools > Application > Local Storage > delete the `monkacraft_passphrase_hash` entry)
7. Save the file and push to GitHub
8. Now you can log in with your new password

### "Site not updating after I pushed changes"

- GitHub Pages can take 1-2 minutes to rebuild after a commit
- Try a hard refresh in your browser: press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Clear your browser cache if the hard refresh does not work
- Check the GitHub repository's Actions tab to see if the deployment succeeded

---

## Architecture (for Curious Uncles)

MonkaCraft is a **static website** -- it has no server or database. Everything runs in the browser. Here is how the pieces fit together:

### Data Flow

```
+-------------------+       +-------------------+       +-------------------+
|   GitHub Pages    |       |    Cloudinary     |       |     EmailJS       |
|   (Hosting)       |       |  (Media Storage)  |       |  (Email Sending)  |
|                   |       |                   |       |                   |
| Serves HTML/CSS/  |       | Stores uploaded   |       | Sends "Chat with  |
| JS files to the   |       | images & videos   |       | Uncle" messages    |
| visitor's browser  |       | via upload widget |       | as real emails    |
+--------+----------+       +--------+----------+       +--------+----------+
         |                           |                            |
         |     All free services     |                            |
         +---------------------------+----------------------------+
                                     |
                              +------+------+
                              |   Browser   |
                              | (localStorage)|
                              |             |
                              | Stores all  |
                              | content data|
                              | locally     |
                              +-------------+
```

### How Content Flows

1. **First visit**: The browser loads `data/content.json` from GitHub Pages and copies it into localStorage
2. **Admin adds content**: New entries are saved to localStorage in the browser
3. **Viewing content**: All public pages read from localStorage to display videos, screenshots, posts, and streams
4. **Publishing to everyone**: The admin exports localStorage as a `.json` file, then replaces `data/content.json` on GitHub. Now new visitors get the updated content.

### Files and What They Do

```
MonkaCraft/
├── index.html                  Main homepage
├── pages/
│   ├── streams.html            Live streams & archive page
│   ├── videos.html             Video gallery page
│   ├── gallery.html            Screenshot gallery with lightbox
│   ├── blog.html               Gaming blog page
│   └── admin.html              Secret admin panel (not linked publicly)
├── css/
│   └── style.css               All styles, colors, animations, responsive design
├── js/
│   ├── content.js              ContentStore: reads/writes all site data
│   ├── app.js                  Shared navigation, footer, cursor effects, animations
│   ├── admin.js                Admin panel: login, dashboard, all 6 tabs, content list
│   ├── cloudinary.js           Cloudinary upload widget integration
│   └── emailjs.js              EmailJS "Chat with Uncle" integration
├── assets/
│   ├── favicon.svg             Site icon (shown in browser tab)
│   └── logo.svg                MonkaCraft logo
├── data/
│   └── content.json            Starter content (videos, screenshots, posts, streams)
└── README.md                   This file!
```

### Technology Used

| What | Why |
|------|-----|
| **HTML/CSS/JavaScript** | The website itself -- no frameworks, no build tools, just plain code |
| **GitHub Pages** | Free website hosting -- push files to GitHub and it becomes a live site |
| **Cloudinary** | Free image and video hosting -- the upload button in admin uses their widget |
| **EmailJS** | Free email sending from the browser -- powers the "Chat with Uncle" feature |
| **Google Fonts** | Free fonts: Press Start 2P (pixel gaming), Nunito (friendly body text), Orbitron (techy stats) |
| **localStorage** | Built-in browser storage -- saves all content data without needing a database |

---

Made with love for MonkaS. Happy gaming!
