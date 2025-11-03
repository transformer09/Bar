import { Router } from 'express';
import { authService } from '../services/authService';
import { SignupSchema, LoginSchema, RefreshTokenSchema } from '../utils/validators';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// POST /api/auth/signup - Register new user (manager only)
router.post('/signup', requireRole('manager'), async (req, res, next) => {
  try {
    const input = SignupSchema.parse(req.body);
    const result = await authService.signup(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Email + password login
router.post('/login', async (req, res, next) => {
  try {
    const input = LoginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = RefreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(refresh_token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Clear session
router.post('/logout', authMiddleware, (req, res) => {
  // In JWT-based auth, logout is typically handled client-side
  // Just return a success response
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
