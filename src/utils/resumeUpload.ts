import { supabase } from '../supabaseClient';

export interface ResumeUploadResult {
  success: boolean;
  publicUrl?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

export interface ResumeValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate resume file
export const validateResumeFile = (file: File): ResumeValidationResult => {
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a PDF, DOC, or DOCX file.'
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB.'
    };
  }

  return { isValid: true };
};

// Upload resume to Supabase Storage and update database
export const uploadResume = async (
  file: File, 
  userId: string
): Promise<ResumeUploadResult> => {
  try {
    // Validate file
    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const timestamp = new Date().getTime();
    const filePath = `${userId}/resume_${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // Update database using the stored function
    // Note: If the function doesn't exist yet, we'll fall back to direct table update
    try {
      const { error: functionError } = await supabase.rpc('update_user_current_resume', {
        p_user_id: userId,
        p_resume_url: publicUrl,
        p_filename: file.name,
        p_file_size: file.size,
        p_file_type: file.type,
        p_storage_path: filePath
      });

      if (functionError) {
        throw new Error(`Database function failed: ${functionError.message}`);
      }
    } catch (functionError: any) {
      // Fallback: Update profiles table directly if function doesn't exist
      console.log('Database function not available, using direct table update');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_url: publicUrl,
          resume_filename: file.name,
          resume_file_size: file.size,
          resume_file_type: file.type,
          resume_uploaded_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Also insert into resume_uploads table if it exists
      try {
        await supabase
          .from('resume_uploads')
          .insert({
            user_id: userId,
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath,
            public_url: publicUrl,
            is_current: true
          });
      } catch (insertError) {
        console.log('resume_uploads table not available, skipping');
      }
    }

    return {
      success: true,
      publicUrl,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload resume.'
    };
  }
};

// Get current resume for a user
export const getCurrentResume = async (userId: string) => {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('get_user_current_resume', {
      p_user_id: userId
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (functionError: any) {
    // Fallback: Get resume info from profiles table
    console.log('Database function not available, using direct table query');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('resume_url, resume_filename, resume_file_size, resume_file_type, resume_uploaded_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (tableError: any) {
      console.error('Error fetching current resume:', tableError);
      return null;
    }
  }
};

// Get resume upload history for a user
export const getResumeHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_user_resume_history', {
      p_user_id: userId
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching resume history:', error);
    return [];
  }
};

// Delete a resume file
export const deleteResume = async (userId: string, uploadId: string) => {
  try {
    // Get the upload record to find the storage path
    const { data: uploadData, error: fetchError } = await supabase
      .from('resume_uploads')
      .select('storage_path')
      .eq('id', uploadId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error('Resume not found');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([uploadData.storage_path]);

    if (storageError) {
      throw new Error(`Storage deletion failed: ${storageError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('resume_uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', userId);

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete resume.'
    };
  }
};

// Parse resume using the Edge Function
export const parseResume = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(
      `${baseUrl}/functions/v1/parse-resume`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Resume parsing failed');
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to parse resume.'
    };
  }
}; 

// Get user resumes from storage bucket
export const getUserResumes = async (userId: string) => {
  try {
    // List all files in the user's folder
    const { data: files, error } = await supabase.storage
      .from('resumes')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to list resumes: ${error.message}`);
    }

    if (!files || files.length === 0) {
      return [];
    }

    // Get public URLs for all files
    const resumesWithUrls = files.map(file => {
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(`${userId}/${file.name}`);
      
      return {
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        public_url: data.publicUrl,
        storage_path: `${userId}/${file.name}`
      };
    });

    return resumesWithUrls;
  } catch (error: any) {
    console.error('Error fetching user resumes:', error);
    return [];
  }
};

// Get the most recent resume for a user
export const getLatestUserResume = async (userId: string) => {
  try {
    const resumes = await getUserResumes(userId);
    
    if (resumes.length === 0) {
      return null;
    }

    // Sort by created_at and return the most recent
    const sortedResumes = resumes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedResumes[0];
  } catch (error: any) {
    console.error('Error fetching latest user resume:', error);
    return null;
  }
};

// Download resume file from storage
export const downloadResume = async (userId: string, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(`${userId}/${fileName}`);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error downloading resume:', error);
    return null;
  }
}; 