import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/database';
import type { Account, DurationTemplate, MembershipStatus, QuickTemplate } from '../types';
import { calcEndAt } from '../utils/date';
import { Button, Input, Select } from './ui';
import { upsertMembership } from '../services/data';

const statuses: MembershipStatus[] = ['active', 'pending', 'expired', 'cancelled'];

export function MembershipForm({ account, onSaved }: { account: Account; onSaved: () => void }) {
  const [error, setError] = useState('');
  const [apps, setApps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [durations, setDurations] = useState<DurationTemplate[]>([]);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [keepSelection, setKeepSelection] = useState(true);
  const [form, setForm] = useState({
    appId: '',
    planTemplateId: '',
    durationTemplateId: '',
    startAt: new Date().toISOString().slice(0, 10),
    endAt: '',
    status: 'active' as MembershipStatus,
    remark: ''
  });

  useEffect(() => {
    Promise.all([db.apps.toArray(), db.quickTemplates.toArray()]).then(([a, q]) => {
      setApps(a);
      setQuickTemplates(q);
    });
  }, []);

  useEffect(() => {
    if (!form.appId) return;
    db.planTemplates.where('appId').equals(form.appId).toArray().then(setPlans);
  }, [form.appId]);

  useEffect(() => {
    if (!form.appId || !form.planTemplateId) return;
    (async () => {
      const mappings = (await db.mappings.toArray()).filter(
        (m) => m.appId === form.appId && m.planTemplateId === form.planTemplateId
      );
      const durationIds = mappings.map((m) => m.durationTemplateId);
      const all = await db.durationTemplates.toArray();
      setDurations(all.filter((d) => durationIds.includes(d.id)).sort((a, b) => a.sortOrder - b.sortOrder));
    })();
  }, [form.appId, form.planTemplateId]);

  const computedEndAt = useMemo(() => {
    const duration = durations.find((d) => d.id === form.durationTemplateId);
    if (!duration || !form.startAt) return '';
    return calcEndAt(new Date(form.startAt).toISOString(), duration)?.slice(0, 10) ?? '';
  }, [form.startAt, form.durationTemplateId, durations]);

  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <h3 className="font-semibold">新增订阅（{account.email}）</h3>
      {error && <div className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {quickTemplates.map((tpl) => (
          <button key={tpl.id} className="rounded border px-2 py-1 text-xs" onClick={() => setForm((s) => ({ ...s, appId: tpl.appId, planTemplateId: tpl.planTemplateId, durationTemplateId: tpl.durationTemplateId }))}>
            {tpl.name}
          </button>
        ))}
      </div>
      <Select value={form.appId} onChange={(e) => setForm((s) => ({ ...s, appId: e.target.value, planTemplateId: '', durationTemplateId: '' }))}>
        <option value="">选择 App</option>
        {apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}
      </Select>
      <Select value={form.planTemplateId} onChange={(e) => setForm((s) => ({ ...s, planTemplateId: e.target.value, durationTemplateId: '' }))}>
        <option value="">选择会员类型</option>
        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <Select value={form.durationTemplateId} onChange={(e) => setForm((s) => ({ ...s, durationTemplateId: e.target.value }))}>
        <option value="">选择时长</option>
        {durations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={form.startAt} onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))} />
        <Input type="date" value={computedEndAt || form.endAt} onChange={(e) => setForm((s) => ({ ...s, endAt: e.target.value }))} />
      </div>
      <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as MembershipStatus }))}>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Input placeholder="备注" value={form.remark} onChange={(e) => setForm((s) => ({ ...s, remark: e.target.value }))} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepSelection} onChange={(e) => setKeepSelection(e.target.checked)} /> 保存并继续时保留常用选择</label>
      <div className="flex gap-2">
        <Button
          onClick={async () => {
            if (!form.appId || !form.planTemplateId || !form.durationTemplateId) {
              setError('请完整选择 App、会员类型和时长');
              return;
            }
            await upsertMembership({
              accountId: account.id,
              appId: form.appId,
              planTemplateId: form.planTemplateId,
              durationTemplateId: form.durationTemplateId,
              startAt: new Date(form.startAt).toISOString(),
              endAt: computedEndAt ? new Date(computedEndAt).toISOString() : undefined,
              status: form.status,
              remark: form.remark
            });
            setError('');
            onSaved();
          }}
        >保存</Button>
        <Button
          onClick={async () => {
            if (!form.appId || !form.planTemplateId || !form.durationTemplateId) {
              setError('请完整选择 App、会员类型和时长');
              return;
            }
            await upsertMembership({
              accountId: account.id,
              appId: form.appId,
              planTemplateId: form.planTemplateId,
              durationTemplateId: form.durationTemplateId,
              startAt: new Date(form.startAt).toISOString(),
              endAt: computedEndAt ? new Date(computedEndAt).toISOString() : undefined,
              status: form.status,
              remark: form.remark
            });
            setError('');
            if (!keepSelection) setForm({ appId: '', planTemplateId: '', durationTemplateId: '', startAt: new Date().toISOString().slice(0, 10), endAt: '', status: 'active', remark: '' });
            onSaved();
          }}
        >保存并继续新增</Button>
      </div>
    </div>
  );
}
