// src/backtester.ts
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
import { promisify } from 'util';
import { Event, PriceData, Result } from './types';
import logger from './utils/logger';

const STOP_LOSS_PERCENTAGE = 0.002; // 0.2%
const TAKE_PROFIT_PERCENTAGE = 0.02; // 2%
const RETURN_THRESHOLD_PERCENTAGE = 0.0015; // 0.15%

const AMOUNT = 200000;
const MAX_AMOUNT = 1000000;

const OFFSET_NFP = 15000;
const OFFSET_CPI = 0.02;
const OFFSET_FOMC = 0.02;

const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);
const readAsync = promisify(fs.read);

/**
 * Reads events from a JSON file.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<Event[]>}
 */
async function readEvents(filePath: string): Promise<Event[]> {
  logger.info(`Reading events from file: ${filePath}`);
  const data = await readFileAsync(filePath, 'utf-8');
  return JSON.parse(data) as Event[];
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
async function binarySearchCSV(
  filePath: string,
  targetTime: Date
): Promise<number> {
  const stats = await statAsync(filePath);
  let start = 0;
  let end = stats.size;

  let foundPosition = -1; // Inicializa con -1 para marcar si encontramos una posición válida

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const chunkSize = 50000;
    const buffer = Buffer.alloc(chunkSize);

    const readPosition = Math.max(mid - chunkSize / 2, 0); // Leer un poco antes de la posición media
    const fd = fs.openSync(filePath, 'r');
    await readAsync(fd, buffer, 0, chunkSize, readPosition);

    const chunk = buffer.toString('utf-8');

    // Asegúrate de comenzar y terminar con líneas completas
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
      if (!row.trim()) continue; // Saltar líneas vacías
      const [timestamp] = row.split(',');
      const time = new Date(parseInt(timestamp, 10));
      if (time >= targetTime) {
        found = true;
        foundPosition = readPosition; // Marcar la posición donde encontramos el timestamp
        break;
      }
    }

    if (found) {
      end = readPosition - 1; // Sigue buscando hacia la izquierda por la posible primera aparición
    } else {
      start = readPosition + chunkSize;
    }
  }

  // Si encontramos una posición válida, ajustar para encontrar el principio de la línea más cercana
  if (foundPosition !== -1) {
    const buffer = Buffer.alloc(1000); // Tamaño pequeño para ajuste fino
    const fd = fs.openSync(filePath, 'r');
    await readAsync(fd, buffer, 0, 1000, foundPosition);
    fs.closeSync(fd);
    const chunk = buffer.toString('utf-8');
    const startLineIndex = chunk.indexOf('\n') + 1; // Encontrar el principio de la primera línea completa
    return foundPosition + startLineIndex;
  }

  return 0; // Si no se encuentra, regresar al principio
}

/**
 * Loads Bitcoin prices from a CSV file starting at a given position until a condition is met.
 * The condition is a function that takes a price data point and returns a boolean.
 * The function stops reading the file when the condition is met.
 * The function returns an array of price data points that satisfy the condition.
 *
 *
 * @param {string} filePath - The path to the file containing Bitcoin prices.
 * @param {number} startPosition - The position (in bytes) to start reading the file.
 * @param {Function} condition - Function that takes a price data point and returns a boolean.
 * @param {string[]} headers - The headers of the CSV file.
 * @returns {Promise<PriceData[]>}
 */
