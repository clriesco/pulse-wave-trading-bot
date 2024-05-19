// src/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const WEBSHARE_API_KEY = process.env.WEBSHARE_API_KEY || '';
export const QUANTFURY_TOKEN = process.env.QUANTFURY_TOKEN || '';
export const QUANTFURY_DEVICEID = process.env.QUANTFURY_DEVICEID || '';

export const PROXY_API_URL =
  process.env.PROXY_API_URL || 'https://proxy.webshare.io/api/v2/proxy/list';
export const CPI_URL =
  process.env.CPI_URL ||
  'https://data.bls.gov/timeseries/CUSR0000SA0&output_view=pct_1mth';
export const CHECK_INTERVAL_SECONDS =
  Number(process.env.CHECK_INTERVAL_SECONDS) || 10;
export const VALUE_THRESHOLD = Number(process.env.VALUE_THRESHOLD) || 0.5;
