// src/quantfury.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { QUANTFURY_TOKEN, QUANTFURY_DEVICEID } from './config';
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
  type OrderType,
} from './types';
import { isAxiosError } from './utils';

const BASE_URL = 'https://l1.trdngbcknd.com/v11';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const headers = {
  Authorization: `Bearer ${QUANTFURY_TOKEN}`,
  'Content-Type': 'application/json',
  'Custom-Deviceid': QUANTFURY_DEVICEID,
  'Custom-Platform': '3',
  Accept: 'application/json, text/plain, */*',
  'User-Agent': USER_AGENT,
  'Custom-Language': '0',
};

/**
 * Opens a limit position.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @param {number} [direction=1] - The direction of the position, 1 for long and 2 for short.
 * @param {StopOrder[]} [stop=[]] - The stop orders.
 * @param {TargetOrder[]} [target=[]] - The target orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
async function openLimitPosition(
  price: number,
  amount: number,
  direction = 1,
  stop: StopOrder[] = [],
  target: TargetOrder[] = []
): Promise<QuantfuryResponse | APIError> {
  const priceId = uuidv4();
  const url = `${BASE_URL}/limitOrder/create`;

  const payload: PositionPayload = {
    priceId,
    price,
    executionType: 0,
    value: {
      amountInstrument: amount,
    },
    positionType: direction,
    shortName: 'BTC/USDT',
    stopOrder: stop,
    targetOrder: target,
  };

  try {
    const response = await axios.post<APIResponse<QuantfuryResponse>>(
      url,
      payload,
      {
        headers,
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
 * @param {StopOrder[]} stop - The stop orders.
 * @param {TargetOrder[]} target - The target orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedLimitLongPosition(
  price: number,
  amount: number,
  stop: StopOrder[],
  target: TargetOrder[]
): Promise<QuantfuryResponse | APIError> {
  return openLimitPosition(price, amount, 1, stop, target);
}

/**
 * Opens an extended short limit position with stop and target orders.
 *
 * @param {number} price - The price at which to open the position.
 * @param {number} amount - The amount of the instrument.
 * @param {StopOrder[]} stop - The stop orders.
 * @param {TargetOrder[]} target - The target orders.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedLimitShortPosition(
  price: number,
  amount: number,
  stop: StopOrder[],
  target: TargetOrder[]
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
  const url = `${BASE_URL}/limitOrder/cancel`;
  const payload = { id };

  try {
    const response = await axios.post<APIResponse<any>>(url, payload, {
      headers,
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
 * Opens a market position.
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
  stops: StopOrder[] = []
): Promise<QuantfuryResponse | APIError> {
  const priceResponse = await getCurrentPrice();
  if (!priceResponse) {
    return { error: 'Failed to fetch current price', code: 'error' };
  }

  const url = `${BASE_URL}/positions/open`;

  const payload: PositionPayload = {
    priceId: priceResponse.priceId,
    value: {
      amountInstrument: amount,
    },
    positionType: direction,
    shortName: 'BTC/USDT',
    targetOrder: targets,
    stopOrder: stops,
  };

  try {
    const response = await axios.post<APIResponse<QuantfuryResponse>>(
      url,
      payload,
      {
        headers,
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
 * Opens a long market position.
 *
 * @param {number} amount - The amount of the instrument.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openMarketLongPosition(
  amount: number
): Promise<QuantfuryResponse | APIError> {
  return openMarketPosition(amount, 1);
}

/**
 * Opens a short market position.
 *
 * @param {number} amount - The amount of the instrument.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openMarketShortPosition(
  amount: number
): Promise<QuantfuryResponse | APIError> {
  return openMarketPosition(amount, 2);
}

/**
 * Opens an extended long market position with stop and target orders.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {StopOrder} stop - The stop order.
 * @param {TargetOrder} target - The target order.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedMarketLongPosition(
  amount: number,
  stop: StopOrder,
  target: TargetOrder
): Promise<QuantfuryResponse | APIError> {
  return openMarketPosition(amount, 1, [target], [stop]);
}

/**
 * Opens an extended short market position with stop and target orders.
 *
 * @param {number} amount - The amount of the instrument.
 * @param {StopOrder} stop - The stop order.
 * @param {TargetOrder} target - The target order.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function openExtendedMarketShortPosition(
  amount: number,
  stop: StopOrder,
  target: TargetOrder
): Promise<QuantfuryResponse | APIError> {
  return openMarketPosition(amount, 2, [target], [stop]);
}

/**
 * Updates a trading position with new stop and target orders.
 *
 * @param {string} id - The ID of the trading position to update.
 * @param {orderType} orderType - The type of order to update, 1 for target and 0 for stop.
 * @returns {Promise<QuantfuryResponse | APIError>} A promise that resolves to the API response or an error.
 */
export async function reducePosition(
  id: string,
  orderType: OrderType,
  price: number,
  amount: number
): Promise<QuantfuryResponse | APIError> {
  const url = `${BASE_URL}/reduceOrders/create`;
  const payload = {
    orderType,
    price,
    tradingPositionId: id,
    value: {
      amountInstrument: amount,
    },
  };

  try {
    const response = await axios.post<APIResponse<QuantfuryResponse>>(
      url,
      payload,
      {
        headers,
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
  id: string
): Promise<QuantfuryResponse | APIError> {
  const priceId = uuidv4();
  const url = `${BASE_URL}/positions/close`;
  const payload = { tradingPositionId: id, priceId };

  try {
    const response = await axios.post<APIResponse<any>>(url, payload, {
      headers,
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
  const url = `${BASE_URL}/price`;
  const payload = { shortNames: ['BTC/USDT'] };

  try {
    const response = await axios.post(url, payload, { headers });
    if (response.status === 200) {
      return {
        priceAsk: response.data.data[0].a,
        priceBid: response.data.data[0].b,
        priceId: response.data.data[0].id,
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
  const url = `${BASE_URL}/positions`;

  try {
    const response = await axios.post<GetPositionsResponse>(url, {
      headers,
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
