// src/index.ts
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
import logger from './logger';
import {
  checkCPIValue,
  checkGDPValue,
  checkPCEValue,
  checkNFPValue,
} from './scraper';
import {
  launchAlgorithm,
  executeCPITradingStrategy,
  executeGDPTradingStrategy,
  executePCETradingStrategy,
  executeNFPTradingStrategy,
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
    case 'PCE':
      logger.info('Using PCE trading strategy.');
      await launchAlgorithm('PCE', checkPCEValue, executePCETradingStrategy);
      break;
    case 'NFP':
      logger.info('Using NFP trading strategy.');
      await launchAlgorithm('NFP', checkNFPValue, executeNFPTradingStrategy);
      break;
    default:
      logger.error('Invalid trading strategy:', ACTIVE_ALGORITHM);
      return;
  }
}

main().catch((error) => {
  logger.error(`Error in main execution: ${error}`);
});
