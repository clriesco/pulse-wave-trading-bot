// src/scraper.ts
import axios from 'axios';
import cheerio from 'cheerio';
import { CPI_URL, NUM_ROWS, NUM_COLUMNS } from './config';
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
      .eq(NUM_ROWS - 1)
      .find('td')
      .eq(NUM_COLUMNS - 1)
      .text();
    const value = parseFloat(cellValue.trim());

    return isNaN(value) ? null : value;
  } catch (error) {
    console.error('Error fetching or parsing CPI data:', error);
    return null;
  }
}
