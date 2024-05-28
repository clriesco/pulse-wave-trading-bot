// src/config.ts
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
import dotenv from 'dotenv';

dotenv.config();

//Webshare
export const WEBSHARE_API_KEY = process.env.WEBSHARE_API_KEY || '';
export const PROXY_API_URL =
  process.env.PROXY_API_URL || 'https://proxy.webshare.io/api/v2/proxy/list';

//Quantfury
export const E1_QUANTFURY_TOKEN = process.env.E1_QUANTFURY_TOKEN || '';
export const L1_QUANTFURY_TOKEN = process.env.L1_QUANTFURY_TOKEN || '';
export const QUANTFURY_DEVICEID = process.env.QUANTFURY_DEVICEID || '';

//CPI
export const CPI_URL =
  process.env.CPI_URL ||
  'https://data.bls.gov/timeseries/CUSR0000SA0&output_view=pct_1mth';
export const CHECK_INTERVAL_SECONDS =
  Number(process.env.CHECK_INTERVAL_SECONDS) || 1;
export const CPI_VALUE_THRESHOLD =
  Number(process.env.CPI_VALUE_THRESHOLD) || 0.5; // Expected CPI value
export const CPI_NUM_ROWS = Number(process.env.CPI_NUM_ROWS) || 12; //Row nr 12, corresponding to 2024
export const CPI_NUM_COLUMNS = Number(process.env.CPI_NUM_COLUMNS) || 4; //Column nr 4, corresponding to CPI April 2024, announced in May 2024

//GDP
export const GDP_URL =
  process.env.GDP_URL || 'https://www.bea.gov/data/gdp/gross-domestic-product';
export const GDP_VALUE_THRESHOLD =
  Number(process.env.GDP_VALUE_THRESHOLD) || 1.3; // Expected GDP value
export const GDP_OLD_STAGE = process.env.GDP_OLD_STAGE || '(Adv)'; // Old stage of the GDP value announcement

//PCE
export const PCE_URL =
  process.env.PCE_URL ||
  'https://www.bea.gov/data/personal-consumption-expenditures-price-index'; // Personal Consumption Expenditures
export const PCE_VALUE_THRESHOLD =
  Number(process.env.PCE_VALUE_THRESHOLD) || 2.6; // Expected PCE value
export const PCE_OLD_STAGE = process.env.PCE_OLD_STAGE || 'March 2024'; // Old stage of the PCE value announcement

//NFP
export const NFP_URL =
  process.env.NFP_URL || 'https://www.bls.gov/news.release/empsit.nr0.htm'; // Non-Farm Payrolls
export const NFP_VALUE_THRESHOLD =
  Number(process.env.NFP_VALUE_THRESHOLD) || 175000; // Expected NFP value
export const NFP_NEXT_STAGE = process.env.NFP_NEXT_STAGE || 'MAY 2024'; // Next stage of the NFP value announcement

//Strategy
export const ACTIVE_ALGORITHM = process.env.ACTIVE_ALGORITHM || 'GDP'; // 'CPI' or 'GDP'
export const AMOUNT = Number(process.env.AMOUNT) || 100; // Amount to trade in USDT
export const STOP_LOSS_PERCENTAGE =
  Number(process.env.STOP_LOSS_PERCENTAGE) || 0.003; // 0.3% stop loss
export const TAKE_PROFIT_PERCENTAGE =
  Number(process.env.TAKE_PROFIT_PERCENTAGE) || 0.01; // 1% take profit
export const STRATEGY_PROXY_INDEX =
  Number(process.env.STRATEGY_PROXY_INDEX) || 0; // Index of the proxy to use for the trading strategy
export const NO_RECURRENT_FETCH =
  process.env.NO_RECURRENT_FETCH === 'true' || false; // If true, the algorithm will only check the value once
export const NO_PROXY = process.env.NO_PROXY === 'true' || false; // If true, the algorithm will not use a proxy
export const NO_TRADING = process.env.NO_TRADING === 'true' || false; // If true, the algorithm will not execute trades
