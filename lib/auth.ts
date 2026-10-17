import { SignJWT, jwtVerify } from 'jose';
import { Role } from './validators';

export const AUTH_COOKIE_NAME = 'givetrack_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'super-secret-jwt-key-for-givetrack-operations-platform-2024';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  [key: string]: any;
}

/**
 * Sign a new JWT containing user identity and role.
 * Valid for 7 days.
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verify and decode a JWT using jose.
 * Returns null if token is expired, tampered, or invalid.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Cookie options for setting the secure httpOnly auth cookie.
 */
export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
