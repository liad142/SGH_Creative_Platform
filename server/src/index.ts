// Bypass self-signed certificate issues (corporate proxy/VPN)
// This must be set BEFORE any network imports
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main API Router
app.use('/api', router);

app.get('/', (req, res) => {
    res.send('SGH Smart Platform API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
