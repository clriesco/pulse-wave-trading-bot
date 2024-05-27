// src/scraper.ts
import axios from 'axios';
import cheerio from 'cheerio';
import logger from './logger';
import {
  CPI_URL,
  CPI_NUM_ROWS,
  CPI_NUM_COLUMNS,
  GDP_URL,
  GDP_OLD_STAGE,
  PCE_URL,
  PCE_OLD_STAGE,
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
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking CPI value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(CPI_URL, {
        httpAgent: agent,
        httpsAgent: agent,
      });
    } else {
      response = await axios.get<string>(CPI_URL);
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
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      logger.debug(`Checking GDP value using proxy ${proxy.proxy_address}.`);
      response = await axios.get<string>(GDP_URL, {
        httpAgent: agent,
        httpsAgent: agent,
      });
    } else {
      response = await axios.get<string>(GDP_URL);
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
