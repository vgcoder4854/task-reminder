# Task Planner (Android app)

React + Capacitor. Tasks → Calendar/Day planning → Tracker dashboard, with real alarm notifications (sound + vibration).

## Get the APK (easiest, works from your phone)
1. Create a GitHub repo, upload/commit this whole folder (keep the `.github` folder).
2. Open the repo → **Actions** → **Build APK** → **Run workflow** (also runs on every push to main).
3. When it finishes (~5 min), open the run → **Artifacts** → download `task-planner-apk` → unzip → install `app-debug.apk`.
4. On first launch allow **Notifications** and **Alarms & reminders** (exact alarms). Use **🔔 Test alarm** on the Tasks tab.

## Try it in the browser (Codespace)
```
npm install
npm run dev
```
The web preview rings an in-page beep alarm while the tab is open (native notifications only work in the APK).

## Notes
- Data is stored on the phone (localStorage). Uninstalling the app erases it.
- Reminders are re-scheduled for the next 60 days whenever you change anything.
- Some phones (Xiaomi, Oppo, Vivo, Samsung) kill background apps: set Task Planner to "No restrictions" in battery settings so alarms are reliable.
