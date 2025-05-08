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
module.exports = router;
