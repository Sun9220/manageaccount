import { useEffect, useState } from 'react';
import type { Account } from '../types';
import { listAccounts } from '../services/data';
import { Button, Input, Select } from './ui';
import { useUiStore } from '../store/uiStore';

export function AccountList({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const setSelected = useUiStore((s) => s.setSelectedAccountId);

  useEffect(() => {
    listAccounts(search, status).then(setItems);
  }, [search, status, refreshKey]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="搜索邮箱" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">全部状态</option>
          <option value="normal">normal</option>
          <option value="abnormal">abnormal</option>
          <option value="disabled">disabled</option>
        </Select>
      </div>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded border bg-white p-2 text-sm">
            <div>
              <div className="font-medium">{a.email}</div>
              <div className="text-slate-500">{a.status} | 更新于 {new Date(a.updatedAt).toLocaleString()}</div>
            </div>
            <Button onClick={() => setSelected(a.id)}>详情</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
