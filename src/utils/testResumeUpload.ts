import { supabase } from '../supabaseClient';
import { uploadResume, validateResumeFile } from './resumeUpload';

// Test function to verify resume upload functionality
export const testResumeUpload = async () => {
  console.log('Testing resume upload functionality...');
  
  // Test 1: Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ User not authenticated:', authError);
    return false;
  }
  console.log('✅ User authenticated:', user.id);

  // Test 2: Check if resumes bucket exists
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return false;
    }
    
    console.log('📋 Available buckets:', buckets);
    
    const resumesBucket = buckets.find(bucket => bucket.name === 'resumes');
    if (!resumesBucket) {
      console.error('❌ Resumes bucket not found');
      console.log('🔍 Looking for bucket named exactly "resumes"');
      console.log('📝 Available bucket names:', buckets.map(b => b.name));
      return false;
    }
    console.log('✅ Resumes bucket found:', resumesBucket.name, 'Public:', resumesBucket.public);

  } catch (error) {
    console.error('❌ Error checking buckets:', error);
    return false;
  }

  // Test 3: Create a test file
  const testContent = 'This is a test resume file content.';
  const testFile = new File([testContent], 'test_resume.txt', { type: 'text/plain' });

  // Test 4: Validate the test file
  const validation = validateResumeFile(testFile);
  console.log('✅ File validation result:', validation);

  // Test 5: Try to upload the test file
  try {
    const result = await uploadResume(testFile, user.id);
    console.log('✅ Upload result:', result);
    
    if (result.success) {
      console.log('🎉 Resume upload test successful!');
      console.log('Public URL:', result.publicUrl);
      return true;
    } else {
      console.error('❌ Upload failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return false;
  }
};

// Alternative test that bypasses bucket listing
export const testDirectUpload = async () => {
  console.log('Testing direct upload to resumes bucket...');
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ User not authenticated:', authError);
    return false;
  }
  console.log('✅ User authenticated:', user.id);

  // Create a test file
  const testContent = 'This is a test resume file content.';
  const testFile = new File([testContent], 'test_resume.txt', { type: 'text/plain' });

  // Try direct upload to resumes bucket
  try {
    const filePath = `${user.id}/test_${Date.now()}.txt`;
    console.log('📁 Uploading to path:', filePath);
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, testFile, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Direct upload failed:', uploadError);
      return false;
    }

    console.log('✅ Direct upload successful!');
    
    // Get public URL
    const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
    console.log('🔗 Public URL:', data.publicUrl);
    
    return true;
  } catch (error) {
    console.error('❌ Direct upload error:', error);
    return false;
  }
};

// Function to list files in the resumes bucket
export const listResumeFiles = async () => {
  try {
    const { data: files, error } = await supabase.storage
      .from('resumes')
      .list();

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    console.log('Files in resumes bucket:', files);
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

// Function to get a public URL for a file
export const getResumePublicUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath);
  
  console.log('Public URL for', filePath, ':', data.publicUrl);
  return data.publicUrl;
}; 