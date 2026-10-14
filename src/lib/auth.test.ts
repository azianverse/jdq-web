import { describe, expect, it } from 'vitest';
import { adminHandoffUrl, isStoredUser, sessionFailureDisposition } from './auth';

describe('stored auth session helpers', () => {
  it('rejects non-object stored users', () => {
    expect(isStoredUser(null)).toBe(false);
    expect(isStoredUser('{"role":"user"}')).toBe(false);
    expect(isStoredUser({ role: 'user' })).toBe(true);
  });

  it('hands admins to the dashboard origin without exposing a token fragment', () => {
    const url = adminHandoffUrl();
    expect(url).not.toContain('#session=');
    expect(url).toBe('https://admin.juanderquest.app');
  });

  it('preserves the session on outages but treats 401 as signed out', () => {
    expect(sessionFailureDisposition({ response: { status: 503 } })).toBe('retryable');
    expect(sessionFailureDisposition(new Error('Network Error'))).toBe('retryable');
    expect(sessionFailureDisposition({ isAxiosError: true, response: { status: 401 } })).toBe('signed_out');
  });
});
