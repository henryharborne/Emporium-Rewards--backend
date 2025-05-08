const supabase = require('../database/supabaseClient');

exports.lookupCustomer = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const { data, error } = await supabase
  .from('customers')
  .select('name, points, cashable, notes')
  .eq('phone', phone)
  .single();

  if (error || !data) return res.status(404).json({ error: 'Customer not found' });
  return res.json(data);
};