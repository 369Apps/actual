import React from 'react';

import { generateAccount } from '@actual-app/core/mocks';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSheetValue } from '#hooks/useSheetValue';
import { TestProviders } from '#mocks';

import { ReconcilingBanner } from './ReconcilingBanner';

vi.mock('#hooks/useSheetValue', () => ({
  useSheetValue: vi.fn(),
}));

describe('ReconcilingBanner', () => {
  beforeEach(() => {
    vi.mocked(useSheetValue).mockReturnValue(5000);
  });

  it('releases focus before locking transactions', async () => {
    const resolveLocking: { current: (() => void) | null } = { current: null };
    const locking = new Promise<void>(resolve => {
      resolveLocking.current = resolve;
    });
    const onDone = vi.fn(() => {
      expect(document.activeElement).toBe(document.body);
      return locking;
    });

    render(
      <TestProviders>
        <ReconcilingBanner
          account={generateAccount('Checking')}
          targetBalance={5000}
          onDone={onDone}
          onCreateTransaction={vi.fn()}
        />
      </TestProviders>,
    );

    const lockButton = screen.getByRole('button', {
      name: 'Lock transactions',
    });
    lockButton.focus();
    expect(document.activeElement).toBe(lockButton);

    await userEvent.click(lockButton);
    expect(onDone).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveLocking.current?.();
      await locking;
    });
  });
});
