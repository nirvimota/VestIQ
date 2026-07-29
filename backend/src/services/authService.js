import supabase from '../config/supabase.js';
import { AuditLogService } from './auditLogService.js';

/**
 * Auth Service - handles authentication and user-related operations
 */
export class AuthService {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userMetadata - Additional user data (full_name, etc.)
   * @returns {Promise<Object>} Auth response with user and session
   */
  static async registerUser(email, password, userMetadata = {}) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: userMetadata
        }
      });
      
      if (error) throw error;
      
      // If email confirmation is required, we might not get a session immediately
      if (data.user) {
        // Create profile for the user
        await this._createUserProfile(data.user.id, {
          full_name: userMetadata.full_name || '',
          phone: userMetadata.phone || ''
        });
        
        // Log successful registration
        await AuditLogService.logAuthEvent(
          data.user.id,
          'register',
          { email: data.user.email },
          null // IP would come from request in real implementation
        );
      }
      
      return data;
    } catch (error) {
      // Log failed registration attempt
      await AuditLogService.logAuthEvent(
        null, // No user ID for failed registration
        'register_failed',
        { 
          email: email ? email.toLowerCase().trim() : 'unknown',
          error: error.message
        },
        null
      );
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response with user and session
   */
  static async loginUser(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      if (error) throw error;
      
      // Update last login time in profile
      if (data.user) {
        await this._updateUserLoginTime(data.user.id);
        
        // Log successful login
        await AuditLogService.logAuthEvent(
          data.user.id,
          'login',
          { 
            email: data.user.email 
          },
          null // IP would come from request in real implementation
        );
      }
      
      return data;
    } catch (error) {
      // Log failed login attempt
      await AuditLogService.logAuthEvent(
        null, // No user ID for failed login
        'login_failed',
        { 
          email: email ? email.toLowerCase().trim() : 'unknown',
          error: error.message
        },
        null
      );
      throw error;
    }
  }

  /**
   * Sign out user
   * @param {string} accessToken - User's access token
   * @returns {Promise<void>}
   */
  static async logoutUser(accessToken) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Note: In a real app, we would get userId from context before logout, we would get the user from the session
      // For now, we assume the calling code handles logging the user ID
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user session
   * @returns {Promise<Object>} Session data
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object>} User data
   */
  static async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  static async updatePassword(newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Get current user for logging
      const user = await this.getUser();
      if (user) {
        await AuditLogService.logSecurityEvent(
          user.id,
          'password_changed',
          {},
          null // IP would come from request
        );
      }
      
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async sendPasswordResetEmail(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        // You would configure redirect URL in your app settings
      });
      
      if (error) throw error;
      
      // Log password reset request
      await AuditLogService.logSecurityEvent(
        null, // No user ID yet
        'password_reset_requested',
        { email: email.toLowerCase().trim() },
        null
      );
      
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user email
   * @param {string} newEmail - New email address
   * @returns {Promise<void>}
   */
  static async updateEmail(newEmail) {
    try {
      if (!newEmail) {
        throw new Error('Email is required');
      }
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail.toLowerCase().trim()
      });
      
      if (error) throw error;
      
      // Get current user for logging
      const user = await this.getUser();
      if (user) {
        await AuditLogService.logSecurityEvent(
          user.id,
          'email_updated',
          { oldEmail: user.email, newEmail: newEmail.toLowerCase().trim() },
          null
        );
      }
      
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend email confirmation
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async resendEmailConfirmation(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim()
      });
      
      if (error) throw error;
      
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile from profiles table
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated profile
   */
  static async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log profile update
      await AuditLogService.logSecurityEvent(
        userId,
        'profile_updated',
        { updatedFields: Object.keys(updates) },
        null
      );
      
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   * @param {string} userId - User ID
   * @param {File} file - Image file
   * @returns {Promise<string>} URL of uploaded avatar
   */
  static async uploadAvatar(userId, file) {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!file || !allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.');
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }
      
      // Generate file path
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded avatar');
      }
      
      // Update user profile with avatar URL
      await this.updateUserProfile(userId, {
        avatar_url: urlData.publicUrl
      });
      
      // Log avatar upload
      await AuditLogService.logSecurityEvent(
        userId,
        'avatar_updated',
        {},
        null
      );
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteUserAccount(userId) {
    try {
      // In a real app, you might want to:
      // 1. Cancel/open orders
      // 2. Settle positions
      // 3. Withdraw funds
      // 4. Then delete the user
      
      // For now, we'll just delete the auth user
      // (This would typically be done server-side with service role)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Log account deletion
      await AuditLogService.logSecurityEvent(
        userId,
        'account_deleted',
        {},
        null
      );
      
      return;
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Create user profile in profiles table
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<void>}
   */
  static async _createUserProfile(userId, profileData) {
    try {
      await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't throw here as the user is already created in auth
      // In a production system, you might want to handle this differently
    }
  }

  /**
   * Update user's last login time
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async _updateUserLoginTime(userId) {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating user login time:', error);
      // Non-critical, so don't throw
    }
  }

  /**
   * Check if user has completed KYC
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if KYC approved
   */
  static async isKycApproved(userId) {
    try {
      // This would typically call the KYC service
      // For now, we'll check if there's an approved KYC record
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No approved KYC found
        return false;
      }
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  /**
   * Check if user can trade (based on KYC status, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Eligibility status
   */
  static async canTrade(userId) {
    try {
      const isKycApproved = await this.isKycApproved(userId);
      
      return {
        eligible: isKycApproved,
        reason: isKycApproved ? 'Account is verified and ready to trade' : 'KYC verification required',
        requiresKyc: !isKycApproved
      };
    } catch (error) {
      console.error('Error checking trade eligibility:', error);
      return {
        eligible: false,
        reason: 'Unable to verify account status',
        requiresKyc: true
      };
    }
  }
}

export default AuthService;

// Named function exports used by authController
export const registerUser = (email, password) =>
  supabase.auth.signUp({ email: email.toLowerCase().trim(), password });

export const loginUser = (email, password) =>
  supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });

export async function createProfile(userId, { fullName = '', phone = '' } = {}) {
  return AuthService._createUserProfile(userId, { full_name: fullName, phone });
}

export async function getProfileById(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}