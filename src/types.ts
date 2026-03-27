export type AccountStatus = 'normal' | 'abnormal' | 'disabled';
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type EntityType =
  | 'account'
  | 'app'
  | 'planTemplate'
  | 'durationTemplate'
  | 'mapping'
  | 'accountMembership'
  | 'system';

export interface Account {
  id: string;
  email: string;
  password: string;
  note?: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppPlatform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanTemplate {
  id: string;
  appId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DurationTemplate {
  id: string;
  label: string;
  value: number;
  unit: 'week' | 'month' | 'year' | 'lifetime';
  sortOrder: number;
}

export interface AppPlanDurationMapping {
  id: string;
  appId: string;
  planTemplateId: string;
  durationTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountMembership {
  id: string;
  accountId: string;
  appId: string;
  planTemplateId: string;
  durationTemplateId: string;
  startAt: string;
  endAt?: string;
  status: MembershipStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  diffData?: Record<string, unknown>;
  createdAt: string;
}

export interface QuickTemplate {
  id: string;
  appId: string;
  planTemplateId: string;
  durationTemplateId: string;
  name: string;
}
