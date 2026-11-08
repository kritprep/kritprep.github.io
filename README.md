# KritPrep

A responsive, mobile-first study companion for Class 10 students. Built as a static website so it can be hosted free with GitHub Pages.

## Included
- Responsive dashboard for phones, tablets and laptops
- Study resource library with Class 9/10 switch, search and subject filter
- Links to official NCERT / CBSE resource pages
- Sample-paper countdown timer
- Five-question mixed MCQ quiz with instant explanations and score
- Daily to-do planner with categories and completion tracking
- Pomodoro focus timer
- Chapter tracker and progress dashboard
- Light/dark theme
- Firebase email/password signup and login, plus Google sign-in integration

## Run locally
Because the app uses JavaScript modules, open it through a local web server (not by double-clicking `index.html`). For example, use VS Code Live Server, or run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Turn on real login and Google sign-in
Firebase web configuration is prefilled for the KritPrep project. The student workspace is hidden until Firebase confirms a signed-in account. Email/password signup and login, Google sign-in redirect (mobile-friendly), and browser-local persistent authentication are wired in. Student tasks and progress are separated by Firebase user UID in this browser. Cloud sync is not implemented yet.

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In Project settings, add a Web App and copy its Firebase web configuration.
3. Open `firebase-config.js` and replace the placeholder values with your project's `apiKey`, `authDomain`, `projectId`, and `appId`.
4. In Firebase Authentication → Sign-in method, enable **Email/Password** and **Google**.
5. In Authentication → Settings → Authorized domains, add `kritprep.github.io` (domain only; do not include `/kritprep/`) and any custom domain you use.
6. Save and redeploy the site. Test signup, logout, email login and Google login on the published HTTPS site.

**Security:** Firebase web config is designed to be present in browser code. Never put a Firebase service-account JSON, private key, admin SDK credential, or other server secret in this repository. Configure Firebase security rules before adding private cloud-stored student data.

## Publish using GitHub on your phone
1. Sign in at [github.com](https://github.com/) in your mobile browser.
2. Tap **+** → **New repository**. Name it `kritprep`, choose **Public** (or Private if you prefer), and create it.
3. Upload the files from this project (`index.html`, `styles.css`, `app.js`, `firebase-config.js`, and `README.md`). You can upload the extracted project files from your phone's file picker. Keep all five in the repository's root folder.
4. Open repository **Settings** → **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish. Your website address will look like `https://YOUR-USERNAME.github.io/kritprep/`.
7. Add that domain to Firebase Authorized domains if you enabled login.

If mobile GitHub upload is awkward, use the GitHub website's **Add file → Upload files** page in your browser. You can also switch your mobile browser to Desktop site.

## Important content note
KritPrep is an independent learning project, not an official NCERT or CBSE website. This starter version links to official source portals; it does not bundle copyrighted textbook PDFs. Only upload original materials, public-domain content, or resources you have permission to redistribute. Verify current syllabus and sample-paper links each academic year.

## Current storage behaviour
Tasks, chapter checkmarks, theme and quiz/focus stats are stored in browser localStorage under a key scoped to the signed-in Firebase UID. They remain on that device/browser and do not yet sync across devices. Resource and chapter lists are intentionally empty until the KritPrep admin publishing workflow is built.


## Public SEO pages and student updates (new)
The repository root `index.html` is now a public landing page. The private student workspace lives at `app.html` and is marked `noindex`. Public pages include `class-9.html`, `class-10.html`, `resources.html`, `sample-papers.html`, `updates.html`, `about.html`, and `contact.html`. Each has its own title, description, canonical URL and WebPage structured data. The homepage has EducationalOrganization schema. `sitemap.xml`, `robots.txt`, an SVG favicon and an Open Graph social image are included. Google controls when/how these appear in search; sitelinks and rich results are not guaranteed.

## Telegram
The official Telegram channel is linked throughout the public site and student workspace: https://t.me/kritprepofficial

## Live student announcements and admin publishing
Announcements are stored in Cloud Firestore. Students must sign in to see the live feed in the app's **Updates** section. To enable publishing:
1. Sign in to KritPrep once, then open Firebase Console → Authentication → Users and copy your own account's **UID**.
2. In `firebase-config.js`, replace `PASTE_YOUR_ADMIN_UID_HERE` in `ADMIN_UID` with that UID.
3. In `firestore.rules`, replace the same placeholder with the exact same UID. Deploy these rules in Firebase Console → Firestore Database → Rules.
4. Create a Firestore database (production mode is fine), then publish the rules.
5. Commit and push the updated project to GitHub Pages.
6. Sign in again. The Admin · Publish an update form appears only for the configured admin UID. Other signed-in users can read announcements but cannot publish them.

**Important:** A client-side admin check only controls what the interface displays. The Firestore rules are the actual security boundary. Do not skip deploying the rules, and never make the announcements collection writable by everyone. This announcement feed is for platform-wide notices; it does not yet send email, push notifications or Telegram DMs. Students see the latest feed when they open the Updates page.

## Deploying Firestore rules
Copy `firestore.rules` into Firebase Console → Firestore Database → Rules after replacing the UID placeholder. The default catch-all rule denies access to all other collections. Add separate, carefully scoped rules if you later introduce cloud-synced private student data or resource management.
