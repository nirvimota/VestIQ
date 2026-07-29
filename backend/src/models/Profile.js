/**
 * Profile model - represents extended user profile information
 * Maps to public.profiles table
 */
export class Profile {
  /**
   * @param {Object} data - Profile data
   * @param {string} data.id - User ID (matches auth.users.id)
   * @param {string} data.full_name - User's full name
   * @param {string} data.phone - Phone number
   * @param {string} data.avatar_url - URL to avatar image
   * @param {string} data.created_at - Profile creation timestamp
   * @param {string} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.full_name = data.full_name || '';
    this.phone = data.phone || '';
    this.avatar_url = data.avatar_url || '';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Profile>} Profile instance
   */
  static async findById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return new Profile(data);
  }

  /**
   * Create or update profile
   * @param {Object} profileData - Profile data to save
   * @returns {Promise<Profile>} Profile instance
   */
  static async save(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profileData.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Profile(data);
  }

  /**
   * Update profile fields
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Profile>} Updated profile
   */
  static async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return new Profile(data);
  }
}