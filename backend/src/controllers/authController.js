import crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { redis } from '../config/redis.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_TTL_MS,
} from '../utils/tokenHelper.js';

export async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        type: 'https://api.ips-wealth.com/errors/email-exists',
        title: 'Email Already Registered',
        status: 409,
        detail: 'An institutional account with this email address already exists.',
      });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'RETAIL_USER',
      kycStatus: 'UNVERIFIED',
      walletBalancePaise: 0,
    });

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshTokenString();
    const family = crypto.randomUUID();

    await RefreshToken.create({
      tokenHash: hashToken(rawRefreshToken),
      user: user._id,
      family,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    setAuthCookies(res, accessToken, rawRefreshToken);

    return res.status(201).json({
      status: 'success',
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, totpCode } = req.body;

    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/invalid-credentials',
        title: 'Authentication Failed',
        status: 401,
        detail: 'Invalid institutional email or password provided.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        type: 'https://api.ips-wealth.com/errors/account-suspended',
        title: 'Account Suspended',
        status: 403,
        detail: 'Account has been deactivated. Please contact compliance operations.',
      });
    }

    // Two-Factor Authentication Verification
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(200).json({
          status: '2FA_REQUIRED',
          message: 'Two-factor authentication code required to complete login.',
        });
      }

      const secret = decrypt(user.twoFactorSecret);
      const isValid = authenticator.check(totpCode, secret);
      if (!isValid) {
        return res.status(401).json({
          type: 'https://api.ips-wealth.com/errors/invalid-totp',
          title: 'Invalid 2FA Token',
          status: 401,
          detail: 'The provided 6-digit TOTP code is incorrect or expired.',
        });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshTokenString();
    const family = crypto.randomUUID();

    await RefreshToken.create({
      tokenHash: hashToken(rawRefreshToken),
      user: user._id,
      family,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    setAuthCookies(res, accessToken, rawRefreshToken);

    return res.status(200).json({
      status: 'success',
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    return next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const rawToken = req.cookies?.ips_refresh_token || req.body?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/missing-refresh-token',
        title: 'Missing Refresh Token',
        status: 401,
        detail: 'Refresh token must be present in HttpOnly cookie or request body.',
      });
    }

    const currentHash = hashToken(rawToken);
    const tokenRecord = await RefreshToken.findOne({ tokenHash: currentHash });

    // REUSE DETECTION: If token is revoked, invalidate entire family immediately
    if (tokenRecord && tokenRecord.isRevoked) {
      await RefreshToken.updateMany({ family: tokenRecord.family }, { isRevoked: true });
      clearAuthCookies(res);
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/token-reuse-detected',
        title: 'Security Alert: Token Reuse',
        status: 401,
        detail: 'Revoked refresh token presented. All active sessions in this family terminated.',
      });
    }

    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      clearAuthCookies(res);
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/expired-refresh-token',
        title: 'Refresh Token Expired',
        status: 401,
        detail: 'The refresh token has expired. Please sign in again.',
      });
    }

    const user = await User.findById(tokenRecord.user);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({
        type: 'https://api.ips-wealth.com/errors/user-not-found',
        title: 'Invalid User',
        status: 401,
        detail: 'User account not active.',
      });
    }

    // Rotate: Revoke current token and generate replacement in same family
    const newRawToken = generateRefreshTokenString();
    const newHash = hashToken(newRawToken);

    tokenRecord.isRevoked = true;
    tokenRecord.replacedByTokenHash = newHash;
    await tokenRecord.save();

    await RefreshToken.create({
      tokenHash: newHash,
      user: user._id,
      family: tokenRecord.family,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    const newAccessToken = generateAccessToken(user);
    setAuthCookies(res, newAccessToken, newRawToken);

    return res.status(200).json({
      status: 'success',
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.ips_refresh_token;
    if (rawToken) {
      const currentHash = hashToken(rawToken);
      await RefreshToken.updateOne({ tokenHash: currentHash }, { isRevoked: true });
    }

    const accessToken = req.cookies?.ips_access_token;
    if (accessToken) {
      // Blacklist access token in Redis for remaining 15 minutes
      await redis.set(`bl:access:${accessToken}`, '1', 'EX', 15 * 60);
    }

    clearAuthCookies(res);
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully and session invalidated.',
    });
  } catch (err) {
    return next(err);
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    status: 'success',
    data: { user: req.user.toSafeObject() },
  });
}

export { setup2FA, verify2FA } from './mfaController.js';

