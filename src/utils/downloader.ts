// src/downloadBitcoinKlines.ts
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
import fs from 'fs';
import { parseISO } from 'date-fns';
import { HttpsProxyAgent } from 'https-proxy-agent';
import logger from './logger';
import { getProxies } from './proxy';
import { Proxy } from '../types';

const symbol = 'BTCUSDT';
const interval = '1s';
const limit = 1000;

const baseURL = 'https://api.binance.com/api/v3';
const parallelDownloads = 20; // Número de descargas en paralelo
const tempProgressFile = 'data/progress.json'; // Archivo temporal para guardar progreso

/**
 * Fetches klines from the Binance API using a proxy
 *
 * @param {number} startTime - Timestamp in milliseconds
 * @param {number} endTime - Timestamp in milliseconds
 * @param {Proxy | null} proxy - The proxy configuration to use for the request
 * @returns {Promise<any[]>}
 */
async function fetchKlines(
  startTime: number,
  endTime: number,
  proxy: Proxy | null
) {
  const url = `${baseURL}/klines`;
  const params = {
    symbol,
    interval,
    startTime,
    endTime,
    limit,
  };

  try {
    let response;
    if (proxy !== null) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);
      response = await axios.get(url, {
        params,
        httpAgent: agent,
        httpsAgent: agent,
      });
    } else {
      response = await axios.get(url, { params });
    }

    return response.data;
  } catch (error) {
    logger.error(`Error fetching klines: ${(error as any).message}`);
    return [];
  }
}

/**
 * Saves the current progress to a temporary file.
 *
 * @param {number} startTime - The current start time to save.
 */
function saveProgress(startTime: number) {
  fs.writeFileSync(tempProgressFile, JSON.stringify({ startTime }));
}

/**
 * Reads the progress from a temporary file.
 *
 * @returns {number} - The start time read from the file.
 */
function readProgress(): number {
  if (fs.existsSync(tempProgressFile)) {
    const data = JSON.parse(fs.readFileSync(tempProgressFile, 'utf-8'));
    return data.startTime;
  }
  return parseISO('2020-11-30T05:59:59.000Z').getTime();
}

/**
 * Downloads Bitcoin klines from the Binance API using proxies
 *
 * The data is saved in a CSV file named "btc_1s_klines.csv"
 * @returns {Promise<void>}
 */
async function downloadBitcoinKlines() {
  let allKlines: any[] = [];
  let startTime = readProgress(); // Leer el progreso anterior
  const endTime = Date.now();

  const proxies = await getProxies();
  let proxyIndex = 0;

  const segmentDuration = limit * 1000; // 1000 segundos

  // Escribir encabezado del CSV si el archivo no existe
  if (!fs.existsSync('data/btc_1s_klines.csv')) {
    fs.writeFileSync(
      'data/btc_1s_klines.csv',
      'timestamp,open,high,low,close,volume\n'
    );
  }

  // eslint-disable-next-line no-constant-condition
  while (startTime < endTime) {
    const downloadTasks = [];

    for (let i = 0; i < parallelDownloads; i++) {
      const proxy = proxies[proxyIndex];
      proxyIndex = (proxyIndex + 1) % proxies.length;

      const segmentStartTime = startTime + i * segmentDuration;
      const segmentEndTime = segmentStartTime + segmentDuration;

      if (segmentStartTime >= endTime) break;

      downloadTasks.push(fetchKlines(segmentStartTime, segmentEndTime, proxy));
    }

    let klinesSegments: any[];

    try {
      klinesSegments = await Promise.all(downloadTasks);

      klinesSegments.forEach((klines) => {
        allKlines = allKlines.concat(klines);
      });
    } catch (error) {
      logger.error(`Error during download tasks: ${(error as any).message}`);
      continue; // Continúa con la siguiente iteración en caso de error
    }

    if (klinesSegments.every((segment) => segment.length === 0)) {
      logger.info('No more data available from Binance API.');
      break;
    }

    // Update startTime for the next batch of requests
    startTime += parallelDownloads * segmentDuration;

    // Guardar progreso actual
    saveProgress(startTime);

    // Guardar datos incrementales
    const incrementalCsvData =
      allKlines.map((entry) => entry.slice(0, 6).join(',')).join('\n') + '\n';
    fs.appendFileSync('data/btc_1s_klines.csv', incrementalCsvData);

    logger.info(
      `Fetched ${allKlines.length} klines up to ${new Date(startTime).toISOString()}`
    );

    allKlines.length = 0; // Limpiar array después de guardar
  }

  logger.info('Bitcoin klines downloaded successfully.');
}

downloadBitcoinKlines();
