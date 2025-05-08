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

module.exports = router;