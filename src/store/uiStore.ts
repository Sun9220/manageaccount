import { create } from 'zustand';

interface UiState {
  selectedAccountId?: string;
  activeTab: 'dashboard' | 'accounts' | 'data';
  setTab: (tab: UiState['activeTab']) => void;
  setSelectedAccountId: (id?: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  setTab: (tab) => set({ activeTab: tab }),
  setSelectedAccountId: (id) => set({ selectedAccountId: id, activeTab: 'accounts' })
}));
