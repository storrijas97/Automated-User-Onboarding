'use strict';

// withRetry is defined inline in both service files. Tested here as a standalone unit.
async function withRetry(fn, limit = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= limit; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt < limit) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastErr;
}

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns result immediately when fn succeeds on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const prom = withRetry(fn, 3);
    await Promise.resolve();
    jest.runAllTimers();
    const result = await prom;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries after a transient failure and returns on second attempt', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('recovered');

    const prom = withRetry(fn, 3);
    await Promise.resolve();
    jest.runAllTimers();
    await Promise.resolve();
    const result = await prom;
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('exhausts all attempts and throws the last error', async () => {
    const error = new Error('always fails');
    const fn = jest.fn().mockRejectedValue(error);

    const prom = withRetry(fn, 3);
    const assertion = expect(prom).rejects.toThrow('always fails');
    await jest.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('respects custom limit of 1 (no retries)', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const prom = withRetry(fn, 1);
    await Promise.resolve();
    jest.runAllTimers();
    await expect(prom).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('passes attempt number to fn', async () => {
    const attempts = [];
    const fn = jest.fn().mockImplementation(async (attempt) => {
      attempts.push(attempt);
      if (attempt < 3) throw new Error('not yet');
      return 'done';
    });

    const prom = withRetry(fn, 3);
    await jest.runAllTimersAsync();
    const result = await prom;
    expect(result).toBe('done');
    expect(attempts).toEqual([1, 2, 3]);
  });

  test('succeeds on first attempt with limit=1', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const prom = withRetry(fn, 1);
    await Promise.resolve();
    jest.runAllTimers();
    const result = await prom;
    expect(result).toBe(42);
  });
});
