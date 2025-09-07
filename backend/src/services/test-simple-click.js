require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// File-based communication for user answers
const ANSWER_FILE = path.join(__dirname, 'user_answer.json');

// Global delay function to avoid redundancy
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Initialize Supabase client with environment variables (only if running as standalone)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else if (require.main === module) {
  // Only exit if this file is run directly, not when imported
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

// Import the secure decryption function
const { decrypt } = require('../utils/encryption');

// Decryption function that uses the secure encryption implementation
async function decryptPassword(encryptedPassword) {
  try {
    return await decrypt(encryptedPassword);
  } catch (error) {
    console.log('❌ Failed to decrypt password:', error);
    return null;
  }
}

// Helper function to get user credentials from Supabase
async function getUserCredentials() {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not available - this function requires database access');
      return null;
    }
    
    console.log('🔐 Fetching user credentials from Supabase...');
    
    // Check if we're in session mode and have a specific user ID
    const sessionUserId = process.env.SESSION_USER_ID;
    let userId;
    
    if (sessionUserId) {
      console.log(`🔐 Session mode: Using provided user ID: ${sessionUserId}`);
      userId = sessionUserId;
    } else {
      console.log('🔐 No session user ID provided, getting first available user');
      // First, we need to get the user ID from the profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1);
      
      if (profileError || !profiles || profiles.length === 0) {
        console.log('❌ No user profiles found');
        return null;
      }
      
      userId = profiles[0].id;
      console.log(`🔐 Using user ID: ${userId}`);
    }
    
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.log('❌ Error fetching credentials:', error);
      return null;
    }
    
    if (!data) {
      console.log('❌ No active credentials found for user:', userId);
      return null;
    }
    
    console.log(`✅ Found credentials for: ${data.email}`);
    
    // Decrypt password
    const decryptedPassword = decryptPassword(data.password_encrypted);
    if (!decryptedPassword) {
      console.log('❌ Failed to decrypt password');
      return null;
    }
    
    return {
      email: data.email,
      password: decryptedPassword
    };
  } catch (error) {
    console.log('❌ Error in getUserCredentials:', error);
    return null;
  }
}

// Helper function to get user resume from Supabase storage
async function getUserResume() {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not available - this function requires database access');
      return null;
    }
    
    console.log('📄 Fetching user resume from Supabase storage...');
    
    // Get the session user ID or first available user
    const sessionUserId = process.env.SESSION_USER_ID;
    let userId;
    
    if (sessionUserId) {
      userId = sessionUserId;
    } else {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileError || !profiles || profiles.length === 0) {
        console.log('❌ No user profiles found');
        return null;
      }
      
      userId = profiles[0].id;
    }
    
    // Get resume from storage
        const { data, error } = await supabase.storage
          .from('resumes')
      .list(userId);
        
        if (error) {
          console.log('❌ Error fetching resume list:', error);
          return null;
        }
        
        if (!data || data.length === 0) {
      console.log('❌ No resume files found for user');
          return null;
        }
        
    // Get the first resume file
    const resumeFile = data[0];
    console.log(`📄 Found resume file: ${resumeFile.name}`);
        
        // Download the resume file
        const { data: resumeData, error: downloadError } = await supabase.storage
          .from('resumes')
      .download(`${userId}/${resumeFile.name}`);
        
        if (downloadError) {
          console.log('❌ Error downloading resume:', downloadError);
          return null;
        }
        
    // Save to local file
    const localPath = path.join(__dirname, 'resume.pdf');
    fs.writeFileSync(localPath, resumeData);
    console.log(`📄 Resume saved to: ${localPath}`);
    
    return localPath;
  } catch (error) {
    console.log('❌ Error in getUserResume:', error);
    return null;
  }
}

// Helper function to get user ID from credentials
async function getUserIdFromCredentials() {
  try {
    const sessionUserId = process.env.SESSION_USER_ID;
    if (sessionUserId) {
      return sessionUserId;
    }
    
    // Get first available user
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError || !profiles || profiles.length === 0) {
      console.log('❌ No user profiles found');
      return null;
    }
    
    return profiles[0].id;
  } catch (error) {
    console.log('❌ Error getting user ID from credentials:', error);
    return null;
  }
}

// Helper function to get user answer for a specific question
async function getUserAnswerForQuestion(userId, questionText) {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not available - this function requires database access');
      return null;
    }
    
    console.log(`🔍 Looking for previous answer to: "${questionText}"`);
    
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('question_text', questionText)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.log('❌ Error fetching user answer:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Found previous answer: "${data[0].answer}"`);
      return data[0].answer;
    }
    
    console.log('❌ No previous answer found');
    return null;
  } catch (error) {
    console.log('❌ Error in getUserAnswerForQuestion:', error);
    return null;
  }
}

// Helper function to find similar question answers
async function findSimilarQuestionAnswer(userId, questionText) {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not available - this function requires database access');
      return null;
    }
    
    console.log(`🔍 Looking for similar questions to: "${questionText}"`);
    
    // Get all user answers for this user
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching user answers:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No user answers found');
      return null;
    }
    
    // Simple similarity check - look for keywords
    const questionLower = questionText.toLowerCase();
    const keywords = [
      'authorized', 'sponsorship', 'visa', 'citizenship', 'relocate',
      'salary', 'experience', 'years', 'start date', 'remote'
    ];
    
    for (const answer of data) {
      const answerQuestionLower = answer.question_text.toLowerCase();
      
      // Check if both questions contain similar keywords
      for (const keyword of keywords) {
        if (questionLower.includes(keyword) && answerQuestionLower.includes(keyword)) {
          console.log(`✅ Found similar question: "${answer.question_text}"`);
          console.log(`✅ Using answer: "${answer.answer}"`);
          return answer.answer;
        }
      }
    }
    
    console.log('❌ No similar questions found');
    return null;
  } catch (error) {
    console.log('❌ Error in findSimilarQuestionAnswer:', error);
    return null;
  }
}

