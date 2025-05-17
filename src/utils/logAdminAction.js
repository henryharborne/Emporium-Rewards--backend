const supabase = require('../database/supabaseClient');

async function logAdminAction({ admin_email, action_type, customer_id, details }) {
  let customerName = null;
  let customerPhone = null;

  if (customer_id) {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('name, phone')
      .eq('id', customer_id)
      .single();

    if (!error && customer) {
      customerName = customer.name;
      customerPhone = customer.phone;
    }
  }

  const { error: insertError } = await supabase.from('admin_logs').insert({
    admin_email,
    action_type,
    customer_id,
    customer_name: customerName,
    customer_phone: customerPhone,
    details,
  });

  if (insertError) {
    console.error('Logging failed:', insertError);
  }
}

module.exports = logAdminAction;
