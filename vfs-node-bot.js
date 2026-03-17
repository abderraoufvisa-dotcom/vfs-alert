/**
 * VFS Greece Algeria - Node.js Puppeteer Bot
 * =============================================
 * Automated headless browser bot with:
 *  - IPRoyal Residential Proxy support (to bypass Cloudflare IP blocks)
 *  - Anti-Captcha API integration (to solve Turnstile / reCAPTCHA challenges)
 *
 * REQUIREMENTS:
 *   Node.js >= 18
 *   npm install  (installs dependencies from package.json)
 *
 * SETUP:
 *   1. Copy .env.example to .env
 *   2. Fill in your proxy and anti-captcha credentials in .env
 *   3. Run:  node vfs-node-bot.js
 *
 * SECURITY WARNING:
 *   NEVER commit your .env file or hardcode credentials in source code.
 *   Add .env to .gitignore (already done in this repo).
 */

'use strict';

const puppeteer = require('puppeteer');
const ac = require('@antiadmin/anticaptchaofficial');
require('dotenv').config();

// ---------------------------------------------------------------------------
// Configuration — all sensitive values come from environment variables
// ---------------------------------------------------------------------------
const PROXY_HOST = process.env.PROXY_HOST;
const PROXY_PORT = process.env.PROXY_PORT;
const PROXY_USER = process.env.PROXY_USER;
const PROXY_PASS = process.env.PROXY_PASS;
const ANTICAPTCHA_KEY = process.env.ANTICAPTCHA_KEY;

const VFS_URL = 'https://visa.vfsglobal.com/dza/en/grc/login';

// Bot behaviour settings
const CONFIG = {
  centerName: 'Algiers',
  visaCategory: 'Short Stay',
  visaSubCategory: 'Tourist',
  checkInterval: 45000,   // ms between retries (45s keeps Cloudflare happy)
  maxChecks: 300,         // ~3.75 hours of monitoring
  navigationTimeout: 60000,
  selectorTimeout: 15000,
  alertSoundUrl: 'https://www.youtube.com/watch?v=bRJKrwCrfY0', // Notification sound URL
};

// ---------------------------------------------------------------------------
// Validate required environment variables before starting
// ---------------------------------------------------------------------------
const requiredEnvVars = ['PROXY_HOST', 'PROXY_PORT', 'PROXY_USER', 'PROXY_PASS', 'ANTICAPTCHA_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length) {
  console.error(`[VFS Node Bot] ERROR: Missing environment variables: ${missingVars.join(', ')}`);
  console.error('[VFS Node Bot] Copy .env.example to .env and fill in your credentials.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Waits for a <mat-select> with the given formControlName to appear, then clicks it.
 * @param {import('puppeteer').Page} page
 * @param {string} controlName - Angular formControlName attribute value
 */
async function openDropdown(page, controlName) {
  const selector = `mat-select[formcontrolname='${controlName}']`;
  await page.waitForSelector(selector, { timeout: CONFIG.selectorTimeout });
  await page.click(selector);
  await delay(1500);
}

/**
 * Clicks the first <mat-option> whose visible text contains the given string.
 * @param {import('puppeteer').Page} page
 * @param {string} text
 */
async function selectOptionByText(page, text) {
  await page.waitForSelector('mat-option', { timeout: CONFIG.selectorTimeout });
  const clicked = await page.evaluate((searchText) => {
    const options = Array.from(document.querySelectorAll('mat-option span'));
    const target = options.find(el => el.innerText.trim().includes(searchText));
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);

  if (!clicked) {
    throw new Error(`Option containing "${text}" not found in the dropdown.`);
  }
  console.log(`[VFS Node Bot] Selected option: "${text}"`);
  await delay(1000);
}

/**
 * Solves a Cloudflare Turnstile or reCAPTCHA v2 challenge using Anti-Captcha.
 * Returns the token string on success.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string>}
 */
async function solveCaptcha(page) {
  ac.setAPIKey(ANTICAPTCHA_KEY);

  const url = page.url();

  // Detect Turnstile first (Cloudflare)
  const turnstileSiteKey = await page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]');
    return el ? el.getAttribute('data-sitekey') : null;
  });

  if (turnstileSiteKey) {
    console.log(`[VFS Node Bot] Turnstile detected. Solving with Anti-Captcha (sitekey: ${turnstileSiteKey})...`);
    const token = await ac.solveTurnstileProxyless(url, turnstileSiteKey);
    console.log('[VFS Node Bot] Turnstile solved.');
    return token;
  }

  // Fall back to reCAPTCHA v2
  const recaptchaSiteKey = await page.evaluate(() => {
    const el = document.querySelector('.g-recaptcha');
    return el ? el.getAttribute('data-sitekey') : null;
  });

  if (recaptchaSiteKey) {
    console.log(`[VFS Node Bot] reCAPTCHA v2 detected. Solving (sitekey: ${recaptchaSiteKey})...`);
    const token = await ac.solveRecaptchaV2Proxyless(url, recaptchaSiteKey);
    console.log('[VFS Node Bot] reCAPTCHA solved.');
    return token;
  }

  console.log('[VFS Node Bot] No CAPTCHA detected on this page.');
  return null;
}

