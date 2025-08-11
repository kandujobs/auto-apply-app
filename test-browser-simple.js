require('dotenv').config();
const { chromium } = require('playwright');

async function testBrowser() {
  let browser = null;
  let context = null;
  let page = null;
  
  try {
    console.log('🚀 Starting browser test...');
    
    // Initialize browser
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    page = await context.newPage();
    
    console.log('✅ Browser initialized successfully');
    
    // Navigate to LinkedIn
    console.log('📄 Navigating to LinkedIn...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('✅ Navigation completed');
    console.log('🔄 Browser will stay open for 30 seconds...');
    
    // Keep browser open for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  } finally {
    console.log('🔄 Closing browser...');
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

testBrowser().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
}); 