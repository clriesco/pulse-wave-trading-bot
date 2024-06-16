// src/quantfuryPricesHandler.ts
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
import { Request, Response } from 'express';
import { QuantfuryPrice, PositionData } from './types';
import {
  AMOUNT,
  NO_TRADING,
  STRATEGY_PROXY_INDEX,
  QUANTFURY_HACK_PRICE_THRESHOLD,
} from './config';
import { getProxies } from './utils/proxy';
import logger from './utils/logger';
import {
  init as initQuantfury,
  openMarketShortPosition,
  openMarketLongPosition,
  closePosition,
} from './quantfury';

const threshold = QUANTFURY_HACK_PRICE_THRESHOLD;
let lastPrice: QuantfuryPrice | null = null;
let currentPrice: QuantfuryPrice | null = null;
let lastOperation: PositionData | null = null;
let operationCompleted = false;

export async function initStrategy() {
  const proxies = await getProxies();
  await initQuantfury(proxies[STRATEGY_PROXY_INDEX]);
}

/**
 * Validates the price object.
 *
 * @param {QuantfuryPrice} price - The price object to validate.
 * @returns {boolean} Whether the price object is valid.
 */
function isValidPrice(price: QuantfuryPrice): boolean {
  return (
    price !== null &&
    typeof price === 'object' &&
    typeof price.id === 'string' &&
    typeof price.shortName === 'string' &&
    typeof price.price === 'number' &&
    price.shortName === 'BTC/USDT'
  );
}

/**
 * Determines the type of trading operation based on the price difference.
 *
 * @param {number} priceDifference - The difference between the current and last price.
 * @returns {string | null} The operation type ('short' or 'long') or null if no operation is needed.
 */
function determineOperationType(
  priceDifference: number
): 'short' | 'long' | null {
  if (priceDifference < -threshold) {
    return 'short';
  } else if (priceDifference > threshold) {
    return 'long';
  }
  return null;
}

/**
 * Simulates opening and closing a trading operation for non-trading environments.
 *
 * @param {'short' | 'long'} operationType - The type of operation to simulate.
 */
function simulateOperation(operationType: 'short' | 'long') {
  logger.info(
    `MOCK Opening ${operationType} position for ${lastPrice!.shortName} at ${lastPrice!.price}...`
  );
  setTimeout(() => {
    logger.info(
      `MOCK Closing ${operationType} position for ${currentPrice!.shortName} at ${currentPrice!.price}...`
    );
  }, 2000);
}

/**
 * Executes the appropriate trading operation.
 *
 * @param {'short' | 'long'} operationType - The type of operation to execute.
 * @returns {Promise<void>} A promise that resolves when the operation is executed.
 */
async function executeTradingOperation(operationType: 'short' | 'long') {
  if (NO_TRADING) {
    simulateOperation(operationType);
  } else {
    logger.info(
      `Opening ${operationType} position for ${lastPrice!.shortName} at ${lastPrice!.price}...`
    );
    const ret = await (
      operationType === 'short'
        ? openMarketShortPosition
        : openMarketLongPosition
    )(AMOUNT, lastPrice!.id);

    if (!('data' in ret)) {
      throw new Error(ret.error);
    }

    lastOperation = ret.data.position;

    setTimeout(async () => {
      if (lastOperation) {
        await closePosition(lastOperation.id, currentPrice!.id);
        operationCompleted = true;
        lastOperation = null;
        logger.info(
          `Closed ${operationType} position for ${currentPrice!.shortName} at ${currentPrice!.price}...`
        );
      }
    }, 2000);
  }
}

/**
 * Handles the price received from Quantfury.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Response} The response object.
 */
export async function handlePrice(req: Request, res: Response) {
  if (operationCompleted) {
    return res.status(200);
  }

  try {
    currentPrice = req.body;

    if (!isValidPrice(currentPrice!)) {
      logger.error('Invalid price object');
      return res.status(400).send('Invalid price object');
    }

    if (lastOperation) {
      logger.info('No action during an open position');
      return res.status(200).send('No action during an open position');
    }

    if (lastPrice) {
      const priceDifference = currentPrice!.price - lastPrice.price;
      const operationType = determineOperationType(priceDifference);

      if (operationType) {
        logger.info(
          `Price difference: ${priceDifference} - Triggering ${operationType} operation...`
        );
        await executeTradingOperation(operationType);
        lastPrice = currentPrice; // Update lastPrice after processing the operation
        return res.status(200).send('Price received and processed');
      }
    }

    // Update lastPrice if no operation is triggered
    lastPrice = currentPrice;

    return res.status(200).send('Price received and processed');
  } catch (error) {
    logger.error(`Error handling price: ${error}`);
    return res.status(500).send('Internal server error');
  }
}
