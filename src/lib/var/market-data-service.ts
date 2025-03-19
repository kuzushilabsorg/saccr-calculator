import { HistoricalMarketData, VaRAssetType, MarketDataPoint } from "./types";

// Define the available data providers
export const DATA_PROVIDERS = {
  ALPHA_VANTAGE: 'alpha_vantage',
  COINGECKO: 'coingecko',
  FRED: 'fred',
  YAHOO_FINANCE: 'yahoo_finance',
  MARKETSTACK: 'marketstack',
  FINNHUB: 'finnhub',
  OPEN_EXCHANGE_RATES: 'open_exchange_rates',
  WORLD_BANK: 'world_bank',
  SYNTHETIC: 'synthetic'
};

// Define market data providers with their supported asset types
export const marketDataProviders = [
  {
    id: DATA_PROVIDERS.ALPHA_VANTAGE,
    name: 'Alpha Vantage',
    description: 'Stock and forex data provider',
    supportedAssetTypes: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE],
    requiresApiKey: true
  },
  {
    id: DATA_PROVIDERS.COINGECKO,
    name: 'CoinGecko',
    description: 'Cryptocurrency data provider',
    supportedAssetTypes: [VaRAssetType.CRYPTO],
    requiresApiKey: false
  },
  {
    id: DATA_PROVIDERS.FRED,
    name: 'Federal Reserve Economic Data (FRED)',
    description: 'Economic and interest rate data provider',
    supportedAssetTypes: [VaRAssetType.INTEREST_RATE],
    requiresApiKey: true
  },
  {
    id: DATA_PROVIDERS.YAHOO_FINANCE,
    name: 'Yahoo Finance',
    description: 'Stock, forex, and crypto data provider',
    supportedAssetTypes: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE, VaRAssetType.CRYPTO, VaRAssetType.COMMODITY],
    requiresApiKey: false
  },
  {
    id: DATA_PROVIDERS.MARKETSTACK,
    name: 'Marketstack',
    description: 'Stock market data provider',
    supportedAssetTypes: [VaRAssetType.EQUITY],
    requiresApiKey: true
  },
  {
    id: DATA_PROVIDERS.FINNHUB,
    name: 'Finnhub',
    description: 'Stock, forex, and crypto data provider',
    supportedAssetTypes: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE, VaRAssetType.CRYPTO],
    requiresApiKey: true
  },
  {
    id: DATA_PROVIDERS.OPEN_EXCHANGE_RATES,
    name: 'Open Exchange Rates',
    description: 'Foreign exchange data provider',
    supportedAssetTypes: [VaRAssetType.FOREIGN_EXCHANGE],
    requiresApiKey: true
  },
  {
    id: DATA_PROVIDERS.WORLD_BANK,
    name: 'World Bank',
    description: 'Economic and interest rate data provider',
    supportedAssetTypes: [VaRAssetType.INTEREST_RATE],
    requiresApiKey: false
  },
  {
    id: DATA_PROVIDERS.SYNTHETIC,
    name: 'Synthetic Data',
    description: 'Generated synthetic data for testing',
    supportedAssetTypes: [
      VaRAssetType.EQUITY, 
      VaRAssetType.FOREIGN_EXCHANGE, 
      VaRAssetType.INTEREST_RATE, 
      VaRAssetType.COMMODITY, 
      VaRAssetType.CRYPTO
    ],
    requiresApiKey: false
  }
];

// Map of provider IDs to supported asset types for easier lookup
export const PROVIDER_ASSET_TYPE_MAP: Record<string, VaRAssetType[]> = {
  [DATA_PROVIDERS.ALPHA_VANTAGE]: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE],
  [DATA_PROVIDERS.COINGECKO]: [VaRAssetType.CRYPTO],
  [DATA_PROVIDERS.FRED]: [VaRAssetType.INTEREST_RATE],
  [DATA_PROVIDERS.YAHOO_FINANCE]: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE, VaRAssetType.CRYPTO, VaRAssetType.COMMODITY],
  [DATA_PROVIDERS.MARKETSTACK]: [VaRAssetType.EQUITY],
  [DATA_PROVIDERS.FINNHUB]: [VaRAssetType.EQUITY, VaRAssetType.FOREIGN_EXCHANGE, VaRAssetType.CRYPTO],
  [DATA_PROVIDERS.OPEN_EXCHANGE_RATES]: [VaRAssetType.FOREIGN_EXCHANGE],
  [DATA_PROVIDERS.WORLD_BANK]: [VaRAssetType.INTEREST_RATE],
  [DATA_PROVIDERS.SYNTHETIC]: [
    VaRAssetType.EQUITY, 
    VaRAssetType.FOREIGN_EXCHANGE, 
    VaRAssetType.INTEREST_RATE, 
    VaRAssetType.COMMODITY, 
    VaRAssetType.CRYPTO
  ]
};

