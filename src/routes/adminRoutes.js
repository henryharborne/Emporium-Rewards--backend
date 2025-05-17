const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../database/supabaseClient');

const router = express.Router();

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(403).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: admin, error } = await supabase
    .from('admin_credentials')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !admin) return res.status(401).json({ error: 'Invalid credentials' });

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { email: admin.email, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// GET /api/admin/is-admin
router.get('/is-admin', verifyToken, (req, res) => {
  res.json({
    isAdmin: true,
    email: req.user.email,
    username: req.user.username
  });
});

// GET /api/admin/logs
router.get('/logs', verifyToken, async (req, res) => {
  console.log('HIT /api/admin/logs route');
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Log fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch logs.' });
  }

  res.json(data);
});

// POST /api/admin/logs/:logID/undo
router.post('/logs/:logId/undo', verifyToken, async (req, res) => {
  const { logId } = req.params;

  const { data: log, error: logError } = await supabase
    .from('admin_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (logError || !log) {
    return res.status(404).json({ error: 'Log not found' });
  }

  const { action_type, customer_id, details } = log;

  if (action_type !== 'modify_points') {
    return res.status(400).json({ error: 'Undo not supported for this action.' });
  }

  const match = details.match(/Adjusted points by (-?\d+)/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid log details format.' });
  }

  const originalAmount = parseInt(match[1]);
  const undoAmount = -originalAmount;

  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('points')
    .eq('id', customer_id)
    .single();

  if (fetchError || !customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  const newPoints = customer.points + undoAmount;

  const { error: updateError } = await supabase
    .from('customers')
    .update({ points: newPoints })
    .eq('id', customer_id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to undo points adjustment.' });
  }

  await supabase.from('admin_logs').insert({
    admin_email: req.user.email,
    action_type: 'undo_modify_points',
    customer_id,
    customer_name: log.customer_name,
    customer_phone: log.customer_phone,
    details: `Undo of points adjustment: reversed ${originalAmount}`,
  });

  res.json({ success: true, message: `Reversed point change of ${originalAmount}` });
});

module.exports = router;
