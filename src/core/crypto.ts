import crypto from 'crypto';

/**
 * Cryptographic utilities for blockchain
 */

export class Crypto {
  /**
   * Generate SHA-256 hash
   */
  static hash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Generate a new key pair
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * Sign a message with private key
   */
  static sign(message: string, privateKey: string): string {
    const sign = crypto.createSign('sha256');
    sign.update(message);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify a signature
   */
  static verify(
    message: string,
    signature: string,
    publicKey: string
  ): boolean {
    const verify = crypto.createVerify('sha256');
    verify.update(message);
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  }

  /**
   * Generate address from public key
   */
  static publicKeyToAddress(publicKey: string): string {
    return this.hash(publicKey).substring(0, 40);
  }

  /**
   * Proof of Work - find a valid nonce
   */
  static findPoW(
    data: any,
    difficulty: number,
    maxIterations: number = 10000000
  ): { nonce: number; hash: string } {
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(difficulty);
    // Exclude hash and nonce from the data being hashed
    const { hash: _, nonce: __, ...blockData } = data;

    while (nonce < maxIterations) {
      hash = this.hash(JSON.stringify({ ...blockData, nonce }));
      if (hash.startsWith(target)) {
        return { nonce, hash };
      }
      nonce++;
    }

    throw new Error('Could not find valid proof of work');
  }

  /**
   * Verify Proof of Work
   */
  static verifyPoW(
    data: any,
    nonce: number,
    hash: string,
    difficulty: number
  ): boolean {
    const target = '0'.repeat(difficulty);
    // Exclude hash and nonce from the data being rehashed
    const { hash: _, nonce: __, ...blockData } = data;
    const calculatedHash = this.hash(JSON.stringify({ ...blockData, nonce }));
    return calculatedHash === hash && hash.startsWith(target);
  }

  /**
   * Generate random ID
   */
  static randomId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate random uint32
   */
  static randomUint32(): number {
    return crypto.randomInt(0, 4294967295);
  }
}
