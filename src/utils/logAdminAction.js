const supabase = require('../database/supabaseClient');

async function logAdminAction({ admin_email, action_type, customer_id, details }) {
  console.log('Logging admin action:', {
    admin_email,
    action_type,
    customer_id,
    details
  });
  const { error } = await supabase
    .from('admin_logs')
    .insert([
      {
        admin_email,
        action_type,
        customer_id,
        details
      }
    ]);

  if (error) {
    console.error('Failed to log admin action:', error);
  }
}

module.exports = logAdminAction;