// Interface for standardized API responses to simplify data mapping
export class StandardizedAPIResponse {
  dates: string[];
  prices: number[];
  volumes?: number[];
  metadata?: {
    source: string;
    startDate?: string;
    endDate?: string;
    dataPoints?: number;
    [key: string]: string | number | boolean | undefined;
  };

  constructor(
    dates: string[],
    prices: number[],
    volumes?: number[],
    metadata?: {
      source: string;
      startDate?: string;
      endDate?: string;
      dataPoints?: number;
      [key: string]: string | number | boolean | undefined;
    }
  ) {
    this.dates = dates;
    this.prices = prices;
    this.volumes = volumes;
    this.metadata = metadata;
  }
}

/**
 * Utility function to convert standardized API response to HistoricalMarketData
 */
function convertToHistoricalMarketData(
  standardized: StandardizedAPIResponse,
  assetIdentifier: string,
  assetType: VaRAssetType,
  currency: string,
  provider: string
): HistoricalMarketData {
  // Create market data points from standardized format
  const marketData: MarketDataPoint[] = standardized.dates.map((date, index) => ({
    date,
    price: standardized.prices[index],
    ...(standardized.volumes ? { volume: standardized.volumes[index] } : {})
  }));

  // Return in the expected format with metadata
  return {
    assetIdentifier,
    assetType,
    currency,
    data: marketData,
    metadata: {
      dataSource: provider,
      dataPoints: marketData.length,
      startDate: marketData[0]?.date,
      endDate: marketData[marketData.length - 1]?.date,
      ...(standardized.metadata || {})
    }
  };
}

/**
 * Fetch historical market data from the appropriate provider based on asset type
 * @param provider Data provider name
 * @param assetType Type of asset
 * @param assetIdentifier Asset identifier (ticker, symbol, etc.)
 * @param currency Currency for pricing
 * @param lookbackPeriod Number of days to look back
 * @returns Historical market data
 */
