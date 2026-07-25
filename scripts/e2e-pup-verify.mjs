import { chromium } from 'playwright';

async function verifyE2E() {
  console.log('🚀 Starting Playwright E2E Pipeline Verification...');
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // Track console and failed requests
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  page.on('requestfailed', req => {
    console.log(`[Browser Request Failed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  console.log('🌐 Navigating to VOID Demo Web App (http://localhost:3000)...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log(`✅ Page loaded! Title: "${title}"`);

  console.log('🚪 Clicking "Enter Live Demo"...');
  const demoButtons = await page.$$('button');
  for (const btn of demoButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Enter Live Demo') || text.includes('Skip to Live Demo'))) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Scroll down to Investigation section
  console.log('🔍 Scrolling to Investigation section...');
  await page.evaluate(() => {
    const el = document.getElementById('investigation');
    if (el) el.scrollIntoView();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Find "Run Investigation" button
  console.log('▶️ Clicking "Run Investigation" button for active scenario...');
  const buttons = await page.$$('button');
  let runButton = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Run Investigation')) {
      runButton = btn;
      break;
    }
  }

  if (!runButton) {
    console.error('❌ Could not find "Run Investigation" button!');
    await browser.close();
    process.exit(1);
  }

  await runButton.click();
  console.log('⚡ Button clicked! Waiting for investigation pipeline execution & UI rendering...');

  // Wait for completion (up to 45s for worker + Gemini + UI update)
  const maxWaitMs = 45000;
  const startTime = Date.now();
  let completed = false;

  while (Date.now() - startTime < maxWaitMs) {
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    if (bodyText.includes('Forensic Evidence') || bodyText.includes('Confidence') || bodyText.includes('Report ready')) {
      completed = true;
      console.log(`🎉 Pipeline completed successfully in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
      break;
    }
    if (bodyText.includes('Investigation failed')) {
      console.error('❌ UI displayed "Investigation failed"!');
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // Capture screenshot of rendered result
  await page.screenshot({ path: '/tmp/void_e2e_result.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/void_e2e_result.png');

  await browser.close();

  if (completed) {
    console.log('====================================================');
    console.log('🎉 E2E PIPELINE FULLY VERIFIED AND WORKING PERFECTLY!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('❌ Pipeline verification timed out or failed!');
    process.exit(1);
  }
}

verifyE2E().catch(err => {
  console.error('❌ Puppeteer error:', err);
  process.exit(1);
});
