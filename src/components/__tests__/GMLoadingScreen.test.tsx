import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GMLoadingScreen } from '../GMLoadingScreen';

describe('GMLoadingScreen', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "Loading from Google Sheets..." when isAuthenticated is true', () => {
    render(
      <GMLoadingScreen
        isAuthenticated={true}
        campaignName="My Epic Campaign"
        isSyncing={true}
        onSignIn={vi.fn()}
      />
    );

    expect(screen.getByText('My Epic Campaign')).toBeDefined();
    expect(screen.getByText('Loading from Google Sheets...')).toBeDefined();
    expect(screen.queryByText('Sign In With Google')).toBeNull();
  });

  it('renders the sign-in button when isAuthenticated is false', () => {
    const handleSignIn = vi.fn();
    render(
      <GMLoadingScreen
        isAuthenticated={false}
        campaignName="My Epic Campaign"
        isSyncing={false}
        onSignIn={handleSignIn}
      />
    );

    expect(screen.getByText('My Epic Campaign')).toBeDefined();
    expect(screen.queryByText('Loading from Google Sheets...')).toBeNull();
    
    const signInButton = screen.getByText('Sign In With Google');
    expect(signInButton).toBeDefined();

    fireEvent.click(signInButton);
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it('does not render tab navigation', () => {
    render(
      <GMLoadingScreen
        isAuthenticated={false}
        campaignName="My Epic Campaign"
        isSyncing={false}
        onSignIn={vi.fn()}
      />
    );

    expect(screen.queryByText('Party Roster')).toBeNull();
    expect(screen.queryByText('NPC Library')).toBeNull();
    expect(screen.queryByText('Encounters')).toBeNull();
  });
});
