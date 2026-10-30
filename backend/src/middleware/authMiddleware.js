import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { redis } from '../config/redis.js';

/**
 * Core Authentication Guard:
 * Reads access token from HttpOnly cookie 'ips_access_token' or Authorization Bearer header.
 */
export async function protect(req, res, next) {
  let token = null;

  // 1. Primary: HttpOnly cookie
  if (req.cookies && req.cookies.ips_access_token) {
    token = req.cookies.ips_access_token;
  }
  // 2. Secondary fallback: Bearer token header for programmatic clients
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      type: 'https://api.ips-wealth.com/errors/unauthenticated',
      title: 'Authentication Required',
      status: 401,
      detail: 'Missing access token in HttpOnly cookie or Authorization header.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Check if token was explicitly revoked / blacklisted
    const isBlacklisted = await redis.get(`bl:access:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/token-revoked',
        title: 'Token Revoked',
        status: 401,
        detail: 'The access token presented has been explicitly revoked.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/user-deactivated',
        title: 'Account Inactive',
        status: 401,
        detail: 'User account associated with this token does not exist or has been deactivated.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    req.user = user;
    req.tokenPayload = decoded;
    return next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      type: isExpired
        ? 'https://api.ips-wealth.com/errors/token-expired'
        : 'https://api.ips-wealth.com/errors/invalid-token',
      title: isExpired ? 'Access Token Expired' : 'Invalid Access Token',
      status: 401,
      detail: isExpired
        ? 'Access token has expired. Please refresh the session using your refresh token.'
        : 'Access token failed cryptographic signature verification.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Role-Based Access Control: Restricts access to administrative roles.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      type: 'https://api.ips-wealth.com/errors/unauthenticated',
      title: 'Authentication Required',
      status: 401,
      detail: 'Authentication session required prior to authorization check.',
    });
  }

  const privilegedRoles = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'];
  if (!privilegedRoles.includes(req.user.role)) {
    return res.status(403).json({
      type: 'https://api.ips-wealth.com/errors/insufficient-privilege',
      title: 'Forbidden Access',
      status: 403,
      detail: 'Access restricted to authorized administrative compliance personnel.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

/**
 * KYC Verification Guard: Restricts financial execution to verified accounts.
 */
export function requireKycVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      type: 'https://api.ips-wealth.com/errors/unauthenticated',
      title: 'Authentication Required',
      status: 401,
      detail: 'Authentication session required.',
    });
  }

  if (req.user.kycStatus !== 'VERIFIED') {
    return res.status(403).json({
      type: 'https://api.ips-wealth.com/errors/kyc-unverified',
      title: 'KYC Verification Required',
      status: 403,
      detail: 'Account must complete Penny-Drop bank verification and KYC review before executing financial transactions.',
      instance: req.originalUrl,
      kycStatus: req.user.kycStatus,
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

/**
 * Step-Up 2FA Guard: Enforces 2FA verification for high-risk mutations.
 */
export async function require2FA(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      type: 'https://api.ips-wealth.com/errors/unauthenticated',
      title: 'Authentication Required',
      status: 401,
      detail: 'Authentication session required.',
    });
  }

  // If user does not have 2FA enabled, allow or prompt to enable based on policy
  if (!req.user.twoFactorEnabled) {
    return next();
  }

  const mfaToken = req.headers['x-mfa-token'];

  if (!mfaToken) {
    return res.status(403).json({
      type: 'https://api.ips-wealth.com/errors/mfa-step-up-required',
      title: 'MFA Step-Up Verification Required',
      status: 403,
      detail: 'This sensitive mutation requires an active X-MFA-Token from TOTP verification.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate the MFA token from Redis (issued upon successful TOTP verification with 5m TTL)
  const isValidMfaSession = await redis.get(`mfa:session:${req.user._id}:${mfaToken}`);
  if (!isValidMfaSession) {
    return res.status(403).json({
      type: 'https://api.ips-wealth.com/errors/mfa-token-invalid',
      title: 'Invalid or Expired MFA Token',
      status: 403,
      detail: 'The provided X-MFA-Token has expired or is invalid. Please re-authenticate TOTP.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

