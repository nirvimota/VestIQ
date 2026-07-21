import  supabase from '../config/supabase.js';

export async function logAction(userId, action, metadata = {}) {
  const { error } = await supabase.from('audit_logs').insert({ user_id: userId, action, metadata });
  if (error) console.error('[auditLogService] failed to log action:', error.message);
}