import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusIndicators } from '../SyncStatusIndicators';

describe('SyncStatusIndicators', () => {
  it('renders sync status correctly', () => {
    render(
      <SyncStatusIndicators
        isSyncing={false}
        isOnline={true}
        queuedWrites={0}
        lastSyncTime={null}
        syncError={null}
      />
    );
    expect(screen.getByText('G')).toBeDefined();
  });
});
