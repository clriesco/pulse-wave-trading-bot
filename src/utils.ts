// src/utils.ts
/**
 * Checks if the given error is an Axios error with a response status.
 *
 * @param {any} error - The error to check.
 * @returns {boolean} True if the error is an Axios error with a response status, otherwise false.
 */
export function isAxiosError(
  error: any
): error is { response: { status: number } } {
  return error && error.response && typeof error.response.status === 'number';
}
