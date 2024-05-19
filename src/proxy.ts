// src/proxy.ts
import axios from 'axios';
import { PROXY_API_URL, WEBSHARE_API_KEY } from './config';
import { Proxy, ProxyAPIResponse } from './types';

/**
 * Fetches the list of proxies from the Webshare API.
 *
 * @returns {Promise<Proxy[]>} A promise that resolves to an array of proxies.
 * @throws Will throw an error if the request fails.
 */
export async function getProxies(): Promise<Proxy[]> {
  try {
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

    return response.data.results;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error fetching proxies:', error.response.data);
      throw new Error(`Error fetching proxies: ${error.response.statusText}`);
    } else {
      console.error('Unknown error:', error);
      throw new Error('Unknown error occurred');
    }
  }
}
