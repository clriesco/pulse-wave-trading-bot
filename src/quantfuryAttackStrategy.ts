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
import { QuantfuryPrice, PositionData, TargetOrder, StopOrder } from './types';
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
  openExtendedMarketShortPosition,
  openExtendedMarketLongPosition,
} from './quantfury';

const threshold = QUANTFURY_HACK_PRICE_THRESHOLD;
let lastPrice: QuantfuryPrice | null = null;
let currentPrice: QuantfuryPrice | null = null;
let lastOperation: PositionData | null = null;
let operationCompleted = false;
let operationInProgress = false;

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
    const target: TargetOrder = {
      price: currentPrice!.price,
      value: {
        amountInstrument: AMOUNT,
      },
    };
    const stop: StopOrder = {
      price: lastPrice!.price,
      value: {
        amountInstrument: AMOUNT,
      },
    };
    const ret = await (
      operationType === 'short'
        ? openExtendedMarketShortPosition
        : openExtendedMarketLongPosition
    )(AMOUNT, target, stop, lastPrice!.id);

    if (!('data' in ret)) {
      throw new Error(ret.error);
    }

    lastOperation = ret.data.position;
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
  try {
    currentPrice = req.body;

    if (operationInProgress) {
      return res.status(200).send({
        status: 'no_action',
        message: 'Operation in progress',
      });
    }
    if (operationCompleted) {
      return res.status(200).send({
        status: 'no_action',
        message: 'Operation already completed',
      });
    }
    if (!isValidPrice(currentPrice!)) {
      logger.error('Invalid price object');
      return res.status(400).send({
        status: 'error',
        message: 'Invalid price object',
        error: 'Price validation failed',
      });
    }
    if (lastOperation) {
      logger.info('No action during an open position');
      return res.status(200).send({
        status: 'no_action',
        message: 'No action during an open position',
      });
    }

    if (lastPrice) {
      const priceDifference = currentPrice!.price - lastPrice.price;
      const operationType = determineOperationType(priceDifference);

      if (operationType) {
        logger.info(`Last price: ${lastPrice.price}`);
        logger.info(`Current price: ${currentPrice!.price}`);
        logger.info(
          `Price difference: ${priceDifference} - Triggering ${operationType} operation...`
        );
        operationInProgress = true;
        await executeTradingOperation(operationType);
        operationInProgress = false;
        operationCompleted = true;
        const responseMessage = {
          status: 'success',
          message: 'Operation triggered',
          data: {
            operationType,
            openPrice: lastPrice!.price,
            closePrice: currentPrice!.price,
          },
        };
        lastPrice = currentPrice; // Update lastPrice after processing the operation
        return res.status(200).send(responseMessage);
      }
    }

    // Update lastPrice if no operation is triggered
    lastPrice = currentPrice;
    return res.status(200).send({
      status: 'no_action',
      message: 'No operation triggered',
    });
  } catch (error) {
    logger.error(`Error handling price: ${error}`);
    operationCompleted = true;
    return res.status(500).send({
      status: 'error',
      message: 'Error handling price',
      error: `${error}`,
    });
  }
}

/**
 * Tests the strategy by sending a limit order to Quantfury.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Response} The response object.
 */
export async function testStrategy(req: Request, res: Response) {
  try {
    if (NO_TRADING) {
      logger.info('MOCK Sending test order...');
      return res.status(200).send({
        status: 'success',
        message: 'Test order sent',
      });
    }

    const price: QuantfuryPrice = req.body;

    logger.info('Sending test order...');
    const ret = await openExtendedMarketShortPosition(
      AMOUNT,
      {
        price: 66200,
        value: {
          amountInstrument: AMOUNT,
        },
      },
      {
        price: 66666,
        value: {
          amountInstrument: AMOUNT,
        },
      },
      price.id
    );

    if (!('data' in ret)) {
      throw new Error(ret.error);
    }

    return res.status(200).send({
      status: 'success',
      message: 'Test order sent',
      data: {
        operationType: 'short',
        openPrice: price.price,
        closePrice: '?',
      },
    });
  } catch (error) {
    logger.error(`Error testing strategy: ${error}`);
    return res.status(500).send({
      status: 'error',
      message: 'Error testing strategy',
      error: `${error}`,
    });
  }
}
