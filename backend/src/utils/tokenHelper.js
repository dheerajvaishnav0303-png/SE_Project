import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Signs a short-lived JSON Web Token for API authentication.
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generates a cryptographically secure random token string for refresh tokens.
 */
export function generateRefreshTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Hashes a refresh token string via SHA-256 for persistent database storage.
 */
export function hashToken(tokenString) {
  return crypto.createHash('sha256').update(tokenString).digest('hex');
}

/**
 * Standard cookie configuration for HttpOnly, Secure, SameSite=Strict cookies.
 */
export function getCookieOptions(maxAgeMs) {
  const isProd = env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const cookieDomain = env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined;

  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeMs,
    domain: cookieDomain,
  };
}

/**
 * Attaches Access and Refresh tokens to response as HttpOnly cookies.
 */
export function setAuthCookies(res, accessToken, refreshTokenString) {
  res.cookie('ips_access_token', accessToken, getCookieOptions(ACCESS_TOKEN_TTL_MS));
  res.cookie('ips_refresh_token', refreshTokenString, getCookieOptions(REFRESH_TOKEN_TTL_MS));
}

/**
 * Clears authentication cookies upon logout or session invalidation.
 */
export function clearAuthCookies(res) {
  res.clearCookie('ips_access_token', getCookieOptions(0));
  res.clearCookie('ips_refresh_token', getCookieOptions(0));
}

