// src/scraper.ts
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
import axios from 'axios';
import cheerio from 'cheerio';
import logger from './utils/logger';
import {
  CPI_URL,
  CPI_NUM_ROWS,
  CPI_NUM_COLUMNS,
  GDP_URL,
  GDP_OLD_STAGE,
  PCE_URL,
  PCE_OLD_STAGE,
  NFP_URL,
  NFP_NEXT_STAGE,
  FOMC_URL,
} from './config';
import { Proxy } from './types';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Fetches the CPI value from the specified URL using the given proxy.
 *
 * @param {Proxy} proxy - The proxy configuration to use for the request.
 * @returns {Promise<number | null>} A promise that resolves to the CPI value or null if not found.
 */
export async function checkCPIValue(
  proxy: Proxy | null
): Promise<number | null> {
  try {
    let response;
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking CPI value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(CPI_URL, {
        httpAgent: agent,
        httpsAgent: agent,
        headers,
      });
    } else {
      response = await axios.get<string>(CPI_URL, { headers });
    }
    const html = response.data;
    const $ = cheerio.load(html);

    const cellValue = $('#table0')
      .eq(0)
      .find('tr')
      .eq(CPI_NUM_ROWS - 1)
      .find('td')
      .eq(CPI_NUM_COLUMNS - 1)
      .text();
    const value = parseFloat(cellValue.trim());
    logger.debug(`CPI value: ${value}`);

    return isNaN(value) ? null : value;
  } catch (error) {
    logger.error(`Error fetching or parsing CPI data: ${error}`);
    return null;
  }
}

/**
 * Fetches the GDP value from the specified URL using the given proxy.
 *
 * @param {Proxy} proxy - The proxy configuration to use for the request.
 * @returns {Promise<number | null>} A promise that resolves to the GDP value or null if not found.
 * @throws Will throw an error if the request fails.
 */
export async function checkGDPValue(
  proxy: Proxy | null
): Promise<number | null> {
  try {
    let response;
    const headers = {
      //'User-Agent': fakeUserAgent(),
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking GDP value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(GDP_URL, {
        httpAgent: agent,
        httpsAgent: agent,
        headers,
      });
    } else {
      response = await axios.get<string>(GDP_URL, { headers });
    }
    const html = response.data;
    const $ = cheerio.load(html);

    const cellName = $('.bea-special').eq(0).find('td').eq(0).text();
    if (cellName.trim().includes(GDP_OLD_STAGE)) {
      logger.error(`Data not available yet. Still in ${GDP_OLD_STAGE} stage.`);
      return null;
    }

    const cellValue = $('.bea-special').eq(0).find('td').eq(1).text();
    const value = parseFloat(cellValue.replace('\n', '').trim());

    logger.debug(`GDP value: ${value}`);
    return isNaN(value) ? null : value;
  } catch (error) {
    logger.error(`Error fetching or parsing GDP data: ${error}`);
    return null;
  }
}

/**
 * Fetches the PCE Price Index value from the specified URL using the given proxy.
 *
 * @param {Proxy} proxy - The proxy configuration to use for the request.
 * @returns {Promise<number | null>} A promise that resolves to the PCE price indexvalue or null if not found.
 * @throws Will throw an error if the request fails.
 */
export async function checkPCEValue(
  proxy: Proxy | null
): Promise<number | null> {
  try {
    let response;
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking PCE value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(PCE_URL, {
        httpAgent: agent,
        httpsAgent: agent,
      });
    } else {
      response = await axios.get<string>(PCE_URL);
    }
    const html = response.data;
    const $ = cheerio.load(html);

    const cellName = $('.bea-special')
      .eq(0)
      .find('td:first-child')
      .eq(0)
      .text();
    if (cellName.trim().includes(PCE_OLD_STAGE)) {
      logger.error(`Data not available yet. Still in ${PCE_OLD_STAGE} stage.`);
      return null;
    }

    const cellValue = $('.bea-special')
      .eq(0)
      .find('td:nth-child(2)')
      .eq(0)
      .text();
    const value = parseFloat(cellValue.replace('\n', '').trim());

    logger.debug(`PCE value: ${value}`);
    return isNaN(value) ? null : value;
  } catch (error) {
    logger.error(`Error fetching or parsing PCE data: ${error}`);
    return null;
  }
}

