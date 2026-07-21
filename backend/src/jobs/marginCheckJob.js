import { supabase } from '../config/supabase.js';
import { createNotification } from '../services/notificationService.js';

export async function runMarginCheck() {
  const { data: fundsRows, error } = await supabase.from('funds').select('user_id, available_balance, blocked_margin');
  if (error) {
    console.error('[marginCheckJob] failed to load funds:', error.message);
    return;
  }

  for (const row of fundsRows) {
    if (row.blocked_margin > row.available_balance) {
      await createNotification(row.user_id, 'Margin shortfall on open positions', 'margin');
    }
  }
}