// Helper function to save user answer
async function saveUserAnswer(userId, questionText, questionType, answer, jobId, jobTitle, companyName) {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not available - this function requires database access');
      return false;
    }
    
    console.log(`💾 Saving answer: "${answer}" for question: "${questionText}"`);
    
    const { data, error } = await supabase
      .from('user_answers')
      .insert({
        user_id: userId,
        question_text: questionText,
        question_type: questionType,
        answer: answer,
        job_id: jobId,
        job_title: jobTitle,
        company_name: companyName,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.log('❌ Error saving user answer:', error);
      return false;
    }
    
    console.log('✅ Answer saved successfully');
    return true;
  } catch (error) {
    console.log('❌ Error in saveUserAnswer:', error);
    return false;
  }
}

// Helper function to fill out the Easy Apply form
async function fillEasyApplyForm(page) {
  console.log('📝 Filling out Easy Apply form...');
  
  try {
    // Wait for form to be fully loaded
    await delay(2000);
    
    // Debug: List all input fields in the modal
    console.log('🔍 Debugging: Listing all input fields in modal...');
    const allInputs = await page.locator('input').all();
    for (let i = 0; i < allInputs.length; i++) {
      try {
        const input = allInputs[i];
        const tagName = await input.evaluate(el => el.tagName);
        const name = await input.getAttribute('name') || 'no-name';
        const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
        const ariaLabel = await input.getAttribute('aria-label') || 'no-aria-label';
        const type = await input.getAttribute('type') || 'no-type';
        const value = await input.inputValue() || 'no-value';
        
        console.log(`Input ${i}: tagName=${tagName}, name="${name}", placeholder="${placeholder}", aria-label="${ariaLabel}", type="${type}", value="${value}"`);
      } catch (error) {
        console.log(`Input ${i}: Error getting details: ${error}`);
      }
    }
    
    // Look for phone number field and fill it if empty
    console.log('📱 Looking for phone number field...');
    const phoneSelectors = [
      // Specific selectors based on the actual HTML structure
      'input[id*="phoneNumber-nationalNumber"]',
      'input[class*="artdeco-text-input--input"]',
      'input[aria-describedby*="phoneNumber-nationalNumber-error"]',
      'input[id*="phoneNumber"]',
      'input[class*="artdeco-text-input"]',
      // Generic fallbacks
      'input[name="phoneNumber"]',
      'input[aria-label*="phone"]',
      'input[placeholder*="phone"]',
      'input[type="tel"]',
      'input[name="mobilePhoneNumber"]',
      'input[name="phone"]',
      'input[data-test-id*="phone"]',
      'input[data-control-name*="phone"]',
      // Try broader selectors as last resort
      'input[type="text"]',
      'input:not([type="checkbox"])',
      'input:not([type="search"])'
    ];
    
    let phoneFilled = false;
    for (const selector of phoneSelectors) {
      try {
        const phoneField = await page.locator(selector).first();
        if (await phoneField.isVisible()) {
          const currentValue = await phoneField.inputValue();
          const placeholder = await phoneField.getAttribute('placeholder') || '';
          const ariaLabel = await phoneField.getAttribute('aria-label') || '';
          const name = await phoneField.getAttribute('name') || '';
          
          console.log(`📱 Found field: ${selector}, placeholder="${placeholder}", aria-label="${ariaLabel}", name="${name}", current value: "${currentValue}"`);
          
          // Check if this looks like a phone number field
          const isPhoneField = placeholder.toLowerCase().includes('phone') || 
                              ariaLabel.toLowerCase().includes('phone') || 
                              name.toLowerCase().includes('phone') ||
                              (currentValue === '' && placeholder === '' && ariaLabel === '' && name === '');
          
          if (isPhoneField && (!currentValue || currentValue.trim() === '')) {
            console.log(`📱 Filling phone number field: ${selector}`);
            
            // Clear the field first
            await phoneField.click();
            await delay(500);
            await phoneField.clear();
            await delay(300);
            
            // Fill with a sample American phone number
            const samplePhone = '555-123-4567';
            await phoneField.fill(samplePhone);
            await delay(1000);
            
            // Verify the value was set
            const newValue = await phoneField.inputValue();
            console.log(`📱 Phone number filled: "${newValue}"`);
            
            if (newValue === samplePhone) {
              console.log('✅ Phone number filled successfully');
              phoneFilled = true;
              break;
            } else {
              console.log('❌ Phone number not filled properly');
            }
          } else if (currentValue && currentValue.trim() !== '') {
            console.log(`📱 Field already has value: ${currentValue}`);
            phoneFilled = true;
            break;
          } else {
            console.log(`📱 Field doesn't look like phone number field`);
          }
        }
      } catch (error) {
        console.log(`Phone selector ${selector} failed: ${error}`);
      }
    }
    
    if (!phoneFilled) {
      console.log('⚠️ Could not fill phone number field - may not be required for this application');
    }
    
    // Look for and click the Next/Review/Submit button
    console.log('➡️ Looking for Next/Review/Submit button...');
    const nextButtonSelectors = [
      'button:has-text("Next")',
      'button:has-text("Review")',
      'button:has-text("Submit")',
      'button[aria-label*="Next"]',
      'button[aria-label*="Review"]',
      'button[aria-label*="Submit"]',
      'button[data-control-name="continue_unify"]',
      '.jobs-easy-apply-content__footer button:last-child',
      'button[type="submit"]'
    ];
    
    let nextButton = null;
    for (const selector of nextButtonSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible() && !(await button.isDisabled())) {
          nextButton = button;
          console.log(`✅ Found Next/Review/Submit button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`Next button selector ${selector} failed: ${error}`);
      }
    }
    
    if (nextButton) {
      console.log('🖱 Clicking Next/Review/Submit button...');
      await nextButton.click();
      await delay(3000);
      console.log('✅ Next/Review/Submit button clicked');
      
      // Check if we moved to the next step or if there are additional questions
      const result = await handleAdditionalQuestions(page);
      return result; // Return the result from handleAdditionalQuestions
      
    } else {
      console.log('❌ Next/Review/Submit button not found');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error filling form: ${error}`);
    return false;
  }
}

// Helper function to handle additional questions or steps
async function handleAdditionalQuestions(page) {
  console.log('❓ Checking for additional questions...');
  
  try {
    await delay(2000);
    
    // Check application progress first
    console.log('📊 Checking application progress...');
    const progressSelectors = [
      '[data-test-id*="progress"]',
      '.jobs-easy-apply-content__progress',
      '[aria-label*="progress"]',
      '.artdeco-progress-bar__percentage'
    ];
    
    let progressPercentage = 0;
    for (const selector of progressSelectors) {
      try {
        const progressElement = await page.locator(selector).first();
        if (await progressElement.isVisible()) {
          const progressText = await progressElement.textContent();
          console.log(`📊 Found progress element: ${progressText}`);
          
          // Extract percentage from text like "67%" or "50%"
          const percentageMatch = progressText.match(/(\d+)%/);
          if (percentageMatch) {
            progressPercentage = parseInt(percentageMatch[1]);
            console.log(`📊 Application progress: ${progressPercentage}%`);
          }
          break;
        }
      } catch (error) {
        console.log(`Progress selector ${selector} failed: ${error}`);
      }
    }
    
    // If progress is not 100%, look for questions
    if (progressPercentage < 100) {
      console.log('❓ Progress less than 100%, looking for questions...');
      
      // Look for question section titles first
      const questionSectionSelectors = [
        'h3:has-text("Work authorization")',
        'h3:has-text("Additional questions")',
        'h4:has-text("Work authorization")',
        'h4:has-text("Additional questions")',
        '[class*="work-authorization"]',
        '[class*="additional-questions"]',
        '[data-test-id*="work-authorization"]',
        '[data-test-id*="additional-questions"]'
      ];
      
      let hasQuestionSection = false;
      let questionSectionTitle = '';
      
      for (const selector of questionSectionSelectors) {
        try {
          const sectionElement = await page.locator(selector).first();
          if (await sectionElement.isVisible()) {
            hasQuestionSection = true;
            questionSectionTitle = await sectionElement.textContent();
            console.log(`✅ Found question section: "${questionSectionTitle}"`);
            break;
          }
        } catch (error) {
          console.log(`Question section selector ${selector} failed: ${error}`);
        }
      }
      
      if (hasQuestionSection) {
        console.log('❓ Found question section, extracting real questions...');
        
        // Use the new extractQuestionsFromModal function
        const questions = await extractQuestionsFromModal(page);
        
        if (questions.length > 0) {
          console.log(`❓ Found ${questions.length} real questions that need user input`);
          
          // Convert to the format expected by the rest of the system
          const foundQuestions = questions.map(q => ({
            text: q.text,
            type: q.type,
            options: q.options,
            element: null,
            selector: q.selector
          }));
          
          // Send questions to frontend (this would be handled by the backend)
          for (const question of foundQuestions) {
            console.log(`📝 Question for user: "${question.text}" (type: ${question.type})`);
            if (question.options.length > 0) {
              console.log(`📝 Options: ${question.options.join(', ')}`);
            }
          }
          
          // Handle questions one at a time
          console.log(`⏳ Processing ${foundQuestions.length} questions one at a time...`);
          
          // Process each question individually
          for (let questionIndex = 0; questionIndex < foundQuestions.length; questionIndex++) {
            const currentQuestion = foundQuestions[questionIndex];
            console.log(`📝 Processing question ${questionIndex + 1}/${foundQuestions.length}: "${currentQuestion.text}"`);
            console.log(`🔍 Debug: Current question type: "${currentQuestion.type}"`);
            
                      // Try to get user ID for answer lookup
          const userId = await getUserIdFromCredentials();
          
          // Check for previous answers to this question
          let suggestedAnswer = null;
          if (userId) {
            suggestedAnswer = await getUserAnswerForQuestion(userId, currentQuestion.text);
            
            // If no exact match, try to find similar questions
            if (!suggestedAnswer) {
              suggestedAnswer = await findSimilarQuestionAnswer(userId, currentQuestion.text);
            }
          }
          
          // Send this question to the user interface via WebSocket
          console.log(`📤 Sending question ${questionIndex + 1} to user interface...`);
          
          try {
            const ws = new WebSocket('ws://localhost:3002');
            
            ws.on('open', () => {
              console.log('🔌 Connected to WebSocket server for question', questionIndex + 1);
              
              const questionMessage = {
                type: 'question',
                data: {
                  text: currentQuestion.text,
                  type: currentQuestion.type,
                  options: currentQuestion.options,
                  suggestedAnswer: suggestedAnswer // Include suggested answer if available
                }
              };
              
              ws.send(JSON.stringify(questionMessage));
              console.log(`📤 Question ${questionIndex + 1} sent to user interface`);
              if (suggestedAnswer) {
                console.log(`💡 Suggested answer: "${suggestedAnswer}"`);
              }
            });
            
            ws.on('message', (data) => {
              try {
                const message = JSON.parse(data.toString());
                if (message.type === 'answer') {
                  console.log(`🔌 Received answer for question ${questionIndex + 1}: ${message.answer}`);
                  
                  // Save the answer to database for future use
                  if (userId) {
                    saveUserAnswer(userId, currentQuestion.text, currentQuestion.type, message.answer, 'job-id', 'job-title', 'company-name');
                  }
                  
                  // Write answer to file for the script to read
                  const answerData = {
                    question: currentQuestion.text,
                    answer: message.answer,
                    timestamp: new Date().toISOString()
                  };
                  
                  fs.writeFileSync(ANSWER_FILE, JSON.stringify(answerData, null, 2));
                  console.log('📤 Answer written to file:', answerData);
                  
                  // Close WebSocket connection
                  ws.close();
                }
              } catch (error) {
                console.log('Error parsing WebSocket message:', error);
              }
            });
            
            ws.on('error', (error) => {
              console.log('WebSocket error:', error);
            });
            
            ws.on('close', () => {
              console.log('WebSocket connection closed');
            });
            
          } catch (error) {
            console.log('Failed to connect to WebSocket server:', error);
          }
          
          // Wait for user answer for this specific question
          console.log('⏳ Waiting for user to answer question...');
          
          // Wait for the answer file to be created
          let answerData = null;
          let attempts = 0;
          const maxAttempts = 60; // Wait up to 60 seconds
          
          while (attempts < maxAttempts) {
            try {
              if (fs.existsSync(ANSWER_FILE)) {
                answerData = JSON.parse(fs.readFileSync(ANSWER_FILE, 'utf8'));
                console.log(`✅ Received answer: ${answerData.answer}`);
                
                // Clean up the answer file
                fs.unlinkSync(ANSWER_FILE);
                break;
              }
            } catch (error) {
              console.log('Error reading answer file:', error);
            }
            
            await delay(1000); // Wait 1 second
            attempts++;
          }
          
          if (!answerData) {
            console.log('❌ No answer received, stopping application');
            return false;
          }
          
          // Handle different question types
          console.log(`🎯 Processing answer: ${answerData.answer} for question type: ${currentQuestion.type}`);
          
          let clicked = false;
          
          if (currentQuestion.type === 'radio') {
            // Handle radio button questions
            console.log(`🎯 Clicking radio button for answer: ${answerData.answer}`);
            
            // Find and click the radio button that matches the answer
            const radioButtons = await page.locator('input[type="radio"]').all();
            
            for (const radioButton of radioButtons) {
              try {
                // Get the associated label text
                const radioId = await radioButton.getAttribute('id');
                let labelText = '';
                let labelElement = null;
                
                if (radioId) {
                  labelElement = await page.locator(`label[for="${radioId}"]`).first();
                  if (await labelElement.count() > 0) {
                    labelText = await labelElement.textContent();
                  }
                }
                
                // If no label found, try to get the text from the parent element
                if (!labelText) {
                  const parent = await radioButton.locator('xpath=..').first();
                  if (await parent.count() > 0) {
                    labelText = await parent.textContent();
                  }
                }
                
                console.log(`🔍 Checking radio button: "${labelText}"`);
                
                // Check if this radio button matches the answer
                if (labelText && labelText.toLowerCase().includes(answerData.answer.toLowerCase())) {
                  console.log(`✅ Found matching radio button: "${labelText}"`);
                  
                  // Try clicking the label first (which is more reliable)
                  if (labelElement && await labelElement.count() > 0) {
                    try {
                      console.log('🎯 Attempting to click label element...');
                      await labelElement.click({ timeout: 10000 });
                      clicked = true;
                      console.log('✅ Successfully clicked label element');
                    } catch (labelError) {
                      console.log('⚠️ Label click failed, trying radio button directly:', labelError.message);
                      // Fallback to clicking the radio button directly
                      try {
                        await radioButton.click({ timeout: 10000 });
                        clicked = true;
                        console.log('✅ Successfully clicked radio button directly');
                      } catch (radioError) {
                        console.log('❌ Radio button click also failed:', radioError.message);
                      }
                    }
                  } else {
                    // No label found, try clicking the radio button directly
                    try {
                      await radioButton.click({ timeout: 10000 });
                      clicked = true;
                      console.log('✅ Successfully clicked radio button directly');
                    } catch (radioError) {
                      console.log('❌ Radio button click failed:', radioError.message);
                    }
                  }
                  
                  if (clicked) break;
                }
              } catch (error) {
                console.log('Error checking radio button:', error);
              }
            }
            
            if (!clicked) {
              console.log('❌ Could not find matching radio button, trying to click by value');
              // Try to click by value attribute
              const radioButton = await page.locator(`input[type="radio"][value="${answerData.answer}"]`).first();
              if (await radioButton.count() > 0) {
                try {
                  // Try clicking the label first
                  const radioId = await radioButton.getAttribute('id');
                  if (radioId) {
                    const label = await page.locator(`label[for="${radioId}"]`).first();
                    if (await label.count() > 0) {
                      console.log('🎯 Attempting to click label for value-based radio button...');
                      await label.click({ timeout: 10000 });
                      clicked = true;
                      console.log(`✅ Clicked label for radio button by value: ${answerData.answer}`);
                    }
                  }
                  
                  // If label click failed, try the radio button directly
                  if (!clicked) {
                    await radioButton.click({ timeout: 10000 });
                    clicked = true;
                    console.log(`✅ Clicked radio button by value: ${answerData.answer}`);
                  }
                } catch (valueError) {
                  console.log('❌ Value-based radio button click failed:', valueError.message);
                }
              }
            }
          } else if (currentQuestion.type === 'text') {
            // Handle text input questions
            console.log(`🎯 Filling text input with answer: ${answerData.answer}`);
            
            try {
              // Find the text input field associated with this question
              const textInputs = await page.locator('input[type="text"]').all();
              let filled = false;
              
              for (const textInput of textInputs) {
                try {
                  // Check if this input is visible and empty
                  if (await textInput.isVisible() && !(await textInput.inputValue())) {
                    console.log('🎯 Found empty text input, filling with answer');
                    await textInput.fill(answerData.answer);
                    filled = true;
                    console.log(`✅ Successfully filled text input with: ${answerData.answer}`);
                    break;
                  }
                } catch (error) {
                  console.log('Error checking text input:', error);
                }
              }
              
              if (!filled) {
                // If no empty text input found, try to find by placeholder or label
                const textInput = await page.locator('input[type="text"]').first();
                if (await textInput.count() > 0) {
                  try {
                    await textInput.fill(answerData.answer);
                    filled = true;
                    console.log(`✅ Successfully filled first text input with: ${answerData.answer}`);
                  } catch (error) {
                    console.log('Error filling text input:', error);
                  }
                }
              }
              
              clicked = filled;
            } catch (error) {
              console.log('Error handling text input:', error);
            }
          }
          
          if (!clicked) {
            console.log('❌ Could not process answer, stopping application');
            return false;
          }
          
          console.log('✅ Radio button clicked successfully');
          await delay(1000); // Wait a moment for the click to register
          
          // Only proceed to the next question if this one was successfully clicked
          console.log(`✅ Question ${questionIndex + 1} completed successfully`);
          
          // If this was the last question, break out of the loop
          if (questionIndex === foundQuestions.length - 1) {
            console.log('✅ All questions completed successfully');
            break;
          }
        } // End of for loop for questions
      } else {
        console.log('📋 No real questions found, continuing...');
      }
    } else {
      console.log('📋 No question section found, continuing with application...');
    }
      
      // Look for Next/Review/Submit button to proceed to the next screen
      console.log('➡️ Looking for Next/Review/Submit button to continue...');
      
      // First, try to find the Review button specifically within the modal
      let nextButton = null;
      try {
        const reviewButton = await page.locator('[data-test-modal-id="easy-apply-modal"] button:has-text("Review")').first();
        if (await reviewButton.isVisible() && !(await reviewButton.isDisabled())) {
          nextButton = reviewButton;
          console.log('✅ Found Review button within Easy Apply modal');
        }
      } catch (error) {
        console.log('Review button not found in modal, trying other buttons...');
      }
      
      // If no Review button found, try other buttons
      if (!nextButton) {
        const nextButtonSelectors = [
          'button:has-text("Next")',
          'button:has-text("Submit")',
          'button[aria-label*="Next"]',
          'button[aria-label*="Submit"]',
          'button[data-control-name="continue_unify"]',
          '.jobs-easy-apply-content__footer button:last-child',
          'button[type="submit"]'
        ];
        
        for (const selector of nextButtonSelectors) {
          try {
            const button = await page.locator(selector).first();
            if (await button.isVisible() && !(await button.isDisabled())) {
              nextButton = button;
              console.log(`✅ Found Next/Review/Submit button with selector: ${selector}`);
              break;
            }
          } catch (error) {
            console.log(`Next button selector ${selector} failed: ${error}`);
          }
        }
      }
      
      if (nextButton) {
        console.log('🖱 Clicking Next/Review/Submit button to continue...');
        await nextButton.click();
        await delay(3000);
        console.log('✅ Next/Review/Submit button clicked, checking for questions on next screen...');
        
        // Recursively check for questions on the next screen
        return await handleAdditionalQuestions(page);
      } else {
        console.log('❌ No Next/Review/Submit button found, application may be complete');
      }
    }
    
    // Check if resume is already uploaded
    console.log('📄 Checking if resume is already uploaded...');
    const resumeCheckSelectors = [
      '[data-test-id*="resume"]',
      '.jobs-document-upload__file',
      '[class*="resume"]',
      '[class*="document"]',
      'div[class*="file"]',
      '.jobs-document-upload-redesign-card_container',
      '.jobs-document-upload-redesign-card',
      '[data-test-id*="document"]',
      '.jobs-document-upload__file-name',
      '.jobs-document-upload__file-size'
    ];
    
    let resumeFound = false;
    for (const selector of resumeCheckSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          const resumeText = await element.textContent();
          console.log(`📄 Found resume element: ${resumeText}`);
          
          // Check if it contains resume-related text or file info
          if (resumeText && (
            resumeText.includes('resume') || 
            resumeText.includes('pdf') || 
            resumeText.includes('uploaded') ||
            resumeText.includes('last used') ||
            resumeText.includes('document') ||
            resumeText.includes('cv')
          )) {
            console.log('✅ Resume already uploaded');
            resumeFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`Resume check selector ${selector} failed: ${error}`);
      }
    }
    
    // If no resume found, upload the user's resume
    if (!resumeFound) {
      console.log('📄 No resume found, uploading user resume...');
      
      // Get user resume from Supabase
      const userResumePath = await getUserResume();
      if (!userResumePath) {
        console.log('❌ Could not get user resume from Supabase');
        return false;
      }
      
      // Look for file input to upload resume
      const fileInputSelectors = [
        'input[type="file"]',
        'input[id*="jobs-document-upload-file-input"]',
        'input[id*="upload-resume"]',
        'input[data-test-id*="file"]',
        'input[data-control-name*="file"]',
        'input[accept*="pdf"]',
        'input[accept*="doc"]',
        'input[aria-label*="resume"]',
        'input[aria-label*="cv"]',
        'input[aria-label*="upload"]',
        'input[placeholder*="resume"]',
        'input[placeholder*="cv"]'
      ];
      
      let resumeUploaded = false;
      for (const selector of fileInputSelectors) {
        try {
          const fileInput = await page.locator(selector).first();
          if (await fileInput.count() > 0) {
            console.log(`📄 Found file input: ${selector}`);
            
            const fs = require('fs');
            if (fs.existsSync(userResumePath)) {
              console.log('📄 Uploading user resume...');
              try {
                await fileInput.setInputFiles(userResumePath);
                await delay(3000);
                console.log('✅ Resume uploaded successfully');
                resumeUploaded = true;
                break;
              } catch (error) {
                console.log(`❌ Failed to upload resume: ${error}`);
              }
            } else {
              console.log('❌ User resume file not found locally');
            }
          }
        } catch (error) {
          console.log(`File input selector ${selector} failed: ${error}`);
        }
      }
      
      if (!resumeUploaded) {
        console.log('⚠️ Could not upload resume, but continuing...');
      }
    } else {
      console.log('✅ Resume already available');
    }
    
    // Look for Review button (next step after resume upload)
    console.log('📋 Looking for Review button...');
    const reviewSelectors = [
      'button:has-text("Review")',
      'button[aria-label*="Review"]',
      'button[data-control-name="continue_unify"]',
      'button:has-text("Next")'
    ];
    
    for (const selector of reviewSelectors) {
      try {
        const reviewButton = await page.locator(selector).first();
        if (await reviewButton.isVisible() && !(await reviewButton.isDisabled())) {
          console.log(`✅ Found Review button with selector: ${selector}`);
          console.log('🖱 Clicking Review button...');
          await reviewButton.click();
          await delay(3000);
          console.log('✅ Review button clicked');
          break;
        }
      } catch (error) {
        console.log(`Review button selector ${selector} failed: ${error}`);
      }
    }
    
    // Look for Submit button (final step)
    console.log('📤 Looking for Submit button...');
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Submit application")',
      'button[aria-label*="Submit"]',
      'button[data-control-name="submit_unify"]'
    ];
    
    for (const selector of submitSelectors) {
      try {
        const submitButton = await page.locator(selector).first();
        if (await submitButton.isVisible() && !(await submitButton.isDisabled())) {
          console.log(`✅ Found Submit button with selector: ${selector}`);
          console.log('🖱 Clicking Submit button...');
          await submitButton.click();
          await delay(5000);
          console.log('🎉 Application submitted successfully!');
          return true;
        }
      } catch (error) {
        console.log(`Submit button selector ${selector} failed: ${error}`);
      }
    }
    
    console.log('📋 Form filling completed (no submit button found)');
    return true;
    
  } catch (error) {
    console.log(`❌ Error handling additional questions: ${error}`);
    return false;
  }
}

