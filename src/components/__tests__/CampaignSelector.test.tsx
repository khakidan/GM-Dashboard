import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CampaignSelector } from '../CampaignSelector';
import { Campaign } from '../../hooks/useCampaign';

describe('CampaignSelector Component Tests', () => {
  const campaigns: Campaign[] = [
    {
      id: 'camp-1',
      name: 'Curse of Strahd',
      spreadsheetId: 'sheet-strahd',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-strahd/edit',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastOpenedAt: '2026-06-19T00:00:00.000Z',
    },
  ];

  const defaultProps = {
    campaigns: [] as Campaign[],
    isLoading: false,
    error: null as string | null,
    onCreateCampaign: vi.fn(),
    onConnectCampaign: vi.fn(),
    onOpenCampaign: vi.fn(),
    onDeleteCampaign: vi.fn(),
    onClearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders empty state correctly when campaigns list is empty', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Connect Existing Spreadsheet')).toBeInTheDocument();
  });

  it('renders campaigns cards when list contains entries', () => {
    render(<CampaignSelector {...defaultProps} campaigns={campaigns} />);
    expect(screen.getByText('Curse of Strahd')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('↗ Open Sheet')).toBeInTheDocument();
  });

  it('handles campaign open button trigger click', () => {
    render(<CampaignSelector {...defaultProps} campaigns={campaigns} />);
    const openBtn = screen.getByText('Open');
    fireEvent.click(openBtn);
    expect(defaultProps.onOpenCampaign).toHaveBeenCalledWith(campaigns[0]);
  });

  it('switches between Create and Connect forms, collapsing one when opening other', () => {
    render(<CampaignSelector {...defaultProps} />);

    // Click Create New
    const createBtn = screen.getByText('Create New Campaign');
    fireEvent.click(createBtn);
    expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();

    // Click Connect Existing - should collapse Create and open Connect
    const connectBtn = screen.getByText('Connect Existing Spreadsheet');
    fireEvent.click(connectBtn);
    expect(screen.queryByLabelText('Spreadsheet ID or URL')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Curse of Strahd')).toBeInTheDocument();
  });

  it('submits create campaign naming correct parameters', async () => {
    defaultProps.onCreateCampaign.mockResolvedValue({ id: 'new-camp' });
    render(<CampaignSelector {...defaultProps} />);

    // Open create form
    fireEvent.click(screen.getByText('Create New Campaign'));

    const input = screen.getByPlaceholderText('e.g. Curse of Strahd');
    fireEvent.change(input, { target: { value: 'Wildemount' } });

    const submitBtn = screen.getByText('Create Campaign →');
    fireEvent.click(submitBtn);

    expect(defaultProps.onCreateCampaign).toHaveBeenCalledWith('Wildemount');
  });

  it('shows inline deletion confirmation dialog and calls onDeleteCampaign on confirm', () => {
    render(<CampaignSelector {...defaultProps} campaigns={campaigns} />);

    const delBtn = screen.getByTitle('Remove Campaign from Dashboard');
    fireEvent.click(delBtn);

    expect(screen.getByText("Remove 'Curse of Strahd'?")).toBeInTheDocument();
    const confirmRemoveBtn = screen.getByText('Remove');
    fireEvent.click(confirmRemoveBtn);

    expect(defaultProps.onDeleteCampaign).toHaveBeenCalledWith('camp-1');
  });

  it('collapses confirmation dialog on cancel deletion select', () => {
    render(<CampaignSelector {...defaultProps} campaigns={campaigns} />);

    const delBtn = screen.getByTitle('Remove Campaign from Dashboard');
    fireEvent.click(delBtn);

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText("Remove 'Curse of Strahd'?")).toBeNull();
    expect(defaultProps.onDeleteCampaign).not.toHaveBeenCalled();
  });
});
