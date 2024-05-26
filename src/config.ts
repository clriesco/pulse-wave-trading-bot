// src/config.ts
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

//Strategy
export const ACTIVE_TRADING_STRATEGY =
  process.env.ACTIVE_TRADING_STRATEGY || 'GDP'; // 'CPI' or 'GDP'
export const AMOUNT = Number(process.env.AMOUNT) || 100; // Amount to trade in USDT
export const STOP_LOSS_PERCENTAGE =
  Number(process.env.STOP_LOSS_PERCENTAGE) || 0.003; // 0.3% stop loss
export const TAKE_PROFIT_PERCENTAGE =
  Number(process.env.TAKE_PROFIT_PERCENTAGE) || 0.01; // 1% take profit
export const STRATEGY_PROXY_INDEX =
  Number(process.env.STRATEGY_PROXY_INDEX) || 0; // Index of the proxy to use for the trading strategy
