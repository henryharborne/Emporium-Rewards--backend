const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customerRoutes = require('./src/routes/customerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
