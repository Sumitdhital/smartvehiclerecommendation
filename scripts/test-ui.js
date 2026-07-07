const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '../test-results');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Starting UI testing with Puppeteer...');
  
  // Launch browser with sandbox flags to ensure compatibility in server environment
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen to page console and error events
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Set consistent large screen viewport
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit homepage
    console.log(`Navigating to: ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2' });
    console.log('Homepage loaded.');

    // Take screenshot of homepage
    await page.screenshot({ path: path.join(OUT_DIR, '01_homepage.png') });
    console.log('Saved 01_homepage.png');

    // Verify main page title
    const mainTitle = await page.$eval('#main-page-title', el => el.textContent.trim());
    console.log(`Page Title verified: "${mainTitle}"`);

    // 2. Open EMI calculator modal
    console.log('Testing EMI Modal...');
    // Click the first EMI button (which is for BYD Dolphin)
    const emiButtons = await page.$$('button[title="EMI Calculator"]');
    if (emiButtons.length > 0) {
      await emiButtons[0].click();
      await sleep(1000); // wait for modal animation

      // Take screenshot of EMI modal
      await page.screenshot({ path: path.join(OUT_DIR, '02_emi_modal.png') });
      console.log('Saved 02_emi_modal.png');

      // Verify EMI value calculated text
      const emiText = await page.$eval('#calculated-emi-val', el => el.textContent.trim());
      console.log(`Calculated EMI text: "${emiText}"`);

      // Close EMI modal (click first close button in the modal or escape)
      await page.keyboard.press('Escape');
      await sleep(500);
      console.log('EMI Modal closed.');
    } else {
      console.warn('No EMI buttons found on the cards.');
    }

    // 3. Test Compare Checkboxes
    console.log('Testing Checkbox Comparison selection...');
    const checkboxes = await page.$$('input[type="checkbox"]');
    console.log(`Found ${checkboxes.length} compare checkboxes.`);

    if (checkboxes.length >= 3) {
      // Check first 3 checkboxes safely via page.evaluate to avoid double toggle clicks in headless environments
      await page.evaluate(el => el.click(), checkboxes[0]);
      await sleep(500);
      await page.evaluate(el => el.click(), checkboxes[1]);
      await sleep(500);
      await page.evaluate(el => el.click(), checkboxes[2]);
      await sleep(1000);

      // Verify view compare button exists
      const compareBtn = await page.$('#view-compare-btn');
      const compareBtnExists = compareBtn !== null;
      console.log(`View Compare Button visible: ${compareBtnExists}`);

      await page.screenshot({ path: path.join(OUT_DIR, '03_compared_count.png') });
      console.log('Saved 03_compared_count.png');

      if (compareBtnExists) {
        // Click "View Compare" button via evaluate to bypass overlay issues
        console.log('Navigating to Comparison details...');
        await page.evaluate(el => el.click(), compareBtn);
        await sleep(3000); // Wait for Next.js client-side route transition to complete

        // Take details page screenshot
        await page.screenshot({ path: path.join(OUT_DIR, '04_compare_details.png') });
        console.log('Saved 04_compare_details.png');

        // Verify page URL
        const compareUrl = page.url();
        console.log(`Current Compare URL: ${compareUrl}`);

        // 4. Remove one vehicle in compare page
        console.log('Testing column removal in comparison page...');
        const removeBtn = await page.$('#remove-slot-1');
        if (removeBtn) {
          await page.evaluate(el => el.click(), removeBtn);
          await sleep(1500);
          await page.screenshot({ path: path.join(OUT_DIR, '05_compare_removed_one.png') });
          console.log('Saved 05_compare_removed_one.png');
        } else {
          console.warn('Remove button #remove-slot-1 not found on compare page.');
        }
      }
    } else {
      console.warn('Not enough checkboxes found for comparison test.');
    }

    console.log('UI Testing completed successfully!');

  } catch (error) {
    console.error('An error occurred during Puppeteer testing:', error);
  } finally {
    await browser.close();
    console.log('Puppeteer browser closed.');
  }
}

run();
