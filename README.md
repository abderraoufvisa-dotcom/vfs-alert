# vfs-alert

Automated slot availability monitor for the **VFS Greece – Algeria** portal ([visa.vfsglobal.com/dza/en/grc](https://visa.vfsglobal.com/dza/en/grc/login)).

Two versions are provided:

| File | Description |
|---|---|
| `vfs-bot.js` | Browser console script — paste into Chrome DevTools |
| `vfs-node-bot.js` | Node.js (Puppeteer) script — runs locally with proxy & captcha solving |

> ⚠️ **Security Warning**: Never hardcode your proxy credentials or Anti-Captcha API key in source code. Always use environment variables (see `.env.example`). Keep your `.env` file **private** and never commit it.

---

## Option 1 — Browser Console Script (`vfs-bot.js`)

No installation required. Best for quick, manual use.

1. Open [https://visa.vfsglobal.com/dza/en/grc/login](https://visa.vfsglobal.com/dza/en/grc/login) and log in.
2. Navigate to **Start New Booking**.
3. Press **F12** → **Console** tab.
4. Copy the contents of `vfs-bot.js` and paste them into the console.
5. Press **Enter**.

The script will:
- Automatically select **Algiers**, **Short Stay**, and **Tourist**.
- Check for available slots every **45 seconds**.
- Play an alert sound and show a browser notification when a slot is found.

---

## Option 2 — Node.js Puppeteer Bot (`vfs-node-bot.js`)

Runs headlessly with a residential proxy and automatic CAPTCHA solving.

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- An [IPRoyal](https://iproyal.com/) residential proxy subscription
- An [Anti-Captcha](https://anti-captcha.com/) account and API key

### Installation

```bash
# Clone the repository
git clone https://github.com/abderraoufvisa-dotcom/vfs-alert.git
cd vfs-alert

# Install dependencies
npm install
```

### Configuration

```bash
# Create your local environment file from the template
cp .env.example .env
```

Open `.env` and fill in your credentials:

```dotenv
PROXY_HOST=geo.iproyal.com
PROXY_PORT=12321
PROXY_USER=your_proxy_username
PROXY_PASS=your_proxy_password
ANTICAPTCHA_KEY=your_anticaptcha_api_key
```

> 💡 If you are using **GitHub Actions** or another CI environment, add these as **Repository Secrets** instead of a `.env` file.

### Running the bot

```bash
npm start
# or
node vfs-node-bot.js
```

The browser window will open, and the bot will:

1. Navigate to the VFS login page through your residential proxy.
2. Automatically solve any **Cloudflare Turnstile** or **reCAPTCHA** challenge.
3. Pause so you can log in manually (one-time step).
4. Monitor the **Algiers / Short Stay / Tourist** combination on a 45-second loop.
5. Alert you (browser popup + YouTube notification) when a slot becomes available.

---

## Customisation

Edit the `CONFIG` object at the top of either script to change the target centre or category:

```javascript
const CONFIG = {
  centerName: 'Algiers',       // 'Algiers', 'Oran', or 'Annaba'
  visaCategory: 'Short Stay',
  visaSubCategory: 'Tourist',
  checkInterval: 45000,        // ms between checks
  maxChecks: 300,              // total attempts (~3.75 hours)
};
```

---

## Important Notes

- **Anti-bot protection**: VFS Global uses Cloudflare. Avoid checking more frequently than every 30 seconds or your IP may be temporarily blocked.
- **Dynamic IDs**: The script uses text-based selectors (`"Algiers"`, `"Short Stay"`) instead of fragile numeric IDs (`#mat-option-27`) which change on every page refresh.
- **Session timeouts**: The bot automatically dismisses the "Stay Logged In" dialog.
- **Errors**: On any error the bot doubles the wait interval before retrying to avoid rapid-fire requests.

---

## License

MIT
