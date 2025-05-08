const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customerRoutes = require('./routes/customerRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', customerRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
