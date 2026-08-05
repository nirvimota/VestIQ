import supabase from '../config/supabase.js';

/**
 * KYC Submission model - represents a user's KYC verification submission
 * Maps to public.kyc_submissions table
 */
export class KYCSubmission {
  /**
   * @param {Object} data - KYC submission data
   * @param {string} data.id - Submission ID
   * @param {string} data.user_id - User ID
   * @param {string} data.full_name - Full name as per ID document
   * @param {string|null} data.date_of_birth - Date of birth
   * @param {string|null} data.address_line1 - Address line 1
   * @param {string|null} data.address_line2 - Address line 2
   * @param {string|null} data.city - City
   * @param {string|null} data.state - State
   * @param {string|null} data.postal_code - Postal/ZIP code
   * @param {string} data.country - Country (default: 'India')
   * @param {string|null} data.pan_number - PAN number
   * @param {string|null} data.aadhar_number - Aadhar number
   * @param {'pan'|'aadhar'|'passport'|'driving_license'} data.document_type - Type of ID document
   * @param {string} data.document_number - ID document number
   * @param {string|null} data.document_front_url - URL to front of ID document
   * @param {string|null} data.document_back_url - URL to back of ID document (if applicable)
   * @param {string|null} data.selfie_url - URL to selfie with document
   * @param {'pending'|'under_review'|'approved'|'rejected'} data.status - Verification status
   * @param {string|null} data.rejected_reason - Reason for rejection (if applicable)
   * @param {string|null} data.reviewed_by - Admin user ID who reviewed
   * @param {string|null} data.reviewed_at - When reviewed
   * @param {string} data.created_at - Submission timestamp
   * @param {string} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.full_name = data.full_name;
    this.date_of_birth = data.date_of_birth || null;
    this.address_line1 = data.address_line1 || null;
    this.address_line2 = data.address_line2 || null;
    this.city = data.city || null;
    this.state = data.state || null;
    this.postal_code = data.postal_code || null;
    this.country = data.country || 'India';
    this.pan_number = data.pan_number || null;
    this.aadhar_number = data.aadhar_number || null;
    this.document_type = data.document_type;
    this.document_number = data.document_number;
    this.document_front_url = data.document_front_url || null;
    this.document_back_url = data.document_back_url || null;
    this.selfie_url = data.selfie_url || null;
    this.status = data.status || 'pending';
    this.rejected_reason = data.rejected_reason || null;
    this.reviewed_by = data.reviewed_by || null;
    this.reviewed_at = data.reviewed_at || null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get KYC submission by user ID
   * @param {string} userId - User ID
   * @returns {Promise<KYCSubmission>} KYC submission
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no record found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return new KYCSubmission(data);
  }

  /**
   * Get KYC submission by ID
   * @param {string} kycId - KYC submission ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<KYCSubmission>} KYC submission
   */
  static async findById(kycId, userId) {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('id', kycId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return new KYCSubmission(data);
  }

  /**
   * Create a new KYC submission
   * @param {Object} kycData - KYC submission data
   * @returns {Promise<KYCSubmission>} Created KYC submission
   */
  static async create(kycData) {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: kycData.user_id,
        full_name: kycData.full_name,
        date_of_birth: kycData.date_of_birth,
        address_line1: kycData.address_line1,
        address_line2: kycData.address_line2,
        city: kycData.city,
        state: kycData.state,
        postal_code: kycData.postal_code,
        country: kycData.country || 'India',
        pan_number: kycData.pan_number,
        aadhar_number: kycData.aadhar_number,
        document_type: kycData.document_type,
        document_number: kycData.document_number,
        document_front_url: kycData.document_front_url,
        document_back_url: kycData.document_back_url,
        selfie_url: kycData.selfie_url,
        status: kycData.status || 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return new KYCSubmission(data);
  }

  /**
   * Update KYC submission
   * @param {string} kycId - KYC submission ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<KYCSubmission>} Updated KYC submission
   */
  static async update(kycId, updates) {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', kycId)
      .select()
      .single();
    
    if (error) throw error;
    return new KYCSubmission(data);
  }

  /**
   * Submit KYC for review
   * @param {string} kycId - KYC submission ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<KYCSubmission>} Updated KYC submission
   */
  static async submitForReview(kycId, userId) {
    return this.update(kycId, { status: 'under_review' });
  }

  /**
   * Approve KYC submission
   * @param {string} kycId - KYC submission ID
   * @param {string} adminId - Admin user ID
   * @returns {Promise<KYCSubmission>} Updated KYC submission
   */
  static async approve(kycId, adminId) {
    return this.update(kycId, {
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    });
  }

  /**
   * Reject KYC submission
   * @param {string} kycId - KYC submission ID
   * @param {string} adminId - Admin user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<KYCSubmission>} Updated KYC submission
   */
  static async reject(kycId, adminId, reason) {
    return this.update(kycId, {
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejected_reason: reason
    });
  }

  /**
   * Get KYC status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Status information
   */
  static async getStatus(userId) {
    const kyc = await this.findByUserId(userId);
    
    if (!kyc) {
      return {
        exists: false,
        status: null,
        canTrade: false
      };
    }
    
    return {
      exists: true,
      status: kyc.status,
      canTrade: kyc.status === 'approved',
      submittedAt: kyc.created_at,
      reviewedAt: kyc.reviewed_at,
      rejectedReason: kyc.rejected_reason
    };
  }
}

export default KYCSubmission;