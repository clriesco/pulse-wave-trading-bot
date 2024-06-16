// src/generateCharts.ts
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
import * as fs from 'fs';
import { BoxPlotData, OhlcData } from 'plotly.js-dist-min';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Result, PriceData, TradeChartData } from './types'; // Asegúrate de tener estos tipos definidos en 'types.ts'
import logger from './utils/logger';
import csvParser from 'csv-parser';
import { binarySearchCSV, readFromFile, readCSVHeader } from './utils/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadPricesFromPosition(
  filePath: string,
  startPosition: number,
  endTime: Date,
  headers: string[]
): Promise<PriceData[]> {
  return new Promise((resolve, reject) => {
    const results: PriceData[] = [];
    const stream = fs
      .createReadStream(filePath, { start: startPosition })
      .pipe(csvParser({ headers }))
      .on('data', (row) => {
        const price = {
          timestamp: new Date(parseInt(row.timestamp, 10)),
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseFloat(row.volume),
        };
        results.push(price);
        if (price.timestamp.getTime() >= endTime.getTime()) {
          stream.pause();
          resolve(results);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}
/**
 * Generate chart data for a trade.
 *
 * @param {Result} trade - The trade data.
 * @param {string} filePath - The path to the OHLC data file.
 * @param {string[]} headers - The headers of the CSV file.
 * @returns {Promise<TradeChartData>}
 */
async function getTradeChartData(
  trade: Result,
  filePath: string,
  headers: string[]
): Promise<TradeChartData> {
  const entryTime = new Date(trade.entryTime);
  const exitTime = new Date(trade.exitTime);
  const startTime = new Date(entryTime.getTime() - 50 * 1000); // 50 segundos antes de la entrada
  const endTime = new Date(exitTime.getTime() + 50 * 1000); // 50 segundos después de la salida

  const startPosition = await binarySearchCSV(filePath, startTime);

  const pre_prices = await loadPricesFromPosition(
    filePath,
    startPosition,
    endTime,
    headers
  );
  const prices = pre_prices.filter(
    (price) => price.timestamp >= startTime && price.timestamp <= endTime
  );

  const entryIndex = prices.findIndex((d) => d.timestamp >= entryTime);
  const exitIndex = prices.findIndex((d) => d.timestamp >= exitTime);

  return {
    entryIndex,
    exitIndex,
    prices,
  };
}

/**
 * Creates and saves a chart for a trade using Puppeteer and Plotly.
 *
 * @param {Result} trade - The trade data.
 * @param {TradeChartData} chartData - The chart data.
 * @param {string} outputFilePath - The path to save the chart.
 */
async function createChart(
  trade: Result,
  chartData: TradeChartData,
  outputFilePath: string
) {
  const { prices, entryIndex, exitIndex } = chartData;

  const ohlc: Partial<OhlcData> = {
    x: prices.map((p) => p.timestamp.toISOString()),
    open: prices.map((p) => p.open),
    high: prices.map((p) => p.high),
    low: prices.map((p) => p.low),
    close: prices.map((p) => p.close),
    type: 'ohlc',
    xaxis: 'x',
    yaxis: 'y',
  };

  const entryMarker: Partial<BoxPlotData> = {
    x: [prices[entryIndex].timestamp.toISOString()],
    y: [prices[entryIndex].open],
    mode: 'markers',
    marker: {
      color: trade.action.startsWith('buy') ? 'green' : 'red',
      symbol: trade.action.startsWith('buy') ? 'triangle-up' : 'triangle-down',
      size: 12,
    },
    name: 'Entry',
  };

  const exitMarker: Partial<BoxPlotData> = {
    x: [prices[exitIndex].timestamp.toISOString()],
    y: [prices[exitIndex].close],
    mode: 'markers',
    marker: {
      color: trade.action.startsWith('buy') ? 'red' : 'green',
      symbol: trade.action.startsWith('buy') ? 'triangle-down' : 'triangle-up',
      size: 12,
    },
    name: 'Exit',
  };

  const layout = {
    title: `Trade Chart: ${trade.event}`,
    xaxis: { title: 'Time' },
    yaxis: { title: 'Price' },
  };

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const templatePath = `file://${join(__dirname, 'public', 'template.html')}`;

  await page.goto(templatePath, {
    waitUntil: 'networkidle0',
  });

  await page.evaluate(
    (ohlc, entryMarker, exitMarker, layout) => {
      const data = [ohlc, entryMarker, exitMarker];
      (window as any).renderChart(data, layout);
    },
    ohlc,
    entryMarker,
    exitMarker,
    layout
  );

  await page.screenshot({ path: outputFilePath });

  await browser.close();
}

/**
 * Generates charts for all trades in the results file.
 *
 * @param {string} resultsFilePath - The path to the results file.
 * @param {string} ohlcFilePath - The path to the OHLC data file.
 * @param {string} outputDir - The directory to save the charts.
 */
async function generateCharts(
  resultsFilePath: string,
  ohlcFilePath: string,
  outputDir: string
) {
  const results = (await readFromFile(resultsFilePath)) as Result[];
  const headers = await readCSVHeader(ohlcFilePath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const [index, trade] of results.entries()) {
    const chartData = await getTradeChartData(trade, ohlcFilePath, headers);
    const outputFilePath = `${outputDir}/trade_${index + 1}.jpg`;
    await createChart(trade, chartData, outputFilePath);
    logger.info(`Saved chart for trade ${index + 1} to ${outputFilePath}`);
  }
}

// Main function
(async () => {
  try {
    const resultsFilePath = 'data/backtest_results.json';
    const ohlcFilePath = 'data/btc_1s_klines.csv';
    const outputDir = 'charts';
    await generateCharts(resultsFilePath, ohlcFilePath, outputDir);
  } catch (error) {
    logger.error('Error generating charts:', error);
  }
})();
