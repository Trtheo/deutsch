import { render, screen, fireEvent, act } from '@testing-library/react';
import { DialogProvider, useDialog } from '../components/Dialog';

function Harness({ onResult }) {
  const { confirm, alert } = useDialog();
  return (
    <>
      <button onClick={async () => onResult(await confirm({ title: 'Delete this user?', message: 'anna will be deleted.', confirmLabel: 'Delete user' }))}>ask</button>
      <button onClick={async () => { await alert({ title: 'Heads up', confirmLabel: 'Got it' }); onResult('closed'); }}>tell</button>
    </>
  );
}

const setup = () => {
  const onResult = jest.fn();
  render(<DialogProvider><Harness onResult={onResult} /></DialogProvider>);
  return onResult;
};

test('confirm resolves true when the user confirms', async () => {
  const onResult = setup();
  fireEvent.click(screen.getByText('ask'));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete this user?');
  expect(screen.getByText('anna will be deleted.')).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByText('Delete user')));
  expect(onResult).toHaveBeenCalledWith(true);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('Cancel, Escape and clicking outside all resolve false', async () => {
  const onResult = setup();
  fireEvent.click(screen.getByText('ask'));
  await act(async () => fireEvent.click(screen.getByText('Cancel')));
  fireEvent.click(screen.getByText('ask'));
  await act(async () => fireEvent.keyDown(window, { key: 'Escape' }));
  expect(onResult.mock.calls).toEqual([[false], [false]]);
});

test('destructive dialogs focus Cancel first, so Enter cannot delete by accident', () => {
  setup();
  fireEvent.click(screen.getByText('ask'));
  expect(screen.getByText('Cancel')).toHaveFocus();
});

test('alert has a single button', async () => {
  const onResult = setup();
  fireEvent.click(screen.getByText('tell'));
  expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByText('Got it')));
  expect(onResult).toHaveBeenCalledWith('closed');
});
