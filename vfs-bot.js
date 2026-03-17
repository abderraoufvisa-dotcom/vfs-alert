/**
 * VFS Greece – Algeria Slot Monitor
 * Run this script in the Chrome DevTools console after logging in and
 * clicking "Start New Booking" on https://visa.vfsglobal.com/dza/en/grc/login
 *
 * Adapted from rpandey/vfs-Germany-Book-slot, modernised for the VFS Global
 * Angular interface and the specific categories for Greece visas in Algeria.
 */

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
    centerName:      'Algiers',    // Change to 'Oran' or 'Annaba' if needed
    visaCategory:    'Short Stay', // Main visa category (Schengen)
    visaSubCategory: 'Tourist',    // Sub-category (e.g. 'Business', 'Transit')
    // Random delay between 45 and 60 seconds to avoid anti-bot detection
    minInterval:     45000,        // 45 seconds (milliseconds)
    maxInterval:     60000,        // 60 seconds (milliseconds)
    maxChecks:       500,          // Maximum number of loop iterations (~6–8 hours)
    // YouTube video used as an audible alert (upbeat song – easy to recognise)
    alertSound:      'https://www.youtube.com/watch?v=bRJKrwCrfY0',
};
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 * Used with await to pause execution and let Angular components render.
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * Used to randomise the check interval to look more like a human user.
 */
const randomBetween = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Clicks the first <mat-option> whose visible text includes `text`.
 * This approach avoids hard-coded dynamic IDs (e.g. #mat-option-27) that
 * change on every page load.
 *
 * @param {string} text  The label to search for inside the open dropdown.
 * @returns {boolean}    true if the option was found and clicked, false otherwise.
 */
const clickOptionByText = text => {
    const options = Array.from(document.querySelectorAll('mat-option span.mat-option-text'));
    const target  = options.find(el => el.textContent.trim().includes(text));
    if (target) {
        target.click();
        console.log(`[VFS Bot] ✔ Selected: "${text}"`);
        return true;
    }
    console.warn(`[VFS Bot] ✘ Could not find option: "${text}"`);
    return false;
};

/**
 * Opens a dropdown identified by its Angular formControlName attribute and
 * waits for the overlay to appear.
 *
 * @param {string} formControlName  Value of the formcontrolname attribute.
 * @param {number} waitMs           Milliseconds to wait after clicking (default 2000).
 */
const openDropdown = async (formControlName, waitMs = 2000) => {
    // Angular renders formcontrolname as a lowercase HTML attribute; the CSS
    // attribute selector is case-insensitive by default for HTML documents but
    // we add the `i` flag to be explicit and safe across all browsers/modes.
    const el = document.querySelector(`mat-select[formcontrolname="${formControlName}" i]`);
    if (el) {
        el.click();
        await delay(waitMs);
    } else {
        console.warn(`[VFS Bot] Dropdown "${formControlName}" not found.`);
    }
};

/**
 * Dismisses the "Stay Logged In" session-timeout popup if it is visible.
 * The button text may vary slightly so we match any button containing "Stay".
 */
const handleStayLoggedIn = () => {
    // Try the branded orange button first
    const buttons = Array.from(document.querySelectorAll('button'));
    const stayBtn = buttons.find(
        btn => btn.textContent.trim().toLowerCase().includes('stay')
    );
    if (stayBtn && stayBtn.offsetParent !== null) {
        stayBtn.click();
        console.log('[VFS Bot] 🔄 Clicked "Stay Logged In"');
    }
};

// ─── Main loop ────────────────────────────────────────────────────────────────
(async () => {
    console.log('════════════════════════════════════════');
    console.log('  VFS Greece – Algeria Slot Monitor');
    console.log(`  Center      : ${CONFIG.centerName}`);
    console.log(`  Category    : ${CONFIG.visaCategory}`);
    console.log(`  Sub-Category: ${CONFIG.visaSubCategory}`);
    console.log('════════════════════════════════════════');

    for (let i = 0; i < CONFIG.maxChecks; i++) {
        console.log(`\n[VFS Bot] ── Attempt #${i + 1} of ${CONFIG.maxChecks} ──`);

        // Step 0 – Keep the session alive
        handleStayLoggedIn();

        try {
            // ── Step 1: Select VFS Center ────────────────────────────────────
            await openDropdown('admissionCentre', 2000);
            const centerSelected = clickOptionByText(CONFIG.centerName);
            if (!centerSelected) {
                console.warn('[VFS Bot] Retrying after failed center selection…');
                await delay(3000);
                continue;
            }
            // Wait for the page to react to the center selection
            await delay(3000);

            // ── Step 2: Select Visa Category ─────────────────────────────────
            await openDropdown('visaCategory', 2000);
            const categorySelected = clickOptionByText(CONFIG.visaCategory);
            if (!categorySelected) {
                await delay(3000);
                continue;
            }
            // Wait for the sub-category dropdown to become active
            await delay(5000);

            // ── Step 3: Select Sub-Category ──────────────────────────────────
            await openDropdown('visaSubCategory', 2000);
            const subCategorySelected = clickOptionByText(CONFIG.visaSubCategory);
            if (!subCategorySelected) {
                await delay(3000);
                continue;
            }
            // Wait for the page to query slot availability
            await delay(5000);

            // ── Step 4: Check whether a slot is available ────────────────────
            //   The "Continue" button is disabled (has the `disabled` attribute)
            //   when no slots are available.
            const continueBtn = document.querySelector(
                'button.btn-brand-orange, ' +
                'button.mat-raised-button.btn-brand-orange'
            );
            const noSlotsAlert = document.querySelector(
                '.alert-info, .alert-warning'
            );

            const hasSlot =
                continueBtn &&
                !continueBtn.disabled &&
                !continueBtn.hasAttribute('disabled') &&
                // Make sure the "no slots" message is absent or hidden
                (!noSlotsAlert || noSlotsAlert.offsetParent === null);

            if (hasSlot) {
                // ── SLOT FOUND ─────────────────────────────────────────────
                console.log('%c[VFS Bot] 🎉 SLOT FOUND! Opening alert…', 'color: green; font-weight: bold;');
                window.open(CONFIG.alertSound);
                alert('SLOT AVAILABLE! BOOK NOW!');
                return; // Stop the loop
            }

            console.log('[VFS Bot] No slots available yet.');

        } catch (err) {
            console.error('[VFS Bot] Error during attempt:', err);
        }

        // ── Wait a random interval before the next check ───────────────────
        const waitTime = randomBetween(CONFIG.minInterval, CONFIG.maxInterval);
        console.log(`[VFS Bot] ⏱ Waiting ${(waitTime / 1000).toFixed(0)}s before next check…`);
        await delay(waitTime);
    }

    console.log('[VFS Bot] Reached maximum number of checks. Stopping.');
})();
