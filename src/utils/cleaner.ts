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
  '6f846eaa-9a12-43ab-930d-f059069c6646',
];

const cleanedData = data
  .filter((entry: any) => targetEventIds.includes(entry.eventId))
  .map((entry: any) => {
    const cleanedEntry: Record<string, any> = {};
    switch (entry.potency) {
      case 'K':
        entry.actual = entry.actual * 1000;
        entry.revised = entry.revised * 1000;
        entry.consensus = entry.consensus * 1000;
        entry.previous = entry.previous * 1000;
        break;
      case 'M':
        entry.actual = entry.actual * 1000000;
        entry.revised = entry.revised * 1000000;
        entry.consensus = entry.consensus * 1000000;
        entry.previous = entry.previous * 1000000;
        break;
      case null:
        break;
    }

    relevantFields.forEach((field) => {
      cleanedEntry[field] = entry[field];
    });

    return cleanedEntry;
  });

fs.writeFileSync(
  'data/cleaned_history.json',
  JSON.stringify(cleanedData, null, 4)
);

logger.info('Data cleaned successfully.');
