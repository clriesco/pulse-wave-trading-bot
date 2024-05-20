// src/types.ts
export interface Proxy {
  id: string;
  username: string;
  password: string;
  proxy_address: string;
  port: number;
  valid: boolean;
  last_verification: string;
  country_code: string;
  city_name: string;
  created_at: string;
}

export interface PositionPayload {
  priceId: string;
  price?: number;
  executionType?: number;
  value: {
    amountInstrument: number;
  };
  positionType: number;
  shortName: string;
  stopOrder?: StopOrder[];
  targetOrder?: TargetOrder[];
}

export interface StopOrder {
  price: number;
  amount: number;
}

export interface TargetOrder {
  price: number;
  amount: number;
}

export interface Price {
  priceAsk: number;
  priceBid: number;
  priceId: string;
}

export interface QuantfuryResponse {
  code: 'Success' | 'Error';
  data: PositionResponseData;
  isSuccess: boolean;
}

export interface PositionResponseData {
  id: string;
  closedPositionPnlAccount: number;
  operationPrice: number;
  position: PositionData;
}

export interface GetPositionsResponse {
  code: 'Success' | 'Error';
  data: PositionResponseData[];
  isSuccess: boolean;
}

export enum OrderType {
  STOP = 0,
  TARGET = 1,
}

export interface PositionData {
  amountInstrument: number;
  amountSystem: number;
  commissionSaved: number;
  id: string;
  investedAmountInstrument: number;
  isAverageOpenPrice: boolean;
  openDate: string;
  openPrice: number;
  positionType: number;
  quantity: number;
  scalpingModeEndDate: number;
  sessionId: string;
  shortName: string;
  spreadAdjustmentEndDate: number;
  stopOrders: StopOrder[];
  targetOrders: TargetOrder[];
  tradingMode: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: Record<string, any>;
  request?: any;
}

export interface APIError {
  error: string;
  code: string;
  status_code?: number;
}

export interface ProxyAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Proxy[];
}
