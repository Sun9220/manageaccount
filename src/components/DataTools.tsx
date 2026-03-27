import { useState } from 'react';
import { exportAll, exportBusinessData, exportLogsOnly, importData } from '../services/data';
import { Button, Card, Select } from './ui';

const download = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export function DataTools({ onImported }: { onImported: () => void }) {
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [message, setMessage] = useState('');

  return (
    <Card>
      <h3 className="mb-3 font-semibold">导入 / 导出</h3>
      {message && <div className="mb-2 rounded bg-slate-100 p-2 text-xs text-slate-700">{message}</div>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={async () => download(`all-export-${Date.now()}.json`, await exportAll())}>导出全部数据</Button>
        <Button onClick={async () => download(`business-export-${Date.now()}.json`, await exportBusinessData())}>仅导出账号+订阅</Button>
        <Button onClick={async () => download(`logs-export-${Date.now()}.json`, await exportLogsOnly())}>仅导出日志</Button>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <Select value={mode} onChange={(e) => setMode(e.target.value as 'replace' | 'merge')}>
          <option value="replace">覆盖现有数据（replace）</option>
          <option value="merge">合并数据（merge）</option>
        </Select>
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!window.confirm(`确认执行${mode === 'replace' ? '覆盖' : '合并'}导入？`)) return;
              const text = await file.text();
              const json = JSON.parse(text);
              await importData(json, mode);
              onImported();
              setMessage('导入完成');
            } catch (error) {
              const msg = error instanceof Error ? error.message : '导入失败';
              setMessage(`导入失败：${msg}`);
            }
          }}
        />
      </div>
    </Card>
  );
}
