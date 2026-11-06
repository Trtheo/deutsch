import { render, screen, fireEvent, act } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = {};
  for (const key of Object.keys(actual)) mocked[key] = typeof actual[key] === 'function' ? vi.fn() : actual[key];
  return { __esModule: true, ...mocked, default: actual.default };
});

const student = { id: 's1', username: 'anna', email: 'anna@example.com', level: 'A1', role: 'user' };
const question = { type: 'fill', question: 'Ich kaufe ___ Apfel.', questionEn: 'I buy an apple.', options: ['einen', 'ein', 'eine', 'einem'] };
const started = { _id: 'e1', lessonSlug: 'a1-shopping', level: 'A1', parts: { filling: [question], writing: [], speaking: [], reading: [], listening: [] } };
const graded = {
  ...started,
  parts: { ...started.parts, filling: [{ ...question, answer: 'einen', explanationEn: '"der Apfel" is masculine: einen.' }] },
  result: { correct: 1, total: 1, pct: 100, xp: 5 },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(student));
  window.history.pushState({}, '', '/exams?lesson=a1-shopping&level=A1');
  api.getProgress.mockResolvedValue({ data: [] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getMessages.mockResolvedValue({ data: { messages: [], unread: 0 } });
  api.getLessons.mockResolvedValue({ data: [{ slug: 'a1-shopping', title: 'Shopping', level: 'A1' }] });
  api.getExams.mockResolvedValue({ data: [] });
  api.generateExam.mockResolvedValue({ data: started });
  api.submitExam.mockResolvedValue({ data: { exam: graded, result: graded.result, progress: { lessonSlug: 'a1-shopping', status: 'completed', xp: 5, examScores: [] } } });
});

test('the exam is graded by the server, which then reveals the answers', async () => {
  render(<App />);
  fireEvent.click(await screen.findByText('Start Exam'));
  expect(await screen.findByText('Ich kaufe ___ Apfel.')).toBeInTheDocument();
  expect(screen.queryByText(/is masculine/)).not.toBeInTheDocument(); // no answers before submitting

  fireEvent.click(screen.getByText('einen'));
  await act(async () => fireEvent.click(screen.getByText('Submit Exam')));

  expect(api.submitExam).toHaveBeenCalledWith('e1', { 'filling-0': 'einen' });
  expect(screen.getByRole('status')).toHaveTextContent('1 of 1 correct · +5 XP');
  expect(screen.getByText(/is masculine/)).toBeInTheDocument();
  expect(screen.getAllByText('100%').length).toBeGreaterThan(0); // the score card
});

test('a failed submission keeps the answers and explains', async () => {
  api.submitExam.mockRejectedValue({ response: { data: { error: 'This exam was already submitted. Start a new exam to practise again.' } } });
  render(<App />);
  fireEvent.click(await screen.findByText('Start Exam'));
  fireEvent.click(await screen.findByText('einen'));
  await act(async () => fireEvent.click(screen.getByText('Submit Exam')));
  expect(screen.getByRole('alert')).toHaveTextContent('already submitted');
  expect(screen.getByText('Submit Exam')).toBeInTheDocument();
});
