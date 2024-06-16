// src/quantfury.ts
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
import { v4 as uuidv4 } from 'uuid';
import fakeUserAgent from 'fake-useragent';
import {
  E1_QUANTFURY_TOKEN,
  L1_QUANTFURY_TOKEN,
  QUANTFURY_DEVICEID,
  NO_TRADING,
} from './config';
import {
  PositionPayload,
  StopOrder,
  TargetOrder,
  APIResponse,
  APIError,
  Price,
  QuantfuryResponse,
  GetPositionsResponse,
  PositionResponseData,
  Proxy,
  AxiosProxyConfig,
  ReducePositionData,
  type OrderType,
} from './types';
import { isAxiosError } from './utils/utils';

const BASE_URL = 'trdngbcknd.com/v11';
let USER_AGENT: string = '';
let proxyConfig: AxiosProxyConfig | false = false;

const headers: Record<string, string> = {
  Authorization: `Bearer ${E1_QUANTFURY_TOKEN}`,
  'Content-Type': 'application/json',
  'Custom-Deviceid': QUANTFURY_DEVICEID,
  'Custom-Platform': '3',
  Accept: 'application/json, text/plain, */*',
  'Custom-Language': '0',
};

const optionsHeaders: Record<string, string> = {
  Accept: '*/*',
  'Access-Control-Request-Headers':
    'authorization,content-type,custom-deviceid,custom-language,custom-platform',
  'Access-Control-Request-Method': 'POST',
  Origin: 'https://trading.quantfury.com',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-Dest': 'empty',
  Referer: 'https://trading.quantfury.com/',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8,la;q=0.7',
  Priority: 'u=1, i',
  Connection: 'close',
};

/**
 * The main function that initializes the trading bot.
 * This function fetches the list of proxies and sets the user agent.
 *
 * @param {Proxy | null} proxy - The proxy to use for the bot. If null, no proxy is used.
 * @returns {Promise<void>} A promise that resolves when the bot is initialized.
 */
export async function init(proxy: Proxy | null) {
  USER_AGENT = fakeUserAgent();
  headers['User-Agent'] = USER_AGENT;
  optionsHeaders['User-Agent'] = USER_AGENT;

  if (proxy) {
    proxyConfig = {
      protocol: 'http',
      host: proxy.proxy_address,
      port: proxy.port,
      auth: {
        username: proxy.username,
        password: proxy.password,
      },
    };
  } else {
    proxyConfig = false;
  }
}

