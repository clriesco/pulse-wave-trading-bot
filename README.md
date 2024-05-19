# CPI Trading Strategy

## Author

**Charly López**

- [GitHub](https://github.com/clriesco)
- [LinkedIn](https://www.linkedin.com/in/carloslopezriesco/)

## Overview

The CPI Trading Strategy project is a trading bot that executes trades based on the Consumer Price Index (CPI) data from the Bureau of Labor Statistics. The algorithm utilizes proxies to scrape CPI data and executes trading strategies on the Quantfury platform depending on the CPI value obtained.

## Features

- Proxy Rotation: Utilizes a pool of proxies to scrape CPI data, rotating between them to avoid rate limits and blocking.
- CPI Data Scraping: Fetches CPI data from the Bureau of Labor Statistics website.
- Trading Strategy Execution: Executes long or short trades based on the CPI value compared to a predefined threshold.
- Error Handling: Includes robust error handling to manage failed requests and retries.

## Prerequisites

- Node.js (>=14.x)
- npm (>=6.x)

## Installation

1. Clone the Repository:

   ```bash
   git clone https://github.com/clriesco/cpi-strategy.git
   cd cpi-strategy
   ```

2. Install Dependencies:

   ```bash
   npm install
   ```

3. Set Up Environment Variables:

   Create a .env file in the root directory and add the following environment variables:

   ```plaintext
   WEB_SHARE_API_KEY=your_webshare_api_key
   PROXY_API_URL=https://proxy.webshare.io/api/v2/proxy/list
   CPI_URL=https://data.bls.gov/timeseries/CUSR0000SA0&output_view=pct_1mth
   CHECK_INTERVAL_SECONDS=10
   VALUE_THRESHOLD=0.5
   QUANTFURY_TOKEN=your_quantfury_token
   QUANTFURY_DEVICEID=your_quantfury_deviceid
   ```

## Configuration

### Environment Variables

- **WEB_SHARE_API_KEY**: API key for accessing WebShare proxy services.
- **PROXY_API_URL**: URL for fetching the list of proxies from WebShare.
- **CPI_URL**: URL for fetching CPI data.
- **CHECK_INTERVAL_SECONDS**: Interval in seconds for checking CPI data.
- **VALUE_THRESHOLD**: Threshold value for executing the trading strategy.
- **QUANTFURY_TOKEN**: API token for accessing the Quantfury trading platform.
- **QUANTFURY_DEVICEID**: Device ID for authenticating with the Quantfury trading platform.

## Running the Project

### Build the Project:

    ```bash
    npm run build
    ```

### Start the Project:

    ```bash
    npm start
    ```

### Debug the Project:

    To start the project in debug mode:

    ```bash
    npm run debug
    ```

## Project Structure

- src/
  - config.ts: Contains configuration constants and environment variable loading.
  - index.ts: Main entry point of the application.
  - proxy.ts: Handles fetching and rotating proxies.
  - scraper.ts: Scrapes CPI data using proxies.
  - strategy.ts: Defines and executes the trading strategy.
  - quantfury.ts: Contains functions to interact with the Quantfury trading platform.
  - types.ts: Type definitions for the project.
  - utils.ts: Utility functions, including error handling.

## How It Works

### Proxy Rotation

The algorithm fetches a list of proxies from the WebShare API and rotates through them to access the CPI data URL. This helps to avoid getting blocked by the target server due to too many requests from a single IP address.

### CPI Data Scraping

The scraper module accesses the Bureau of Labor Statistics website using the proxies to fetch the CPI data. The CPI value is extracted from a specific cell in the HTML table.

### Trading Strategy

The trading strategy is based on comparing the scraped CPI value to a predefined threshold (VALUE_THRESHOLD). If the CPI value is above the threshold by more than 0.1, a short position is opened. If it is below the threshold by more than 0.1, a long position is opened. If the value is within the threshold range, no action is taken.

### Error Handling

Robust error handling is implemented to manage different types of errors, including failed HTTP requests and JSON parsing errors. The strategy includes retries and logging to ensure the bot continues to operate smoothly.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.
