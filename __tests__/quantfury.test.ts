// src/__tests__/quantfury.test.ts
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
import MockAdapter from 'axios-mock-adapter';
import {
  getCurrentPrice,
  openMarketLongPosition,
  openExtendedMarketLongPosition,
  openMarketShortPosition,
  openExtendedMarketShortPosition,
  closePosition,
  reducePosition,
  getPositions,
} from '../src/quantfury';
import {
  OrderType,
  Price,
  QuantfuryResponse,
  StopOrder,
  TargetOrder,
} from '../src/types';

const mock = new MockAdapter(axios);

/**
 * Tests for the Quantfury API functions.
 * Summary:
 * - getCurrentPrice should fetch the current price.
 * - openMarketLongPosition should open a long position.
 * - openExtendedMarketLongPosition should open an extended long position with stop and target orders.
 * - openMarketShortPosition should open a short position.
 * - openExtendedMarketShortPosition should open an extended short position with stop and target orders.
 * - closePosition should close a position.
 * - reducePosition should reduce a position.
 */
describe('Quantfury API', () => {
  afterEach(() => {
    mock.reset();
  });

  /**
   * Test for getCurrentPrice function.
   *
   * It should fetch the current price. Axios is mocked to return a mock price.
   */
  test('getCurrentPrice should fetch the current price', async () => {
    const mockPrice: Price = {
      priceAsk: 66884.16,
      priceBid: 66884.15,
      priceId: 'mockPriceId',
    };

    mock.onPost('https://l1.trdngbcknd.com/v11/price').reply(200, {
      data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
    });

    const price = await getCurrentPrice();
    expect(price).toEqual(mockPrice);
  });

  /**
   * Test for openMarketLongPosition function.
   *
   * It should open a long position. Axios is mocked to return a mock response.
   */
  test('openMarketLongPosition should open a long position', async () => {
    const mockResponse: QuantfuryResponse = {
      code: 'Success',
      data: {
        id: 'mockPositionId',
        closedPositionPnlAccount: 0,
        operationPrice: 66900,
        position: {
          amountInstrument: 20,
          amountSystem: 20,
          commissionSaved: 0,
          id: 'mockPositionId',
          investedAmountInstrument: 1,
          isAverageOpenPrice: false,
          openDate: new Date().toISOString(),
          openPrice: 66900,
          positionType: 1,
          quantity: 0.000299267602,
          scalpingModeEndDate: 1716195572495,
          sessionId: 'mockSessionId',
          shortName: 'BTC/USDT',
          spreadAdjustmentEndDate: 1716191972499,
          stopOrders: [],
          targetOrders: [],
          tradingMode: 0,
        },
      },
      isSuccess: true,
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions/open')
      .reply(200, {
        data: mockResponse.data,
      })
      .onPost('https://l1.trdngbcknd.com/v11/price')
      .reply(200, {
        data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
      })
      .onAny()
      .passThrough();

    const response = await openMarketLongPosition(20);
    expect(response).toEqual(mockResponse.data);
  });

  /**
   * Test for openExtendedMarketLongPosition function.
   *
   * It should open an extended long position with stop and target orders. Axios is mocked to return a mock response.
   */
  test('openExtendedMarketLongPosition should open an extended long position with stop and target orders', async () => {
    const stopOrder: StopOrder = { price: 66200, amount: 1 };
    const targetOrder: TargetOrder = { price: 67000, amount: 1 };
    const mockResponse: QuantfuryResponse = {
      code: 'Success',
      data: {
        id: 'mockPositionId',
        closedPositionPnlAccount: 0,
        operationPrice: 66900,
        position: {
          amountInstrument: 20,
          amountSystem: 20,
          commissionSaved: 0,
          id: 'mockPositionId',
          investedAmountInstrument: 1,
          isAverageOpenPrice: false,
          openDate: new Date().toISOString(),
          openPrice: 66900,
          positionType: 1,
          quantity: 0.000299267602,
          scalpingModeEndDate: 1716195572495,
          sessionId: 'mockSessionId',
          shortName: 'BTC/USDT',
          spreadAdjustmentEndDate: 1716191972499,
          stopOrders: [stopOrder],
          targetOrders: [targetOrder],
          tradingMode: 0,
        },
      },
      isSuccess: true,
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions/open')
      .reply(200, {
        data: mockResponse.data,
      })
      .onPost('https://l1.trdngbcknd.com/v11/price')
      .reply(200, {
        data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
      })
      .onAny()
      .passThrough();

    const response = await openExtendedMarketLongPosition(
      1,
      stopOrder,
      targetOrder
    );
    expect(response).toEqual(mockResponse.data);
  });

  /**
   * Test for openMarketShortPosition function.
   *
   * It should open a short position. Axios is mocked to return a mock response.
   */
  test('openMarketShortPosition should open a short position', async () => {
    const mockResponse: QuantfuryResponse = {
      code: 'Success',
      data: {
        id: 'mockPositionId',
        closedPositionPnlAccount: 0,
        operationPrice: 50000,
        position: {
          amountInstrument: 20,
          amountSystem: 20,
          commissionSaved: 0,
          id: 'mockPositionId',
          investedAmountInstrument: 1,
          isAverageOpenPrice: false,
          openDate: new Date().toISOString(),
          openPrice: 66900,
          positionType: 2,
          quantity: 0.000299267602,
          scalpingModeEndDate: 1716195572495,
          sessionId: 'mockSessionId',
          shortName: 'BTC/USDT',
          spreadAdjustmentEndDate: 1716191972499,
          stopOrders: [],
          targetOrders: [],
          tradingMode: 0,
        },
      },
      isSuccess: true,
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions/open')
      .reply(200, {
        data: mockResponse.data,
      })
      .onPost('https://l1.trdngbcknd.com/v11/price')
      .reply(200, {
        data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
      })
      .onAny()
      .passThrough();

    const response = await openMarketShortPosition(1);
    expect(response).toEqual(mockResponse.data);
  });

  /**
   * Test for openExtendedMarketShortPosition function.
   *
   * It should open an extended short position with stop and target orders. Axios is mocked to return a mock response.
   */
  test('openExtendedMarketShortPosition should open an extended short position with stop and target orders', async () => {
    const stopOrder: StopOrder = { price: 51000, amount: 1 };
    const targetOrder: TargetOrder = { price: 49000, amount: 1 };
    const mockResponse: QuantfuryResponse = {
      code: 'Success',
      data: {
        id: 'mockPositionId',
        closedPositionPnlAccount: 0,
        operationPrice: 50000,
        position: {
          amountInstrument: 20,
          amountSystem: 20,
          commissionSaved: 0,
          id: 'mockPositionId',
          investedAmountInstrument: 1,
          isAverageOpenPrice: false,
          openDate: new Date().toISOString(),
          openPrice: 66900,
          positionType: 2,
          quantity: 0.000299267602,
          scalpingModeEndDate: 1716195572495,
          sessionId: 'mockSessionId',
          shortName: 'BTC/USDT',
          spreadAdjustmentEndDate: 1716191972499,
          stopOrders: [stopOrder],
          targetOrders: [targetOrder],
          tradingMode: 0,
        },
      },
      isSuccess: true,
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions/open')
      .reply(200, {
        data: mockResponse.data,
      })
      .onPost('https://l1.trdngbcknd.com/v11/price')
      .reply(200, {
        data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
      })
      .onAny()
      .passThrough();

    const response = await openExtendedMarketShortPosition(
      1,
      stopOrder,
      targetOrder
    );
    expect(response).toEqual(mockResponse.data);
  });

  /**
   * Test for closePosition function.
   *
   * It should close a position. Axios is mocked to return a mock response.
   */
  test('closePosition should close a position', async () => {
    const mockPositions = [
      {
        amountInstrument: 20,
        amountSystem: 20,
        commissionSaved: 0,
        id: 'mockPositionId',
        investedAmountInstrument: 1,
        isAverageOpenPrice: false,
        openDate: new Date().toISOString(),
        openPrice: 66900,
        positionType: 1,
        quantity: 0.000299267602,
        scalpingModeEndDate: 1716195572495,
        sessionId: 'mockSessionId',
        shortName: 'BTC/USDT',
        spreadAdjustmentEndDate: 1716191972499,
        stopOrders: [],
        targetOrders: [],
        tradingMode: 0,
      },
    ];
    const mockResponse = {
      id: 'mockPositionId',
      priceId: 'mockPriceId',
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions')
      .reply(200, {
        data: mockPositions,
      })
      .onPost('https://l1.trdngbcknd.com/v11/positions/close')
      .reply(200, {
        data: mockResponse,
      })
      .onAny()
      .passThrough();

    const positions = await getPositions();
    expect(positions).toEqual(mockPositions);

    if ('error' in positions) {
      throw new Error(`Failed to fetch positions: ${positions.error}`);
    }

    const response = await closePosition(positions[0].id);
    expect(response).toEqual(mockResponse);
  });

  /**
   * Test for reducePosition function.
   *
   * It should reduce a position. Axios is mocked to return a mock response.
   */
  test('reducePosition should reduce a position', async () => {
    const mockPositions = [
      {
        amountInstrument: 20,
        amountSystem: 20,
        commissionSaved: 0,
        id: 'mockPositionId',
        investedAmountInstrument: 1,
        isAverageOpenPrice: false,
        openDate: new Date().toISOString(),
        openPrice: 66900,
        positionType: 1,
        quantity: 0.000299267602,
        scalpingModeEndDate: 1716195572495,
        sessionId: 'mockSessionId',
        shortName: 'BTC/USDT',
        spreadAdjustmentEndDate: 1716191972499,
        stopOrders: [],
        targetOrders: [],
        tradingMode: 0,
      },
    ];

    const mockReduceTargetResponse = {
      id: 'mockPriceTargetId',
      tradingPositionId: 'mockPositionId',
      orderType: OrderType.TARGET,
      price: 67200.0,
      quantity: mockPositions[0].quantity,
      amountInstrument: 20.0,
      amountSystem: 20.0,
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions')
      .reply(200, {
        data: mockPositions,
      })
      .onPost('https://l1.trdngbcknd.com/v11/reduceOrders/create')
      .reply(200, {
        data: mockReduceTargetResponse,
      })
      .onAny()
      .passThrough();

    const positions = await getPositions();
    expect(positions).toEqual(mockPositions);

    const response = await reducePosition(
      'mockPositionId',
      OrderType.TARGET,
      67200,
      20
    );

    expect(response).toEqual(mockReduceTargetResponse);
  });
});
