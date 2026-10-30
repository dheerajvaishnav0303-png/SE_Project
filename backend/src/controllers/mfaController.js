import crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { User } from '../models/User.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { redis } from '../config/redis.js';

export async function setup2FA(req, res, next) {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'IPS Wealth Management', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    // Save pending secret in Redis for 10 minutes awaiting verification
    await redis.set(`2fa:pending:${req.user._id}`, secret, 'EX', 600);

    return res.status(200).json({
      status: 'success',
      data: {
        secret,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function verify2FA(req, res, next) {
  try {
    const totpCode = req.body.totpCode || req.body.token;
    const userId = req.user._id.toString();

    // Case 1: Enabling 2FA for the first time
    if (!req.user.twoFactorEnabled) {
      const pendingSecret = await redis.get(`2fa:pending:${userId}`);
      if (!pendingSecret) {
        return res.status(400).json({
          type: 'https://api.ips-wealth.com/errors/2fa-setup-expired',
          title: '2FA Setup Expired',
          status: 400,
          detail: 'No pending 2FA setup found or session expired. Please re-initiate setup.',
        });
      }

      const isValid = authenticator.check(totpCode, pendingSecret);
      if (!isValid) {
        return res.status(400).json({
          type: 'https://api.ips-wealth.com/errors/invalid-totp',
          title: 'Verification Failed',
          status: 400,
          detail: 'Invalid 6-digit TOTP code provided.',
        });
      }

      req.user.twoFactorEnabled = true;
      req.user.twoFactorSecret = encrypt(pendingSecret);
      await req.user.save();
      await redis.del(`2fa:pending:${userId}`);

      return res.status(200).json({
        status: 'success',
        message: 'Two-factor authentication successfully activated.',
      });
    }

    // Case 2: Step-up authentication for already-enabled 2FA
    const userWithSecret = await User.findById(userId).select('+twoFactorSecret');
    const secret = decrypt(userWithSecret.twoFactorSecret);
    const isValid = authenticator.check(totpCode, secret);

    if (!isValid) {
      return res.status(400).json({
        type: 'https://api.ips-wealth.com/errors/invalid-totp',
        title: 'Verification Failed',
        status: 400,
        detail: 'Invalid 6-digit TOTP code provided.',
      });
    }

    // Issue a 5-minute step-up MFA session token
    const mfaToken = crypto.randomUUID();
    await redis.set(`mfa:session:${userId}:${mfaToken}`, '1', 'EX', 300);

    return res.status(200).json({
      status: 'success',
      data: { mfaToken },
      message: 'MFA step-up verified. Token valid for 5 minutes.',
    });
  } catch (err) {
    return next(err);
  }
}

