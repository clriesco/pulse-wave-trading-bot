// src/proxy.ts
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
import logger from './logger';
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
