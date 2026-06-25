import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CampaignSelector } from '../CampaignSelector';
import { Campaign } from '../../hooks/useCampaign';

describe('CampaignSelector Component Tests', () => {
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

  afterEach(() => {
    cleanup();
  });

  it('renders empty state correctly when campaigns list is empty', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Connect Existing Spreadsheet')).toBeInTheDocument();
  });
});
