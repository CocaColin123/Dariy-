// AES-GCM encryption for diary locking — hardcoded vault password
const VAULT_PASSWORD = '728';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function bufToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const FIXED_SALT = new Uint8Array([0xd7, 0x28, 0xa1, 0x3f, 0x6c, 0x99, 0xe2, 0x44, 0x8b, 0x17, 0x5d, 0x30, 0xfe, 0x81, 0x4a, 0xc2]);

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(VAULT_PASSWORD), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, { name: ALGORITHM, length: KEY_LENGTH }, false, ['encrypt', 'decrypt']);
}

export async function encryptBody(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(FIXED_SALT);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, enc.encode(plaintext));
  const ivHex = bufToHex(iv.buffer);
  const ctHex = bufToHex(ciphertext);
  return `[LOCKED:v2:${ivHex}:${ctHex}]`;
}

export async function decryptBody(encrypted: string, password?: string): Promise<string | null> {
  if (password && password !== VAULT_PASSWORD) return null;
  const m = encrypted.match(/^\[LOCKED:v[12]:(?:[a-f0-9]+:)?([a-f0-9]+):([a-f0-9]+)\]$/);
  if (!m) return null;
  const iv = new Uint8Array(m[1].match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const ct = new Uint8Array(m[2].match(/.{2}/g)!.map(b => parseInt(b, 16)));
  try {
    const key = await deriveKey(FIXED_SALT);
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ct);
    return new TextDecoder().decode(decrypted);
  } catch { return null; }
}

export function isEncryptedBody(body: string): boolean {
  return body.startsWith('[LOCKED:');
}

