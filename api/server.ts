import express from 'express';
import dotenv from 'dotenv';
import blockRoutes from './routes/block';
import txRoutes from './routes/transaction';
import statsRoutes from './routes/stats';
import indexRoutes from './routes/indexRoutes'
import addressRoutes from './routes/address';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/block', blockRoutes);
app.use('/tx', txRoutes);
app.use('/stats', statsRoutes);
app.use('/index', indexRoutes);
app.use('/address', addressRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
