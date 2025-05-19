const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const supabase = require('../database/supabaseClient');
const { lookupCustomer } = require('../controllers/customerController');
const logAdminAction = require('../utils/logAdminAction');
const { Parser } = require('json2csv');

// Customer lookup (public/internal)
router.post('/lookup', lookupCustomer);

// GET /api/customers/search?q=...
router.get('/search', verifyToken, async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required.' });
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  if (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search customers.' });
  }

  res.json(data);
});

// GET /api/customers/export
router.get('/export-customers', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .range(0, 1999);

    if (error) throw error;

    const fields = ['id', 'name', 'email', 'phone', 'points', 'notes'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('customers.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error exporting customer data');
  }
});

// GET /api/customers/:id
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json(customer);
});

// POST /api/customers
router.post('/', verifyToken, async (req, res) => {
  const {
    name = '',
    phone,
    email = '',
    notes = '',
    points = 0
  } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

  // FIXED: safe .or() handling
  const orConditions = [];
  if (email) orConditions.push(`email.eq.${email}`);
  if (phone) orConditions.push(`phone.eq.${phone}`);

  if (orConditions.length === 0) {
    return res.status(400).json({ error: 'Must provide at least email or phone.' });
  }

  const { data: existing, error: lookupError } = await supabase
    .from('customers')
    .select('*')
    .or(orConditions.join(','))
    .maybeSingle();

  if (lookupError) {
    console.error('Customer lookup error:', lookupError);
    return res.status(500).json({ error: 'Failed to check for existing customer.' });
  }

  if (existing) {
    return res.status(409).json({ error: 'Customer with this email or phone already exists.' });
  }

  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert([{
      name,
      phone,
      email,
      notes: notes || '',
      points: typeof points === 'number' ? points : 0,
      cashable: false
    }])
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return res.status(500).json({ error: 'Failed to create customer.' });
  }

  await logAdminAction({
    admin_email: req.user.email,
    action_type: 'create_customer',
    customer_id: newCustomer.id,
    details: `Created customer: ${newCustomer.name}`
  });

  res.status(201).json(newCustomer);
});

// PUT /api/customers/:id
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, notes } = req.body;

  if (!name && !phone && !email && !notes) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update customer.' });
  }

  await logAdminAction({
    admin_email: req.user.email,
    action_type: 'edit_customer',
    customer_id: id,
    details: `Edited fields: ${Object.keys(updates).join(', ')}`
  });

  res.json(data);
});

// PATCH /api/customers/:id/points
router.patch('/:id/points', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount must be a number.' });
  }

  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('points')
    .eq('id', id)
    .single();

  if (fetchError || !customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  const newPoints = customer.points + amount;

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({ points: newPoints })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update points.' });
  }

  await logAdminAction({
    admin_email: req.user.email,
    action_type: 'modify_points',
    customer_id: id,
    details: `Adjusted points by ${amount} (new total: ${newPoints})`
  });

  res.json(updated);
});

// DELETE /api/customers/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete customer.' });
  }

  await logAdminAction({
    admin_email: req.user.email,
    action_type: 'delete_customer',
    customer_id: id,
    details: `Deleted customer ID: ${id}`
  });

  res.json({ success: true, message: 'Customer deleted.' });
});

module.exports = router;
