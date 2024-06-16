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
import { Event, PriceData, Result } from './types';
import logger from './utils/logger';
import csvParser from 'csv-parser';
import { binarySearchCSV, readFromFile, readCSVHeader } from './utils/utils';

const STOP_LOSS_PERCENTAGE = 0.002; // 0.2%
const TAKE_PROFIT_PERCENTAGE = 0.02; // 2%
const RETURN_THRESHOLD_PERCENTAGE = 0.0015; // 0.15%

const AMOUNT = 200000;
const MAX_AMOUNT = 1000000;

const OFFSET_NFP = 15000;
const OFFSET_CPI = 0.02;
const OFFSET_FOMC = 0.02;

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
export async function loadPricesFromPosition(
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
  // events = events.filter((event) => event.dateUtc >= '2024-06-01T00:00:00Z');
  for (const event of events) {
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
    } else if (event.eventId === '6f846eaa-9a12-43ab-930d-f059069c6646') {
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
    let exitTime = eventTime;
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
          exitTime = price.timestamp;
          logger.info(
            `${event.name}: Take profit at ${takeProfitPrice}. Closing position.`
          );
          break;
        } else if (price.low <= stopLossPrice) {
          exitPrice = stopLossPrice;
          exitTime = price.timestamp;
          logger.info(
            `${event.name}: Stop loss at ${stopLossPrice}. Closing position.`
          );
          break;
        } else if (secondsSinceEntry >= 10) {
          if (price.high < returnThreshold) {
            exitPrice = price.close;
            exitTime = price.timestamp;
            exitDueToNoMovement = true;
            logger.info(
              `${event.name}: No movement. Closing position at ${price.close}.`
            );
            break;
          } else if (secondsSinceEntry >= 1500) {
            exitPrice = price.close;
            exitTime = price.timestamp;
            logger.info(
              `${event.name}: No movement. Closing position at ${price.close}.`
            );
            break;
          }
        }
      } else {
        if (price.low <= takeProfitPrice) {
          exitPrice = takeProfitPrice;
          exitTime = price.timestamp;
          logger.info(
            `${event.name}: Take profit at ${takeProfitPrice}. Closing position.`
          );
          break;
        } else if (price.high >= stopLossPrice) {
          exitPrice = stopLossPrice;
          exitTime = price.timestamp;
          logger.info(
            `${event.name}: Stop loss at ${stopLossPrice}. Closing position.`
          );
          break;
        } else if (secondsSinceEntry >= 10) {
          if (price.low > returnThreshold) {
            exitPrice = price.close;
            exitTime = price.timestamp;
            exitDueToNoMovement = true;
            logger.info(
              `${event.name}: No movement. Closing position at ${price.close}.`
            );
            break;
          } else if (secondsSinceEntry >= 1500) {
            exitPrice = price.close;
            exitTime = price.timestamp;
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
      entryTime: eventTime,
      exitTime,
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
    const events = (await readFromFile('data/cleaned_history.json')) as Event[];
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
