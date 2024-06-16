// src/strategy.ts
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
import logger from './utils/logger';
import {
  openMarketLongPosition,
  openMarketShortPosition,
  reducePosition,
  init as initQuantfury,
} from './quantfury';
import { Proxy, PositionData, OrderType } from './types';
import {
  CPI_VALUE_THRESHOLD,
  GDP_VALUE_THRESHOLD,
  PCE_VALUE_THRESHOLD,
  NFP_VALUE_THRESHOLD,
  FOMC_VALUE_THRESHOLD,
  CPI_VALUE_OFFSET,
  GDP_VALUE_OFFSET,
  PCE_VALUE_OFFSET,
  NFP_VALUE_OFFSET,
  FOMC_VALUE_OFFSET,
  AMOUNT,
  MAX_AMOUNT,
  CHECK_INTERVAL_SECONDS,
  STRATEGY_PROXY_INDEX,
  NO_RECURRENT_FETCH,
  NO_PROXY,
  STOP_LOSS_PERCENTAGE,
  TAKE_PROFIT_PERCENTAGE,
} from './config';
import { getProxies } from './utils/proxy';

type CheckValueFunction = (proxy: any) => Promise<number | null>;
type ExecuteStrategyFunction = (value: number, proxy: any) => Promise<void>;

/**
 * Launches the trading algorithm for the specified macroeconomic indicator.
 *
 * @param {string} indicator - The macroeconomic indicator to base the trading strategy on (e.g., 'CPI', 'GDP', 'PCE', 'NFP').
 * @param {CheckValueFunction} checkValueFunction - The function used to fetch the value of the indicator from a data source.
 * @param {ExecuteStrategyFunction} executeStrategyFunction - The function used to execute the trading strategy based on the fetched indicator value.
 * @returns {Promise<void>} A promise that resolves when the algorithm execution completes or is terminated.
 *
 * This function continuously fetches the value of the specified indicator at regular intervals using a proxy (if applicable) until a valid value is obtained. Once a valid value is found, the corresponding trading strategy is executed, and further fetching is stopped.
 */
