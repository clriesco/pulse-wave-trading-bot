// src/strategy.ts
import logger from './logger';
import {
  openMarketLongPosition,
  openMarketShortPosition,
  init as initQuantfury,
} from './quantfury';
import { Proxy } from './types';
import {
  CPI_VALUE_THRESHOLD,
  GDP_VALUE_THRESHOLD,
  AMOUNT,
  CHECK_INTERVAL_SECONDS,
  STRATEGY_PROXY_INDEX,
  NO_RECURRENT_FETCH,
  NO_PROXY,
} from './config';
import { getProxies } from './proxy';

type CheckValueFunction = (proxy: any) => Promise<number | null>;
type ExecuteStrategyFunction = (value: number, proxy: any) => Promise<void>;

/**
 * Launches the trading algorithm for the specified indicator.
 *
 * @param indicator - The indicator to base the trading strategy on.
 * @param checkValueFunction - The function to check the value of the indicator.
 * @param executeStrategyFunction - The function to execute the trading strategy.
 * @returns {Promise<void>} A promise that resolves when the algorithm is launched.
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
      clearInterval(intervalId);
      return;
    }
    NO_RECURRENT_FETCH && clearInterval(intervalId);
    const proxy = NO_PROXY ? null : proxies[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxies.length;

    const value = await checkValueFunction(proxy);
    if (value !== null) {
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
 * Executes the trading strategy based on the CPI value.
 *
 * @param {number | null} cpiValue - The CPI value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy.
 */
export async function executeCPITradingStrategy(
  cpiValue: number | null,
  proxy: Proxy | null
) {
  if (cpiValue === null) {
    logger.error('No value found in the specified cell.');
    return;
  }

  if (cpiValue > CPI_VALUE_THRESHOLD + 0.1) {
    logger.info(
      `CPI value ${cpiValue} is above the threshold. Executing SHORT strategy.`
    );

    await initQuantfury(proxy);
    const ret = await openMarketShortPosition(AMOUNT);
    if ('data' in ret) {
      logger.info(
        `Successfully executed SHORT strategy: ${ret.data.position.amountInstrument} USDT at ${ret.data.operationPrice}`
      );
    } else {
      logger.error('Error executing SHORT strategy:', ret.error);
    }
  } else if (cpiValue < CPI_VALUE_THRESHOLD - 0.1) {
    logger.info(
      `CPI value ${cpiValue} is below the threshold. Executing LONG strategy.`
    );

    await initQuantfury(proxy);
    const ret = await openMarketLongPosition(AMOUNT);
    if ('data' in ret) {
      logger.info(
        `Successfully executed LONG strategy: ${ret.data.position.amountInstrument} USDT at ${ret.data.operationPrice}`
      );
    } else {
      logger.error('Error executing LONG strategy:', ret.error);
    }
  } else {
    logger.info(
      `CPI value ${cpiValue} is around the threshold. No action taken.`
    );
  }
}

/**
 * Executes the trading strategy based on the GDP value.
 *
 * @param {number | null} gdpValue - The GDP value to base the trading strategy on. If null, no action is taken.
 * @param {Proxy | null} proxy - The proxy to use for the trading strategy.
 */
export async function executeGDPTradingStrategy(
  gdpValue: number | null,
  proxy: Proxy | null
) {
  if (gdpValue === null) {
    logger.error('No value found in the specified cell.');
    return;
  }

  if (gdpValue < GDP_VALUE_THRESHOLD - 0.2) {
    logger.info(
      `GDP value ${gdpValue} is below the threshold. Executing SHORT strategy.`
    );

    await initQuantfury(proxy);
    const ret = await openMarketShortPosition(AMOUNT);
    if ('data' in ret) {
      logger.info(
        `Successfully executed SHORT strategy: ${ret.data.position.amountInstrument} USDT at ${ret.data.operationPrice}`
      );
    } else {
      logger.error('Error executing SHORT strategy:', ret.error);
    }
  } else if (gdpValue > GDP_VALUE_THRESHOLD + 0.2) {
    logger.info(
      `GDP value ${gdpValue} is above the threshold. Executing LONG strategy.`
    );

    await initQuantfury(proxy);
    const ret = await openMarketLongPosition(AMOUNT);
    if ('data' in ret) {
      logger.info(
        `Successfully executed LONG strategy: ${ret.data.position.amountInstrument} USDT at ${ret.data.operationPrice}`
      );
    } else {
      logger.error('Error executing LONG strategy:', ret.error);
    }
  } else {
    logger.info(
      `GDP value ${gdpValue} is around the threshold. No action taken.`
    );
  }
}
