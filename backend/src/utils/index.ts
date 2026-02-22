import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash, randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

export async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  
  try {
    const content = await readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2));
}

export async function readJSONL<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  
  try {
    const content = await readFile(filepath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    return lines.map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function appendJSONL<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  const line = JSON.stringify(data) + '\n';
  await appendFile(filepath, line);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return hash === verifyHash;
}

const JWT_SECRET = process.env.JWT_SECRET || 'shipshooter-secret-key-change-in-production';

export function generateToken(userId: string): string {
  const payload = JSON.stringify({ userId, iat: Date.now() });
  const signature = createHash('sha256')
    .update(payload + JWT_SECRET)
    .digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64');
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [payload, signature] = decoded.split('.');
    
    if (!payload || !signature) return null;
    
    const expectedSignature = createHash('sha256')
      .update(payload + JWT_SECRET)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    const data = JSON.parse(payload);
    
    if (data.iat && Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return data.userId;
  } catch {
    return null;
  }
}
