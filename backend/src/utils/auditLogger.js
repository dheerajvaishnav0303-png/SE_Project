import { AuditLog } from '../models/AuditLog.js';
import { logger } from './logger.js';

export async function logAuditEvent({
  req,
  actor,
  category,
  severity = 'INFO',
  action,
  targetEntity = {},
  diffPayload = {},
}) {
  try {
    const actorPayload = actor || {
      userId: req?.user?._id || null,
      email: req?.user?.email || 'system@ips-wealth.com',
      role: req?.user?.role || 'SYSTEM',
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'IPS-Engine',
    };

    const entry = await AuditLog.create({
      actor: actorPayload,
      category,
      severity,
      action,
      targetEntity,
      diffPayload,
    });

    logger.info(
      { auditId: entry._id, action, category, actor: actorPayload.email },
      `[AUDIT] ${action} recorded.`
    );
    return entry;
  } catch (err) {
    logger.error({ err, action }, 'Failed to record immutable audit log entry.');
    return null;
  }
}

