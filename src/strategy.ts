// src/strategy.ts
import logger from './logger';
import {
  openMarketLongPosition,
  openMarketShortPosition,
  init as initQuantfury,
} from './quantfury';
import { Proxy } from './types';
import { CPI_VALUE_THRESHOLD, GDP_VALUE_THRESHOLD, AMOUNT } from './config';

/**
 * Executes the trading strategy based on the CPI value.
 *
 * @param {number | null} cpiValue - The CPI value to base the trading strategy on. If null, no action is taken.
 */
export async function executeCPITradingStrategy(
  cpiValue: number | null,
  proxy: Proxy
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
 */
export async function executeGDPTradingStrategy(
  gdpValue: number | null,
  proxy: Proxy
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
