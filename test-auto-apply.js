// Test script for auto-apply system
const fetch = require('node-fetch');

async function testAutoApply() {
  try {
    console.log('Testing auto-apply system...');
    
    const testData = {
      jobUrl: 'https://www.linkedin.com/jobs/view/123456789',
      userProfile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        location: 'San Francisco, CA',
        resumePath: './resume.pdf',
        experience: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: '2022-01-01',
            endDate: '2023-12-31',
            description: 'Developed web applications using React and Node.js',
            current: false,
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            school: 'University of Technology',
            fieldOfStudy: 'Computer Science',
            startDate: '2018-09-01',
            endDate: '2022-05-01',
            gpa: '3.8',
          }
        ],
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
      },
      linkedInCredentials: {
        email: 'test@example.com',
        password: 'testpassword'
      }
    };

    const response = await fetch('http://localhost:3001/api/auto-apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Auto-apply test result:', result);
    
    if (result.success) {
      console.log('✅ Auto-apply system is working!');
    } else {
      console.log('❌ Auto-apply system failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error testing auto-apply:', error);
  }
}

testAutoApply(); 