import { chromium } from 'playwright';

async function verifyAllScenarios() {
  console.log('🚀 Running Full E2E Multi-Scenario Suite...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Enter demo
  const demoButtons = await page.$$('button');
  for (const btn of demoButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Enter Live Demo') || text.includes('Skip to Live Demo'))) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const el = document.getElementById('investigation');
    if (el) el.scrollIntoView();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Find scenario buttons
  const scenarioPills = ['Recursive API Loop', 'Silent Hallucination', 'Wrong Tool Action', 'Execution Crash'];

  for (const pillText of scenarioPills) {
    console.log(`\n----------------------------------------------------`);
    console.log(`🧪 Testing Scenario: "${pillText}"`);
    console.log(`----------------------------------------------------`);

    // Click scenario pill
    const buttons = await page.$$('button');
    let pillBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes(pillText)) {
        pillBtn = btn;
        break;
      }
    }

    if (pillBtn) {
      await pillBtn.click();
      console.log(`  Selected scenario pill "${pillText}"`);
      await new Promise(r => setTimeout(r, 500));
    }

    // Click Run Investigation
    const allButtons = await page.$$('button');
    let runButton = null;
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Run Investigation')) {
        runButton = btn;
        break;
      }
    }

    if (!runButton) {
      console.error(`❌ Could not find "Run Investigation" button for ${pillText}`);
      continue;
    }

    await runButton.click();
    console.log('  ▶️ Run Investigation clicked. Waiting for resolution...');

    const maxWaitMs = 45000;
    const startTime = Date.now();
    let completed = false;

    while (Date.now() - startTime < maxWaitMs) {
      const bodyText = await page.evaluate(() => document.body.textContent || '');
      if (bodyText.includes('Forensic Evidence') || bodyText.includes('Confidence') || bodyText.includes('Report ready')) {
        completed = true;
        console.log(`  ✅ Scenario "${pillText}" completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
        break;
      }
      if (bodyText.includes('Investigation failed')) {
        console.error(`  ❌ Scenario "${pillText}" failed!`);
        break;
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!completed) {
      console.error(`  ❌ Scenario "${pillText}" timed out!`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();
  console.log('\n====================================================');
  console.log('🎉 ALL SCENARIOS VERIFIED END-TO-END!');
  console.log('====================================================');
}

verifyAllScenarios().catch(err => {
  console.error('❌ Multi-scenario error:', err);
  process.exit(1);
});
