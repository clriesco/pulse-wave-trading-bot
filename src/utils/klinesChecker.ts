// src/checkConsecutivePrices.ts
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
import csvParser from 'csv-parser';
import { GapDetail } from '../types';

/**
 * Checks if the prices in a CSV file are consecutive
 *
 * @param {string} filePath - The path to the CSV file
 * @returns {Promise<void>}
 */
async function checkConsecutivePrices(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let lastTimestamp: Date | null = null;
    let lastTimestampOriginal: number | null = null;
    let hasGap = false;
    const gaps: GapDetail[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const timestampOriginal = parseInt(row.timestamp, 10);
        const timestamp = new Date(timestampOriginal);

        if (lastTimestamp !== null && lastTimestampOriginal !== null) {
          const diff = (timestamp.getTime() - lastTimestamp.getTime()) / 1000;
          if (diff > 1) {
            gaps.push({
              previousTimestamp: lastTimestamp.toISOString(),
              currentTimestamp: timestamp.toISOString(),
              previousTimestampOriginal: lastTimestampOriginal,
              currentTimestampOriginal: timestampOriginal,
              gapInSeconds: diff,
            });
            hasGap = true;
          }
        }

        lastTimestamp = timestamp;
        lastTimestampOriginal = timestampOriginal;
      })
      .on('end', () => {
        if (hasGap) {
          console.log('Gaps detected:');
          console.table(gaps);
        } else {
          console.log('All timestamps are consecutive.');
        }
        resolve();
      })
      .on('error', (error) => reject(error));
  });
}

// Main function
(async () => {
  try {
    const filePath = 'data/btc_1s_klines.csv';
    await checkConsecutivePrices(filePath);
  } catch (error) {
    console.error('Error checking consecutive prices:', error);
  }
})();
