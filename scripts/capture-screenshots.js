import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outDir = path.join(__dirname, '../public/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Slide 1 Hero
  console.log('Capturing Slide 1 (Hero)...');
  await page.screenshot({ path: path.join(outDir, 'slide-01-hero.png') });

  // Move to Slide 2
  console.log('Navigating to Slide 2...');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'slide-02-production.png') });

  // Move to Slide 3
  console.log('Navigating to Slide 3...');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'slide-03-problem.png') });

  // Move to Slide 4
  console.log('Navigating to Slide 4...');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'slide-04-resolution.png') });

  // Click Enter Live Demo
  console.log('Entering Live Demo...');
  const demoButton = page.locator('button:has-text("Enter Live Demo")').first();
  if (await demoButton.isVisible()) {
    await demoButton.click();
  } else {
    await page.click('.skip-pill');
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, 'demo-shell.png') });

  // Trigger Run Investigation
  console.log('Running Investigation...');
  const runBtn = page.locator('button:has-text("Run Investigation")').first();
  if (await runBtn.isVisible()) {
    await runBtn.click();
    console.log('Waiting for telemetry spans & incident analysis completion...');
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(outDir, 'demo-investigation.png') });
  }

  await browser.close();
  console.log('All screenshots captured successfully in public/screenshots/');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