async function loadPricesFromPosition(
  filePath: string,
  startPosition: number,
  condition: (price: PriceData, entryPrice: number) => boolean,
  entryTime: Date,
  headers: string[]
): Promise<PriceData[]> {
  let firstPrice = true;
  let entryPrice = 0;
  return new Promise((resolve, reject) => {
    const results: PriceData[] = [];
    const stream = fs
      .createReadStream(filePath, { start: startPosition })
      .pipe(csvParser({ headers }))
      .on('data', (row) => {
        if (parseInt(row.timestamp) === entryTime.getTime() && firstPrice) {
          entryPrice = parseFloat(row.open);
          firstPrice = false;
        }
        const price = {
          timestamp: new Date(parseInt(row.timestamp, 10)),
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseFloat(row.volume),
        };
        results.push(price);
        if (entryPrice !== 0 && condition(price, entryPrice)) {
          stream.pause();
          resolve(results);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}
/**
 * Reads the header of a CSV file.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string[]>}
 */
async function readCSVHeader(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath, { start: 0, end: 1000 }) // Leer una pequeña parte del archivo
      .pipe(csvParser())
      .on('headers', (headers: string[]) => {
        resolve(headers);
      })
      .on('error', (error) => reject(error));
  });
}

/**
 * Backtests a trading strategy using historical events and Bitcoin prices.
 * The strategy is to buy or sell Bitcoin with leverage when an event occurs.
 * The leverage is calculated based on the difference between the actual value
 * and the consensus value of the event.
 * The strategy uses a stop loss and take profit to limit losses and lock in profits.
 * If the price does not move in the expected direction, the position is closed after 3 seconds.
 * The strategy also has a return threshold to close the position if the price does not move.
 * The strategy assumes that the event has an impact on the price of Bitcoin.
 *
 * @param {Event[]} events - The list of events to backtest.
 * @param {string} priceFilePath - The path to the file containing Bitcoin prices.
 * @returns {Promise<Result[]>}
 */
async function backtest(
  events: Event[],
  priceFilePath: string
): Promise<Result[]> {
  const results: Result[] = [];

  const headers = await readCSVHeader(priceFilePath);
  let i = 0;
  for (const event of events) {
    if (i === 131) {
      logger.info('Event:', event);
    }
    i++;
    const eventTime = new Date(event.dateUtc);
    const startPosition = await binarySearchCSV(priceFilePath, eventTime);

    if (startPosition === 0) {
      logger.info(
        `Event time ${eventTime} is before the first price data point. Skipping event.`
      );
      continue;
    }
    const prices = await loadPricesFromPosition(
      priceFilePath,
      startPosition,
      (price, entryPrice) => {
        return (
          price.high > entryPrice * (1 + TAKE_PROFIT_PERCENTAGE) ||
          price.low < entryPrice * (1 - TAKE_PROFIT_PERCENTAGE)
        );
      },
      eventTime,
      headers
    );

    if (prices.length === 0) continue;

    const relevantPrices = prices.filter(
      (price) => price.timestamp >= eventTime
    );

    if (relevantPrices.length === 0) continue;

    const entryPrice = relevantPrices[0].open;
    const threshold = event.consensus;
    const value = event.actual ?? event.consensus;

    let offset: number;
    if (event.eventId === 'fcfae951-09a7-449e-b6fe-525e1335aaba') {
      offset = OFFSET_FOMC;
    } else if (event.eventId === '9ae5cf07-55da-4f0f-b21d-f6f0835731d9') {
      offset = OFFSET_CPI;
    } else if (event.eventId === '9cdf56fd-99e4-4026-aa99-2b6c0ca92811') {
      offset = OFFSET_NFP;
    } else {
      continue;
    }

    const direction = false;
    let leverage = (value - threshold) / offset;
    leverage = Math.sign(leverage) * Math.floor(Math.abs(leverage));

    const max_leverage = Math.floor(MAX_AMOUNT / AMOUNT);

    if (leverage > max_leverage) leverage = max_leverage;
    if (-max_leverage > leverage) leverage = -max_leverage;

    if (!direction) leverage = -leverage;

    if (leverage > -1 && leverage < 1) {
      logger.info(
        `${event.name}: Value ${value} is around the threshold. No action taken.`
      );
      continue;
    } else if (leverage > 0) {
      logger.info(
        `${event.name}: Value ${value} is below the threshold. Buying with leverage ${leverage}.`
      );
    } else {
      logger.info(
        `${event.name}: Value ${value} is above the threshold. Selling with leverage ${-leverage}.`
      );
    }

    const takeProfitPrice =
      leverage > 0
        ? entryPrice * (1 + TAKE_PROFIT_PERCENTAGE)
        : entryPrice * (1 - TAKE_PROFIT_PERCENTAGE);

    const stopLossPrice =
      leverage > 0
        ? entryPrice * (1 - STOP_LOSS_PERCENTAGE)
        : entryPrice * (1 + STOP_LOSS_PERCENTAGE);

    const action = leverage > 0 ? 'buy' : 'sell';

    let exitPrice = entryPrice;
    let exitDueToNoMovement = false;

    const returnThreshold =
      leverage > 0
        ? entryPrice * (1 + RETURN_THRESHOLD_PERCENTAGE)
        : entryPrice * (1 - RETURN_THRESHOLD_PERCENTAGE);

    for (const price of relevantPrices) {
      const secondsSinceEntry =
        (price.timestamp.getTime() - eventTime.getTime()) / 1000;

      if (leverage > 0) {
        if (price.high >= takeProfitPrice) {
          exitPrice = takeProfitPrice;
          logger.info(
            `${event.name}: Take profit at ${takeProfitPrice}. Closing position.`
          );
          break;
        } else if (price.low <= stopLossPrice) {
          exitPrice = stopLossPrice;
          logger.info(
            `${event.name}: Stop loss at ${stopLossPrice}. Closing position.`
          );
          break;
        } else if (secondsSinceEntry >= 10) {
          if (price.high < returnThreshold) {
            exitPrice = price.close;
            exitDueToNoMovement = true;
            logger.info(
              `${event.name}: No movement. Closing position at ${price.close}.`
            );
            break;
          }
        }
      } else {
        if (price.low <= takeProfitPrice) {
          exitPrice = takeProfitPrice;
          logger.info(
            `${event.name}: Take profit at ${takeProfitPrice}. Closing position.`
          );
          break;
        } else if (price.high >= stopLossPrice) {
          exitPrice = stopLossPrice;
          logger.info(
            `${event.name}: Stop loss at ${stopLossPrice}. Closing position.`
          );
          break;
        } else if (secondsSinceEntry >= 10) {
          if (price.low > returnThreshold) {
            exitPrice = price.close;
            exitDueToNoMovement = true;
            logger.info(
              `${event.name}: No movement. Closing position at ${price.close}.`
            );
            break;
          }
        }
      }
    }

    const amountBTC = (AMOUNT * Math.abs(leverage)) / entryPrice;
    const profitOrLoss =
      leverage > 0
        ? (exitPrice - entryPrice) * amountBTC
        : (entryPrice - exitPrice) * amountBTC;

    logger.info(
      `${eventTime} - ${event.name}: Entry price: ${entryPrice}, Exit price: ${exitPrice}, Profit/Loss: ${profitOrLoss}`
    );
    results.push({
      date: eventTime,
      event: event.name,
      action: exitDueToNoMovement
        ? `${action} (closed due to no movement)`
        : action,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      profitOrLoss: parseFloat(profitOrLoss.toFixed(2)),
      amountBTC: parseFloat(amountBTC.toFixed(4)),
    });
  }

  return results;
}

// Main function
(async () => {
  try {
    const events = await readEvents('data/cleaned_history.json');
    const priceFilePath = 'data/btc_1s_klines.csv';
    const backtestResults = await backtest(events, priceFilePath);

    logger.info('-----------------');
    logger.info('Backtest Results:');
    logger.info('-----------------');
    console.table(backtestResults);

    fs.writeFileSync(
      'data/backtest_results.json',
      JSON.stringify(backtestResults, null, 2)
    );
  } catch (error) {
    console.error('Error during backtesting:', error);
  }
})();
