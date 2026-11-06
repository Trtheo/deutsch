import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast, TOAST_DURATION } from '../components/Toast';

function Buttons() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Profile updated successfully!')}>ok</button>
      <button onClick={() => toast.error('Failed to save profile.')}>fail</button>
    </>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = () => render(<ToastProvider><Buttons /></ToastProvider>);

test('toasts last 4 seconds', () => {
  expect(TOAST_DURATION).toBe(4000);
  setup();
  fireEvent.click(screen.getByText('ok'));
  expect(screen.getByRole('status')).toHaveTextContent('Profile updated successfully!');

  act(() => vi.advanceTimersByTime(3900));
  expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(200));
  expect(screen.queryByText('Profile updated successfully!')).not.toBeInTheDocument();
});

test('errors are announced as alerts', () => {
  setup();
  fireEvent.click(screen.getByText('fail'));
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to save profile.');
});

test('hovering pauses the timer so the message can be read', () => {
  setup();
  fireEvent.click(screen.getByText('fail'));
  const toast = screen.getByRole('alert');
  act(() => vi.advanceTimersByTime(3000));
  fireEvent.mouseEnter(toast);
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.mouseLeave(toast);
  act(() => vi.advanceTimersByTime(1100)); // the remaining ~1 s
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('the close button dismisses at once', () => {
  setup();
  fireEvent.click(screen.getByText('ok'));
  fireEvent.click(screen.getByLabelText('Dismiss notification'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('several toasts stack, and the same message is not shown twice', () => {
  setup();
  fireEvent.click(screen.getByText('ok'));
  fireEvent.click(screen.getByText('ok'));
  fireEvent.click(screen.getByText('fail'));
  expect(screen.getAllByText('Profile updated successfully!')).toHaveLength(1);
  expect(screen.getByText('Failed to save profile.')).toBeInTheDocument();
});
