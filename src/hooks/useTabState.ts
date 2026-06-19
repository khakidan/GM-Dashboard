import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

export const VALID_TABS = [
  'party',
  'encounters',
  'npc-library',
  'combat',
  'settings'
] as const;

export type Tab = typeof VALID_TABS[number];

export function isTab(value: unknown): value is Tab {
  return typeof value === 'string' && (VALID_TABS as readonly string[]).includes(value);
}

const LAST_TAB_KEY = STORAGE_KEYS.lastActiveTab;

export function useTabState(activeEncounterId: string | null) {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const stored = localStorage.getItem(LAST_TAB_KEY);
    return isTab(stored) ? stored : 'party';
  });

  useEffect(() => {
    if (activeTab === 'combat' && !activeEncounterId) {
      setActiveTab('encounters');
      localStorage.setItem(LAST_TAB_KEY, 'encounters');
    }
  }, [activeTab, activeEncounterId]);

  const handleTabChange = useCallback((tab: Tab) => {
    localStorage.setItem(LAST_TAB_KEY, tab);
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const handleTabChangeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Tab>;
      if (customEvent.detail) {
        handleTabChange(customEvent.detail);
      }
    };
    window.addEventListener('gm-change-tab', handleTabChangeEvent);
    return () => {
      window.removeEventListener('gm-change-tab', handleTabChangeEvent);
    };
  }, [handleTabChange]);

  return {
    activeTab,
    handleTabChange,
  };
}
