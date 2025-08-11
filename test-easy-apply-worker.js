const { spawn } = require('child_process');
const path = require('path');

async function testEasyApplyWorker() {
  console.log('🧪 Testing Easy Apply Worker...');
  
  // Set environment variables
  const env = {
    ...process.env,
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
    LINKEDIN_EMAIL: process.env.LINKEDIN_EMAIL || 'test@example.com',
    LINKEDIN_PASSWORD: process.env.LINKEDIN_PASSWORD || 'test-password',
    BROWSER_HEADLESS: 'false',
    BROWSER_SLOW_MO: '1000',
    RESUME_PATH: './resume.pdf',
    SCREENSHOT_DIR: './screenshots',
    PAGE_LOAD_TIMEOUT: '30000',
    ELEMENT_WAIT_TIMEOUT: '10000',
  };

  // Test user ID
  const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
  
  console.log(`🚀 Starting Easy Apply Worker for user: ${testUserId}`);
  
  // Run the Easy Apply Worker
  const autoApplyPath = path.join(__dirname, 'auto-apply');
  const child = spawn('node', ['dist/index.js', 'easy-apply-worker', testUserId], {
    cwd: autoApplyPath,
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('Worker output:', data.toString());
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('Worker error:', data.toString());
  });

  // Let it run for 30 seconds to test
  setTimeout(() => {
    console.log('⏰ Test timeout reached, stopping worker...');
    child.kill('SIGTERM');
  }, 30000);

  child.on('close', (code) => {
    console.log(`✅ Easy Apply Worker test completed with code ${code}`);
    console.log('Final output:', output);
    if (errorOutput) {
      console.log('Errors:', errorOutput);
    }
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start Easy Apply Worker:', error);
  });
}

testEasyApplyWorker().catch(console.error); 