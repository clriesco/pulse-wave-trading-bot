// src/index.ts
import { checkCPIValue } from './scraper';
import { executeTradingStrategy } from './strategy';
import { CHECK_INTERVAL_SECONDS } from './config';
import { getProxies } from './proxy';

/**
 * Main function to start the CPI checking and trading strategy execution.
 */
async function main() {
  let strategy_executed = false;
  const proxies = await getProxies();
  if (proxies.length === 0) {
    console.log('No proxies available. Exiting.');
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
      console.log('Valid CPI value found:', cpiValue);
      strategy_executed = true;
      executeTradingStrategy(cpiValue);
      clearInterval(intervalId);
    } else {
      console.log(
        `No valid value found using proxy ${proxy.proxy_address}. Rotating to the next proxy.`
      );
    }
  }, CHECK_INTERVAL_SECONDS * 1000);
}

main().catch((error) => {
  console.error('Error in main execution:', error);
});
