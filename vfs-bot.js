/**
 * VFS Greece Algeria - Browser Console Bot
 * ==========================================
 * Run this script in the Chrome DevTools console after logging in to:
 * https://visa.vfsglobal.com/dza/en/grc/login
 *
 * Steps:
 * 1. Log in and navigate to "Start New Booking".
 * 2. Press F12 > Console tab.
 * 3. Paste this entire script and press Enter.
 *
 * NOTE: This script does NOT use your proxy or anti-captcha key.
 *       For automated proxy + captcha solving, use vfs-node-bot.js instead.
 */

const CONFIG = {
  centerName: 'Algiers',       // Change to 'Oran' or 'Annaba' if needed
  visaCategory: 'Short Stay',  // Main visa category
  visaSubCategory: 'Tourist',  // Sub-category
  checkInterval: 45000,        // Milliseconds between checks (45s to avoid IP blocks)
  maxChecks: 300,              // Maximum number of attempts (~3.75 hours)
  alertSoundUrl: 'https://www.youtube.com/watch?v=bRJKrwCrfY0', // Notification sound URL
};

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Clicks a <mat-option> element whose visible text includes the given string.
 * @param {string} text - The text to search for inside mat-option spans.
 * @returns {boolean} True if the element was found and clicked.
 */
const clickOptionByText = (text) => {
  const options = Array.from(document.querySelectorAll('mat-option span'));
  const target = options.find(el => el.innerText.trim().includes(text));
  if (target) {
    target.click();
    console.log(`[VFS Bot] Selected: "${text}"`);
    return true;
  }
  console.warn(`[VFS Bot] Could not find option with text: "${text}"`);
  return false;
};

/**
 * Clicks the "Stay Logged In" button if the session timeout dialog is visible.
 */
const handleSessionTimeout = () => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const stayBtn = buttons.find(btn => btn.innerText.includes('Stay'));
  if (stayBtn) {
    stayBtn.click();
    console.log('[VFS Bot] Session timeout dialog dismissed.');
  }
};

(async () => {
  console.log('=== VFS Greece Algeria Bot Started ===');
  console.log(`Configuration: Center="${CONFIG.centerName}", Category="${CONFIG.visaCategory}", Sub-Category="${CONFIG.visaSubCategory}"`);
  console.log(`Will check up to ${CONFIG.maxChecks} times every ${CONFIG.checkInterval / 1000}s.`);

  for (let i = 0; i < CONFIG.maxChecks; i++) {
    console.log(`\n[VFS Bot] Attempt #${i + 1} of ${CONFIG.maxChecks}...`);

    // Handle session timeout modal if present
    handleSessionTimeout();

    try {
      // 1. Select VFS Center (e.g., Algiers)
      const centerSelect = document.querySelector("mat-select[formcontrolname='admissionCentre']");
      if (!centerSelect) {
        console.warn('[VFS Bot] Center dropdown not found. Are you on the booking page?');
        await delay(CONFIG.checkInterval);
        continue;
      }
      centerSelect.click();
      await delay(2000);
      clickOptionByText(CONFIG.centerName);
      await delay(3000);

      // 2. Select Visa Category (e.g., Short Stay)
      const categorySelect = document.querySelector("mat-select[formcontrolname='visaCategory']");
      if (!categorySelect) {
        console.warn('[VFS Bot] Visa category dropdown not found.');
        await delay(CONFIG.checkInterval);
        continue;
      }
      categorySelect.click();
      await delay(2000);
      clickOptionByText(CONFIG.visaCategory);
      await delay(5000);

      // 3. Select Visa Sub-Category (e.g., Tourist)
      const subCategorySelect = document.querySelector("mat-select[formcontrolname='visaSubCategory']");
      if (!subCategorySelect) {
        console.warn('[VFS Bot] Visa sub-category dropdown not found.');
        await delay(CONFIG.checkInterval);
        continue;
      }
      subCategorySelect.click();
      await delay(2000);
      clickOptionByText(CONFIG.visaSubCategory);
      await delay(5000);

      // 4. Check slot availability
      const continueBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.innerText.includes('Continue') && btn.classList.contains('btn-brand-orange'));

      const noSlotsMsg = document.querySelector('.alert-info');
      const hasNoSlots = noSlotsMsg && noSlotsMsg.innerText.includes('No appointment');

      if (continueBtn && !continueBtn.disabled && !hasNoSlots) {
        console.log('[VFS Bot] *** SLOT FOUND! Opening alert... ***');
        window.open(CONFIG.alertSoundUrl);
        alert('🎉 VFS Greece Slot Available in Algeria! Book NOW before it disappears!');
        return;
      }

      console.log(`[VFS Bot] No slots available. Next check in ${CONFIG.checkInterval / 1000}s...`);
    } catch (err) {
      console.error('[VFS Bot] Error during attempt:', err.message);
    }

    await delay(CONFIG.checkInterval);
  }

  console.log('[VFS Bot] Maximum attempts reached. Script stopped.');
})();
