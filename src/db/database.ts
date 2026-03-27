import Dexie, { type Table } from 'dexie';
import type {
  Account,
  AccountMembership,
  AppPlanDurationMapping,
  AppPlatform,
  AuditLog,
  DurationTemplate,
  MembershipPlanTemplate,
  QuickTemplate
} from '../types';
import { genId } from '../utils/id';
import { nowIso } from '../utils/date';

export class LocalManagerDb extends Dexie {
  accounts!: Table<Account, string>;
  apps!: Table<AppPlatform, string>;
  planTemplates!: Table<MembershipPlanTemplate, string>;
  durationTemplates!: Table<DurationTemplate, string>;
  mappings!: Table<AppPlanDurationMapping, string>;
  accountMemberships!: Table<AccountMembership, string>;
  auditLogs!: Table<AuditLog, string>;
  quickTemplates!: Table<QuickTemplate, string>;

  constructor() {
    super('local-account-manager');
    this.version(1).stores({
      accounts: 'id,email,status,updatedAt',
      apps: 'id,slug,name',
      planTemplates: 'id,appId,name',
      durationTemplates: 'id,sortOrder,label',
      mappings: 'id,appId,planTemplateId,durationTemplateId',
      accountMemberships: 'id,accountId,appId,status,endAt,updatedAt',
      auditLogs: 'id,entityType,entityId,action,createdAt',
      quickTemplates: 'id,appId,planTemplateId,durationTemplateId,name'
    });
  }
}

export const db = new LocalManagerDb();

export async function seedPresetData() {
  const appCount = await db.apps.count();
  if (appCount > 0) return;

  const now = nowIso();
  const bumbleId = genId();
  const tinderId = genId();

  const durations: DurationTemplate[] = [
    { id: genId(), label: '1周', value: 1, unit: 'week', sortOrder: 1 },
    { id: genId(), label: '1月', value: 1, unit: 'month', sortOrder: 2 },
    { id: genId(), label: '3个月', value: 3, unit: 'month', sortOrder: 3 },
    { id: genId(), label: '6个月', value: 6, unit: 'month', sortOrder: 4 },
    { id: genId(), label: '终身', value: 0, unit: 'lifetime', sortOrder: 5 }
  ];

  const apps: AppPlatform[] = [
    { id: bumbleId, name: 'Bumble', slug: 'bumble', icon: 'Heart', createdAt: now, updatedAt: now },
    { id: tinderId, name: 'Tinder', slug: 'tinder', icon: 'Flame', createdAt: now, updatedAt: now }
  ];

  const plans: MembershipPlanTemplate[] = [
    { id: genId(), appId: bumbleId, name: 'Premium', createdAt: now, updatedAt: now },
    { id: genId(), appId: bumbleId, name: 'Boost', createdAt: now, updatedAt: now },
    { id: genId(), appId: tinderId, name: 'Plus', createdAt: now, updatedAt: now },
    { id: genId(), appId: tinderId, name: 'Gold', createdAt: now, updatedAt: now },
    { id: genId(), appId: tinderId, name: 'Platinum', createdAt: now, updatedAt: now }
  ];

  const durationByLabel = Object.fromEntries(durations.map((d) => [d.label, d.id]));
  const mappings: AppPlanDurationMapping[] = [];
  const addMappings = (appId: string, planNames: string[], durationLabels: string[]) => {
    planNames.forEach((planName) => {
      const plan = plans.find((p) => p.appId === appId && p.name === planName);
      if (!plan) return;
      durationLabels.forEach((label) => {
        mappings.push({
          id: genId(),
          appId,
          planTemplateId: plan.id,
          durationTemplateId: durationByLabel[label],
          createdAt: now,
          updatedAt: now
        });
      });
    });
  };

  addMappings(bumbleId, ['Premium'], ['1周', '1月', '3个月', '6个月', '终身']);
  addMappings(bumbleId, ['Boost'], ['1周', '1月']);
  addMappings(tinderId, ['Plus', 'Gold', 'Platinum'], ['1周', '1月', '6个月']);

  const quickTemplates: QuickTemplate[] = [
    { id: genId(), appId: bumbleId, planTemplateId: plans.find((p) => p.name === 'Premium')!.id, durationTemplateId: durationByLabel['1月'], name: 'Bumble Premium 1月' },
    { id: genId(), appId: bumbleId, planTemplateId: plans.find((p) => p.name === 'Boost')!.id, durationTemplateId: durationByLabel['1周'], name: 'Bumble Boost 1周' },
    { id: genId(), appId: tinderId, planTemplateId: plans.find((p) => p.name === 'Gold')!.id, durationTemplateId: durationByLabel['1月'], name: 'Tinder Gold 1月' },
    { id: genId(), appId: tinderId, planTemplateId: plans.find((p) => p.name === 'Platinum')!.id, durationTemplateId: durationByLabel['6个月'], name: 'Tinder Platinum 6个月' }
  ];

  await db.transaction('rw', db.apps, db.planTemplates, db.durationTemplates, db.mappings, db.quickTemplates, async () => {
    await db.apps.bulkAdd(apps);
    await db.planTemplates.bulkAdd(plans);
    await db.durationTemplates.bulkAdd(durations);
    await db.mappings.bulkAdd(mappings);
    await db.quickTemplates.bulkAdd(quickTemplates);
  });
}
