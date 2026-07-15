import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import { requestAccessToken } from '../services/googleAuth';
import { fetchSheetData, setSpreadsheetId } from '../services/sheetsService';
import { generateUuid } from '../lib/uuid';

export interface Campaign {
  id: string;           // uuid v4
  name: string;         // "Curse of Strahd"
  spreadsheetId: string;
  spreadsheetUrl: string;
  createdAt: string;    // ISO date string
  lastOpenedAt: string; // ISO date string
}

const uuid = () => generateUuid();

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

function saveCampaigns(campaigns: Campaign[]): void {
  localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(campaigns));
}

function loadCampaigns(): Campaign[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.campaigns);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as Campaign[];
    }
  } catch (err) {
    console.error('[useCampaign] Error parsing campaigns from localStorage:', err);
  }
  return [];
}

function getActiveCampaignFromUrl(): Campaign | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const campaignId = url.searchParams.get('campaign');
  if (!campaignId) return null;
  const list = loadCampaigns();
  return list.find(c => c.id === campaignId) || null;
}

export function useCampaign() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(getActiveCampaignFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync on initial mount in case the URL has a campaign parameter
    // but the local storage hasn't caught up, e.g., if a bookmark was opened.
    const initialActive = getActiveCampaignFromUrl();
    if (initialActive) {
      localStorage.setItem(STORAGE_KEYS.activeCampaignId, initialActive.id);
      localStorage.setItem(STORAGE_KEYS.activeCampaignSpreadsheetId, initialActive.spreadsheetId);
      setSpreadsheetId(initialActive.spreadsheetId);
    }

    const handlePopState = () => {
      const active = getActiveCampaignFromUrl();
      setActiveCampaign(active);
      if (active) {
        localStorage.setItem(STORAGE_KEYS.activeCampaignId, active.id);
        localStorage.setItem(STORAGE_KEYS.activeCampaignSpreadsheetId, active.spreadsheetId);
        setSpreadsheetId(active.spreadsheetId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.activeCampaignId);
        localStorage.removeItem(STORAGE_KEYS.activeCampaignSpreadsheetId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openCampaign = (campaign: Campaign): void => {
    const updatedList = loadCampaigns().map(c => {
      if (c.id === campaign.id) {
        return { ...c, lastOpenedAt: new Date().toISOString() };
      }
      return c;
    });
    setCampaigns(updatedList);
    saveCampaigns(updatedList);

    localStorage.setItem(STORAGE_KEYS.activeCampaignId, campaign.id);
    localStorage.setItem(STORAGE_KEYS.activeCampaignSpreadsheetId, campaign.spreadsheetId);
    setSpreadsheetId(campaign.spreadsheetId);

    // Update URL parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('campaign', campaign.id);
    window.history.pushState(null, '', url.pathname + url.search + url.hash);

    const updatedCampaign = updatedList.find(c => c.id === campaign.id) || campaign;
    setActiveCampaign(updatedCampaign);
  };

  const createCampaign = async (name: string): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await requestAccessToken();
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: name })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = errorData.message || 'Failed to create campaign spreadsheet';
        if (errorData.spreadsheetUrl) {
          errorMessage += `\nSpreadsheet URL: ${errorData.spreadsheetUrl}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const newCampaign: Campaign = {
        id: uuid(),
        name,
        spreadsheetId: data.spreadsheetId,
        spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString()
      };

      const updated = [...loadCampaigns(), newCampaign];
      setCampaigns(updated);
      saveCampaigns(updated);
      openCampaign(newCampaign);
      return newCampaign;
    } catch (err: any) {
      console.error('[useCampaign] createCampaign failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown creation error';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const connectCampaign = async (
    name: string,
    spreadsheetIdOrUrl: string
  ): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
      if (!spreadsheetId) {
        throw new Error('Invalid spreadsheet ID or URL');
      }

      // Validate by attempting to fetch Characters!A1
      await fetchSheetData(spreadsheetId, 'Characters!A1');

      const newCampaign: Campaign = {
        id: uuid(),
        name,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString()
      };

      const updated = [...loadCampaigns(), newCampaign];
      setCampaigns(updated);
      saveCampaigns(updated);
      openCampaign(newCampaign);
      return newCampaign;
    } catch (err: any) {
      console.error('[useCampaign] connectCampaign failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown connection error';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCampaign = (campaignId: string): void => {
    if (activeCampaign && activeCampaign.id === campaignId) {
      setError('Cannot delete the currently active campaign.');
      return;
    }
    const updated = loadCampaigns().filter(c => c.id !== campaignId);
    setCampaigns(updated);
    saveCampaigns(updated);
  };

  const closeCampaign = (): void => {
    localStorage.removeItem(STORAGE_KEYS.activeCampaignId);
    localStorage.removeItem(STORAGE_KEYS.activeCampaignSpreadsheetId);

    const url = new URL(window.location.href);
    url.searchParams.delete('campaign');
    window.history.pushState(null, '', url.pathname + url.search + url.hash);

    setActiveCampaign(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    campaigns,
    activeCampaign,
    isLoading,
    error,
    createCampaign,
    connectCampaign,
    openCampaign,
    deleteCampaign,
    closeCampaign,
    clearError,
  };
}
