import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { Campaign } from '../hooks/useCampaign';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface CampaignSelectorProps {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  onCreateCampaign: (name: string) => Promise<Campaign | null>;
  onConnectCampaign: (name: string, spreadsheetIdOrUrl: string) => Promise<Campaign | null>;
  onOpenCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onClearError: () => void;
}

function formatRelativeDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  } catch (err) {
    return 'unknown date';
  }
}

export function CampaignSelector({
  campaigns,
  isLoading,
  error,
  onCreateCampaign,
  onConnectCampaign,
  onOpenCampaign,
  onDeleteCampaign,
  onClearError,
}: CampaignSelectorProps) {
  const [activeForm, setActiveForm] = useState<'create' | 'connect' | null>(null);
  const [createName, setCreateName] = useState('');
  const [connectName, setConnectName] = useState('');
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('Google User');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { clearTokens } = useGoogleAuth();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const token = localStorage.getItem('GM_GOOGLE_ACCESS_TOKEN');
        if (token) {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              setEmail(data.email);
            }
          }
        }
      } catch (err) {
        // Silent catch fallback
      }
    };
    fetchEmail();
  }, []);

  // When error from parent updates, sync formError
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clearTokens();
    window.location.reload();
  };

  const clearFormState = () => {
    setCreateName('');
    setConnectName('');
    setSpreadsheetInput('');
    setFormError(null);
    onClearError();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setFormError('Campaign name is required.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const camp = await onCreateCampaign(createName.trim());
      if (camp) {
        setActiveForm(null);
        clearFormState();
      }
    } catch (err: any) {
      setFormError(err.message || 'Could not create spreadsheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectName.trim()) {
      setFormError('Campaign name is required.');
      return;
    }
    if (!spreadsheetInput.trim()) {
      setFormError('Spreadsheet ID or URL is required.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const camp = await onConnectCampaign(connectName.trim(), spreadsheetInput.trim());
      if (camp) {
        setActiveForm(null);
        clearFormState();
      } else {
        setFormError('Could not connect. Check that the ID is correct and the sheet is shared with your Google account.');
      }
    } catch (err: any) {
      setFormError('Could not connect. Check that the ID is correct and the sheet is shared with your Google account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="campaign-selector-container"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#ffffff] text-[#0f172a] font-serif select-none"
    >
      <div className="w-full max-w-[640px] flex-1 flex flex-col justify-center py-6">
        {/* Application Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 id="selector-header-title" className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-[#0f172a] flex items-center justify-center gap-3">
            <span role="img" aria-label="dragon" className="text-3xl md:text-4xl text-[#2563eb]">🐉</span>
            GM Encounter Dashboard
          </h1>
          <p id="selector-header-subtitle" className="mt-2 text-sm md:text-base text-[#8d8db9] font-sans">
            Select or create a campaign to get started.
          </p>
        </div>

        {/* Saved Campaigns list */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-8">
          <h3 className="text-xs uppercase tracking-widest font-sans font-bold text-[#8d8db9] mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#2563eb]" />
            Your Campaigns ({campaigns.length})
          </h3>

          <div id="saved-campaigns-list" className="space-y-4">
            {campaigns.length > 0 ? (
              campaigns.map((camp) => (
                <div
                  key={camp.id}
                  id={`campaign-card-${camp.id}`}
                  className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#2563eb]/60 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-[#0f172a] truncate font-serif">
                       {camp.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#8d8db9] font-sans">
                      <span>Last opened: {formatRelativeDate(camp.lastOpenedAt)}</span>
                      <span className="text-[#e2e8f0]">•</span>
                      <a
                        href={camp.spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer referrer"
                        id={`open-sheet-link-${camp.id}`}
                        className="text-[#2563eb] hover:text-[#a09040] flex items-center gap-1 hover:underline cursor-pointer"
                        title="Open external spreadsheet in Google Sheets"
                      >
                        ↗ Open Sheet
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pendingDeleteId === camp.id ? (
                      <div
                        id={`delete-confirm-${camp.id}`}
                        className="flex items-center gap-2 bg-[#fdf2f2] border border-red-200 p-2 rounded-lg text-xs font-sans text-red-700"
                      >
                        <span className="font-bold">Remove '{camp.name}'?</span>
                        <button
                          type="button"
                          id={`confirm-remove-btn-${camp.id}`}
                          onClick={() => {
                            onDeleteCampaign(camp.id);
                            setPendingDeleteId(null);
                          }}
                          className="bg-red-600 text-white font-bold px-2.5 py-1 rounded hover:bg-red-700 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          id={`cancel-remove-btn-${camp.id}`}
                          onClick={() => setPendingDeleteId(null)}
                          className="bg-white border border-stone-300 font-medium px-2.5 py-1 rounded text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`open-campaign-btn-${camp.id}`}
                          onClick={() => onOpenCampaign(camp)}
                          className="px-4 py-2 bg-[#2563eb] hover:bg-[#b0a048] text-white font-sans font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Open <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-campaign-btn-${camp.id}`}
                          onClick={() => {
                            onClearError();
                            setPendingDeleteId(camp.id);
                          }}
                          title="Remove Campaign from Dashboard"
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 text-stone-500 font-sans">
                <p className="font-bold">No campaigns yet.</p>
                <p className="text-sm text-stone-400 mt-1">
                  Create a new one or connect to an existing Google Spreadsheet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Forms / Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <button
              id="expand-create-btn"
              onClick={() => {
                const target = activeForm === 'create' ? null : 'create';
                setActiveForm(target);
                clearFormState();
              }}
              className={`w-full p-3.5 rounded-xl font-sans font-bold flex items-center justify-center gap-2 border text-sm transition-all active:scale-[0.98] cursor-pointer ${
                activeForm === 'create'
                  ? 'bg-[#3f3f37] border-[#3f3f37] text-white'
                  : 'bg-white border-[#e2e8f0] text-[#8d8db9] hover:bg-[#f9f8ff] hover:border-[#2563eb]/50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Create New Campaign
            </button>

            <button
              id="expand-connect-btn"
              onClick={() => {
                const target = activeForm === 'connect' ? null : 'connect';
                setActiveForm(target);
                clearFormState();
              }}
              className={`w-full p-3.5 rounded-xl font-sans font-bold flex items-center justify-center gap-2 border text-sm transition-all active:scale-[0.98] cursor-pointer ${
                activeForm === 'connect'
                  ? 'bg-[#3f3f37] border-[#3f3f37] text-white'
                  : 'bg-white border-[#e2e8f0] text-[#8d8db9] hover:bg-[#f9f8ff] hover:border-[#2563eb]/50'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Connect Existing Spreadsheet
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeForm === 'create' && (
              <motion.form
                id="create-campaign-form"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleCreateSubmit}
                className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <label htmlFor="create-name-input" className="block text-xs font-sans font-bold uppercase tracking-wider text-[#8d8db9]">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    id="create-name-input"
                    disabled={submitting || isLoading}
                    placeholder="e.g. Curse of Strahd"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-2 border.5 border-[#e2e8f0] rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] disabled:opacity-50"
                  />
                </div>

                {formError && (
                  <div id="create-error-msg" className="text-xs font-sans text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 leading-tight">
                    Could not create spreadsheet. {formError}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 font-sans">
                  <button
                    type="button"
                    id="cancel-create-btn"
                    disabled={submitting || isLoading}
                    onClick={() => {
                      setActiveForm(null);
                      clearFormState();
                    }}
                    className="px-4 py-2 border border-stone-300 font-medium text-stone-700 rounded-lg text-sm hover:bg-stone-50 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-create-btn"
                    disabled={submitting || isLoading}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#b0a048] font-bold text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {(submitting || isLoading) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating spreadsheet...
                      </>
                    ) : (
                      'Create Campaign →'
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {activeForm === 'connect' && (
              <motion.form
                id="connect-campaign-form"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleConnectSubmit}
                className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <label htmlFor="connect-name-input" className="block text-xs font-sans font-bold uppercase tracking-wider text-[#8d8db9]">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    id="connect-name-input"
                    disabled={submitting || isLoading}
                    placeholder="e.g. Curse of Strahd"
                    value={connectName}
                    onChange={(e) => setConnectName(e.target.value)}
                    className="w-full px-3 py-2 border.5 border-[#e2e8f0] rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="connect-sheet-input" className="block text-xs font-sans font-bold uppercase tracking-wider text-[#8d8db9]">
                    Spreadsheet ID or URL
                  </label>
                  <input
                    type="text"
                    id="connect-sheet-input"
                    disabled={submitting || isLoading}
                    placeholder="Paste spreadsheet ID or full Google Sheets URL"
                    value={spreadsheetInput}
                    onChange={(e) => setSpreadsheetInput(e.target.value)}
                    className="w-full px-3 py-2 border.5 border-[#e2e8f0] rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] disabled:opacity-50"
                  />
                  <span className="block text-[11px] text-[#8d8db9]/70 font-sans leading-tight mt-1">
                    The ID is the long string in your sheet's URL between /d/ and /edit
                  </span>
                </div>

                {formError && (
                  <div id="connect-error-msg" className="text-xs font-sans text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 leading-tight">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 font-sans">
                  <button
                    type="button"
                    id="cancel-connect-btn"
                    disabled={submitting || isLoading}
                    onClick={() => {
                      setActiveForm(null);
                      clearFormState();
                    }}
                    className="px-4 py-2 border border-stone-300 font-medium text-stone-700 rounded-lg text-sm hover:bg-stone-50 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-connect-btn"
                    disabled={submitting || isLoading}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#b0a048] font-bold text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {(submitting || isLoading) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect →'
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Details */}
      <footer className="text-center text-xs text-[#8d8db9]/60 font-sans pt-6 border-t border-[#e2e8f0]/60 flex flex-col sm:flex-row items-center justify-between gap-2 w-full max-w-[640px] mt-6">
        <div>
          Signed in as: <span className="font-semibold text-[#0f172a]">{email}</span>
        </div>
        <a
          href="#signout"
          id="google-sign-out-link"
          onClick={handleSignOutClick}
          className="text-[#2563eb] hover:text-[#a09040] font-bold hover:underline py-1 px-2.5 rounded hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </a>
      </footer>
    </div>
  );
}
