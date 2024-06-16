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
import * as fs from 'fs';
import { promisify } from 'util';
import { Event, Result } from '../types';
import logger from './logger';
import csvParser from 'csv-parser';

const statAsync = promisify(fs.stat);
const readAsync = promisify(fs.read);
const readFileAsync = promisify(fs.readFile);

/**
 * Reads events from a JSON file.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<Event[]>}
 */
export async function readFromFile(
  filePath: string
): Promise<Event[] | Result[]> {
  logger.info(`Reading from file: ${filePath}`);
  const data = await readFileAsync(filePath, 'utf-8');
  return JSON.parse(data) as Event[];
}
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

/**
 * Searches for the position of the price closest to the target time in a CSV file.
 * The function uses a binary search algorithm to find the position.
 * The function reads chunks of the file to reduce the number of disk reads.
 * The function returns the position (in bytes) of the price closest to the target time.
 * If the target time is before the first price data point, the function returns 0.
 * The function assumes that the CSV file is sorted by timestamp in ascending order.
 * The function assumes that the CSV file has the following format:
 * timestamp,open,high,low,close,volume
 *
 * @param {string} filePath - CSV file path.
 * @param {Date} targetTime - Event time.
 * @returns {Promise<number>} - Position (in bytes) of the price closest to the target time.
 */
export async function binarySearchCSV(
  filePath: string,
  targetTime: Date
): Promise<number> {
  const stats = await statAsync(filePath);
  let start = 0;
  let end = stats.size;

  let foundPosition = -1; // Initialize with an invalid position

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const chunkSize = 50000;
    const buffer = Buffer.alloc(chunkSize);

    const readPosition = Math.max(mid - chunkSize / 2, 0); // Read a chunk around the middle
    const fd = fs.openSync(filePath, 'r');
    await readAsync(fd, buffer, 0, chunkSize, readPosition);

    const chunk = buffer.toString('utf-8');

    // Make sure we have a complete line at the beginning and end of the chunk
    const firstNewLineIndex = chunk.indexOf('\n');
    const startLineIndex = firstNewLineIndex >= 0 ? firstNewLineIndex + 1 : 0;
    const lastNewLineIndex = chunk.lastIndexOf('\n');
    const endLineIndex =
      lastNewLineIndex >= 0 ? lastNewLineIndex : chunk.length;
    const relevantChunk = chunk.slice(startLineIndex, endLineIndex);

    const rows = relevantChunk.split('\n');
    fs.closeSync(fd);

    let found = false;
    for (const row of rows) {
      if (!row.trim()) continue; // Skip empty lines
      const [timestamp] = row.split(',');
      const time = new Date(parseInt(timestamp, 10));
      if (time >= targetTime) {
        found = true;
        foundPosition = readPosition; // Mark the position
        break;
      }
    }

    if (found) {
      end = readPosition - 1; // Keep searching in the left half
    } else {
      start = readPosition + chunkSize;
    }
  }

  // If the target time is before the first price data point, return 0
  if (foundPosition !== -1) {
    const buffer = Buffer.alloc(1000); // Small buffer to read the first line
    const fd = fs.openSync(filePath, 'r');
    await readAsync(fd, buffer, 0, 1000, foundPosition);
    fs.closeSync(fd);
    const chunk = buffer.toString('utf-8');
    const startLineIndex = chunk.indexOf('\n') + 1; // Find the start of the first line
    return foundPosition + startLineIndex;
  }

  return 0; // If not found, return to the beginning of the file
}

/**
 * Reads the header of a CSV file.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string[]>}
 */
export async function readCSVHeader(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath, { start: 0, end: 1000 }) // Read the first 1000 bytes
      .pipe(csvParser())
      .on('headers', (headers: string[]) => {
        resolve(headers);
      })
      .on('error', (error) => reject(error));
  });
}
