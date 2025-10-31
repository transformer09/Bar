import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { loggerMiddleware } from './middleware/logger';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import purchaseOrderRoutes from './routes/purchaseOrders';
import barRoutes from './routes/bar';
import kitchenRoutes from './routes/kitchen';
import staffRoutes from './routes/staff';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import suppliersRoutes from './routes/suppliers';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(loggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', authMiddleware, suppliersRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/purchase-orders', authMiddleware, purchaseOrderRoutes);
app.use('/api/bar', authMiddleware, barRoutes);
app.use('/api/kitchen', authMiddleware, kitchenRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);

// External POS API webhook (no auth required, but API key validated)
app.post('/api/external/pos/sales', async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey !== process.env.POS_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  // Will be handled by POS integration service
  res.json({ success: true, message: 'POS sales received' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
