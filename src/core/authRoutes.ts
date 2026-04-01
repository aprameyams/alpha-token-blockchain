import express, { Request, Response } from 'express';
import { getAuthDatabase } from './authDatabase';
import { generateToken, authMiddleware, AuthRequest } from './authMiddleware';
import { Crypto } from './crypto';

export const authRouter = express.Router();
const authDb = getAuthDatabase();
const crypto = new Crypto();

/**
 * POST /auth/signup
 * Register a new user account
 */
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      res.status(400).json({ error: 'Email, password, and confirm password required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Create user
    const user = authDb.createUser(email, password);

    // Create first wallet for user
    const keyPair = Crypto.generateKeyPair();
    const address = Crypto.publicKeyToAddress(keyPair.publicKey);
    const wallet = authDb.createUserWallet(
      user.id,
      address,
      keyPair.privateKey,
      keyPair.publicKey,
      'Default Wallet'
    );

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      wallet: {
        id: wallet.id,
        address: wallet.address,
        name: wallet.name,
      },
      token,
      message: 'Account created successfully! Your first wallet has been generated.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

/**
 * POST /auth/login
 * Login user and return JWT token
 */
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = authDb.getUserByEmail(email);
    if (!user || !authDb.verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      token,
      message: 'Login successful!',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/me
 * Get current user info (requires auth)
 */
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = authDb.getUserById(req.user!.userId);
    const wallets = authDb.getUserWallets(req.user!.userId);

    res.json({
      user: {
        id: user?.id,
        email: user?.email,
      },
      wallets,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /auth/logout
 * Logout user (requires auth)
 */
authRouter.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    authDb.revokeUserSessions(req.user!.userId);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /auth/wallet
 * Create a new wallet for authenticated user
 */
authRouter.post('/wallet', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const walletName = name || `Wallet ${Date.now()}`;

    const keyPair = Crypto.generateKeyPair();
    const address = Crypto.publicKeyToAddress(keyPair.publicKey);
    const wallet = authDb.createUserWallet(
      req.user!.userId,
      address,
      keyPair.privateKey,
      keyPair.publicKey,
      walletName
    );

    res.status(201).json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        name: wallet.name,
      },
      message: 'Wallet created successfully',
    });
  } catch (error: any) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

/**
 * GET /auth/wallets
 * Get all wallets for authenticated user
 */
authRouter.get('/wallets', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const wallets = authDb.getUserWallets(req.user!.userId);
    res.json({ wallets });
  } catch (error: any) {
    console.error('Get wallets error:', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
});

/**
 * DELETE /auth/wallet/:walletId
 * Delete a wallet (requires auth)
 */
authRouter.delete('/wallet/:walletId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const walletId = parseInt(req.params.walletId);
    
    if (!walletId) {
      res.status(400).json({ error: 'Invalid wallet ID' });
      return;
    }

    const success = authDb.deleteWallet(req.user!.userId, walletId);
    
    if (!success) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({ success: true, message: 'Wallet deleted' });
  } catch (error: any) {
    console.error('Delete wallet error:', error);
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

/**
 * POST /auth/wallet/:walletId/rename
 * Rename a wallet (requires auth)
 */
authRouter.post('/wallet/:walletId/rename', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const walletId = parseInt(req.params.walletId);
    const { name } = req.body;

    if (!walletId || !name) {
      res.status(400).json({ error: 'Invalid wallet ID or name' });
      return;
    }

    const success = authDb.renameWallet(req.user!.userId, walletId, name);
    
    if (!success) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({ success: true, message: 'Wallet renamed', name });
  } catch (error: any) {
    console.error('Rename wallet error:', error);
    res.status(500).json({ error: 'Failed to rename wallet' });
  }
});
