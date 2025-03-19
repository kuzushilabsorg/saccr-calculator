import { AssetClass, MarginType } from '../saccr/types';

// Common types for both approaches
export enum IMCalculationMethod {
  GRID_SCHEDULE = 'grid_schedule',
  ISDA_SIMM = 'isda_simm',
}

// Netting Set Information
export interface IMNettingSetInfo {
  nettingAgreementId: string;
  marginType: MarginType;
  thresholdAmount?: number;
  minimumTransferAmount?: number;
}

// Collateral Information
export interface IMCollateralInfo {
  collateralAmount: number;
  collateralCurrency: string;
  haircut?: number;
}

// Base trade data for both approaches
export interface IMTradeData {
  id: string;
  assetClass: AssetClass;
  notionalAmount: number;
  currency: string;
  maturityDate: string;
  startDate?: string;
}

// Grid/Schedule specific types
export interface GridScheduleTradeData extends IMTradeData {
  maturityBucket: MaturityBucket;
}

export enum MaturityBucket {
  LESS_THAN_ONE_YEAR = 'less_than_one_year',
  ONE_TO_FIVE_YEARS = 'one_to_five_years',
  GREATER_THAN_FIVE_YEARS = 'greater_than_five_years',
}

// ISDA SIMM specific types
export interface ISDASIMMTradeData extends IMTradeData {
  riskFactors: RiskFactor[];
  sensitivityValue: number;
}

export interface RiskFactor {
  type: RiskFactorType;
  bucket: number;
  label: string;
  value: number;
}

export enum RiskFactorType {
  INTEREST_RATE = 'interest_rate',
  CREDIT_QUALIFYING = 'credit_qualifying',
  CREDIT_NON_QUALIFYING = 'credit_non_qualifying',
  EQUITY = 'equity',
  COMMODITY = 'commodity',
  FX = 'fx',
}

// Form input types
export interface GridScheduleFormInput {
  nettingSet: IMNettingSetInfo;
  trades: GridScheduleTradeData[];
  collateral?: IMCollateralInfo[];
}

export interface ISDASIMMFormInput {
  nettingSet: IMNettingSetInfo;
  trades: ISDASIMMTradeData[];
  collateral?: IMCollateralInfo[];
}

// Calculation result types
export interface IMCalculationResult {
  initialMargin: number;
  netInitialMargin: number;
  components: {
    [key in RiskFactorType]?: number;
  };
  diversificationBenefit?: number;
  collateralValue?: number;
}

export interface GridScheduleResult extends IMCalculationResult {
  grossNotionalByAssetClass: {
    [key in AssetClass]?: {
      [key in MaturityBucket]?: number;
    };
  };
}

export interface ISDASIMMResult extends IMCalculationResult {
  riskFactorContributions: { [key in RiskFactorType]?: { [bucket: number]: number } };
  correlationMatrix?: { [key in RiskFactorType]?: { [key in RiskFactorType]?: number } };
}
