const express = require('express');
const router = express.Router();
const { lookupCustomer } = require('../controllers/customerController');

router.post('/lookup', lookupCustomer);
module.exports = router;