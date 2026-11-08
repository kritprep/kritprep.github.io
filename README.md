# KritPrep

A responsive, mobile-first study companion for Class 9 and Class 10 students. Built as a static website so it can be hosted free with GitHub Pages.

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
The authentication UI is included, but real accounts require your own Firebase project. Until configured, the rest of the site works in local demo mode and the login form clearly explains that setup is needed.

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In Project settings, add a Web App and copy its Firebase web configuration.
3. Open `firebase-config.js` and replace the placeholder values with your project's `apiKey`, `authDomain`, `projectId`, and `appId`.
4. In Firebase Authentication → Sign-in method, enable **Email/Password** and **Google**.
5. In Authentication → Settings → Authorized domains, add your GitHub Pages domain, e.g. `YOUR-USERNAME.github.io` (and your custom domain if you use one).
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
Tasks, chapter checkmarks, theme and quiz/focus stats are saved in the current browser using localStorage. They remain on that device/browser and do not yet sync across devices or user accounts. Firebase authentication is real after setup, but cloud syncing of planner/progress data is a separate next development step.
