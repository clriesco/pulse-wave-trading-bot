// src/proxy.ts
import axios from 'axios';
import logger from './logger';
import { PROXY_API_URL, WEBSHARE_API_KEY } from './config';
import { Proxy, ProxyAPIResponse } from './types';

/**
 * Fetches the list of proxies from the Webshare API.
 *
 * @param {number} index [optional] - The index of the proxy to fetch. If null, fetch all proxies.
 * @returns {Promise<Proxy[]>} A promise that resolves to an array of proxies.
 * @throws Will throw an error if the request fails.
 */
export async function getProxies(): Promise<Proxy[]> {
  try {
    logger.info('Fetching proxies from Webshare API...');
    const response = await axios.get<ProxyAPIResponse>(PROXY_API_URL, {
      headers: {
        Authorization: `Token ${WEBSHARE_API_KEY}`,
      },
      params: {
        mode: 'direct',
        page: 1,
        page_size: 25,
      },
    });
    logger.debug(`${response.data.count} proxies fetched.`);

    return response.data.results;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      logger.error(`Error fetching proxies: ${error.response.data}`);
      throw new Error(`Error fetching proxies: ${error.response.statusText}`);
    } else {
      logger.error('Unknown error:', error);
      throw new Error('Unknown error occurred');
    }
  }
}