/**
 * Fetches the Nonfarm payroll employment value from the specified URL using the given proxy.
 *
 * @param {Proxy} proxy - The proxy configuration to use for the request.
 * @returns {Promise<number | null>} A promise that resolves to the NFP price indexvalue or null if not found.
 * @throws Will throw an error if the request fails.
 */
export async function checkNFPValue(
  proxy: Proxy | null
): Promise<number | null> {
  try {
    let response;
    const headers = {
      //'User-Agent': fakeUserAgent(),
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking NFP value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(NFP_URL, {
        httpAgent: agent,
        httpsAgent: agent,
        headers,
      });
    } else {
      response = await axios.get<string>(NFP_URL, { headers });
    }
    const html = response.data;
    const $ = cheerio.load(html);

    const nfpText = $('#bodytext .normalnews pre').text();

    const nfpTextStart = nfpText.indexOf(
      `THE EMPLOYMENT SITUATION -- ${NFP_NEXT_STAGE}`
    );
    const nfpTextEnd = nfpText.indexOf('and the unemployment rate');

    if (
      nfpTextStart === -1 ||
      nfpTextEnd === -1 ||
      nfpTextStart >= nfpTextEnd
    ) {
      logger.error('NFP data not found.');
      return null;
    }

    const nfpData = nfpText.substring(nfpTextStart, nfpTextEnd);
    const cellValue = nfpData.match(/\b\d{1,3}(,\d{3})*\b/);
    if (!cellValue) {
      logger.error('NFP data not found.');
      return null;
    }
    let value = parseFloat(cellValue[0].replace(',', ''));
    // If the words 'declined' or 'fell' is found, the value is negative
    if (nfpData.includes('declined') || nfpData.includes('fell')) {
      value = value * -1;
    }

    logger.debug(`NFP value: ${value}`);
    return isNaN(value) ? null : value;
  } catch (error) {
    logger.error(`Error fetching or parsing NFP data: ${error}`);
    return null;
  }
}

/**
 * Fetches the FOMC value from the specified URL using the given proxy.
 * The FOMC value is the Federal Open Market Committee interest rate.
 *
 * @param {Proxy} proxy - The proxy configuration to use for the request.
 * @returns {Promise<number | null>} A promise that resolves to the FOMC value or null if not found.
 * @throws Will throw an error if the request fails.
 */
export async function checkFOMCValue(
  proxy: Proxy | null
): Promise<number | null> {
  try {
    let response;
    const headers = {
      //'User-Agent': fakeUserAgent(),
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking FOMC value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(FOMC_URL, {
        httpAgent: agent,
        httpsAgent: agent,
        headers,
      });
    } else {
      response = await axios.get<string>(FOMC_URL, { headers });
    }
    const html = response.data;
    const $ = cheerio.load(html);

    const fomcText = $('#content ul li:nth-child(1)').text();

    const fomcTextStart = fomcText.indexOf(
      `The Board of Governors of the Federal Reserve System voted unanimously`
    );
    const fomcTextEnd = fomcText.indexOf('percent, effective');

    if (
      fomcTextStart === -1 ||
      fomcTextEnd === -1 ||
      fomcTextStart >= fomcTextEnd
    ) {
      logger.error('FOMC data not found.');
      return null;
    }

    const fomcData = fomcText.substring(fomcTextStart, fomcTextEnd);
    const cellValue = fomcData.match(/\b\d{1}(.\d{1})*\b/);
    if (!cellValue) {
      logger.error('FOMC data not found.');
      return null;
    }
    const value = parseFloat(cellValue[0]);
    logger.debug(`FOMC value: ${value}`);
    return isNaN(value) ? null : value;
  } catch (error) {
    logger.error(`Error fetching or parsing FOMC data: ${error}`);
    return null;
  }
}
