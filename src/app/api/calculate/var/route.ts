import { NextResponse } from 'next/server';
import { VaRCalculator } from '@/lib/var/var-calculator';
import { varFormSchema } from '@/lib/var/schema';
import { VaRInput, HistoricalMarketData, MarketDataPoint, VaRAssetType } from '@/lib/var/types';
import { DATA_PROVIDERS } from '@/lib/var/market-data-service';

// Interface for standardized API responses
interface StandardizedAPIResponse {
  dates: string[];
  prices: number[];
  volumes?: number[];
  metadata?: {
    source: string;
    startDate?: string;
    endDate?: string;
    dataPoints?: number;
    [key: string]: any;
  };
}

/**
 * Server-side implementation of market data fetching
 * 
 * @param provider Data provider name
 * @param assetType Type of asset
 * @param assetIdentifier Asset identifier (ticker, symbol, etc.)
 * @param currency Currency for pricing
 * @param lookbackPeriod Number of days to look back
 * @returns Historical market data
 */
async function fetchServerHistoricalMarketData(
  provider: string,
  assetType: VaRAssetType,
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackPeriod);
    
    let data: HistoricalMarketData;
    
    switch (provider) {
      case DATA_PROVIDERS.YAHOO_FINANCE:
        // Format the symbol according to Yahoo Finance requirements
        let symbol = assetIdentifier;
        if (assetType === VaRAssetType.FOREIGN_EXCHANGE) {
          // Yahoo Finance uses format like EURUSD=X for forex
          if (assetIdentifier.includes('/')) {
            const [base, quote] = assetIdentifier.split('/');
            symbol = `${base}${quote}=X`;
          } else if (assetIdentifier.includes('_')) {
            const [base, quote] = assetIdentifier.split('_');
            symbol = `${base}${quote}=X`;
          } else {
            symbol = `${assetIdentifier}=X`;
          }
        } else if (assetType === VaRAssetType.COMMODITY) {
          // Yahoo Finance uses format like GC=F for gold futures
          if (!symbol.includes('=')) {
            symbol = `${symbol}=F`;
          }
        } else if (assetType === VaRAssetType.CRYPTO) {
          // Yahoo Finance uses format like BTC-USD for crypto
          if (!symbol.includes('-')) {
            symbol = `${symbol}-USD`;
          }
        }
        
        // Construct Yahoo Finance API URL
        const period1 = Math.floor(startDate.getTime() / 1000);
        const period2 = Math.floor(endDate.getTime() / 1000);
        const interval = '1d'; // Daily data
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Yahoo Finance API responded with status ${response.status}: ${await response.text()}`);
        }
        
        const yahooData = await response.json();
        
        // Check if we have valid data
        if (!yahooData.chart || !yahooData.chart.result || yahooData.chart.result.length === 0) {
          throw new Error(`No data found for ${symbol}`);
        }
        
        const result = yahooData.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators.quote[0] || {};
        const adjClose = result.indicators.adjclose?.[0]?.adjclose || [];
        
        // Extract dates and prices
        const dates: string[] = [];
        const prices: number[] = [];
        const volumes: number[] = [];
        
        for (let i = 0; i < timestamps.length; i++) {
          const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
          // Use adjusted close for more accurate historical comparison
          const price = adjClose[i] || quotes.close[i];
          
          if (price !== undefined && price !== null) {
            dates.push(date);
            prices.push(price);
            volumes.push(quotes.volume?.[i] || 0);
          }
        }
        
        // Create historical market data
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: dates.map((date, index) => ({
            date,
            price: prices[index],
            volume: volumes[index] || 0
          })),
          metadata: {
            dataSource: 'Yahoo Finance',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.YAHOO_FINANCE}`,
            startDate: dates[0],
            endDate: dates[dates.length - 1],
            dataPoints: dates.length,
            originalProvider: DATA_PROVIDERS.YAHOO_FINANCE
          }
        };
        break;
        
      case DATA_PROVIDERS.ALPHA_VANTAGE:
        // Alpha Vantage implementation
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey) {
          throw new Error('Alpha Vantage API key not configured');
        }
        
        let alphaVantageFunction = '';
        let alphaVantageSymbol = assetIdentifier;
        
        if (assetType === VaRAssetType.EQUITY) {
          alphaVantageFunction = 'TIME_SERIES_DAILY_ADJUSTED';
        } else if (assetType === VaRAssetType.FOREIGN_EXCHANGE) {
          alphaVantageFunction = 'FX_DAILY';
          if (assetIdentifier.includes('_')) {
            const [from, to] = assetIdentifier.split('_');
            alphaVantageSymbol = `${from}&to_symbol=${to}`;
          } else if (assetIdentifier.includes('/')) {
            const [from, to] = assetIdentifier.split('/');
            alphaVantageSymbol = `${from}&to_symbol=${to}`;
          }
        }
        
        const alphaVantageUrl = `https://www.alphavantage.co/query?function=${alphaVantageFunction}&symbol=${alphaVantageSymbol}&outputsize=full&apikey=${apiKey}`;
        
        const alphaVantageResponse = await fetch(alphaVantageUrl);
        if (!alphaVantageResponse.ok) {
          throw new Error(`Alpha Vantage API responded with status ${alphaVantageResponse.status}`);
        }
        
        const alphaVantageData = await alphaVantageResponse.json();
        
        // Check for error messages
        if (alphaVantageData['Error Message']) {
          throw new Error(`Alpha Vantage error: ${alphaVantageData['Error Message']}`);
        }
        
        // Parse the response based on the function used
        const alphaVantageDates: string[] = [];
        const alphaVantagePrices: number[] = [];
        const alphaVantageVolumes: number[] = [];
        
        if (alphaVantageFunction === 'TIME_SERIES_DAILY_ADJUSTED') {
          const timeSeries = alphaVantageData['Time Series (Daily)'];
          if (!timeSeries) {
            throw new Error('No time series data found in Alpha Vantage response');
          }
          
          // Convert to arrays and sort by date
          Object.entries(timeSeries)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .forEach(([date, values]: [string, any]) => {
              alphaVantageDates.push(date);
              alphaVantagePrices.push(parseFloat(values['5. adjusted close']));
              alphaVantageVolumes.push(parseInt(values['6. volume'], 10));
            });
        } else if (alphaVantageFunction === 'FX_DAILY') {
          const timeSeries = alphaVantageData['Time Series FX (Daily)'];
          if (!timeSeries) {
            throw new Error('No forex data found in Alpha Vantage response');
          }
          
          // Convert to arrays and sort by date
          Object.entries(timeSeries)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .forEach(([date, values]: [string, any]) => {
              alphaVantageDates.push(date);
              alphaVantagePrices.push(parseFloat(values['4. close']));
              // No volume for forex
              alphaVantageVolumes.push(0);
            });
        }
        
        // Filter to lookback period
        const startDateStr = startDate.toISOString().split('T')[0];
        const filteredIndices = alphaVantageDates.reduce((indices, date, index) => {
          if (date >= startDateStr) {
            indices.push(index);
          }
          return indices;
        }, [] as number[]);
        
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: filteredIndices.map(i => ({
            date: alphaVantageDates[i],
            price: alphaVantagePrices[i],
            volume: alphaVantageVolumes[i]
          })),
          metadata: {
            dataSource: 'Alpha Vantage',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.ALPHA_VANTAGE}`,
            startDate: alphaVantageDates[filteredIndices[0]],
            endDate: alphaVantageDates[filteredIndices[filteredIndices.length - 1]],
            dataPoints: filteredIndices.length,
            originalProvider: DATA_PROVIDERS.ALPHA_VANTAGE
          }
        };
        break;
        
      case DATA_PROVIDERS.COINGECKO:
        // CoinGecko implementation for cryptocurrencies
        if (assetType !== VaRAssetType.CRYPTO) {
          throw new Error('CoinGecko only supports cryptocurrency data');
        }
        
        // Format the coin ID (lowercase, no spaces)
        const coinId = assetIdentifier.toLowerCase().replace(/\s+/g, '-');
        
        // Calculate days parameter (add buffer for weekends/holidays)
        const days = Math.min(Math.ceil(lookbackPeriod * 1.2), 365);
        
        const coinGeckoUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}`;
        
        const coinGeckoResponse = await fetch(coinGeckoUrl);
        if (!coinGeckoResponse.ok) {
          throw new Error(`CoinGecko API responded with status ${coinGeckoResponse.status}: ${await coinGeckoResponse.text()}`);
        }
        
        const coinGeckoData = await coinGeckoResponse.json();
        
        if (!coinGeckoData.prices || !Array.isArray(coinGeckoData.prices)) {
          throw new Error('Invalid response format from CoinGecko API');
        }
        
        const coinGeckoDates: string[] = [];
        const coinGeckoPrices: number[] = [];
        const coinGeckoVolumes: number[] = [];
        
        // Process price data
        coinGeckoData.prices.forEach((item: [number, number]) => {
          const timestamp = item[0];
          const price = item[1];
          
          const date = new Date(timestamp).toISOString().split('T')[0];
          coinGeckoDates.push(date);
          coinGeckoPrices.push(price);
        });
        
        // Process volume data if available
        if (coinGeckoData.total_volumes && Array.isArray(coinGeckoData.total_volumes)) {
          coinGeckoData.total_volumes.forEach((item: [number, number], index: number) => {
            if (index < coinGeckoDates.length) {
              coinGeckoVolumes[index] = item[1];
            }
          });
        } else {
          // Fill with zeros if volume data is not available
          coinGeckoVolumes.fill(0, 0, coinGeckoDates.length);
        }
        
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: coinGeckoDates.map((date, index) => ({
            date,
            price: coinGeckoPrices[index],
            volume: coinGeckoVolumes[index] || 0
          })),
          metadata: {
            dataSource: 'CoinGecko',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.COINGECKO}`,
            startDate: coinGeckoDates[0],
            endDate: coinGeckoDates[coinGeckoDates.length - 1],
            dataPoints: coinGeckoDates.length,
            originalProvider: DATA_PROVIDERS.COINGECKO
          }
        };
        break;
        
      case DATA_PROVIDERS.FRED:
        // FRED implementation for interest rates and economic data
        if (assetType !== VaRAssetType.INTEREST_RATE) {
          throw new Error('FRED is primarily used for interest rate data');
        }
        
        const fredApiKey = process.env.FRED_API_KEY;
        if (!fredApiKey) {
          throw new Error('FRED API key not configured');
        }
        
        // Format dates for FRED API
        const fredStartDate = startDate.toISOString().split('T')[0];
        const fredEndDate = endDate.toISOString().split('T')[0];
        
        // Construct FRED API URL
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${assetIdentifier}&api_key=${fredApiKey}&file_type=json&observation_start=${fredStartDate}&observation_end=${fredEndDate}&sort_order=asc`;
        
        const fredResponse = await fetch(fredUrl);
        if (!fredResponse.ok) {
          throw new Error(`FRED API responded with status ${fredResponse.status}: ${await fredResponse.text()}`);
        }
        
        const fredData = await fredResponse.json();
        
        if (!fredData.observations || !Array.isArray(fredData.observations)) {
          throw new Error('Invalid response format from FRED API');
        }
        
        const fredDates: string[] = [];
        const fredValues: number[] = [];
        
        // Process FRED data
        fredData.observations.forEach((observation: any) => {
          if (observation.value !== '.') { // FRED uses '.' for missing values
            fredDates.push(observation.date);
            fredValues.push(parseFloat(observation.value));
          }
        });
        
        // For interest rates, we don't have volume data
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: fredDates.map((date, index) => ({
            date,
            price: fredValues[index],
            volume: 0 // No volume data for interest rates
          })),
          metadata: {
            dataSource: 'Federal Reserve Economic Data (FRED)',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.FRED}, Series: ${assetIdentifier}`,
            startDate: fredDates[0],
            endDate: fredDates[fredDates.length - 1],
            dataPoints: fredDates.length,
            originalProvider: DATA_PROVIDERS.FRED
          }
        };
        break;
        
      case DATA_PROVIDERS.MARKETSTACK:
        // Marketstack implementation for equity data
        if (assetType !== VaRAssetType.EQUITY) {
          throw new Error('Marketstack is primarily used for equity data');
        }
        
        const marketstackApiKey = process.env.MARKETSTACK_API_KEY;
        if (!marketstackApiKey) {
          throw new Error('Marketstack API key not configured');
        }
        
        // Format dates for Marketstack API
        const marketstackStartDate = startDate.toISOString().split('T')[0];
        const marketstackEndDate = endDate.toISOString().split('T')[0];
        
        // Construct Marketstack API URL
        const marketstackUrl = `http://api.marketstack.com/v1/eod?access_key=${marketstackApiKey}&symbols=${assetIdentifier}&date_from=${marketstackStartDate}&date_to=${marketstackEndDate}&limit=1000`;
        
        const marketstackResponse = await fetch(marketstackUrl);
        if (!marketstackResponse.ok) {
          throw new Error(`Marketstack API responded with status ${marketstackResponse.status}: ${await marketstackResponse.text()}`);
        }
        
        const marketstackData = await marketstackResponse.json();
        
        if (!marketstackData.data || !Array.isArray(marketstackData.data)) {
          throw new Error('Invalid response format from Marketstack API');
        }
        
        // Sort data by date (oldest first)
        marketstackData.data.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const marketstackDates: string[] = [];
        const marketstackPrices: number[] = [];
        const marketstackVolumes: number[] = [];
        
        // Process Marketstack data
        marketstackData.data.forEach((item: any) => {
          marketstackDates.push(item.date.split('T')[0]);
          marketstackPrices.push(item.adj_close || item.close);
          marketstackVolumes.push(item.volume || 0);
        });
        
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: marketstackDates.map((date, index) => ({
            date,
            price: marketstackPrices[index],
            volume: marketstackVolumes[index]
          })),
          metadata: {
            dataSource: 'Marketstack',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.MARKETSTACK}`,
            startDate: marketstackDates[0],
            endDate: marketstackDates[marketstackDates.length - 1],
            dataPoints: marketstackDates.length,
            originalProvider: DATA_PROVIDERS.MARKETSTACK
          }
        };
        break;
        
      case DATA_PROVIDERS.FINNHUB:
        // Finnhub implementation for stocks, forex, and crypto
        const finnhubApiKey = process.env.FINNHUB_API_KEY;
        if (!finnhubApiKey) {
          throw new Error('Finnhub API key not configured');
        }
        
        // Convert dates to UNIX timestamps for Finnhub
        const finnhubFrom = Math.floor(startDate.getTime() / 1000);
        const finnhubTo = Math.floor(endDate.getTime() / 1000);
        
        // Adjust symbol format based on asset type
        let finnhubSymbol = assetIdentifier;
        let resolution = 'D'; // Daily candles
        
        if (assetType === VaRAssetType.FOREIGN_EXCHANGE) {
          // Finnhub uses format like OANDA:EUR_USD for forex
          if (!finnhubSymbol.includes(':')) {
            if (finnhubSymbol.includes('/')) {
              const [base, quote] = finnhubSymbol.split('/');
              finnhubSymbol = `OANDA:${base}_${quote}`;
            } else if (finnhubSymbol.includes('_')) {
              finnhubSymbol = `OANDA:${finnhubSymbol}`;
            } else {
              throw new Error('Invalid forex symbol format for Finnhub');
            }
          }
        } else if (assetType === VaRAssetType.CRYPTO) {
          // Finnhub uses format like BINANCE:BTCUSDT for crypto
          if (!finnhubSymbol.includes(':')) {
            finnhubSymbol = `BINANCE:${finnhubSymbol}USDT`;
          }
        }
        
        // Construct Finnhub API URL
        const finnhubUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=${resolution}&from=${finnhubFrom}&to=${finnhubTo}&token=${finnhubApiKey}`;
        
        const finnhubResponse = await fetch(finnhubUrl);
        if (!finnhubResponse.ok) {
          throw new Error(`Finnhub API responded with status ${finnhubResponse.status}: ${await finnhubResponse.text()}`);
        }
        
        const finnhubData = await finnhubResponse.json();
        
        if (finnhubData.s === 'no_data') {
          throw new Error(`No data found for ${finnhubSymbol} in Finnhub`);
        }
        
        if (!finnhubData.t || !finnhubData.c) {
          throw new Error('Invalid response format from Finnhub API');
        }
        
        const finnhubDates: string[] = [];
        const finnhubPrices: number[] = [];
        const finnhubVolumes: number[] = [];
        
        // Process Finnhub data
        for (let i = 0; i < finnhubData.t.length; i++) {
          const date = new Date(finnhubData.t[i] * 1000).toISOString().split('T')[0];
          finnhubDates.push(date);
          finnhubPrices.push(finnhubData.c[i]); // Close price
          finnhubVolumes.push(finnhubData.v?.[i] || 0); // Volume
        }
        
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: finnhubDates.map((date, index) => ({
            date,
            price: finnhubPrices[index],
            volume: finnhubVolumes[index]
          })),
          metadata: {
            dataSource: 'Finnhub',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.FINNHUB}`,
            startDate: finnhubDates[0],
            endDate: finnhubDates[finnhubDates.length - 1],
            dataPoints: finnhubDates.length,
            originalProvider: DATA_PROVIDERS.FINNHUB
          }
        };
        break;
        
      case DATA_PROVIDERS.OPEN_EXCHANGE_RATES:
        // Open Exchange Rates implementation for forex
        if (assetType !== VaRAssetType.FOREIGN_EXCHANGE) {
          throw new Error('Open Exchange Rates is only for foreign exchange data');
        }
        
        const openExchangeRatesApiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY;
        if (!openExchangeRatesApiKey) {
          throw new Error('Open Exchange Rates API key not configured');
        }
        
        // Parse the currency pair
        let baseCurrency = 'USD'; // OER uses USD as base by default
        let quoteCurrency = currency;
        
        if (assetIdentifier.includes('/')) {
          [baseCurrency, quoteCurrency] = assetIdentifier.split('/');
        } else if (assetIdentifier.includes('_')) {
          [baseCurrency, quoteCurrency] = assetIdentifier.split('_');
        } else if (assetIdentifier.length === 6) {
          // Format like EURUSD
          baseCurrency = assetIdentifier.substring(0, 3);
          quoteCurrency = assetIdentifier.substring(3, 6);
        }
        
        // For historical data, we need to make multiple API calls
        // OER free plan only allows historical data for USD base
        // For non-USD base, we'll need to convert
        
        const oerDates: string[] = [];
        const oerPrices: number[] = [];
        
        // Calculate the number of days to fetch
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // For demo purposes, we'll limit the number of API calls
        const maxDays = Math.min(daysDiff, 30); // Limit to 30 days to avoid too many API calls
        
        // Generate dates to fetch
        for (let i = 0; i < maxDays; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          oerDates.push(date.toISOString().split('T')[0]);
        }
        
        // Fetch data for each date
        const oerPromises = oerDates.map(async (date) => {
          const formattedDate = date.replace(/-/g, '');
          const oerUrl = `https://openexchangerates.org/api/historical/${formattedDate}.json?app_id=${openExchangeRatesApiKey}&symbols=${quoteCurrency}`;
          
          const response = await fetch(oerUrl);
          if (!response.ok) {
            return null; // Skip failed requests
          }
          
          const data = await response.json();
          if (!data.rates || !data.rates[quoteCurrency]) {
            return null;
          }
          
          let rate = data.rates[quoteCurrency];
          
          // If base is not USD, we need to convert
          if (baseCurrency !== 'USD') {
            // Get the base currency rate against USD
            const baseUrl = `https://openexchangerates.org/api/historical/${formattedDate}.json?app_id=${openExchangeRatesApiKey}&symbols=${baseCurrency}`;
            const baseResponse = await fetch(baseUrl);
            
            if (baseResponse.ok) {
              const baseData = await baseResponse.json();
              if (baseData.rates && baseData.rates[baseCurrency]) {
                // Convert: rate = (USD/quote) / (USD/base)
                rate = rate / baseData.rates[baseCurrency];
              }
            }
          }
          
          return { date, rate };
        });
        
        // Wait for all requests to complete
        const oerResults = await Promise.all(oerPromises);
        
        // Filter out failed requests and sort by date
        const validResults = oerResults
          .filter(result => result !== null)
          .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
        
        // Extract dates and rates
        const validDates = validResults.map(result => result!.date);
        const validRates = validResults.map(result => result!.rate);
        
        data = {
          assetIdentifier,
          assetType,
          currency: quoteCurrency,
          data: validDates.map((date, index) => ({
            date,
            price: validRates[index],
            volume: 0 // No volume data for exchange rates
          })),
          metadata: {
            dataSource: 'Open Exchange Rates',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.OPEN_EXCHANGE_RATES}, Base: ${baseCurrency}, Quote: ${quoteCurrency}`,
            startDate: validDates[0],
            endDate: validDates[validDates.length - 1],
            dataPoints: validDates.length,
            originalProvider: DATA_PROVIDERS.OPEN_EXCHANGE_RATES
          }
        };
        break;
        
      case DATA_PROVIDERS.WORLD_BANK:
        // World Bank implementation for interest rates and economic indicators
        if (assetType !== VaRAssetType.INTEREST_RATE) {
          throw new Error('World Bank data is primarily used for interest rates and economic indicators');
        }
        
        // Format dates for World Bank API (YYYY format)
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        
        // World Bank indicator code should be provided as assetIdentifier
        // e.g., FR.INR.LEND for lending interest rate
        const worldBankUrl = `https://api.worldbank.org/v2/country/all/indicator/${assetIdentifier}?date=${startYear}:${endYear}&format=json&per_page=1000`;
        
        const worldBankResponse = await fetch(worldBankUrl);
        if (!worldBankResponse.ok) {
          throw new Error(`World Bank API responded with status ${worldBankResponse.status}: ${await worldBankResponse.text()}`);
        }
        
        const worldBankData = await worldBankResponse.json();
        
        if (!Array.isArray(worldBankData) || worldBankData.length < 2 || !Array.isArray(worldBankData[1])) {
          throw new Error('Invalid response format from World Bank API');
        }
        
        const worldBankDates: string[] = [];
        const worldBankValues: number[] = [];
        
        // Process World Bank data
        worldBankData[1].forEach((item: any) => {
          if (item.value !== null) {
            // World Bank data is annual, so we'll use the year as date
            const date = `${item.date}-01-01`; // January 1st of the year
            worldBankDates.push(date);
            worldBankValues.push(parseFloat(item.value));
          }
        });
        
        // Sort by date
        const sortedIndices = worldBankDates
          .map((date, index) => ({ date, index }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(item => item.index);
        
        const sortedDates = sortedIndices.map(i => worldBankDates[i]);
        const sortedValues = sortedIndices.map(i => worldBankValues[i]);
        
        data = {
          assetIdentifier,
          assetType,
          currency,
          data: sortedDates.map((date, index) => ({
            date,
            price: sortedValues[index],
            volume: 0 // No volume data for interest rates
          })),
          metadata: {
            dataSource: 'World Bank',
            dataSourceNotes: `Provider: ${DATA_PROVIDERS.WORLD_BANK}, Indicator: ${assetIdentifier}`,
            startDate: sortedDates[0],
            endDate: sortedDates[sortedDates.length - 1],
            dataPoints: sortedDates.length,
            originalProvider: DATA_PROVIDERS.WORLD_BANK
          }
        };
        break;
        
      // For other providers, we'll use synthetic data as a fallback for now
      default:
        // Generate synthetic data
        data = generateSyntheticHistoricalData([{
          id: '1',
          assetType,
          assetIdentifier,
          quantity: 1,
          currentPrice: 100,
          currency
        }])[0];
        
        // Add metadata to indicate this is synthetic data
        data.metadata = {
          ...data.metadata,
          dataSource: 'Synthetic (Server)',
          dataSourceNotes: 'Using synthetic data as fallback for server-side rendering'
        };
    }
    
    return data;
  } catch (error) {
    console.error(`Server-side data fetch error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * API endpoint for calculating Value at Risk (VaR)
 * 
 * @param request The HTTP request
 * @returns The HTTP response with VaR calculation results
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input using Zod schema
    const validationResult = varFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedInput = validationResult.data;
    
    // Prepare input for VaR calculator
    const varInput: VaRInput = {
      positions: validatedInput.positions.map(position => ({
        ...position,
        quantity: Number(position.quantity),
        currentPrice: Number(position.currentPrice),
        // Convert Date to string if it exists
        purchaseDate: position.purchaseDate ? 
          (position.purchaseDate instanceof Date ? 
            position.purchaseDate.toISOString() : 
            position.purchaseDate) : 
          undefined
      })),
      parameters: {
        timeHorizon: validatedInput.parameters.timeHorizon,
        confidenceLevel: validatedInput.parameters.confidenceLevel,
        calculationMethod: validatedInput.parameters.calculationMethod,
        lookbackPeriod: Number(validatedInput.parameters.lookbackPeriod),
        includeCorrelations: validatedInput.parameters.includeCorrelations,
      },
    };
    
    // If external data is requested, fetch it
    if (validatedInput.useExternalData && validatedInput.dataSource) {
      try {
        // Fetch historical data for each position
        const historicalDataPromises = validatedInput.positions.map(async (position) => {
          try {
            return await fetchServerHistoricalMarketData(
              validatedInput.dataSource!,
              position.assetType,
              position.assetIdentifier,
              position.currency,
              Number(validatedInput.parameters.lookbackPeriod)
            );
          } catch (error) {
            console.error(`Error fetching data for ${position.assetIdentifier}:`, error);
            // Return null for failed fetches
            return null;
          }
        });
        
        // Wait for all data fetching to complete
        const historicalDataResults = await Promise.all(historicalDataPromises);
        
        // Filter out failed fetches
        const historicalData = historicalDataResults.filter(data => data !== null) as HistoricalMarketData[];
        
        if (historicalData.length > 0) {
          // Use the fetched data for VaR calculation
          varInput.historicalData = historicalData;
        } else {
          console.log('All external data fetches failed, falling back to synthetic data');
          // Fall back to synthetic data if all fetches failed
          varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
        }
      } catch (error) {
        console.error('Error fetching external data:', error);
        // Fall back to synthetic data if there's an error
        varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
      }
    } else {
      // Use synthetic data if external data is not requested
      varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
    }
    
    // Calculate VaR
    const result = VaRCalculator.calculateVaR(varInput);
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating VaR:', error);
    return NextResponse.json(
      { error: 'Error calculating VaR', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate synthetic historical market data for testing and fallback
 * 
 * @param positions Array of positions to generate data for
 * @returns Array of historical market data for each position
 */
function generateSyntheticHistoricalData(positions: any[]): HistoricalMarketData[] {
  return positions.map(position => {
    // Generate dates for the past year
    const dates: string[] = [];
    const prices: number[] = [];
    const volumes: number[] = [];
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 252); // Approximately 1 year of trading days
    
    // Set initial price based on current price
    let currentPrice = position.currentPrice;
    
    // Define asset-specific parameters
    let volatility = 0.01; // Default daily volatility (1%)
    let trend = 0.0001; // Default daily trend (0.01%)
    let volumeBase = 100000; // Default base volume
    let volumeVolatility = 0.2; // Default volume volatility (20%)
    let jumpProbability = 0.01; // Probability of price jump (1%)
    let maxJumpSize = 0.05; // Maximum jump size (5%)
    let meanReversion = 0.001; // Mean reversion strength
    let seasonality = false; // Whether to add seasonality
    
    // Customize parameters based on asset type
    switch (position.assetType) {
      case VaRAssetType.EQUITY:
        volatility = 0.015; // 1.5% daily volatility
        trend = 0.0002; // Slight upward trend (0.02% daily)
        volumeBase = 500000;
        volumeVolatility = 0.3;
        jumpProbability = 0.02;
        seasonality = true; // Quarterly earnings effects
        break;
        
      case VaRAssetType.FOREIGN_EXCHANGE:
        volatility = 0.007; // 0.7% daily volatility
        trend = 0.00005; // Very slight trend
        volumeBase = 1000000;
        volumeVolatility = 0.15;
        jumpProbability = 0.01;
        meanReversion = 0.002; // Stronger mean reversion
        break;
        
      case VaRAssetType.INTEREST_RATE:
        volatility = 0.003; // 0.3% daily volatility
        trend = 0.00001; // Very slight trend
        volumeBase = 10000000;
        volumeVolatility = 0.1;
        jumpProbability = 0.005;
        meanReversion = 0.005; // Strong mean reversion
        break;
        
      case VaRAssetType.COMMODITY:
        volatility = 0.02; // 2% daily volatility
        trend = 0.0001; // Slight trend
        volumeBase = 200000;
        volumeVolatility = 0.25;
        jumpProbability = 0.015;
        seasonality = true; // Seasonal effects
        break;
        
      case VaRAssetType.CRYPTO:
        volatility = 0.04; // 4% daily volatility
        trend = 0.0003; // Stronger trend
        volumeBase = 50000;
        volumeVolatility = 0.5;
        jumpProbability = 0.03;
        maxJumpSize = 0.1; // Larger jumps (10%)
        break;
    }
    
    // Calculate price path using geometric Brownian motion with jumps and mean reversion
    let price = currentPrice * (1 - Math.random() * 0.1); // Start slightly below current price
    const basePrice = price; // Store base price for mean reversion
    
    // Generate daily data
    for (let i = 0; i < 252; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Add seasonality effects if applicable
      let seasonalFactor = 1.0;
      if (seasonality) {
        // Quarterly pattern (earnings seasons for equities, seasonal demand for commodities)
        const month = currentDate.getMonth();
        if (position.assetType === VaRAssetType.EQUITY && (month === 0 || month === 3 || month === 6 || month === 9)) {
          // Earnings months have higher volatility
          volatility *= 1.5;
        } else if (position.assetType === VaRAssetType.COMMODITY) {
          // Seasonal demand patterns
          if (month >= 5 && month <= 7) { // Summer months
            seasonalFactor = 1.05; // 5% higher prices
          } else if (month >= 11 || month <= 1) { // Winter months
            seasonalFactor = 0.95; // 5% lower prices
          }
        }
      }
      
      // Generate random return with drift
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // Box-Muller transform
      
      // Add jump component
      let jump = 0;
      if (Math.random() < jumpProbability) {
        // Jump direction (up or down)
        const jumpDirection = Math.random() > 0.5 ? 1 : -1;
        jump = jumpDirection * Math.random() * maxJumpSize;
      }
      
      // Calculate mean reversion component
      const reversion = meanReversion * (basePrice - price) / basePrice;
      
      // Calculate daily return
      const dailyReturn = trend + volatility * z + jump + reversion;
      
      // Update price
      price *= (1 + dailyReturn) * seasonalFactor;
      
      // Ensure price stays positive
      price = Math.max(price, 0.001);
      
      // Generate volume
      let volume = volumeBase * (1 + (Math.random() - 0.5) * 2 * volumeVolatility);
      
      // Add volume spikes on jump days
      if (jump !== 0) {
        volume *= (1 + Math.abs(jump) * 10);
      }
      
      // Store data point
      dates.push(dateString);
      prices.push(price);
      volumes.push(Math.round(volume));
    }
    
    // Create market data points
    const marketData: MarketDataPoint[] = dates.map((date, index) => ({
      date,
      price: prices[index],
      volume: volumes[index]
    }));
    
    // Return in the expected format
    return {
      assetIdentifier: position.assetIdentifier,
      assetType: position.assetType,
      currency: position.currency,
      data: marketData,
      metadata: {
        dataSource: 'Synthetic Data',
        dataPoints: marketData.length,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        note: 'This is synthetic data generated for testing purposes'
      }
    };
  });
}
