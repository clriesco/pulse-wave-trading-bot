// src/index.ts
import logger from './logger';
import { checkCPIValue, checkGDPValue } from './scraper';
import {
  executeCPITradingStrategy,
  executeGDPTradingStrategy,
} from './strategy';
import {
  CHECK_INTERVAL_SECONDS,
  ACTIVE_TRADING_STRATEGY,
  STRATEGY_PROXY_INDEX,
} from './config';
import { getProxies } from './proxy';

/**
 * Main function that launches the trading bot.
 */
async function main() {
  switch (ACTIVE_TRADING_STRATEGY) {
    case 'CPI':
      console.log('Using CPI trading strategy.');
      logger.info('Using CPI trading strategy.');
      await launch_cpi_strategy();
      break;
    case 'GDP':
      console.log('Using GDP trading strategy.');
      logger.info('Using GDP trading strategy.');
      await launch_gdp_strategy();
      break;
    default:
      console.error('Invalid trading strategy:', ACTIVE_TRADING_STRATEGY);
      logger.error('Invalid trading strategy:', ACTIVE_TRADING_STRATEGY);
      return;
  }
}

/**
 * Launches the CPI trading strategy.
 * This strategy checks the CPI value and executes a trading strategy based on it.
 * The bot will keep checking the CPI value at regular intervals until a valid value is found.
 * Once a valid value is found, the bot will execute the trading strategy and exit.
 */
const launch_cpi_strategy = async () => {
  let strategy_executed = false;
  const proxies = await getProxies();
  if (proxies.length === 0) {
    logger.info('No proxies available. Exiting.');
    return;
  }

  let proxyIndex = 0;

  const intervalId = setInterval(async () => {
    if (strategy_executed) {
      clearInterval(intervalId);
      return;
    }
    const proxy = proxies[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxies.length;

    const cpiValue = await checkCPIValue(proxy);
    if (cpiValue !== null) {
      logger.info(`Valid CPI value found: ${cpiValue}`);
      strategy_executed = true;
      clearInterval(intervalId);
      await executeCPITradingStrategy(cpiValue, proxies[STRATEGY_PROXY_INDEX]);
    } else {
      logger.error(
        `No valid value found using proxy ${proxy.proxy_address}. Rotating to the next proxy.`
      );
    }
  }, CHECK_INTERVAL_SECONDS * 1000);
};

/**
 * Launches the GDP trading strategy.
 * This strategy checks the GDP value and executes a trading strategy based on it.
 * The bot will keep checking the GDP value at regular intervals until a valid value is found.
 * Once a valid value is found, the bot will execute the trading strategy and exit.
 */
const launch_gdp_strategy = async () => {
  let strategy_executed = false;
  const proxies = await getProxies();
  if (proxies.length === 0) {
    logger.info('No proxies available. Exiting.');
    return;
  }

  let proxyIndex = 0;

  const intervalId = setInterval(async () => {
    if (strategy_executed) {
      clearInterval(intervalId);
      return;
    }
    const proxy = proxies[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxies.length;

    const gdpValue = await checkGDPValue(proxy);
    if (gdpValue !== null) {
      logger.info(`Valid GDP value found: ${gdpValue}`);
      strategy_executed = true;
      clearInterval(intervalId);
      await executeGDPTradingStrategy(gdpValue, proxies[STRATEGY_PROXY_INDEX]);
    } else {
      logger.error(
        `No valid value found using proxy ${proxy.proxy_address}. Rotating to the next proxy.`
      );
    }
  }, CHECK_INTERVAL_SECONDS * 1000);
};

main().catch((error) => {
  logger.error(`Error in main execution: ${error}`);
});
