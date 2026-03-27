import { db } from '../db/database';
import type { Account, AccountMembership, MembershipStatus } from '../types';
import { nowIso } from '../utils/date';
import { genId } from '../utils/id';
import { logAction } from './audit';

export async function getDashboardData() {
  const [accountCount, membershipCount, memberships, logs, recentAccounts, recentMemberships] = await Promise.all([
    db.accounts.count(),
    db.accountMemberships.count(),
    db.accountMemberships.toArray(),
    db.auditLogs.orderBy('createdAt').reverse().limit(8).toArray(),
    db.accounts.orderBy('createdAt').reverse().limit(5).toArray(),
    db.accountMemberships.orderBy('createdAt').reverse().limit(5).toArray()
  ]);
  const now = new Date();
  const active = memberships.filter((m) => m.status === 'active').length;
  const expiringSoon = memberships.filter((m) => m.endAt && new Date(m.endAt) > now && new Date(m.endAt).getTime() - now.getTime() < 7 * 24 * 3600 * 1000).length;
  return { accountCount, membershipCount, active, expiringSoon, recentLogs: logs, recentAccounts, recentMemberships };
}

export async function listAccounts(search = '', status = 'all') {
  let data = await db.accounts.orderBy('updatedAt').reverse().toArray();
  if (search) data = data.filter((a) => a.email.toLowerCase().includes(search.toLowerCase()));
  if (status !== 'all') data = data.filter((a) => a.status === status);
  return data;
}

export async function upsertAccount(input: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = nowIso();
  if (input.id) {
    const before = await db.accounts.get(input.id);
    if (!before) throw new Error('Account not found');
    const next: Account = { ...before, ...input, updatedAt: now };
    await db.accounts.put(next);
    await logAction({ entityType: 'account', entityId: next.id, action: 'update', beforeData: before as unknown as Record<string, unknown>, afterData: next as unknown as Record<string, unknown> });
    return next;
  }
  const account: Account = { id: genId(), ...input, createdAt: now, updatedAt: now };
  await db.accounts.add(account);
  await logAction({ entityType: 'account', entityId: account.id, action: 'create', afterData: account as unknown as Record<string, unknown> });
  return account;
}

export async function deleteAccount(accountId: string) {
  const account = await db.accounts.get(accountId);
  if (!account) return;
  const memberships = await db.accountMemberships.where('accountId').equals(accountId).toArray();
  await db.transaction('rw', [db.accounts, db.accountMemberships], async () => {
    await db.accounts.delete(accountId);
    if (memberships.length) {
      await db.accountMemberships.bulkDelete(memberships.map((item) => item.id));
    }
  });
  await logAction({ entityType: 'account', entityId: accountId, action: 'delete', beforeData: account as unknown as Record<string, unknown> });
  await Promise.all(
    memberships.map((membership) =>
      logAction({
        entityType: 'accountMembership',
        entityId: membership.id,
        action: 'delete',
        beforeData: membership as unknown as Record<string, unknown>
      })
    )
  );
}

export async function listMembershipsByAccount(accountId: string) {
  return db.accountMemberships.where('accountId').equals(accountId).reverse().sortBy('updatedAt');
}

export async function upsertMembership(input: Omit<AccountMembership, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = nowIso();
  if (input.id) {
    const before = await db.accountMemberships.get(input.id);
    if (!before) throw new Error('Membership not found');
    const next: AccountMembership = { ...before, ...input, updatedAt: now };
    await db.accountMemberships.put(next);
    await logAction({ entityType: 'accountMembership', entityId: next.id, action: 'update', beforeData: before as unknown as Record<string, unknown>, afterData: next as unknown as Record<string, unknown> });
    return next;
  }
  const membership: AccountMembership = { id: genId(), ...input, createdAt: now, updatedAt: now };
  await db.accountMemberships.add(membership);
  await logAction({ entityType: 'accountMembership', entityId: membership.id, action: 'create', afterData: membership as unknown as Record<string, unknown> });
  return membership;
}

export async function deleteMembership(id: string) {
  const before = await db.accountMemberships.get(id);
  if (!before) return;
  await db.accountMemberships.delete(id);
  await logAction({ entityType: 'accountMembership', entityId: id, action: 'delete', beforeData: before as unknown as Record<string, unknown> });
}

export async function exportAll() {
  const data = {
    accounts: await db.accounts.toArray(),
    apps: await db.apps.toArray(),
    membershipPlanTemplates: await db.planTemplates.toArray(),
    durationTemplates: await db.durationTemplates.toArray(),
    mappings: await db.mappings.toArray(),
    accountMemberships: await db.accountMemberships.toArray(),
    auditLogs: await db.auditLogs.toArray(),
    quickTemplates: await db.quickTemplates.toArray(),
    exportedAt: nowIso()
  };
  await logAction({ entityType: 'system', entityId: 'local', action: 'export', afterData: { itemCount: Object.values(data).length } });
  return data;
}

export async function exportBusinessData() {
  return {
    accounts: await db.accounts.toArray(),
    accountMemberships: await db.accountMemberships.toArray(),
    exportedAt: nowIso()
  };
}

export async function exportLogsOnly() {
  return { auditLogs: await db.auditLogs.toArray(), exportedAt: nowIso() };
}

export async function importData(payload: any, mode: 'replace' | 'merge') {
  if (!payload || typeof payload !== 'object') throw new Error('导入文件格式无效');

  await db.transaction(
    'rw',
    [db.accounts, db.apps, db.planTemplates, db.durationTemplates, db.mappings, db.accountMemberships, db.auditLogs, db.quickTemplates],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.accounts.clear(), db.apps.clear(), db.planTemplates.clear(), db.durationTemplates.clear(), db.mappings.clear(), db.accountMemberships.clear(), db.auditLogs.clear(), db.quickTemplates.clear()
        ]);
      }
      if (payload.accounts?.length) await db.accounts.bulkPut(payload.accounts);
      if (payload.apps?.length) await db.apps.bulkPut(payload.apps);
      if (payload.membershipPlanTemplates?.length) await db.planTemplates.bulkPut(payload.membershipPlanTemplates);
      if (payload.durationTemplates?.length) await db.durationTemplates.bulkPut(payload.durationTemplates);
      if (payload.mappings?.length) await db.mappings.bulkPut(payload.mappings);
      if (payload.accountMemberships?.length) await db.accountMemberships.bulkPut(payload.accountMemberships);
      if (payload.auditLogs?.length && mode === 'merge') await db.auditLogs.bulkPut(payload.auditLogs);
      if (payload.quickTemplates?.length) await db.quickTemplates.bulkPut(payload.quickTemplates);
      await logAction({ entityType: 'system', entityId: 'local', action: 'import', afterData: { mode, keys: Object.keys(payload) } });
    }
  );
}

export async function getAccountRelatedLogs(accountId: string) {
  const memberships = await db.accountMemberships.where('accountId').equals(accountId).toArray();
  const ids = [accountId, ...memberships.map((item) => item.id)];
  const logs = await db.auditLogs.where('entityId').anyOf(ids).toArray();
  return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setMembershipStatus(id: string, status: MembershipStatus) {
  const item = await db.accountMemberships.get(id);
  if (!item) return;
  await upsertMembership({ ...item, id, status });
}
