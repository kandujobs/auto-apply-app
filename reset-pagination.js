import fetch from 'node-fetch';

async function resetPagination() {
  console.log('🔄 Resetting pagination state...');
  const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
  
  try {
    console.log('Sending request to reset pagination state...');
    const response = await fetch('http://localhost:3001/api/reset-pagination', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Pagination reset successful:', result);
    } else {
      console.error('❌ Failed to reset pagination:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error resetting pagination:', error);
  }
}

resetPagination(); 