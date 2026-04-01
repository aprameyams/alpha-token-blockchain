import fs from 'fs';
import path from 'path';
import bcryptjs from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WALLETS_FILE = path.join(DATA_DIR, 'user-wallets.json');

interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

interface UserWallet {
  id: number;
  user_id: number;
  address: string;
  private_key: string;
  public_key: string;
  name: string;
  created_at: string;
}

export class AuthDatabase {
  private users: User[] = [];
  private wallets: UserWallet[] = [];
  private nextUserId: number = 1;
  private nextWalletId: number = 1;

  constructor() {
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): void {
    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      this.users = JSON.parse(data);
      this.nextUserId = Math.max(0, ...this.users.map(u => u.id)) + 1;
    }

    // Load wallets
    if (fs.existsSync(WALLETS_FILE)) {
      const data = fs.readFileSync(WALLETS_FILE, 'utf-8');
      this.wallets = JSON.parse(data);
      this.nextWalletId = Math.max(0, ...this.wallets.map(w => w.id)) + 1;
    }
  }

  private saveUsers(): void {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }

  private saveWallets(): void {
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(this.wallets, null, 2));
  }

  /**
   * Create a new user account
   */
  createUser(email: string, password: string): { id: number; email: string } {
    // Check if user exists
    if (this.users.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    const password_hash = bcryptjs.hashSync(password, 10);
    const user: User = {
      id: this.nextUserId++,
      email,
      password_hash,
      created_at: new Date().toISOString(),
    };

    this.users.push(user);
    this.saveUsers();

    return { id: user.id, email: user.email };
  }

  /**
   * Find user by email
   */
  getUserByEmail(email: string): { id: number; email: string; password_hash: string } | null {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
    };
  }

  /**
   * Find user by ID
   */
  getUserById(id: number): { id: number; email: string } | null {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    return { id: user.id, email: user.email };
  }

  /**
   * Verify user password
   */
  verifyPassword(plainPassword: string, hash: string): boolean {
    return bcryptjs.compareSync(plainPassword, hash);
  }

  /**
   * Create a new wallet for user
   */
  createUserWallet(
    userId: number,
    address: string,
    privateKey: string,
    publicKey: string,
    name: string = 'Wallet'
  ): { id: number; address: string; name: string } {
    const wallet: UserWallet = {
      id: this.nextWalletId++,
      user_id: userId,
      address,
      private_key: privateKey,
      public_key: publicKey,
      name,
      created_at: new Date().toISOString(),
    };

    this.wallets.push(wallet);
    this.saveWallets();

    return {
      id: wallet.id,
      address: wallet.address,
      name: wallet.name,
    };
  }

  /**
   * Get all wallets for a user
   */
  getUserWallets(userId: number): Array<{
    id: number;
    address: string;
    name: string;
    created_at: string;
  }> {
    return this.wallets
      .filter(w => w.user_id === userId)
      .map(w => ({
        id: w.id,
        address: w.address,
        name: w.name,
        created_at: w.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get wallet details including private key (careful!)
   */
  getWalletWithKey(userId: number, walletId: number): {
    id: number;
    address: string;
    private_key: string;
    public_key: string;
    name: string;
  } | null {
    const wallet = this.wallets.find(w => w.id === walletId && w.user_id === userId);
    if (!wallet) return null;
    return {
      id: wallet.id,
      address: wallet.address,
      private_key: wallet.private_key,
      public_key: wallet.public_key,
      name: wallet.name,
    };
  }

  /**
   * Delete a wallet
   */
  deleteWallet(userId: number, walletId: number): boolean {
    const index = this.wallets.findIndex(w => w.id === walletId && w.user_id === userId);
    if (index === -1) return false;

    this.wallets.splice(index, 1);
    this.saveWallets();
    return true;
  }

  /**
   * Rename a wallet
   */
  renameWallet(userId: number, walletId: number, newName: string): boolean {
    const wallet = this.wallets.find(w => w.id === walletId && w.user_id === userId);
    if (!wallet) return false;

    wallet.name = newName;
    this.saveWallets();
    return true;
  }

  /**
   * Revoke all sessions for a user (logout)
   */
  revokeUserSessions(userId: number): void {
    // For JSON-based storage, we don't track sessions
    // In production, you might want to add a sessions list
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    // No-op for JSON-based storage
  }

  close(): void {
    // No-op for file-based storage
  }
}

// Singleton instance
let authDbInstance: AuthDatabase | null = null;

export function getAuthDatabase(): AuthDatabase {
  if (!authDbInstance) {
    authDbInstance = new AuthDatabase();
  }
  return authDbInstance;
}
