// src/types.ts
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

export interface AxiosProxyConfig {
  protocol: string;
  host: string;
  port: number;
  auth: {
    username: string;
    password: string;
  };
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
  stopOrders?: StopOrder[];
  targetOrders?: TargetOrder[];
  stopOrder?: number;
  targetOrder?: number;
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

export interface APIError {
  error: string;
  code: string;
  status_code?: number;
}

export interface QuantfuryResponse {
  code: 'Success' | 'Error';
  data: PositionResponseData;
  isSuccess: boolean;
  error?: string;
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

export interface ProxyAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Proxy[];
}

export interface AxiosConfig {
  headers: Record<string, string>;
  httpAgent?: any;
  httpsAgent?: any;
}
