# Combat Tracker

A local-first, Google Sheets-synced Combat Tracker designed for Dungeons and Dragons. 

## Features
- **GM Dashboard:** Manage encounters, party characters, and run actual combat natively.
- **Player View:** A broadcast-friendly view meant to be cast to a TV or second monitor.
- **Google Sheets Sync:** Pull your existing "Adult Character & Encounter List" straight from Google Docs.

---

## 1. Local Browser Development

If you want to run this app locally in your browser (not as a desktop app just yet):

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   - Rename `.env.example` to `.env.local`
   - Paste your real `VITE_GOOGLE_CLIENT_ID` inside it:
     ```env
     VITE_GOOGLE_CLIENT_ID="<your-google-oauth-client-id>"
     ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to see the app.

---

## 2. Desktop App (Tauri Integration)

To bundle this application into a native desktop app using Tauri, follow these steps.

### Prerequisites for Tauri
You will need Rust and system dependencies installed. 
- **macOS:** Install Xcode Command Line Tools.
- **Windows:** Install Microsoft C++ Build Tools and WebView2.
- **Linux:** Install system dependencies like `libwebkit2gtk-4.0-dev`.
(For full prerequisite details, see the official [Tauri Prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites).)

### Setup Steps
We have specifically configured the routing of this React app to use `HashRouter` which is perfect for desktop app building where the code is served via the `file://` protocol.

1. **Build the current React Application:**
   First, ensure the React code builds successfully into static files (which will end up in the `dist/` directory):
   ```bash
   npm run build
   ```

2. **Initialize Tauri:**
   In the root of this project, run the Tauri CLI init command:
   ```bash
   npm create tauri-app@latest
   ```
   *Follow the prompts:*
   - **Project Name:** Select the default or type what you want (e.g. `tauri-wrapper`).
   - **Frontend Language:** Choose `TypeScript / JavaScript` (or `None` if it asks because we already have our frontend).
   - Alternatively, if you just want to add Tauri to the *existing* folder (easier approach):
     ```bash
     npm install -D @tauri-apps/cli
     npx tauri init
     ```
     *Configuration for `npx tauri init`:*
     - **App name:** `DND Combat Tracker`
     - **Window title:** `DND Combat Tracker`
     - **Where are your web assets located?** `../dist`
     - **What is the url of your dev server?** `http://localhost:3000`
     - **What is your frontend dev command?** `npm run dev`
     - **What is your frontend build command?** `npm run build`

3. **Run the Desktop App:**
   With Tauri initialized, you can launch the native app directly while hot-reloading:
   ```bash
   npx tauri dev
   ```
   
4. **Build the Final Installer (.dmg / .exe / .app):**
   ```bash
   npx tauri build
   ```
   This will generate a native desktop application in `src-tauri/target/release/bundle/`.

---

## Technical Details

- **Tailwind v4:** Uses the new `@tailwindcss/vite` integration.
- **React Router:** Currently uses `<HashRouter>` to guarantee routes function inside desktop app webviews (like Tauri wrappers).
- **Google Sheets API:** Authentication leverages Google's Identity Services script (`gsi/client`). Make sure your callback scopes and authorized JavaScript origins in the Google Cloud Console are set to support your local preview (`http://localhost:3000`) and/or `tauri://localhost` if you execute from within the native wrapper.
