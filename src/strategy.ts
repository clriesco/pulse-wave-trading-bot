// src/strategy.ts
import { openMarketLongPosition, openMarketShortPosition } from './quantfury';
import { VALUE_THRESHOLD } from './config';

/**
 * Executes the trading strategy based on the CPI value.
 *
 * @param {number | null} cpiValue - The CPI value to base the trading strategy on. If null, no action is taken.
 */
export function executeTradingStrategy(cpiValue: number | null) {
  if (cpiValue === null) {
    console.log('No value found in the specified cell.');
    return;
  }

  const amount = 1;

  if (cpiValue > VALUE_THRESHOLD + 0.1) {
    console.log(
      `CPI value ${cpiValue} is above the threshold. Executing SHORT strategy.`
    );
    openMarketShortPosition(amount);
  } else if (cpiValue < VALUE_THRESHOLD - 0.1) {
    console.log(
      `CPI value ${cpiValue} is below the threshold. Executing LONG strategy.`
    );
    openMarketLongPosition(amount);
  } else {
    console.log(
      `CPI value ${cpiValue} is around the threshold. No action taken.`
    );
  }
}
