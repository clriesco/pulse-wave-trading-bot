import logger from './logger';
import { checkCPIValue, checkGDPValue } from './scraper';
import {
  launchAlgorithm,
  executeCPITradingStrategy,
  executeGDPTradingStrategy,
} from './strategy';
import { ACTIVE_ALGORITHM } from './config';

async function main() {
  switch (ACTIVE_ALGORITHM) {
    case 'CPI':
      logger.info('Using CPI trading strategy.');
      await launchAlgorithm('CPI', checkCPIValue, executeCPITradingStrategy);
      break;
    case 'GDP':
      logger.info('Using GDP trading strategy.');
      await launchAlgorithm('GDP', checkGDPValue, executeGDPTradingStrategy);
      break;
    default:
      logger.error('Invalid trading strategy:', ACTIVE_ALGORITHM);
      return;
  }
}

main().catch((error) => {
  logger.error(`Error in main execution: ${error}`);
});
