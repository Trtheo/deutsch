import api from '../api';

const onError = api.interceptors.response.handlers[0].rejected;

describe('session expiry', () => {
  const { location } = window;
  beforeEach(() => {
    delete window.location;
    window.location = { reload: jest.fn() };
    localStorage.setItem('deutsch_token', 'abc');
    localStorage.setItem('deutsch_user', '{}');
  });
  afterEach(() => { window.location = location; localStorage.clear(); });

  test('an invalid token logs the user out', async () => {
    const error = { response: { status: 401, data: { error: 'Invalid token' } } };
    await expect(onError(error)).rejects.toBe(error);
    expect(localStorage.getItem('deutsch_token')).toBeNull();
    expect(window.location.reload).toHaveBeenCalled();
  });

  test('a deactivated account is signed out with a notice for the login screen', async () => {
    const error = { response: { status: 403, data: { code: 'ACCOUNT_DEACTIVATED', error: 'Your account has been deactivated. Please contact support.' } } };
    await expect(onError(error)).rejects.toBe(error);
    expect(localStorage.getItem('deutsch_token')).toBeNull();
    expect(sessionStorage.getItem('auth_notice')).toMatch(/deactivated/);
    expect(window.location.reload).toHaveBeenCalled();
    sessionStorage.clear();
  });

  test('a wrong password does not log the user out', async () => {
    const error = { response: { status: 401, data: { error: 'Current password is incorrect' } } };
    await expect(onError(error)).rejects.toBe(error);
    expect(localStorage.getItem('deutsch_token')).toBe('abc');
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});

test('requests carry the saved token', async () => {
  localStorage.setItem('deutsch_token', 'xyz');
  const config = await api.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBe('Bearer xyz');
  localStorage.clear();
});
