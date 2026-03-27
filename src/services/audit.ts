import { db } from '../db/database';
import type { AuditLog, EntityType } from '../types';
import { nowIso } from '../utils/date';
import { buildDiff, redactSensitive } from '../utils/diff';
import { genId } from '../utils/id';

export async function logAction(params: {
  entityType: EntityType;
  entityId: string;
  action: AuditLog['action'];
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}) {
  const beforeData = params.beforeData ? redactSensitive(params.beforeData) : undefined;
  const afterData = params.afterData ? redactSensitive(params.afterData) : undefined;
  const diffData = beforeData && afterData ? buildDiff(beforeData, afterData) : undefined;

  const log: AuditLog = {
    id: genId(),
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    beforeData,
    afterData,
    diffData,
    createdAt: nowIso()
  };
  await db.auditLogs.add(log);
}
