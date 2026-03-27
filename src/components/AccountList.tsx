import { useEffect, useState } from 'react';
import type { Account } from '../types';
import { deleteAccount, listAccounts } from '../services/data';
import { Button, Input, Select } from './ui';
import { useUiStore } from '../store/uiStore';
import { db } from '../db/database';

export function AccountList({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [items, setItems] = useState<Account[]>([]);
  const [membershipCount, setMembershipCount] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const setSelected = useUiStore((s) => s.setSelectedAccountId);

  useEffect(() => {
    listAccounts(search, status).then(setItems);
  }, [search, status, refreshKey]);

  useEffect(() => {
    db.accountMemberships.toArray().then((records) => {
      const map: Record<string, number> = {};
      records.forEach((item) => {
        map[item.accountId] = (map[item.accountId] ?? 0) + 1;
      });
      setMembershipCount(map);
    });
  }, [refreshKey]);

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
              <div className="text-slate-500">{a.status} | 当前订阅 {membershipCount[a.id] ?? 0} | 更新于 {new Date(a.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setSelected(a.id)}>详情</Button>
              <Button
                onClick={async () => {
                  if (!window.confirm(`确认删除账号 ${a.email} 吗？会同时删除其订阅记录。`)) return;
                  await deleteAccount(a.id);
                  onChanged();
                }}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
