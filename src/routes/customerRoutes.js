const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const supabase = require('../database/supabaseClient');
const { lookupCustomer } = require('../controllers/customerController');

router.post('/lookup', lookupCustomer);

// GET /api/customers/search?q=... — Search by name, phone, or email
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

// PUT /api/customers/:id — Edit customer info
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, notes } = req.body;
  
    // Nothing to update
    if (!name && !phone && !email && !notes) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }
  
    // Build update object dynamically
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (notes) updates.notes = notes;
  
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
  
    res.json(data);
  });
  
// PATCH /api/customers/:id/points — Add/subtract points
router.patch('/:id/points', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
  
    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Amount must be a number.' });
    }
  
    // Get current points
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('points')
      .eq('id', id)
      .single();
  
    if (fetchError || !customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
  
    const newPoints = customer.points + amount;
  
    // Update points
    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update({ points: newPoints })
      .eq('id', id)
      .select()
      .single();
  
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update points.' });
    }
  
    res.json(updated);
  });

// DELETE /api/customers/:id — Delete customer
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
  
    res.json({ success: true, message: 'Customer deleted.' });
  });
    

module.exports = router;
