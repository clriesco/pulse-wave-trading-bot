// src/cleanData.ts
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
import fs from 'fs';
import logger from './logger';

const data = JSON.parse(fs.readFileSync('data/history.json', 'utf-8'));

const relevantFields = [
  'eventId',
  'dateUtc',
  'actual',
  'revised',
  'consensus',
  'previous',
  'ratioDeviation',
  'name',
  'unit',
];

const targetEventIds = [
  'fcfae951-09a7-449e-b6fe-525e1335aaba',
  '9cdf56fd-99e4-4026-aa99-2b6c0ca92811',
  '9ae5cf07-55da-4f0f-b21d-f6f0835731d9',
];

const cleanedData = data
  .filter((entry: any) => targetEventIds.includes(entry.eventId))
  .map((entry: any) => {
    const cleanedEntry: Record<string, any> = {};

    relevantFields.forEach((field) => {
      cleanedEntry[field] = entry[field];

      if (entry.eventId === '9cdf56fd-99e4-4026-aa99-2b6c0ca92811') {
        if (
          field === 'actual' ||
          field === 'revised' ||
          field === 'consensus' ||
          field === 'previous'
        ) {
          if (cleanedEntry[field] !== null) {
            cleanedEntry[field] = cleanedEntry[field] * 1000;
          }
        }
      }
    });

    return cleanedEntry;
  });

fs.writeFileSync(
  'data/cleaned_history.json',
  JSON.stringify(cleanedData, null, 4)
);

logger.info('Data cleaned successfully.');
