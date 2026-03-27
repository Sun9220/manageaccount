import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/data';
import { Card } from './ui';
import { formatDateTime } from '../utils/date';

interface DashboardData {
  accountCount: number;
  membershipCount: number;
  active: number;
  expiringSoon: number;
  recentLogs: { id: string; action: string; entityType: string; createdAt: string }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>();
  useEffect(() => {
    getDashboardData().then(setData);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>总账号数：{data?.accountCount ?? 0}</Card>
        <Card>总订阅数：{data?.membershipCount ?? 0}</Card>
        <Card>有效订阅：{data?.active ?? 0}</Card>
        <Card>7天到期：{data?.expiringSoon ?? 0}</Card>
      </div>
      <Card>
        <h3 className="mb-2 font-semibold">最近操作日志</h3>
        <ul className="space-y-1 text-sm text-slate-700">
          {data?.recentLogs.map((log) => (
            <li key={log.id}>[{log.action}] {log.entityType} - {formatDateTime(log.createdAt)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
