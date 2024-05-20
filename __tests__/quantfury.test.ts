// src/__tests__/quantfury.test.ts
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

describe('Quantfury API', () => {
  afterEach(() => {
    mock.reset();
  });

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

  test('closePosition should close a position', async () => {
    const mockResponse = {
      id: 'mockPositionId',
      priceId: 'mockPriceId',
    };

    mock
      .onPost('https://l1.trdngbcknd.com/v11/positions/close')
      .reply(200, {
        data: mockResponse,
      })
      .onPost('https://l1.trdngbcknd.com/v11/price')
      .reply(200, {
        data: [{ a: 66884.16, b: 66884.15, id: 'mockPriceId' }],
      })
      .onAny()
      .passThrough();

    const response = await closePosition('mockPositionId');
    expect(response).toEqual(mockResponse);
  });

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
