import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EncounterLogModal } from '../EncounterLogModal';
import { useEncounterLogs } from '../hooks/useEncounterLogs';

vi.mock('../hooks/useEncounterLogs', () => ({
  useEncounterLogs: vi.fn(),
}));

describe('EncounterLogModal', () => {
  const mockFetchLogs = vi.fn();
  const mockDeleteLog = vi.fn();
  const defaultProps = {
    encounterId: 'enc-1',
    encounterName: 'Goblin Ambush',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEncounterLogs).mockReturnValue({
      fetchLogsForEncounter: mockFetchLogs.mockResolvedValue([]),
      deleteLog: mockDeleteLog,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => cleanup());

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<EncounterLogModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state while fetching', () => {
    vi.mocked(useEncounterLogs).mockReturnValue({
      fetchLogsForEncounter: mockFetchLogs.mockResolvedValue([]),
      deleteLog: mockDeleteLog,
      isLoading: true,
      error: null,
    });

    render(<EncounterLogModal {...defaultProps} />);
    expect(screen.getByText(/Fetching past logs/i)).toBeInTheDocument();
  });

  it('shows empty state when no logs found', async () => {
    mockFetchLogs.mockResolvedValue([]);
    render(<EncounterLogModal {...defaultProps} />);
    
    expect(await screen.findByText(/No completed encounters logged yet/i)).toBeInTheDocument();
  });

  it('renders a log entry when logs are returned', async () => {
    const mockLog = {
      id: 'log-1',
      encounterId: 'enc-1',
      encounterName: 'Goblin Ambush',
      location: 'Woods',
      date: '2023-01-01T10:00:00Z',
      durationRounds: 5,
      outcome: 'Victory' as const,
      partySnapshot: [],
      events: [],
      transcript: 'transcript',
    };

    mockFetchLogs.mockResolvedValue([mockLog]);

    render(<EncounterLogModal {...defaultProps} />);

    // Check outcome badge (using findAllByText because it appears in summary too)
    const outcomeElements = await screen.findAllByText(/Victory/i);
    expect(outcomeElements.length).toBeGreaterThan(0);
    expect(outcomeElements[0]).toBeInTheDocument();
    // Check date (it might vary by locale, but "2023" should be there)
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', () => {
    render(<EncounterLogModal {...defaultProps} />);
    
    // In DialogShell, the backdrop is a sibling of the dialog container inside a fixed wrapper
    const titleElement = screen.getByText(/Encounter Logs: Goblin Ambush/i);
    const dialogContainer = titleElement.closest('.bg-white');
    const backdropDiv = dialogContainer?.parentElement?.querySelector('.absolute.inset-0');
    
    if (backdropDiv) {
      fireEvent.click(backdropDiv);
    }
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