export async function fetchHistoricalMarketData(
  provider: string,
  assetType: VaRAssetType,
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  try {
    // Validate that the provider supports the asset type
    if (!PROVIDER_ASSET_TYPE_MAP[provider]?.includes(assetType)) {
      throw new Error(`Provider ${provider} does not support ${assetType}`);
    }

    // Select the appropriate data fetching function based on provider
    switch (provider) {
      case DATA_PROVIDERS.ALPHA_VANTAGE:
        return await fetchAlphaVantageData(assetType, assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.COINGECKO:
        return await fetchCoinGeckoData(assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.FRED:
        return await fetchFREDData(assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.YAHOO_FINANCE:
        return await fetchYahooFinanceData(assetType, assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.MARKETSTACK:
        return await fetchMarketstackData(assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.FINNHUB:
        return await fetchFinnhubData(assetType, assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.OPEN_EXCHANGE_RATES:
        return await fetchOpenExchangeRatesData(assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.WORLD_BANK:
        return await fetchWorldBankData(assetIdentifier, currency, lookbackPeriod);
      case DATA_PROVIDERS.SYNTHETIC:
        return generateSyntheticData(assetIdentifier, currency, assetType, lookbackPeriod);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error fetching market data: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return synthetic data as fallback with metadata indicating the error
    const syntheticData = generateSyntheticData(assetIdentifier, currency, assetType, lookbackPeriod);
    syntheticData.metadata = {
      dataSource: DATA_PROVIDERS.SYNTHETIC,
      dataSourceNotes: `Fallback to synthetic data. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      originalProvider: provider
    };
    return syntheticData;
  }
}

/**
 * Fetch data from Alpha Vantage API
 * @param assetType Type of asset (equity or forex)
 * @param assetIdentifier Ticker symbol or currency pair
 * @param currency Currency for pricing
 * @param lookbackPeriod Number of days to look back
 * @returns Historical market data
 */
async function fetchAlphaVantageData(
  assetType: VaRAssetType,
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Get API key from environment variable
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not found in environment variables');
  }

  let endpoint: string;
  const symbol = assetIdentifier;

  // Build the appropriate endpoint based on asset type
  if (assetType === VaRAssetType.EQUITY) {
    endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
  } else if (assetType === VaRAssetType.FOREIGN_EXCHANGE) {
    // For forex, the identifier should be in the format FROM_TO (e.g., EUR_USD)
    const [fromCurrency, toCurrency] = assetIdentifier.split('_');
    if (!fromCurrency || !toCurrency) {
      throw new Error('Invalid forex identifier format. Use FROM_TO format (e.g., EUR_USD)');
    }
    endpoint = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&outputsize=full&apikey=${apiKey}`;
  } else {
    throw new Error(`Asset type ${assetType} not supported by Alpha Vantage provider`);
  }

  try {
    // Fetch data from Alpha Vantage
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Check for API error messages
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
    }
    if (data['Note'] && data['Note'].includes('API call frequency')) {
      throw new Error(`Alpha Vantage API rate limit exceeded: ${data['Note']}`);
    }

    // Extract time series data
    const timeSeriesKey = assetType === VaRAssetType.EQUITY 
      ? 'Time Series (Daily)' 
      : 'Time Series FX (Daily)';
    
    const timeSeries = data[timeSeriesKey];
    if (!timeSeries) {
      throw new Error('No time series data found in Alpha Vantage response');
    }

    // Convert to our format
    const dates = Object.keys(timeSeries).sort();
    const marketData: MarketDataPoint[] = [];
    
    // Limit to lookback period
    const limitedDates = dates.slice(0, lookbackPeriod);

    for (const date of limitedDates) {
      const entry = timeSeries[date];
      // For equity, use close price; for forex, use close price
      const price = assetType === VaRAssetType.EQUITY 
        ? parseFloat(entry['4. close']) 
        : parseFloat(entry['4. close']);
      
      marketData.push({
        date,
        price
      });
    }

    // Return in expected format with metadata
    return {
      assetIdentifier,
      assetType,
      currency,
      data: marketData.reverse(),
      metadata: {
        dataSource: DATA_PROVIDERS.ALPHA_VANTAGE,
        dataPoints: marketData.length,
        startDate: marketData[0]?.date,
        endDate: marketData[marketData.length - 1]?.date
      }
    };
  } catch (error) {
    console.error(`Alpha Vantage API error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Fetch cryptocurrency data from CoinGecko API
 * @param coinId Coin ID (e.g., bitcoin, ethereum)
 * @param currency Currency for pricing
 * @param lookbackPeriod Number of days to look back
 * @returns Historical market data
 */
async function fetchCoinGeckoData(
  coinId: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  try {
    // CoinGecko API endpoint for historical market data
    // Note: CoinGecko free API has rate limits, so we need to handle them
    const endpoint = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${lookbackPeriod}&interval=daily`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Extract prices from response
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Invalid response format from CoinGecko API');
    }

    const marketData: MarketDataPoint[] = [];

    // CoinGecko returns [timestamp, price] pairs
    for (const [timestamp, price] of data.prices) {
      const date = new Date(timestamp).toISOString().split('T')[0];
      marketData.push({
        date,
        price
      });
    }

    // Return in expected format with metadata
    return {
      assetIdentifier: coinId,
      assetType: VaRAssetType.CRYPTO,
      currency,
      data: marketData,
      metadata: {
        dataSource: DATA_PROVIDERS.COINGECKO,
        dataPoints: marketData.length,
        startDate: marketData[0]?.date,
        endDate: marketData[marketData.length - 1]?.date
      }
    };
  } catch (error) {
    console.error(`CoinGecko API error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Fetch economic data from FRED API
 * @param seriesId FRED series ID (e.g., DFF for Federal Funds Rate)
 * @param currency Currency for pricing (usually USD for FRED data)
 * @param lookbackPeriod Number of days to look back
 * @returns Historical market data
 */
async function fetchFREDData(
  seriesId: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Get API key from environment variable
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED API key not found in environment variables');
  }

  // Define FRED observation interface
  interface FREDObservation {
    date: string;
    value: string | number;
    realtime_start?: string;
    realtime_end?: string;
  }

  try {
    // Calculate start date based on lookback period (add extra days for weekends/holidays)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.ceil(lookbackPeriod * 1.5));

    // Format dates for API
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // FRED API endpoint for series observations
    const endpoint = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${formattedStartDate}&observation_end=${formattedEndDate}&sort_order=desc`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`FRED API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Check for API error messages
    if (data.error_code) {
      throw new Error(`FRED API error: ${data.error_message || 'Unknown error'}`);
    }

    // Extract observations from response
    if (!data.observations || !Array.isArray(data.observations)) {
      throw new Error('Invalid response format from FRED API');
    }

    const marketData: MarketDataPoint[] = [];

    // Limit to lookback period and handle missing values
    const validObservations = data.observations
      .filter((obs: FREDObservation) => obs && typeof obs.value === 'string' && obs.value !== '.' && !isNaN(parseFloat(obs.value)))
      .slice(0, lookbackPeriod);

    for (const obs of validObservations) {
      marketData.push({
        date: obs.date,
        price: parseFloat(obs.value as string)
      });
    }

    // Return in expected format with metadata
    return {
      assetIdentifier: seriesId,
      assetType: VaRAssetType.INTEREST_RATE,
      currency,
      data: marketData.reverse(),
      metadata: {
        dataSource: DATA_PROVIDERS.FRED,
        dataPoints: marketData.length,
        startDate: marketData[0]?.date,
        endDate: marketData[marketData.length - 1]?.date,
        seriesId
      }
    };
  } catch (error) {
    console.error(`FRED API error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Generate synthetic market data as a fallback
 * @param assetIdentifier Asset identifier
 * @param currency Currency for pricing
 * @param assetType Asset type
 * @param lookbackPeriod Number of days to look back
 * @returns Synthetic historical market data
 */
function generateSyntheticData(
  assetIdentifier: string,
  currency: string,
  assetType: VaRAssetType,
  lookbackPeriod: number
): HistoricalMarketData {
  const marketData: MarketDataPoint[] = [];
  
  // Start with a base price between 50 and 200
  let currentPrice = 100 + (Math.random() * 100 - 50);
  
  // Generate daily prices with random walk
  const volatility = 0.015; // 1.5% daily volatility
  const today = new Date();
  
  for (let i = lookbackPeriod - 1; i >= 0; i--) {
    // Generate date for this day
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add data point
    marketData.push({
      date: dateStr,
      price: currentPrice
    });
    
    // Random walk for next price
    const dailyReturn = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + dailyReturn);
  }
  
  return {
    assetIdentifier,
    assetType,
    currency,
    data: marketData,
    metadata: {
      dataSource: DATA_PROVIDERS.SYNTHETIC,
      dataPoints: marketData.length,
      startDate: marketData[0]?.date,
      endDate: marketData[marketData.length - 1]?.date
    }
  };
}

async function fetchYahooFinanceData(
  assetType: VaRAssetType,
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackPeriod);
  
  // Format dates for Yahoo Finance API (Unix timestamp in seconds)
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  
  // Construct URL based on asset type
  let symbol = assetIdentifier.toUpperCase();
  
  // For forex, format as XXXYYY=X
  if (assetType === VaRAssetType.FOREIGN_EXCHANGE) {
    // If the identifier is already in the format "USD/EUR", extract the currencies
    if (assetIdentifier.includes('/')) {
      const [baseCurrency, quoteCurrency] = assetIdentifier.split('/');
      symbol = `${baseCurrency}${quoteCurrency}=X`;
    } else {
      // Assume the identifier is already in the correct format
      symbol = `${assetIdentifier}=X`;
    }
  }
  
  // For commodities, add the appropriate suffix
  if (assetType === VaRAssetType.COMMODITY) {
    // Common commodity suffixes in Yahoo Finance
    const commoditySuffixes: Record<string, string> = {
      'GOLD': 'GC=F',
      'SILVER': 'SI=F',
      'OIL': 'CL=F',
      'NATURAL_GAS': 'NG=F',
      'COPPER': 'HG=F',
      'CORN': 'ZC=F',
      'WHEAT': 'ZW=F'
    };
    
    // Use the suffix if available, otherwise use the raw identifier
    symbol = commoditySuffixes[assetIdentifier.toUpperCase()] || assetIdentifier;
  }
  
  // Interval (1d for daily data)
  const interval = '1d';
  
  // Construct the URL
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;
  
  try {
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have valid data
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data found in Yahoo Finance response');
    }
    
    const result = data.chart.result[0];
    
    // Extract timestamps and prices
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const adjCloseValues = result.indicators.adjclose?.[0]?.adjclose;
    
    // Use adjusted close if available, otherwise use close prices
    const prices = adjCloseValues || quotes.close;
    
    if (!timestamps || !prices || timestamps.length === 0 || prices.length === 0) {
      throw new Error('Invalid data format in Yahoo Finance response');
    }
    
    // Convert to standardized format
    const standardized: StandardizedAPIResponse = {
      dates: timestamps.map((timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toISOString().split('T')[0];
      }),
      prices: prices,
      volumes: quotes.volume,
      metadata: {
        source: 'Yahoo Finance',
        symbol: symbol,
        currency: result.meta?.currency || currency,
        exchangeName: result.meta?.exchangeName,
        instrumentType: result.meta?.instrumentType,
        dataGranularity: interval
      }
    };
    
    // Convert to historical market data format
    return convertToHistoricalMarketData(
      standardized,
      assetIdentifier,
      assetType,
      currency,
      DATA_PROVIDERS.YAHOO_FINANCE
    );
  } catch (error) {
    console.error(`Error fetching data from Yahoo Finance: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function fetchMarketstackData(
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackPeriod);
  
  // Format dates for Marketstack API (YYYY-MM-DD)
  const dateFrom = startDate.toISOString().split('T')[0];
  const dateTo = endDate.toISOString().split('T')[0];
  
  // API key should be stored in environment variables
  const apiKey = process.env.MARKETSTACK_API_KEY || 'demo'; // Use 'demo' for testing
  
  // Construct the URL
  const url = `http://api.marketstack.com/v1/eod?access_key=${apiKey}&symbols=${encodeURIComponent(assetIdentifier)}&date_from=${dateFrom}&date_to=${dateTo}&limit=1000`;
  
  try {
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Marketstack API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API error messages
    if (data.error) {
      throw new Error(`Marketstack API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    // Check if we have valid data
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No data found in Marketstack response');
    }
    
    // Sort data by date (oldest first)
    const sortedData = [...data.data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Convert to standardized format
    const standardized: StandardizedAPIResponse = {
      dates: sortedData.map(item => item.date.split('T')[0]),
      prices: sortedData.map(item => item.close),
      volumes: sortedData.map(item => item.volume),
      metadata: {
        source: 'Marketstack',
        symbol: assetIdentifier,
        currency: currency,
        exchange: sortedData[0]?.exchange,
        dataCount: sortedData.length
      }
    };
    
    // Convert to historical market data format
    return convertToHistoricalMarketData(
      standardized,
      assetIdentifier,
      VaRAssetType.EQUITY, // Marketstack only supports equity data
      currency,
      DATA_PROVIDERS.MARKETSTACK
    );
  } catch (error) {
    console.error(`Error fetching data from Marketstack: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function fetchFinnhubData(
  assetType: VaRAssetType,
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackPeriod);
  
  // Format dates for Finnhub API (Unix timestamp in seconds)
  const from = Math.floor(startDate.getTime() / 1000);
  const to = Math.floor(endDate.getTime() / 1000);
  
  // API key should be stored in environment variables
  const apiKey = process.env.FINNHUB_API_KEY || 'demo'; // Replace with actual API key
  
  // Determine the endpoint based on asset type
  let endpoint = '';
  let symbol = assetIdentifier;
  
  switch (assetType) {
    case VaRAssetType.EQUITY:
      endpoint = 'stock/candle';
      break;
    case VaRAssetType.FOREIGN_EXCHANGE:
      endpoint = 'forex/candle';
      // Format for forex is typically "EUR/USD"
      if (assetIdentifier.includes('/')) {
        symbol = assetIdentifier;
      }
      break;
    case VaRAssetType.CRYPTO:
      endpoint = 'crypto/candle';
      // Format for crypto is typically "BINANCE:BTCUSDT"
      if (!assetIdentifier.includes(':')) {
        symbol = `BINANCE:${assetIdentifier}USDT`;
      }
      break;
    default:
      throw new Error(`Finnhub does not support asset type: ${assetType}`);
  }
  
  // Construct the URL
  const url = `https://finnhub.io/api/v1/${endpoint}?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
  
  try {
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Finnhub API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API error messages
    if (data.s === 'no_data') {
      throw new Error(`Finnhub API returned no data for ${symbol}`);
    }
    
    if (data.error) {
      throw new Error(`Finnhub API error: ${data.error}`);
    }
    
    // Check if we have valid data
    if (!data.t || !data.c || data.t.length === 0 || data.c.length === 0) {
      throw new Error('Invalid data format in Finnhub response');
    }
    
    // Convert to standardized format
    const standardized: StandardizedAPIResponse = {
      dates: data.t.map((timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toISOString().split('T')[0];
      }),
      prices: data.c, // Closing prices
      volumes: data.v, // Volumes
      metadata: {
        source: 'Finnhub',
        symbol: symbol,
        currency: currency,
        resolution: 'D', // Daily resolution
        dataPoints: data.t.length
      }
    };
    
    // Convert to historical market data format
    return convertToHistoricalMarketData(
      standardized,
      assetIdentifier,
      assetType,
      currency,
      DATA_PROVIDERS.FINNHUB
    );
  } catch (error) {
    console.error(`Error fetching data from Finnhub: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function fetchOpenExchangeRatesData(
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackPeriod);
  
  // API key should be stored in environment variables
  const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY || 'demo'; // Replace with actual API key
  
  // Parse the asset identifier
  // Expected format: "USD/EUR" (base/quote)
  let baseCurrency = 'USD'; // Default base currency
  let quoteCurrency = currency;
  
  if (assetIdentifier.includes('/')) {
    const parts = assetIdentifier.split('/');
    baseCurrency = parts[0];
    quoteCurrency = parts[1];
  }
  
  // Open Exchange Rates uses USD as the base currency for the free tier
  // We'll need to convert if the requested base currency is not USD
  const needsConversion = baseCurrency !== 'USD';
  
  // Collect historical data for each day in the lookback period
  const dates: string[] = [];
  const prices: number[] = [];
  const promises: Promise<void>[] = [];
  
  // Generate dates for the lookback period
  for (let i = 0; i <= lookbackPeriod; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.unshift(dateStr); // Add to beginning to maintain chronological order
    
    // Create a promise for fetching data for this date
    const promise = (async () => {
      try {
        // Format date for API (YYYY-MM-DD)
        const formattedDate = dateStr;
        
        // Construct the URL for historical data
        const url = `https://openexchangerates.org/api/historical/${formattedDate}.json?app_id=${apiKey}&symbols=${quoteCurrency}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Open Exchange Rates API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API error messages
        if (data.error) {
          throw new Error(`Open Exchange Rates API error: ${data.error}`);
        }
        
        // Get the exchange rate
        let rate = data.rates[quoteCurrency];
        
        // If we need to convert from a non-USD base currency
        if (needsConversion && baseCurrency !== 'USD') {
          const baseRate = data.rates[baseCurrency];
          if (!baseRate) {
            throw new Error(`Exchange rate for ${baseCurrency} not found`);
          }
          // Convert: USD/quote ÷ USD/base = base/quote
          rate = rate / baseRate;
        }
        
        // For forex, we typically want the inverse rate (quote/base)
        // This gives us how much of the quote currency we get for 1 unit of the base currency
        prices[dates.indexOf(dateStr)] = rate;
      } catch (error) {
        console.error(`Error fetching data for ${dateStr}: ${error instanceof Error ? error.message : String(error)}`);
        // Use the previous day's rate as a fallback, or 1 if no previous rate
        const prevIndex = dates.indexOf(dateStr) - 1;
        prices[dates.indexOf(dateStr)] = prevIndex >= 0 ? prices[prevIndex] : 1;
      }
    })();
    
    promises.push(promise);
  }
  
  // Wait for all promises to resolve
  await Promise.all(promises);
  
  // Convert to standardized format
  const standardized: StandardizedAPIResponse = {
    dates,
    prices,
    metadata: {
      source: 'Open Exchange Rates',
      baseCurrency,
      quoteCurrency,
      originalBase: needsConversion ? 'USD' : baseCurrency,
      dataPoints: dates.length
    }
  };
  
  // Convert to historical market data format
  return convertToHistoricalMarketData(
    standardized,
    assetIdentifier,
    VaRAssetType.FOREIGN_EXCHANGE,
    quoteCurrency,
    DATA_PROVIDERS.OPEN_EXCHANGE_RATES
  );
}

async function fetchWorldBankData(
  assetIdentifier: string,
  currency: string,
  lookbackPeriod: number
): Promise<HistoricalMarketData> {
  // Map common identifiers to World Bank indicator codes
  const indicatorMap: Record<string, string> = {
    'REAL_INTEREST_RATE': 'FR.INR.RINR',
    'LENDING_RATE': 'FR.INR.LEND',
    'DEPOSIT_RATE': 'FR.INR.DPST',
    'TREASURY_BILL': 'FR.INR.TBIL'
  };
  
  // Get the indicator code
  const indicator = indicatorMap[assetIdentifier.toUpperCase()] || assetIdentifier;
  
  // Default to US
  let countryCode = 'US';
  if (assetIdentifier.includes('_')) {
    const parts = assetIdentifier.split('_');
    if (parts[0].length === 2) {
      countryCode = parts[0];
    }
  }
  
  // Calculate years for the API call
  const endYear = new Date().getFullYear();
  const startYear = endYear - Math.ceil(lookbackPeriod / 365);
  
  // Construct the URL
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?date=${startYear}:${endYear}&format=json`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`World Bank API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      throw new Error('Invalid data format in World Bank response');
    }
    
    // World Bank API returns data in reverse chronological order
    const timeSeriesData = [...data[1]].reverse();
    
    if (timeSeriesData.length === 0) {
      throw new Error(`No data found for indicator ${indicator}`);
    }
    
    // Extract dates and values
    const dates: string[] = [];
    const prices: number[] = [];
    
    for (const item of timeSeriesData) {
      if (item.value !== null) {
        // Use middle of the year for annual data
        const date = `${item.date}-07-01`;
        dates.push(date);
        prices.push(item.value);
      }
    }
    
    // Simple linear interpolation for daily data
    const dailyDates: string[] = [];
    const dailyPrices: number[] = [];
    
    // Generate daily points for the lookback period
    const today = new Date();
    for (let i = 0; i < lookbackPeriod; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyDates.unshift(dateStr);
      
      // Find the closest annual data point
      const year = date.getFullYear();
      let closestIndex = 0;
      
      for (let j = 0; j < dates.length; j++) {
        const dataYear = parseInt(dates[j].split('-')[0]);
        if (dataYear <= year) {
          closestIndex = j;
          break;
        }
      }
      
      dailyPrices.push(prices[closestIndex] || prices[0]);
    }
    
    // Create standardized response
    const standardized: StandardizedAPIResponse = {
      dates: dailyDates,
      prices: dailyPrices,
      metadata: {
        source: 'World Bank',
        indicator,
        country: countryCode,
        description: data[1][0]?.indicator?.value || indicator
      }
    };
    
    return convertToHistoricalMarketData(
      standardized,
      assetIdentifier,
      VaRAssetType.INTEREST_RATE,
      currency,
      DATA_PROVIDERS.WORLD_BANK
    );
  } catch (error) {
    console.error(`Error fetching World Bank data: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