export async function launchAlgorithm(
  indicator: string,
  checkValueFunction: CheckValueFunction,
  executeStrategyFunction: ExecuteStrategyFunction
) {
  let strategy_executed = false;

  const proxies = NO_PROXY ? [] : await getProxies();
  if (!NO_PROXY && proxies.length === 0) {
    logger.error(`No proxies available. Exiting.`);
    return;
  }

  let proxyIndex = 0;

  const intervalId = setInterval(async () => {
    if (strategy_executed) {
      return;
    }
    NO_RECURRENT_FETCH && clearInterval(intervalId);
    const proxy = NO_PROXY ? null : proxies[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxies.length;

    const value = await checkValueFunction(proxy);
    if (value !== null && !strategy_executed) {
      logger.info(`Valid ${indicator} value found: ${value}`);
      strategy_executed = true;
      clearInterval(intervalId);
      await executeStrategyFunction(
        value,
        NO_PROXY ? null : proxies[STRATEGY_PROXY_INDEX]
      );
    } else {
      logger.error(
        `No valid value found${NO_PROXY ? '' : ` using proxy ${proxy?.proxy_address}`} for ${indicator}.`
      );
      if (!NO_RECURRENT_FETCH && !NO_PROXY) {
        logger.info('Rotating to next proxy...');
      }
    }
  }, CHECK_INTERVAL_SECONDS * 1000);
}

/**
 * Adds Take Profit and Stop Loss orders to the specified trading position.
 *
 * @param {PositionData} position - The trading position to add the orders to.
 * @returns {Promise<void>} A promise that resolves when the orders are successfully added to the position.
 */
export async function addTakeProfitStopLoss(position: PositionData) {
  const { id, openPrice } = position;
  const stopLossPrice = Math.floor(openPrice * (1 - STOP_LOSS_PERCENTAGE));
  const takeProfitPrice = Math.floor(openPrice * (1 + TAKE_PROFIT_PERCENTAGE));

  const tpResponse = await reducePosition(
    id,
    OrderType.TARGET,
    takeProfitPrice,
    position.amountInstrument
  );

  if ('error' in tpResponse) {
    logger.error('Error adding Take Profit order:', tpResponse.error);
  } else {
    logger.info(`Take Profit order added at price ${takeProfitPrice}`);
  }

  const slResponse = await reducePosition(
    id,
    OrderType.STOP,
    stopLossPrice,
    position.amountInstrument
  );

  if ('error' in slResponse) {
    logger.error('Error adding Stop Loss order:', slResponse.error);
  } else {
    logger.info(`Stop Loss order added at price ${stopLossPrice}`);
  }
}

/**
 * Executes a generic trading strategy based on the provided macroeconomic indicator value.
 *
 * @param {number | null} value - The value of the macroeconomic indicator to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @param {boolean} direction - The direction of the indicator's influence on the trading strategy. True for a direct relation, false for an inverse relation.
 * @param {number} threshold - The threshold value for the indicator, used to determine trading actions.
 * @param {number} offset - The offset value used to calculate leverage based on the difference between the indicator value and the threshold.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed or if no action is taken.
 *
 * The leverage for the trading position is calculated as (value - threshold) / offset. The leverage determines the size of the position and its direction
 * (long or short) based on the relation specified by `direction`. If leverage is between -1 and 1, no action is taken.
 */
export async function executeTradingStrategy(
  value: number | null,
  proxy: Proxy | null,
  direction: boolean,
  threshold: number,
  offset: number
) {
  if (value === null) {
    logger.error('No value found in the specified position.');
    return;
  }
  let leverage = (value - threshold) / offset;
  leverage = Math.sign(leverage) * Math.floor(Math.abs(leverage));

  const max_leverage = Math.floor(MAX_AMOUNT / AMOUNT);

  if (leverage > max_leverage) leverage = max_leverage;
  if (-max_leverage > leverage) leverage = -max_leverage;

  if (!direction) leverage = -leverage;

  if (leverage > -1 && leverage < 1) {
    logger.info(`Value ${value} is around the threshold. No action taken.`);
    return;
  }

  await initQuantfury(proxy);

  let directionFunction = openMarketLongPosition;
  if (leverage <= -1) {
    logger.info(
      `Value ${value} is above the threshold. Executing SHORT strategy.`
    );
    directionFunction = openMarketShortPosition;
  } else {
    logger.info(
      `Value ${value} is below the threshold. Executing LONG strategy.`
    );
  }

  const ret = await directionFunction(AMOUNT * Math.abs(leverage));

  if ('data' in ret) {
    logger.info(ret.data);
    logger.info(
      `Successfully executed strategy: ${ret.data.position.amountInstrument} USDT at ${ret.data.operationPrice}`
    );
    await addTakeProfitStopLoss(ret.data.position);
  } else {
    logger.error('Error executing strategy:', ret.error);
  }
}

/**
 * Executes the trading strategy based on the CPI (Consumer Price Index) value.
 *
 * @param {number | null} cpiValue - The CPI value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed.
 *
 * The CPI value has an inverse relation with the trading strategy: if the CPI value is higher than the threshold,
 * a short position is taken; if lower, a long position is taken. The leverage is calculated based on the difference
 * between the CPI value and the threshold, divided by the offset.
 */
export async function executeCPITradingStrategy(
  cpiValue: number | null,
  proxy: Proxy | null
) {
  return await executeTradingStrategy(
    cpiValue,
    proxy,
    false,
    CPI_VALUE_THRESHOLD,
    CPI_VALUE_OFFSET
  );
}

/**
 * Executes the trading strategy based on the GDP (Gross Domestic Product) value.
 *
 * @param {number | null} gdpValue - The GDP value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed.
 *
 * The GDP value has an inverse relation with the trading strategy: if the GDP value is higher than the threshold,
 * a short position is taken; if lower, a long position is taken. The leverage is calculated based on the difference
 * between the GDP value and the threshold, divided by the offset.
 */
export async function executeGDPTradingStrategy(
  gdpValue: number | null,
  proxy: Proxy | null
) {
  return await executeTradingStrategy(
    gdpValue,
    proxy,
    false,
    GDP_VALUE_THRESHOLD,
    GDP_VALUE_OFFSET
  );
}

/**
 * Executes the trading strategy based on the PCE (Personal Consumption Expenditures Price Index) value.
 *
 * @param {number | null} pceValue - The PCE value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed.
 *
 * The PCE value has an inverse relation with the trading strategy: if the PCE value is higher than the threshold,
 * a short position is taken; if lower, a long position is taken. The leverage is calculated based on the difference
 * between the PCE value and the threshold, divided by the offset.
 */
export async function executePCETradingStrategy(
  pceValue: number | null,
  proxy: Proxy | null
) {
  return await executeTradingStrategy(
    pceValue,
    proxy,
    false,
    PCE_VALUE_THRESHOLD,
    PCE_VALUE_OFFSET
  );
}

/**
 * Executes the trading strategy based on the Non-Farm Payroll (NFP) value.
 *
 * @param {number | null} nfpValue - The NFP value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed.
 *
 * The NFP value has an inverse relation with the trading strategy: if the NFP value is higher than the threshold,
 * a short position is taken; if lower, a long position is taken. The leverage is calculated based on the difference
 * between the NFP value and the threshold, divided by the offset.
 */
export async function executeNFPTradingStrategy(
  nfpValue: number | null,
  proxy: Proxy | null
) {
  return await executeTradingStrategy(
    nfpValue,
    proxy,
    false,
    NFP_VALUE_THRESHOLD,
    NFP_VALUE_OFFSET
  );
}

/**
 * Executes the trading strategy based on the FOMC (Federal Open Market Committee) value.
 *
 * @param {number | null} fomcValue - The FOMC value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy. Null if no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the trading strategy is executed.
 *
 * The FOMC value has an inverse relation with the trading strategy: if the FOMC value is higher than the threshold,
 * a long short is taken; if lower, a long position is taken. The leverage is calculated based on the difference between
 * the FOMC value and the threshold, divided by the offset.
 */
export async function executeFOMCTradingStrategy(
  fomcValue: number | null,
  proxy: Proxy | null
) {
  return await executeTradingStrategy(
    fomcValue,
    proxy,
    false,
    FOMC_VALUE_THRESHOLD,
    FOMC_VALUE_OFFSET
  );
}
