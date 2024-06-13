// src/utils.ts
/* -*- coding: utf-8 -*-
 * ------------------------------------------------------------------------------
 *
 *   Copyright 2024 Charly López
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 * ------------------------------------------------------------------------------*/
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
