# VFS Greece – Algeria Slot Monitor (`vfs-alert`)

Automated JavaScript script that runs in the **Chrome DevTools console** and
monitors the [VFS Global Greece-Algeria booking portal](https://visa.vfsglobal.com/dza/en/grc/login)
for available appointment slots.  
When a slot is detected the script opens a YouTube alert-sound tab and triggers
a browser alert so you can book immediately.

> **Based on** [rpandey/vfs-Germany-Book-slot](https://github.com/rpandey/vfs-Germany-Book-slot),
> modernised with text-based selectors for the current Angular interface and
> adapted for the **Greece** visa categories in **Algeria**.

---

## Repository contents

| File | Description |
|------|-------------|
| `vfs-bot.js` | Main automation script – paste this into the DevTools console |
| `README.md` | This guide |

---

## How to use

### Step 1 – Log in to the VFS Greece Algeria portal

1. Open [https://visa.vfsglobal.com/dza/en/grc/login](https://visa.vfsglobal.com/dza/en/grc/login) in **Google Chrome**.
2. Sign in with your VFS Global account credentials.

### Step 2 – Start a new booking

1. After logging in you will see your dashboard.
2. Click the **"Start New Booking"** button.  
   You will be taken to the booking form with the VFS Center, Visa Category,
   and Sub-Category dropdowns.  
   **Do not fill in the form manually** – the script will do that.

### Step 3 – Open the browser console

1. Press **F12** (Windows / Linux) or **Cmd + Option + I** (macOS) to open Chrome DevTools.
2. Click the **Console** tab at the top of the DevTools panel.

### Step 4 – Paste and run the script

1. Open [`vfs-bot.js`](./vfs-bot.js) in this repository and copy the entire content.
2. Click inside the DevTools console input field (at the bottom, next to `>`).
3. Paste the copied code and press **Enter**.

The console will print status messages like:

```
════════════════════════════════════════
  VFS Greece – Algeria Slot Monitor
  Center      : Algiers
  Category    : Short Stay
  Sub-Category: Tourist
════════════════════════════════════════

[VFS Bot] ── Attempt #1 of 500 ──
[VFS Bot] ✔ Selected: "Algiers"
[VFS Bot] ✔ Selected: "Short Stay"
[VFS Bot] ✔ Selected: "Tourist"
[VFS Bot] No slots available yet.
[VFS Bot] ⏱ Waiting 52s before next check…
```

### Step 5 – When a slot is found

The script will:

1. Open **[https://www.youtube.com/watch?v=bRJKrwCrfY0](https://www.youtube.com/watch?v=bRJKrwCrfY0)** in a new tab to play an alert sound.
   > **Note:** If the YouTube tab does not open, your browser may be blocking
   > pop-ups. Click the pop-up blocked icon in the Chrome address bar and
   > select **"Always allow pop-ups from [visa.vfsglobal.com]"**, then restart
   > the script.
2. Show a browser popup: **"SLOT AVAILABLE! BOOK NOW!"**
3. Stop the loop automatically.

Switch to the booking tab quickly and complete your appointment.

---

## Configuration

You can change the target centre, category, or timing **before pasting** the script
by editing the `CONFIG` object at the top of `vfs-bot.js`:

```js
const CONFIG = {
    centerName:      'Algiers',    // 'Algiers' | 'Oran' | 'Annaba'
    visaCategory:    'Short Stay', // Main visa category
    visaSubCategory: 'Tourist',    // 'Tourist' | 'Business' | 'Transit' | …
    minInterval:     45000,        // Minimum wait between checks (ms)
    maxInterval:     60000,        // Maximum wait between checks (ms)
    maxChecks:       500,          // Stop after this many attempts
    alertSound:      'https://www.youtube.com/watch?v=bRJKrwCrfY0',
};
```

---

## ⚠️ Important warnings

### Anti-bot measures & IP blocking

VFS Global uses **Cloudflare** and session-activity monitoring to detect
automated behaviour. Running the script too aggressively **will** result in:

- A **403 Forbidden** or "Access Denied" error.
- Your account session being terminated.
- Your IP address being temporarily blocked (usually 2–4 hours).

The script already randomises the wait time between 45 and 60 seconds to
reduce the risk, but **do not** lower `minInterval` below `45000` ms (45 s).

### Session timeout popup

The VFS portal logs you out after a period of inactivity. The script
automatically clicks the **"Stay Logged In"** button if it appears, but if
the session has already expired you will need to log back in and restart the
script.

### Dynamic Angular IDs

The original Germany script used IDs like `#mat-option-27`, which change
every time the page is refreshed. This script uses **form-control-name
attributes** and **text matching** instead, making it resilient to ID changes.

### No guarantee of success

Slot availability depends entirely on VFS Global. This script only
automates the act of checking – it cannot create slots.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Dropdown "admissionCentre" not found` | Make sure you clicked **"Start New Booking"** before pasting the script. |
| `Could not find option: "Algiers"` | Check the exact label used on the portal and update `CONFIG.centerName`. |
| Script stops after a few attempts | Your session may have expired. Log in again and restart the script. |
| 403 / Access Denied page | Your IP was temporarily blocked. Wait 2–4 hours or use a VPN. |

---

## Disclaimer

This tool is provided for **personal, non-commercial use only**. The author is
not responsible for any account suspension, IP block, or missed appointments
that may result from its use. Always comply with VFS Global's Terms of Service.