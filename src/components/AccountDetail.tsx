import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { db } from '../db/database';
import type { Account, AccountMembership, AuditLog } from '../types';
import { deleteMembership, listMembershipsByAccount } from '../services/data';
import { formatDateTime } from '../utils/date';
import { Button, Card } from './ui';

export function AccountDetail({ accountId, refreshKey, onRefresh }: { accountId: string; refreshKey: number; onRefresh: () => void }) {
  const [account, setAccount] = useState<Account | undefined>();
  const [items, setItems] = useState<AccountMembership[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [durations, setDurations] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      db.accounts.get(accountId),
      listMembershipsByAccount(accountId),
      db.auditLogs.where('entityId').anyOf([accountId]).reverse().sortBy('createdAt'),
      db.apps.toArray(),
      db.planTemplates.toArray(),
      db.durationTemplates.toArray()
    ]).then(([a, m, l, ap, p, d]) => {
      setAccount(a);
      setItems(m.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)));
      setLogs(l.reverse());
      setApps(ap);
      setPlans(p);
      setDurations(d);
    });
  }, [accountId, refreshKey]);

  const mapName = useMemo(() => {
    const appById = Object.fromEntries(apps.map((x) => [x.id, x.name]));
    const planById = Object.fromEntries(plans.map((x) => [x.id, x.name]));
    const durById = Object.fromEntries(durations.map((x) => [x.id, x.label]));
    return { appById, planById, durById };
  }, [apps, plans, durations]);

  if (!account) return <Card>请选择账号。</Card>;

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{account.email}</h3>
            <p className="text-sm text-slate-600">状态：{account.status}，创建：{formatDateTime(account.createdAt)}，更新：{formatDateTime(account.updatedAt)}</p>
            <p className="text-sm text-slate-700">备注：{account.note || '—'}</p>
          </div>
          <button className="text-sm text-slate-700" onClick={() => setShowPwd((s) => !s)}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        <div className="mt-2 text-sm">密码：{showPwd ? account.password : '••••••••'}</div>
      </Card>
      <Card>
        <h4 className="mb-2 font-semibold">订阅记录</h4>
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="rounded border p-2 text-sm">
              <div className="font-medium">{mapName.appById[m.appId]} - {mapName.planById[m.planTemplateId]} - {mapName.durById[m.durationTemplateId]}</div>
              <div className="text-slate-600">状态 {m.status} | 开始 {formatDateTime(m.startAt)} | 到期 {formatDateTime(m.endAt)}</div>
              <div className="flex justify-end"><Button onClick={async () => { await deleteMembership(m.id); onRefresh(); }}>删除</Button></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h4 className="mb-2 font-semibold">账号相关日志</h4>
        <ul className="space-y-1 text-xs text-slate-700">
          {logs.map((log) => (
            <li key={log.id}>{formatDateTime(log.createdAt)} - [{log.action}] {JSON.stringify(log.diffData ?? log.afterData ?? log.beforeData)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
