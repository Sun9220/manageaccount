import { useState } from 'react';
import type { Account, AccountStatus } from '../types';
import { upsertAccount } from '../services/data';
import { Button, Input, Select } from './ui';

const statuses: AccountStatus[] = ['normal', 'abnormal', 'disabled'];

export function AccountFormModal({
  onSaved,
  editing
}: {
  onSaved: () => void;
  editing?: Account;
}) {
  const [form, setForm] = useState({
    email: editing?.email ?? '',
    password: editing?.password ?? '',
    status: editing?.status ?? ('normal' as AccountStatus),
    note: editing?.note ?? ''
  });

  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <h3 className="font-semibold">{editing ? '编辑账号' : '新增账号'}</h3>
      <Input placeholder="邮箱" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
      <Input placeholder="密码" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
      <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as AccountStatus }))}>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Input placeholder="备注" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
      <Button
        onClick={async () => {
          await upsertAccount({ ...form, id: editing?.id });
          setForm({ email: '', password: '', status: 'normal', note: '' });
          onSaved();
        }}
      >
        保存账号
      </Button>
    </div>
  );
}
