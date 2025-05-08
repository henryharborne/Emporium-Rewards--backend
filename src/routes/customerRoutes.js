const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const supabase = require('../database/supabaseClient');
const { lookupCustomer } = require('../controllers/customerController');

router.post('/lookup', lookupCustomer);

// GET /api/customers/:id — Protected route
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

// POST /api/customers — Add new customer
router.post('/', verifyToken, async (req, res) => {
  const { name, phone, email, notes, points } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

  const { data: existing, error: lookupError } = await supabase
    .from('customers')
    .select('*')
    .or(`email.eq.${email},phone.eq.${phone}`)
    .maybeSingle();

  if (lookupError) {
    return res.status(500).json({ error: 'Failed to check for existing customer.' });
  }

  if (existing) {
    return res.status(409).json({ error: 'Customer with this email or phone already exists.' });
  }

  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert([
      {
        name,
        phone,
        email,
        notes: notes || '',
        points: typeof points === 'number' ? points : 0,
        cashable: false
      }
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return res.status(500).json({ error: 'Failed to create customer.' });
  }

  res.status(201).json(newCustomer);
});

module.exports = router;
