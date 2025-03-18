/**
 * Types for SACCR Calculator based on CRE52 framework
 */

// Asset Classes
export enum AssetClass {
  INTEREST_RATE = 'INTEREST_RATE',
  FOREIGN_EXCHANGE = 'FOREIGN_EXCHANGE',
  CREDIT = 'CREDIT',
  EQUITY = 'EQUITY',
  COMMODITY = 'COMMODITY',
}

// Transaction Types
export enum TransactionType {
  LINEAR = 'LINEAR',
  OPTION = 'OPTION',
  BASIS = 'BASIS',
  VOLATILITY = 'VOLATILITY',
}

// Position Types
export enum PositionType {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

// Margin Types
export enum MarginType {
  MARGINED = 'MARGINED',
  UNMARGINED = 'UNMARGINED',
}

// Base Trade Data
export interface TradeData {
  id: string;
  assetClass: AssetClass;
  transactionType: TransactionType;
  positionType: PositionType;
  notionalAmount: number;
  currency: string;
  maturityDate: string; // ISO date string
  startDate: string; // ISO date string
  currentMarketValue: number;
}

// Interest Rate Specific Data
export interface InterestRateTradeData extends TradeData {
  assetClass: AssetClass.INTEREST_RATE;
  referenceCurrency: string;
  paymentFrequency?: number; // in months
  resetFrequency?: number; // in months
  indexName?: string;
  basis?: string;
}

// Foreign Exchange Specific Data
export interface ForeignExchangeTradeData extends TradeData {
  assetClass: AssetClass.FOREIGN_EXCHANGE;
  currencyPair: string; // e.g., "USD/EUR"
  settlementDate: string; // ISO date string
}

// Credit Specific Data
export interface CreditTradeData extends TradeData {
  assetClass: AssetClass.CREDIT;
  referenceEntity: string;
  seniority: string;
  sector: string;
  creditQuality?: string;
}

// Equity Specific Data
export interface EquityTradeData extends TradeData {
  assetClass: AssetClass.EQUITY;
  issuer: string;
  market: string;
  sector: string;
}

// Commodity Specific Data
export interface CommodityTradeData extends TradeData {
  assetClass: AssetClass.COMMODITY;
  commodityType: string; // e.g., "ENERGY", "METALS", "AGRICULTURAL"
  subType: string; // e.g., "OIL", "GOLD", "WHEAT"
}

// Union type for all trade data
export type SpecificTradeData =
  | InterestRateTradeData
  | ForeignExchangeTradeData
  | CreditTradeData
  | EquityTradeData
  | CommodityTradeData;

// Netting Set Information
export interface NettingSetInfo {
  nettingAgreementId: string;
  marginType: MarginType;
  thresholdAmount?: number;
  minimumTransferAmount?: number;
  independentCollateralAmount?: number;
  variationMargin?: number;
  marginPeriodOfRisk?: number; // in days
}

// Collateral Information
export interface CollateralInfo {
  collateralAmount: number;
  collateralCurrency: string;
  haircut?: number;
}

// Complete SACCR Input
export interface SACCRInput {
  trades: SpecificTradeData[];
  nettingSet: NettingSetInfo;
  collateral?: CollateralInfo[];
}

// SACCR Calculation Results
export interface ReplacementCostResult {
  value: number;
  components: {
    currentExposure: number;
    variationMargin?: number;
    threshold?: number;
    minimumTransferAmount?: number;
    independentCollateralAmount?: number;
  };
}

export interface AddOnResult {
  value: number;
  components: {
    [key in AssetClass]?: number;
  };
  hedgingSets?: {
    [key: string]: number;
  };
}

export interface PotentialFutureExposureResult {
  value: number;
  multiplier: number;
  aggregateAddOn: number;
}

export interface SACCRResult {
  exposureAtDefault: number;
  replacementCost: ReplacementCostResult;
  potentialFutureExposure: PotentialFutureExposureResult;
  timestamp: string;
  inputSummary: {
    nettingSetId: string;
    tradeCount: number;
    assetClasses: AssetClass[];
    marginType: MarginType;
    totalNotional: number;
  };
}

// CSV Upload Format
export interface CSVTradeData {
  id: string;
  assetClass: string;
  transactionType: string;
  positionType: string;
  notionalAmount: string;
  currency: string;
  maturityDate: string;
  startDate: string;
  currentMarketValue: string;
  [key: string]: string; // Additional fields based on asset class
}

// Form Input Schema
export interface SACCRFormInput {
  nettingSet: {
    nettingAgreementId: string;
    marginType: MarginType;
    thresholdAmount: number | string;
    minimumTransferAmount: number | string;
    independentCollateralAmount: number | string;
    variationMargin: number | string;
    marginPeriodOfRisk: number | string;
  };
  trade: {
    id: string;
    assetClass: AssetClass;
    transactionType: TransactionType;
    positionType: PositionType;
    notionalAmount: number | string;
    currency: string;
    maturityDate: string;
    startDate: string;
    currentMarketValue: number | string;
    // Asset class specific fields will be added dynamically
    [key: string]:
      | string
      | number
      | AssetClass
      | TransactionType
      | PositionType;
  };
  collateral: {
    collateralAmount: number | string;
    collateralCurrency: string;
    haircut: number | string;
  }[];
}
