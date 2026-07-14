import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CampaignSelector } from '../CampaignSelector';
import { Campaign } from '../../hooks/useCampaign';

let mockIsGoogleConnected = true;

vi.mock('../../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    isGoogleConnected: mockIsGoogleConnected,
    handleSignIn: vi.fn(),
    clearTokens: vi.fn(),
  }),
}));

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
    mockIsGoogleConnected = true;
  });

  it('renders empty state correctly when campaigns list is empty', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Connect Existing Spreadsheet')).toBeInTheDocument();
  });

  it('renders Google Connection Required screen when not connected', () => {
    mockIsGoogleConnected = false;
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('Google Connection Required')).toBeInTheDocument();
    expect(screen.getByText('Connect with Google')).toBeInTheDocument();
    expect(screen.queryByText('No campaigns yet.')).not.toBeInTheDocument();
  });
});