/**
 * Injects a solved CAPTCHA token into the page's hidden response fields.
 * @param {import('puppeteer').Page} page
 * @param {string} token
 */
async function injectCaptchaToken(page, token) {
  await page.evaluate((t) => {
    // Turnstile / Cloudflare hidden input
    const cfInput = document.querySelector('[name="cf-turnstile-response"]');
    if (cfInput) cfInput.value = t;

    // reCAPTCHA hidden textarea
    const rcInput = document.querySelector('#g-recaptcha-response');
    if (rcInput) rcInput.value = t;
  }, token);
}

/**
 * Dismisses the "Stay Logged In" session timeout modal if it is present.
 * @param {import('puppeteer').Page} page
 */
async function handleSessionTimeout(page) {
  try {
    const stayBtn = await page.$('button.btn-brand-orange');
    if (stayBtn) {
      const text = await page.evaluate(el => el.innerText, stayBtn);
      if (text.includes('Stay')) {
        await stayBtn.click();
        console.log('[VFS Node Bot] Session timeout dialog dismissed.');
      }
    }
  } catch (_) {
    // Silently ignore — the modal may not be present
  }
}

// ---------------------------------------------------------------------------
// Main bot logic
// ---------------------------------------------------------------------------
(async () => {
  console.log('=== VFS Greece Algeria Node Bot Starting ===');
  console.log(`Proxy: ${PROXY_HOST}:${PROXY_PORT} | Anti-Captcha: configured`);
  console.log(`Target: ${CONFIG.centerName} / ${CONFIG.visaCategory} / ${CONFIG.visaSubCategory}`);

  const browser = await puppeteer.launch({
    headless: false,           // Set to true for fully headless operation
    args: [
      `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();

  // Authenticate with the proxy
  await page.authenticate({
    username: PROXY_USER,
    password: PROXY_PASS,
  });

  await page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

  // Navigate to VFS login page
  console.log(`[VFS Node Bot] Navigating to ${VFS_URL} ...`);
  await page.goto(VFS_URL, { waitUntil: 'networkidle2' });

  // Solve any CAPTCHA on the login page
  const loginToken = await solveCaptcha(page);
  if (loginToken) {
    await injectCaptchaToken(page, loginToken);
    await delay(2000);
  }

  // --- MANUAL LOGIN STEP ---
  // The bot pauses here so you can log in manually (or fill credentials via env vars).
  // After logging in and reaching the "Start New Booking" page, press Enter in the terminal.
  console.log('\n[VFS Node Bot] Please log in to the VFS portal in the browser window.');
  console.log('[VFS Node Bot] Navigate to "Start New Booking", then press ENTER here to continue...');
  await new Promise(resolve => process.stdin.once('data', resolve));
  // -------------------------

  console.log('[VFS Node Bot] Starting slot monitoring loop...');

  for (let i = 0; i < CONFIG.maxChecks; i++) {
    console.log(`\n[VFS Node Bot] Attempt #${i + 1} of ${CONFIG.maxChecks}`);

    await handleSessionTimeout(page);

    // Solve any CAPTCHA that may have appeared mid-session
    const midToken = await solveCaptcha(page);
    if (midToken) {
      await injectCaptchaToken(page, midToken);
      await delay(2000);
    }

    try {
      // 1. Select VFS Center
      await openDropdown(page, 'admissionCentre');
      await selectOptionByText(page, CONFIG.centerName);
      await delay(3000);

      // 2. Select Visa Category
      await openDropdown(page, 'visaCategory');
      await selectOptionByText(page, CONFIG.visaCategory);
      await delay(5000);

      // 3. Select Visa Sub-Category
      await openDropdown(page, 'visaSubCategory');
      await selectOptionByText(page, CONFIG.visaSubCategory);
      await delay(5000);

      // 4. Check slot availability
      const slotAvailable = await page.evaluate(() => {
        const continueBtn = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.innerText.includes('Continue') && btn.classList.contains('btn-brand-orange'));
        const noSlotsMsg = document.querySelector('.alert-info');
        const hasNoSlots = noSlotsMsg && noSlotsMsg.innerText.includes('No appointment');
        return continueBtn && !continueBtn.disabled && !hasNoSlots;
      });

      if (slotAvailable) {
        console.log('[VFS Node Bot] *** SLOT FOUND! ***');
        await page.evaluate((soundUrl) => window.open(soundUrl), CONFIG.alertSoundUrl);
        await page.evaluate(() => alert('🎉 VFS Greece Slot Available in Algeria! Book NOW!'));
        // Keep browser open so user can complete the booking
        return;
      }

      console.log(`[VFS Node Bot] No slots available. Next check in ${CONFIG.checkInterval / 1000}s...`);
    } catch (err) {
      console.error(`[VFS Node Bot] Error during attempt #${i + 1}:`, err.message);
      // On error, wait longer before retrying to avoid rapid-fire requests
      await delay(CONFIG.checkInterval * 2);
      continue;
    }

    await delay(CONFIG.checkInterval);
  }

  console.log('[VFS Node Bot] Maximum attempts reached. Closing browser.');
  await browser.close();
})();
