/**
 * Types for Historical Value at Risk (VaR) Calculator
 */

// Asset Types
export enum VaRAssetType {
  EQUITY = 'EQUITY',
  FOREIGN_EXCHANGE = 'FOREIGN_EXCHANGE',
  INTEREST_RATE = 'INTEREST_RATE',
  COMMODITY = 'COMMODITY',
  CRYPTO = 'CRYPTO',
}

// Time Horizons for VaR
export enum VaRTimeHorizon {
  ONE_DAY = '1_day',
  TEN_DAYS = '10_days',
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
}

// Confidence Levels
export enum VaRConfidenceLevel {
  NINETY_PERCENT = '90%',
  NINETY_FIVE_PERCENT = '95%',
  NINETY_SEVEN_POINT_FIVE_PERCENT = '97.5%',
  NINETY_NINE_PERCENT = '99%',
}

// VaR Calculation Methods
export enum VaRCalculationMethod {
  HISTORICAL_SIMULATION = 'historical_simulation',
  MONTE_CARLO_SIMULATION = 'monte_carlo_simulation',
  PARAMETRIC = 'parametric',
}

// Position in the portfolio
export interface VaRPosition {
  id: string;
  assetType: VaRAssetType;
  assetIdentifier: string; // Ticker, currency pair, etc.
  quantity: number;
  currentPrice: number;
  currency: string;
  purchaseDate?: string; // ISO date string
}

// Historical Market Data
export interface MarketDataPoint {
  date: string; // ISO date string
  price: number;
  volume?: number;
}

/**
 * Historical Market Data interface
 */
export interface HistoricalMarketData {
  assetIdentifier: string;
  assetType: VaRAssetType;
  currency: string;
  data: MarketDataPoint[];
  metadata?: {
    dataSource: string;
    dataSourceNotes?: string;
    dataPoints?: number;
    startDate?: string;
    endDate?: string;
    seriesId?: string;
    originalProvider?: string;
  };
}

// VaR Calculation Parameters
export interface VaRParameters {
  timeHorizon: VaRTimeHorizon;
  confidenceLevel: VaRConfidenceLevel;
  calculationMethod: VaRCalculationMethod;
  lookbackPeriod: number; // Number of days to look back for historical data
  includeCorrelations: boolean;
}

// Complete VaR Input
export interface VaRInput {
  positions: VaRPosition[];
  parameters: VaRParameters;
  historicalData?: HistoricalMarketData[]; // Optional if fetched from API
}

// VaR Calculation Results
export interface VaRResult {
  valueAtRisk: number;
  varPercentage: number;
  expectedShortfall: number;
  diversificationBenefit: number;
  portfolioValue: number;
  assetContributions: Record<string, {
    valueAtRisk: number;
    contribution: number;
  }>;
  stressScenarios?: Record<string, number>;
  returnDistribution?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
    skewness?: number;
    kurtosis?: number;
  };
  parameters: {
    confidenceLevel: string;
    timeHorizon: string;
    calculationMethod: string;
    lookbackPeriod: number;
    includeCorrelations: boolean;
  };
  timestamp: number;
  metadata?: {
    dataSource: string;
    dataSourceNotes?: string;
    dataPoints?: number;
    startDate?: string;
    endDate?: string;
    assetDataSources?: Record<string, string>;
  };
}

// Form Input Schema
export interface VaRFormInput {
  parameters: {
    timeHorizon: VaRTimeHorizon;
    confidenceLevel: VaRConfidenceLevel;
    calculationMethod: VaRCalculationMethod;
    lookbackPeriod: string | number;
    includeCorrelations: boolean;
  };
  positions: {
    id: string;
    assetType: VaRAssetType;
    assetIdentifier: string;
    quantity: string | number;
    currentPrice: string | number;
    currency: string;
    purchaseDate?: string;
  }[];
  useExternalData: boolean;
  dataSource?: string;
}
