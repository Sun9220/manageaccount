import { useEffect, useState } from 'react';
import { AccountDetail } from './components/AccountDetail';
import { AccountFormModal } from './components/AccountFormModal';
import { AccountList } from './components/AccountList';
import { Dashboard } from './components/Dashboard';
import { DataTools } from './components/DataTools';
import { MembershipForm } from './components/MembershipForm';
import { db, seedPresetData } from './db/database';
import { useUiStore } from './store/uiStore';
import { Button } from './components/ui';

function App() {
  const { activeTab, setTab, selectedAccountId } = useUiStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentAccount, setCurrentAccount] = useState<any>();

  useEffect(() => {
    seedPresetData().then(() => setRefreshKey((x) => x + 1));
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    db.accounts.get(selectedAccountId).then(setCurrentAccount);
  }, [selectedAccountId, refreshKey]);

  const refresh = () => setRefreshKey((x) => x + 1);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">本地账号/订阅管理工具</h1>
        <nav className="flex gap-2">
          <Button onClick={() => setTab('dashboard')}>仪表盘</Button>
          <Button onClick={() => setTab('accounts')}>账号管理</Button>
          <Button onClick={() => setTab('data')}>导入导出</Button>
        </nav>
      </header>

      {activeTab === 'dashboard' && <Dashboard />}

      {activeTab === 'accounts' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <AccountFormModal onSaved={refresh} />
            <AccountList refreshKey={refreshKey} onChanged={refresh} />
          </div>
          <div className="lg:col-span-2 space-y-3">
            {selectedAccountId ? <AccountDetail accountId={selectedAccountId} refreshKey={refreshKey} onRefresh={refresh} /> : <div className="rounded border bg-white p-4">请选择账号查看详情。</div>}
            {currentAccount && <MembershipForm account={currentAccount} onSaved={refresh} />}
          </div>
        </div>
      )}

      {activeTab === 'data' && <DataTools onImported={refresh} />}
    </div>
  );
}

export default App;
