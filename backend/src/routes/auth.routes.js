import { Router } from 'express';
import {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleRefreshToken,
  handleLogOut,
  handleLogoutAll,
  handleVerifyEmail,
} from '../controllers/auth.controller.js';
import handleMiddleware from '../middlewares/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register', handleRegister);
authRouter.post('/login', handleLogin);
authRouter.post('/verify-email', handleVerifyEmail);
authRouter.get('/me', handleMiddleware,handleGetMe);
authRouter.post('/refresh', handleRefreshToken);
authRouter.post('/logout', handleLogOut);
authRouter.post('/logout-all', handleLogoutAll);

export default authRouter;