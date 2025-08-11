# Resume Upload Functionality

This document describes the resume upload functionality implemented for the Joint app, including database schema, storage setup, and usage instructions.

## Overview

The resume upload system allows users to:
- Upload PDF, DOC, and DOCX resume files
- Store files securely in Supabase Storage
- Track upload history and current resume
- Parse resume content using AI
- Manage resume metadata

## Database Schema

### New Tables Created

1. **resume_uploads** - Tracks all resume uploads for each user
2. **resume_parsing_results** - Stores parsed resume data

### Updated Tables

1. **profiles** - Added resume-related fields:
   - `resume_url` - Public URL to the resume file
   - `resume_filename` - Original filename
   - `resume_file_size` - File size in bytes
   - `resume_file_type` - MIME type
   - `resume_uploaded_at` - Upload timestamp

### Database Functions

1. **update_user_current_resume()** - Updates the current resume for a user
2. **get_user_current_resume()** - Retrieves the current resume for a user
3. **get_user_resume_history()** - Gets upload history for a user

## Setup Instructions

### 1. Run the Database Schema

Execute the SQL files in your Supabase database in this order:

```sql
-- First, run the resume storage schema
-- Run the contents of resume_storage_schema.sql

-- Then, enable RLS on all tables
-- Run the contents of enable_rls_policies.sql
```

**Important**: Make sure to run both SQL files to enable Row Level Security (RLS) on all tables.

### 2. Create Supabase Storage Bucket

Create a storage bucket named `resumes` in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `resumes`
4. Set the bucket to private
5. Configure RLS policies for the bucket

### 3. Storage Bucket Configuration

**Important**: You need to disable RLS on the storage bucket to allow uploads.

Run the `disable_storage_rls.sql` file to configure the storage bucket:

```sql
-- Run the contents of disable_storage_rls.sql
-- This disables RLS on the resumes bucket for public access
```

**Why this is needed**: Even though the bucket shows as "Public" in the UI, RLS policies can still block uploads. This SQL file creates a policy that allows all operations on the resumes bucket.

**Security Note**: With RLS disabled, resume files will be publicly accessible via their URLs. If you need private access, uncomment the alternative policies in the SQL file.

## Usage

### Uploading a Resume

```typescript
import { uploadResume } from '../utils/resumeUpload';

const handleFileUpload = async (file: File) => {
  const result = await uploadResume(file, userId);
  
  if (result.success) {
    console.log('Resume uploaded successfully:', result.publicUrl);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

### Getting Current Resume

```typescript
import { getCurrentResume } from '../utils/resumeUpload';

const getResume = async (userId: string) => {
  const resume = await getCurrentResume(userId);
  if (resume) {
    console.log('Current resume:', resume);
  }
};
```

### Getting Upload History

```typescript
import { getResumeHistory } from '../utils/resumeUpload';

const getHistory = async (userId: string) => {
  const history = await getResumeHistory(userId);
  console.log('Upload history:', history);
};
```

### Parsing a Resume

```typescript
import { parseResume } from '../utils/resumeUpload';

const parseFile = async (file: File) => {
  const result = await parseResume(file);
  
  if (result.success) {
    console.log('Parsed data:', result.data);
  } else {
    console.error('Parsing failed:', result.error);
  }
};
```

## File Validation

The system validates uploaded files:

- **File Types**: PDF, DOC, DOCX only
- **File Size**: Maximum 10MB
- **File Naming**: Unique timestamps to prevent conflicts

## Security Features

1. **Row Level Security (RLS)**: Users can only access their own resume data in the database
2. **Storage Access**: Resume files are publicly accessible (RLS disabled on storage)
3. **File Validation**: Prevents malicious file uploads
4. **Unique File Paths**: Prevents file overwrites
5. **Database Protection**: All database tables have RLS enabled for user data protection

## Error Handling

The system provides comprehensive error handling:

- File validation errors
- Upload failures
- Database errors
- Storage errors
- Parsing errors

## Integration Points

### Profile Screen
- Resume upload button in the profile section
- Shows current resume status
- Displays upload success/error messages

### Onboarding Flow
- Resume upload during account creation
- Automatic parsing and profile population
- Resume review and editing

### Resume Parser
- Uses Supabase Edge Function for AI parsing
- Extracts contact info, experience, education, skills
- Populates user profile automatically

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check storage bucket permissions and RLS policies
2. **Database Errors**: Ensure all schema changes are applied
3. **RLS Policy Errors**: Make sure RLS is enabled on all tables and policies are created
4. **Authentication Errors**: Verify user is properly authenticated before accessing data
5. **Parsing Fails**: Verify Edge Function is deployed and accessible
6. **File Too Large**: Check file size limits (10MB max)

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify Supabase connection and authentication
3. Test storage bucket permissions
4. Validate database schema and functions
5. Check Edge Function logs
6. Verify RLS policies are properly set up
7. Test database access with authenticated user

## Future Enhancements

- Resume versioning and comparison
- Multiple resume support
- Resume templates
- Advanced parsing options
- Resume sharing capabilities
- Integration with job applications 