// Helper function to extract real application questions from the modal
async function extractQuestionsFromModal(page) {
  console.log('🔍 Extracting real application questions from modal...');
  
  try {
    // Find all input elements (radio buttons, text inputs, number inputs, etc.)
    const radioGroups = await page.locator('input[type="radio"]').all();
    const textInputs = await page.locator('input[type="text"]').all();
    const numberInputs = await page.locator('input[type="number"]').all();
    const selectElements = await page.locator('select').all();
    
    console.log(`📄 Found ${radioGroups.length} radio button elements`);
    console.log(`📄 Found ${textInputs.length} text input elements`);
    console.log(`📄 Found ${numberInputs.length} number input elements`);
    console.log(`📄 Found ${selectElements.length} select elements`);
    
    const questions = [];
    const processedInputs = new Set(); // Track processed inputs by name/id
    
    // Process radio button groups
    for (const radioButton of radioGroups) {
      try {
        // Get the name attribute to identify radio groups
        const name = await radioButton.getAttribute('name');
        if (!name || processedInputs.has(name)) {
          continue; // Skip if no name or already processed this group
        }
        
        processedInputs.add(name);
        console.log(`📄 Processing radio group: ${name}`);
        
        // Find the question text by looking for:
        // 1. Legend element
        // 2. Aria-label on the radio group
        // 3. Preceding text elements (h3, p, span)
        
        let questionText = '';
        
        // Method 1: Look for legend element
        try {
          const legend = await radioButton.locator('xpath=ancestor::fieldset/legend').first();
          if (await legend.count() > 0 && await legend.isVisible()) {
            questionText = await legend.textContent();
            console.log(`✅ Found question in legend: "${questionText}"`);
          }
        } catch (error) {
          console.log(`❌ No legend found for radio group ${name}`);
        }
        
        // Method 2: Look for aria-label on the radio group
        if (!questionText) {
          try {
            const ariaLabel = await radioButton.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.length > 10) {
              questionText = ariaLabel;
              console.log(`✅ Found question in aria-label: "${questionText}"`);
            }
          } catch (error) {
            console.log(`❌ No aria-label found for radio group ${name}`);
          }
        }
        
        // Method 3: Look for preceding text elements
        if (!questionText) {
          try {
            // Look for preceding h3, p, or span elements
            const precedingSelectors = [
              'xpath=preceding::h3[1]',
              'xpath=preceding::p[1]',
              'xpath=preceding::span[1]',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//h3',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//p'
            ];
            
            for (const selector of precedingSelectors) {
              try {
                const textElement = await radioButton.locator(selector).first();
                if (await textElement.count() > 0 && await textElement.isVisible()) {
                  const text = await textElement.textContent();
                  if (text && text.length > 10 && text.length < 500) {
                    // Check if this looks like a question
                    const textLower = text.toLowerCase();
                    if (text.includes('?') || 
                        textLower.includes('authorized') ||
                        textLower.includes('sponsorship') ||
                        textLower.includes('visa') ||
                        textLower.includes('work authorization') ||
                        textLower.includes('citizenship') ||
                        textLower.includes('relocate') ||
                        textLower.includes('salary') ||
                        textLower.includes('experience') ||
                        textLower.includes('start date')) {
                      questionText = text.trim();
                      console.log(`✅ Found question in preceding text: "${questionText}"`);
                      break;
                    }
                  }
                }
              } catch (error) {
                // Continue to next selector
              }
            }
          } catch (error) {
            console.log(`❌ Error finding preceding text for radio group ${name}: ${error}`);
          }
        }
        
        // If we found a question, get the options
        if (questionText) {
          console.log(`❓ Processing question: "${questionText}"`);
          
          // Get all radio buttons in this group
          const groupRadios = await page.locator(`input[type="radio"][name="${name}"]`).all();
          const options = [];
          
          for (const groupRadio of groupRadios) {
            try {
              // Get the label text for this radio button using a simpler approach
              let optionText = '';
              
              // Method 1: Try to find label using for attribute
              const radioId = await groupRadio.getAttribute('id');
              if (radioId) {
                try {
                  const label = await page.locator(`label[for="${radioId}"]`).first();
                  if (await label.count() > 0) {
                    optionText = await label.textContent();
                  }
                } catch (error) {
                  console.log(`❌ Error finding label with for="${radioId}": ${error}`);
                }
              }
              
              // Method 2: Try to find label as sibling
              if (!optionText) {
                try {
                  const label = await groupRadio.locator('xpath=following-sibling::label').first();
                  if (await label.count() > 0) {
                    optionText = await label.textContent();
                  }
                } catch (error) {
                  console.log(`❌ Error finding sibling label: ${error}`);
                }
              }
              
              // Method 3: Try to find label as parent
              if (!optionText) {
                try {
                  const label = await groupRadio.locator('xpath=ancestor::label').first();
                  if (await label.count() > 0) {
                    optionText = await label.textContent();
                  }
                } catch (error) {
                  console.log(`❌ Error finding parent label: ${error}`);
                }
              }
              
              // Method 4: Try to find text in the same container
              if (!optionText) {
                try {
                  const container = await groupRadio.locator('xpath=ancestor::div[contains(@class, "jobs-easy-apply")]').first();
                  if (await container.count() > 0) {
                    const containerText = await container.textContent();
                    // Look for common radio button options in the container text
                    if (containerText) {
                      if (containerText.includes('Yes')) optionText = 'Yes';
                      else if (containerText.includes('No')) optionText = 'No';
                      else if (containerText.includes('True')) optionText = 'True';
                      else if (containerText.includes('False')) optionText = 'False';
                    }
                  }
                } catch (error) {
                  console.log(`❌ Error finding container text: ${error}`);
                }
              }
              
              if (optionText && optionText.trim().length > 0) {
                options.push(optionText.trim());
                console.log(`✅ Found option: "${optionText.trim()}"`);
              }
            } catch (error) {
              console.log(`❌ Error getting option text: ${error}`);
            }
          }
          
          if (options.length > 0) {
            console.log(`📝 Found options: ${options.join(', ')}`);
            
            // Clean up the question text - remove extra whitespace and formatting
            let cleanedQuestionText = questionText.replace(/\s+/g, ' ').trim();
            cleanedQuestionText = cleanedQuestionText.replace(/Required/g, '').trim();
            
            // Remove duplicated question text (common issue with LinkedIn forms)
            // Split by common delimiters and take the first part
            const delimiters = ['?', '!', '.'];
            for (const delimiter of delimiters) {
              if (cleanedQuestionText.includes(delimiter + delimiter)) {
                const parts = cleanedQuestionText.split(delimiter + delimiter);
                if (parts.length > 1) {
                  // Take the first part and add back the delimiter
                  cleanedQuestionText = parts[0] + delimiter;
                  break;
                }
              }
            }
            
            // If the question is still duplicated (same text repeated), take only the first occurrence
            const questionLength = cleanedQuestionText.length;
            const halfLength = Math.floor(questionLength / 2);
            if (questionLength > 50) { // Only check for longer questions
              const firstHalf = cleanedQuestionText.substring(0, halfLength);
              const secondHalf = cleanedQuestionText.substring(halfLength);
              if (firstHalf === secondHalf) {
                cleanedQuestionText = firstHalf;
              }
            }
            
            // Remove any remaining extra whitespace and newlines
            cleanedQuestionText = cleanedQuestionText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            
            console.log(`📝 Raw question text: ${questionText}`);
            console.log(`📝 Cleaned question text: ${cleanedQuestionText}`);
            console.log(`📝 Parsed question: ${cleanedQuestionText}`);
            console.log(`📝 Parsed options: [ '${options.join("', '")}' ]`);
            
            const question = {
              text: cleanedQuestionText,
              selector: `input[type="radio"][name="${name}"]`,
              type: 'radio',
              options: options
            };
            
            questions.push(question);
            console.log(`✅ Added question: "${questionText}" with ${options.length} options`);
            console.log(`🔍 Debug: Question object created with type: "${question.type}"`);
          }
        } else {
          console.log(`⚠️ No question text found for radio group ${name}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing radio button: ${error}`);
      }
    }
    
    // Process number inputs (like years of experience questions)
    for (const numberInput of numberInputs) {
      try {
        const inputId = await numberInput.getAttribute('id');
        const inputName = await numberInput.getAttribute('name');
        const inputKey = inputId || inputName;
        
        if (!inputKey || processedInputs.has(inputKey)) {
          continue; // Skip if no identifier or already processed
        }
        
        processedInputs.add(inputKey);
        console.log(`📄 Processing number input: ${inputKey}`);
        
        // Find the question text for this input
        let questionText = '';
        
        // Method 1: Look for label with for attribute
        if (inputId) {
          try {
            const label = await page.locator(`label[for="${inputId}"]`).first();
            if (await label.count() > 0 && await label.isVisible()) {
              questionText = await label.textContent();
              console.log(`✅ Found question in label: "${questionText}"`);
            }
          } catch (error) {
            console.log(`❌ No label found for number input ${inputId}`);
          }
        }
        
        // Method 2: Look for preceding text elements
        if (!questionText) {
          try {
            const precedingSelectors = [
              'xpath=preceding::label[1]',
              'xpath=preceding::p[1]',
              'xpath=preceding::span[1]',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//label',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//p'
            ];
            
            for (const selector of precedingSelectors) {
              try {
                const textElement = await numberInput.locator(selector).first();
                if (await textElement.count() > 0 && await textElement.isVisible()) {
                  const text = await textElement.textContent();
                  if (text && text.length > 10 && text.length < 500) {
                    // Check if this looks like a question about experience
                    const textLower = text.toLowerCase();
                    if (text.includes('?') || 
                        textLower.includes('years') ||
                        textLower.includes('experience') ||
                        textLower.includes('work') ||
                        textLower.includes('how many')) {
                      questionText = text.trim();
                      console.log(`✅ Found question in preceding text: "${questionText}"`);
                      break;
                    }
                  }
                }
              } catch (error) {
                // Continue to next selector
              }
            }
          } catch (error) {
            console.log(`❌ Error finding question text for number input: ${error}`);
          }
        }
        
        // If we found a question, process it
        if (questionText) {
          console.log(`❓ Processing number input question: "${questionText}"`);
          
          // For number inputs, we'll ask the user for a number
          const question = {
            text: questionText,
            selector: `input[type="number"]${inputId ? `[id="${inputId}"]` : ''}${inputName ? `[name="${inputName}"]` : ''}`,
            type: 'number',
            options: [] // Number inputs don't have predefined options
          };
          
          questions.push(question);
          console.log(`✅ Added number input question: "${questionText}"`);
        } else {
          console.log(`⚠️ No question text found for number input ${inputKey}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing number input: ${error}`);
      }
    }
    
    // Process text inputs
    for (const textInput of textInputs) {
      try {
        const inputId = await textInput.getAttribute('id');
        const inputName = await textInput.getAttribute('name');
        const inputKey = inputId || inputName;
        
        if (!inputKey || processedInputs.has(inputKey)) {
          continue; // Skip if no identifier or already processed
        }
        
        processedInputs.add(inputKey);
        console.log(`📄 Processing text input: ${inputKey}`);
        
        // Find the question text for this input (similar to number inputs)
        let questionText = '';
        
        // Method 1: Look for label with for attribute
        if (inputId) {
          try {
            const label = await page.locator(`label[for="${inputId}"]`).first();
            if (await label.count() > 0 && await label.isVisible()) {
              questionText = await label.textContent();
              console.log(`✅ Found question in label: "${questionText}"`);
            }
          } catch (error) {
            console.log(`❌ No label found for text input ${inputId}`);
          }
        }
        
        // Method 2: Look for preceding text elements
        if (!questionText) {
          try {
            const precedingSelectors = [
              'xpath=preceding::label[1]',
              'xpath=preceding::p[1]',
              'xpath=preceding::span[1]',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//label',
              'xpath=ancestor::div[contains(@class, "jobs-easy-apply")]//p'
            ];
            
            for (const selector of precedingSelectors) {
              try {
                const textElement = await textInput.locator(selector).first();
                if (await textElement.count() > 0 && await textElement.isVisible()) {
                  const text = await textElement.textContent();
                  if (text && text.length > 10 && text.length < 500) {
                    // Check if this looks like a question
                    const textLower = text.toLowerCase();
                    if (text.includes('?') || 
                        textLower.includes('describe') ||
                        textLower.includes('explain') ||
                        textLower.includes('what') ||
                        textLower.includes('how')) {
                      questionText = text.trim();
                      console.log(`✅ Found question in preceding text: "${questionText}"`);
                      break;
                    }
                  }
                }
              } catch (error) {
                // Continue to next selector
              }
            }
          } catch (error) {
            console.log(`❌ Error finding question text for text input: ${error}`);
          }
        }
        
        // If we found a question, process it
        if (questionText) {
          console.log(`❓ Processing text input question: "${questionText}"`);
          
          const question = {
            text: questionText,
            selector: `input[type="text"]${inputId ? `[id="${inputId}"]` : ''}${inputName ? `[name="${inputName}"]` : ''}`,
            type: 'text',
            options: [] // Text inputs don't have predefined options
          };
          
          questions.push(question);
          console.log(`✅ Added text input question: "${questionText}"`);
        } else {
          console.log(`⚠️ No question text found for text input ${inputKey}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing text input: ${error}`);
      }
    }
    
    console.log(`🎯 Extracted ${questions.length} real application questions`);
    return questions;
    
  } catch (error) {
    console.log(`❌ Error extracting questions: ${error}`);
    return [];
  }
}

// Main test function (for backward compatibility)
async function testSimpleClick() {
  console.log('🧪 This function is now deprecated. Use fillEasyApplyForm() instead.');
  console.log('🧪 Browser management is now handled by server.js');
                  return true;
                }

// Export the main function for use by server.js
module.exports = {
  fillEasyApplyForm,
  testSimpleClick,
  getUserCredentials,
  getUserResume,
  getUserIdFromCredentials,
  getUserAnswerForQuestion,
  findSimilarQuestionAnswer,
  saveUserAnswer
};
          
// If this file is run directly (not imported), show usage
if (require.main === module) {
  console.log('🔐 This file is now a utility module for form filling');
  console.log('🔐 Browser management is handled by server.js');
  console.log('🔐 Use fillEasyApplyForm(page) to fill Easy Apply forms');
} 