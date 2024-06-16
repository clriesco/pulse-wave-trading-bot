// src/analyzeResults.ts
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
import { promisify } from 'util';
import Table from 'cli-table3';
import { Result } from './types';
import logger from './utils/logger';

const readFileAsync = promisify(fs.readFile);

/**
 * Reads the results from the given file.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<Result[]>}
 */
async function readResults(filePath: string): Promise<Result[]> {
  const data = await readFileAsync(filePath, 'utf-8');
  return JSON.parse(data) as Result[];
}

/**
 * Calculates the statistics for the given results.
 *
 * @param {Result[]} results - The results to calculate the statistics for.
 * @returns {Promise<Statistics>}
 */
async function calculateStatistics(results: Result[]) {
  const totalTrades = results.length;
  const winningTrades = results.filter((r) => r.profitOrLoss > 0);
  const losingTrades = results.filter((r) => r.profitOrLoss < 0);
  const falsePositiveTrades = results.filter((r) =>
    r.action.includes('(closed due to no movement)')
  );
  const totalWinningTrades = winningTrades.length;
  const totalLosingTrades = losingTrades.length;
  const totalFalsePositives = falsePositiveTrades.length;

  const totalProfit = winningTrades.reduce(
    (acc, trade) => acc + trade.profitOrLoss,
    0
  );
  const totalLoss = losingTrades.reduce(
    (acc, trade) => acc + trade.profitOrLoss,
    0
  );

  const avgProfit = totalWinningTrades ? totalProfit / totalWinningTrades : 0;
  const avgLoss = totalLosingTrades ? totalLoss / totalLosingTrades : 0;

  const tradeDurations = results.map((r) =>
    Math.abs(new Date(r.entryTime).getTime() - new Date(r.exitTime).getTime())
  );
  const avgTradeDuration =
    tradeDurations.reduce((acc, duration) => acc + duration, 0) / totalTrades;

  // Sharpe ratio
  const meanReturn =
    results.reduce((acc, trade) => acc + trade.profitOrLoss, 0) / totalTrades;
  const stddevReturn = Math.sqrt(
    results.reduce(
      (acc, trade) => acc + Math.pow(trade.profitOrLoss - meanReturn, 2),
      0
    ) / totalTrades
  );
  const sharpeRatio = stddevReturn ? meanReturn / stddevReturn : 0;

  // Sortino ratio
  const downsideDeviation = Math.sqrt(
    results.reduce(
      (acc, trade) =>
        acc + Math.pow(Math.min(0, trade.profitOrLoss - meanReturn), 2),
      0
    ) / totalTrades
  );
  const sortinoRatio = downsideDeviation ? meanReturn / downsideDeviation : 0;

  // Impact, success and failure probabilities for each event
  const eventTypes = [...new Set(results.map((r) => r.event))];
  const eventStats = eventTypes.map((event) => {
    const trades = results.filter((r) => r.event === event);
    const winningTrades = trades.filter((r) => r.profitOrLoss > 0).length;
    const losingTrades = trades.filter((r) => r.profitOrLoss < 0).length;
    const falsePositives = trades.filter((r) =>
      r.action.includes('(closed due to no movement)')
    ).length;

    return {
      event,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      falsePositives,
      impactProbability: trades.length / totalTrades,
      successProbability: winningTrades / trades.length,
      failureProbability: losingTrades / trades.length,
      falsePositiveProbability: falsePositives / trades.length,
    };
  });

  return {
    totalTrades,
    totalWinningTrades,
    totalLosingTrades,
    totalFalsePositives,
    totalProfit,
    totalLoss,
    avgProfit,
    avgLoss,
    avgTradeDuration,
    sharpeRatio,
    sortinoRatio,
    eventStats,
  };
}

/**
 * Displays the statistics in a table.
 *
 * @param {Statistics} stats - The statistics to display.
 * @returns {void}
 */
function displayStatistics(stats: any) {
  const mainStatsTable = new Table({
    head: ['Statistic', 'Value'],
    colWidths: [30, 20],
  });

  mainStatsTable.push(
    ['Total Trades', stats.totalTrades],
    ['Winning Trades', stats.totalWinningTrades],
    ['Losing Trades', stats.totalLosingTrades],
    ['False Positives', stats.totalFalsePositives],
    ['Total Profit', stats.totalProfit.toFixed(2)],
    ['Total Loss', stats.totalLoss.toFixed(2)],
    ['Average Profit', stats.avgProfit.toFixed(2)],
    ['Average Loss', stats.avgLoss.toFixed(2)],
    [
      'Average Trade Duration (seconds)',
      (stats.avgTradeDuration / 1000).toFixed(2),
    ],
    ['Sharpe Ratio', stats.sharpeRatio.toFixed(2)],
    ['Sortino Ratio', stats.sortinoRatio.toFixed(2)]
  );

  logger.info(`
${mainStatsTable.toString()}
    `);

  const eventStatsTable = new Table({
    head: [
      'Event',
      'Total Trades',
      'Winning Trades',
      'Losing Trades',
      'False Positives',
      'Impact Probability (%)',
      'Success Probability (%)',
      'Failure Probability (%)',
      'False Positive Probability (%)',
    ],
    colWidths: [30, 15, 15, 15, 15, 22, 22, 22, 22],
  });

  stats.eventStats.forEach((stat: any) => {
    eventStatsTable.push([
      stat.event,
      stat.totalTrades,
      stat.winningTrades,
      stat.losingTrades,
      stat.falsePositives,
      (stat.impactProbability * 100).toFixed(2),
      (stat.successProbability * 100).toFixed(2),
      (stat.failureProbability * 100).toFixed(2),
      (stat.falsePositiveProbability * 100).toFixed(2),
    ]);
  });

  logger.info(`
${eventStatsTable.toString()}
`);
}

// Main function
(async () => {
  try {
    const results = await readResults('data/backtest_results.json');
    const stats = await calculateStatistics(results);

    logger.info('Backtest Statistics:');
    displayStatistics(stats);

    // Guardar las estadísticas en un archivo JSON
    fs.writeFileSync(
      'data/backtest_statistics.json',
      JSON.stringify(stats, null, 2)
    );
  } catch (error) {
    console.error('Error calculating statistics:', error);
  }
})();