/**
 * Opens a limit position. If stop and target orders are provided, an extended position is opened.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @param {number} [direction=1] - The direction of the position, 1 for long and 2 for short.
 * @param {number | null} [stop=null] - The stop orders.
 * @param {number | null} [target=null] - The target orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
async function openLimitPosition(
  price: number,
  amount: number,
  direction = 1,
  stop: number | null = null,
  target: number | null = null
): Promise<QuantfuryResponse | APIError> {
  if (NO_TRADING) {
    return { error: 'Trading is disabled', code: 'error' };
  }
  const priceId = uuidv4();
  const url = `https://e1.${BASE_URL}/limitOrder/create`;

  const payload: PositionPayload = {
    priceId,
    price,
    executionType: 0,
    value: {
      amountInstrument: amount,
    },
    positionType: direction,
    shortName: 'BTC/USDT',
  };
  if (stop) {
    payload.stopOrder = stop;
  }
  if (target) {
    payload.targetOrder = target;
  }

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<APIResponse<QuantfuryResponse>>(
      url,
      payload,
      {
        headers,
        proxy: proxyConfig,
      }
    );
    return response.status === 200
      ? response.data.data
      : {
          error: 'Request failed',
          code: 'error',
          status_code: response.status,
        };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}

/**
 * Opens a long limit position.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openLimitLongPosition(
  price: number,
  amount: number
): Promise<QuantfuryResponse | APIError> {
  return openLimitPosition(price, amount, 1);
}

/**
 * Opens a short limit position.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openLimitShortPosition(
  price: number,
  amount: number
): Promise<QuantfuryResponse | APIError> {
  return openLimitPosition(price, amount, 2);
}

/**
 * Opens an extended long limit position with stop and target orders.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @param {number} target - The target order.
 * @param {number} stop - The stop order.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedLimitLongPosition(
  price: number,
  amount: number,
  target: number,
  stop: number
): Promise<QuantfuryResponse | APIError> {
  return openLimitPosition(price, amount, 1, stop, target);
}

/**
 * Opens an extended short limit position with stop and target orders.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @param {number} target - The target orders.
 * @param {number} stop - The stop orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedLimitShortPosition(
  price: number,
  amount: number,
  target: number,
  stop: number
): Promise<QuantfuryResponse | APIError> {
  return openLimitPosition(price, amount, 2, stop, target);
}

/**
 * Cancels a limit position.
 *
 * @param {string} id - The ID of the position to cancel.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function cancelLimitPosition(
  id: string
): Promise<QuantfuryResponse | APIError> {
  const url = `https://e1.${BASE_URL}/limitOrder/cancel`;
  const payload = { id };

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<APIResponse<any>>(url, payload, {
      headers,
      proxy: proxyConfig,
    });
    return response.status === 200
      ? response.data.data
      : {
          error: 'Request failed',
          code: 'error',
          status_code: response.status,
        };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}

/**
 * Opens a market position. If stop and target orders are provided, an extended position is opened.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {number} [direction=1] - The direction of the position, 1 for long and 2 for short.
 * @param {TargetOrder[]} [targets=[]] - The target orders.
 * @param {StopOrder[]} [stops=[]] - The stop orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
async function openMarketPosition(
  amount: number,
  direction = 1,
  targets: TargetOrder[] = [],
  stops: StopOrder[] = [],
  priceId: string | null = null
): Promise<QuantfuryResponse | APIError> {
  if (NO_TRADING) {
    return { error: 'Trading is disabled', code: 'error' };
  }
  if (!priceId) {
    const priceResponse = await getCurrentPrice();
    if (!priceResponse) {
      return { error: 'Failed to fetch current price', code: 'error' };
    }
    priceId = priceResponse.priceId;
  }
  const url = `https://e1.${BASE_URL}/positions/open`;

  const payload: PositionPayload = {
    priceId,
    value: {
      amountInstrument: amount,
    },
    positionType: direction,
    shortName: 'BTC/USDT',
    targetOrders: targets,
    stopOrders: stops,
  };

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<QuantfuryResponse>(url, payload, {
      headers,
      proxy: proxyConfig,
    });
    if (response.status !== 200) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: response.status,
      };
    }
    if (!response.data.isSuccess) {
      return {
        error: `Failed to open position: ${response.data.error}`,
        code: 'error',
      };
    }
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}

/**
 * Opens a long market position.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {string} [priceId=null] - The price ID to use for the position.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openMarketLongPosition(
  amount: number,
  priceId: string | null = null
): Promise<QuantfuryResponse | APIError> {
  return await openMarketPosition(amount, 1, [], [], priceId);
}

/**
 * Opens a short market position.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {string} [priceId=null] - The price ID to use for the position.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openMarketShortPosition(
  amount: number,
  priceId: string | null = null
): Promise<QuantfuryResponse | APIError> {
  return await openMarketPosition(amount, 2, [], [], priceId);
}

/**
 * Opens an extended long market position with stop and target orders.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {StopOrder} stop - The stop order.
 * @param {TargetOrder} target - The target order.
 * @param {string} [priceId=null] - The price ID to use for the position.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedMarketLongPosition(
  amount: number,
  target: TargetOrder,
  stop: StopOrder,
  priceId: string | null = null
): Promise<QuantfuryResponse | APIError> {
  return await openMarketPosition(amount, 1, [target], [stop], priceId);
}

/**
 * Opens an extended short market position with stop and target orders.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {TargetOrder} target - The target order.
 * @param {StopOrder} stop - The stop order.
 * @param {string} [priceId=null] - The price ID to use for the position.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedMarketShortPosition(
  amount: number,
  target: TargetOrder,
  stop: StopOrder,
  priceId: string | null = null
): Promise<QuantfuryResponse | APIError> {
  return await openMarketPosition(amount, 2, [target], [stop], priceId);
}

/**
 * Updates a trading position with new stop and target orders.
 *
 * @param {string} id - The ID of the trading position to update.
 * @param {orderType} orderType - The type of order to update, 1 for target and 0 for stop.
 * @param {number} price - The price of the order.
 * @param {number} amount - The amount of the instrument.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function reducePosition(
  id: string,
  orderType: OrderType,
  price: number,
  amount: number
): Promise<QuantfuryResponse | APIError> {
  const url = `https://e1.${BASE_URL}/reduceOrders/create`;
  const payload: ReducePositionData = {
    orderType,
    price,
    tradingPositionId: id,
    value: {
      amountInstrument: amount,
    },
  };

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<APIResponse<QuantfuryResponse>>(
      url,
      payload,
      {
        headers,
        proxy: proxyConfig,
      }
    );
    return response.status === 200
      ? response.data.data
      : {
          error: 'Request failed',
          code: 'error',
          status_code: response.status,
        };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}

/**
 * Closes an open trading position.
 *
 * @param {string} id - The ID of the trading position to close.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function closePosition(
  id: string,
  priceId: string = uuidv4()
): Promise<QuantfuryResponse | APIError> {
  const url = `https://e1.${BASE_URL}/positions/close`;
  const payload = { tradingPositionId: id, priceId };

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<APIResponse<any>>(url, payload, {
      headers,
      proxy: proxyConfig,
    });
    return response.status === 200
      ? response.data.data
      : {
          error: 'Request failed',
          code: 'error',
          status_code: response.status,
        };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}

/**
 * Fetches the current price of the instrument.
 *
 * @returns {Promise<Price | null>} A promise that resolves to the current price or null if not found.
 */
export async function getCurrentPrice(): Promise<Price | null> {
  const url = `https://l1.${BASE_URL}/price`;
  const payload = { shortNames: ['BTC/USDT'] };

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const priceHeaders = {
      ...headers,
      Authorization: `Bearer ${L1_QUANTFURY_TOKEN}`,
    };
    const response = await axios.post(url, payload, {
      headers: priceHeaders,
      proxy: proxyConfig,
    });
    if (response.status === 200) {
      return {
        priceAsk: response.data.data[0].a,
        priceBid: response.data.data[0].b,
        priceId: response.data.data[0].i,
      };
    } else {
      console.error(`Request failed with status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching price ID: ${error}`);
    return null;
  }
}

/**
 * Fetches the current positions.
 *
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function getPositions(): Promise<
  PositionResponseData[] | APIError
> {
  const url = `https://e1.${BASE_URL}/positions`;

  try {
    await axios.options(url, { headers: optionsHeaders, proxy: proxyConfig });
    const response = await axios.post<GetPositionsResponse>(url, {
      headers,
      proxy: proxyConfig,
    });
    return response.status === 200
      ? response.data.data
      : {
          error: 'Request failed',
          code: 'error',
          status_code: response.status,
        };
  } catch (error) {
    if (isAxiosError(error)) {
      return {
        error: 'Request failed',
        code: 'error',
        status_code: error.response.status,
      };
    }
    return { error: 'Unknown error occurred', code: 'error' };
  }
}
