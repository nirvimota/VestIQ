/**
 * User model - represents a user in the system
 * Maps to Supabase auth.users table (built-in)
 */
export class User {
  /**
   * @param {Object} data - User data from Supabase auth
   * @param {string} data.id - User ID
   * @param {string} data.email - User email
   * @param {string} data.created_at - Account creation timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.created_at = data.created_at;
  }

  /**
   * Get user profile from profiles table
   * @returns {Promise<Object>} Profile data
   */
  static async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated profile
   */
  static async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}