# PULSE WAVE TRADING BOT

## Economic News Based Trading Strategy

## Author

**Charly López**

- [GitHub](https://github.com/clriesco)
- [LinkedIn](https://www.linkedin.com/in/carloslopezriesco/)

## Overview

The Pulse Wave Trading Bot is a trading bot that executes trades based on various economic indicators, such as the Consumer Price Index (CPI), Gross Domestic Product (GDP) data, Personal Consumption Expenditures Price Index (PCE) value and others. The algorithm utilizes proxies to scrape economic data and executes trading strategies on the Quantfury platform depending on the values obtained.

## Features

- Proxy Rotation: Utilizes a pool of proxies to scrape economic data, rotating between them to avoid rate limits and blocking.
- Economic Data Scraping: Fetches CPI data from the Bureau of Labor Statistics and GDP data from the Bureau of Economic Analysis.
- Trading Strategy Execution: Executes long or short trades based on the CPI or GDP value compared to predefined thresholds.
- Configurable Algorithms: Supports multiple algorithms based on different economic indicators.
- Error Handling: Includes robust error handling to manage failed requests and retries.
- Proxyless Mode: Can operate without proxies if configured.

## Prerequisites

- Node.js (>=14.x)
- npm (>=6.x)

## Installation

1. Clone the Repository:

   ```
   git clone https://github.com/clriesco/pulse-wave-trading-bot.git
   cd pulse-wave-trading-bot
   ```

2. Install Dependencies:

   ```
   npm install
   ```

3. Set Up Environment Variables:

   Create a .env file in the root directory and add the following environment variables:

   ```
    #Proxy Configuration
    WEBSHARE_API_KEY=your_webshare_api_key
    PROXY_API_URL=https://proxy.webshare.io/api/v2/proxy/list

    #Quantfury Configuration
    E1_QUANTFURY_TOKEN=your_e1_quantfury_token
    L1_QUANTFURY_TOKEN=your_l1_quantfury_token
    QUANTFURY_DEVICEID=your_quantfury_deviceid
    STRATEGY_PROXY_INDEX=0

    # CPI Configuration
    CPI_URL=https://data.bls.gov/timeseries/CUSR0000SA0&output_view=pct_1mth
    CPI_VALUE_THRESHOLD=0.5
    CPI_NUM_ROWS=12
    CPI_NUM_COLUMNS=4

    #GDP Configuration
    GDP_URL=https://www.bea.gov/data/gdp/gross-domestic-product
    GDP_VALUE_THRESHOLD=1.3
    GDP_OLD_STAGE=(Adv)

    #PCE Configuration
    PCE_URL=https://www.bea.gov/data/personal-consumption-expenditures-price-index
    PCE_VALUE_THRESHOLD=2.6
    PCE_OLD_STAGE=(Adv)

    #Strategy Configuration
    ACTIVE_ALGORITHM=PCE
    AMOUNT=100
    STOP_LOSS_PERCENTAGE=0.003
    TAKE_PROFIT_PERCENTAGE=0.01

    #Program Configuration
    CHECK_INTERVAL_SECONDS=10
    NO_RECURRENT_FETCH=false
    NO_PROXY=false
   ```

## Configuration

### Environment Variables

- **WEBSHARE_API_KEY**: API key for accessing WebShare proxy services.
- **PROXY_API_URL**: URL for fetching the list of proxies from WebShare.
- **E1_QUANTFURY_TOKEN**: API token for accessing the Quantfury trading platform.
- **L1_QUANTFURY_TOKEN**: API token for fetching price data from the Quantfury trading platform.
- **QUANTFURY_DEVICEID**: Device ID for authenticating with the Quantfury trading platform.
- **CHECK_INTERVAL_SECONDS**: Interval in seconds for checking economic data.
- **CPI_URL**: URL for fetching CPI data.
- **CPI_VALUE_THRESHOLD**: Threshold value for executing the CPI trading strategy.
- **CPI_NUM_ROWS**: Row number in the HTML table corresponding to the CPI value.
- **CPI_NUM_COLUMNS**: Column number in the HTML table corresponding to the CPI value.
- **GDP_URL**: URL for fetching GDP data.
- **GDP_VALUE_THRESHOLD**: Threshold value for executing the GDP trading strategy.
- **GDP_OLD_STAGE**: Old stage of the GDP value announcement.
- **PCE_URL**: URL for fetching PCE Price Index data.
- **PCE_VALUE_THRESHOLD**: Threshold value for executing the PCE Price Index trading strategy.
- **PCE_OLD_STAGE**: Old stage of the PCE Price Index value announcement.
- **ACTIVE_ALGORITHM**: The algorithm to use for trading, either 'CPI', 'GDP' or 'PCE.
- **AMOUNT**: Amount to trade in USDT.
- **STOP_LOSS_PERCENTAGE**: Stop loss percentage.
- **TAKE_PROFIT_PERCENTAGE**: Take profit percentage.
- **STRATEGY_PROXY_INDEX**: Index of the proxy to use for the trading strategy.
- **NO_RECURRENT_FETCH**: If true, the algorithm will only check the value once.
- **NO_PROXY**: If true, the algorithm will not use a proxy.

## Running the Project

### Build the Project:

    ```
    npm run build
    ```

### Start the Project:

    ```
    npm start
    ```

### Debug the Project:

To start the project in debug mode:

    ```
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
  - logger.ts: Colorized logging configuration

## How It Works

### Proxy Rotation

The algorithm fetches a list of proxies from the WebShare API and rotates through them to access the target eco news data URL. This helps to avoid getting blocked by the target server due to too many requests from a single IP address.

### Economic Data Scraping

The scraper module accesses the Bureau of Labor Statistics website using the proxies to fetch the CPI data and the Bureau of Economic Analysis website to fetch the GDP and the PCE Price Index data. The respective values are extracted from specific cells in the HTML tables.

### Trading Strategy

The trading strategy is based on comparing the scraped CPI, GDP or PCE value to a predefined threshold ([PCE|CPI|GDP]VALUE_THRESHOLD).

#### For CPI:

- If the CPI value is above the threshold by more than 0.1, a short position is opened.
- If it is below the threshold by more than 0.1, a long position is opened.
- If the value is within the threshold range, no action is taken.

#### For GDP:

- If the GDP value is below the threshold by more than 0.2, a short position is opened.
- If it is above the threshold by more than 0.2, a long position is opened.
- If the value is within the threshold range, no action is taken.

#### For PCE:

- If the PCE value is above the threshold by more than 0.2, a short position is opened.
- If it is below the threshold by more than 0.2, a long position is opened.
- If the value is within the threshold range, no action is taken.

### Error Handling

Robust error handling is implemented to manage different types of errors, including failed HTTP requests and JSON parsing errors. The strategy includes retries and logging to ensure the bot continues to operate smoothly.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the Apache 2.0 License.
