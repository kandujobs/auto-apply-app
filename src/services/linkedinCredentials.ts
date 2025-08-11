import { supabase } from '../supabaseClient';
import { encrypt, isValidEmail, isValidPassword } from '../utils/encryption';

export interface LinkedInCredentials {
  email: string;
  password: string;
}

export interface StoredLinkedInCredentials {
  id: string;
  email: string;
  password_encrypted: string;
  is_active: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save LinkedIn credentials to Supabase
 */
export async function saveLinkedInCredentials(credentials: LinkedInCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (!isValidPassword(credentials.password)) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Encrypt password
    const encryptedPassword = encrypt(credentials.password);

    // Save to database
    const { error } = await supabase
      .from('linkedin_credentials')
      .upsert({
        id: user.id,
        email: credentials.email,
        password_encrypted: encryptedPassword,
        is_active: true,
        last_used: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving LinkedIn credentials:', error);
      return { success: false, error: 'Failed to save credentials' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveLinkedInCredentials:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get LinkedIn credentials from Supabase (without decrypting password)
 */
export async function getLinkedInCredentials(): Promise<{ success: boolean; credentials?: LinkedInCredentials; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Fetch credentials from database
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No credentials found
        return { success: false, error: 'No LinkedIn credentials found' };
      }
      console.error('Error fetching LinkedIn credentials:', error);
      return { success: false, error: 'Failed to fetch credentials' };
    }

    // Return credentials without decrypting password (backend handles decryption)
    return {
      success: true,
      credentials: {
        email: data.email,
        password: '***', // Don't decrypt password in frontend
      }
    };
  } catch (error) {
    console.error('Error in getLinkedInCredentials:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update LinkedIn credentials
 */
export async function updateLinkedInCredentials(credentials: LinkedInCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (!isValidPassword(credentials.password)) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Encrypt password
    const encryptedPassword = encrypt(credentials.password);

    // Update in database
    const { error } = await supabase
      .from('linkedin_credentials')
      .update({
        email: credentials.email,
        password_encrypted: encryptedPassword,
        last_used: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating LinkedIn credentials:', error);
      return { success: false, error: 'Failed to update credentials' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateLinkedInCredentials:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete LinkedIn credentials
 */
export async function deleteLinkedInCredentials(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Delete from database
    const { error } = await supabase
      .from('linkedin_credentials')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error('Error deleting LinkedIn credentials:', error);
      return { success: false, error: 'Failed to delete credentials' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteLinkedInCredentials:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if user has LinkedIn credentials
 */
export async function hasLinkedInCredentials(): Promise<{ success: boolean; hasCredentials: boolean; error?: string }> {
  try {
    console.log('[hasLinkedInCredentials] Starting credentials check');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[hasLinkedInCredentials] User not authenticated:', userError);
      return { success: false, hasCredentials: false, error: 'User not authenticated' };
    }

    console.log('[hasLinkedInCredentials] User authenticated, checking credentials for user:', user.id);

    // Check if credentials exist
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[hasLinkedInCredentials] Database error:', error);
      return { success: false, hasCredentials: false, error: 'Failed to check credentials' };
    }

    const hasCredentials = !!data;
    console.log('[hasLinkedInCredentials] Credentials check completed, hasCredentials:', hasCredentials);
    
    return { success: true, hasCredentials };
  } catch (error) {
    console.error('[hasLinkedInCredentials] Unexpected error:', error);
    return { success: false, hasCredentials: false, error: 'An unexpected error occurred' };
  }
} 