/**
 * SACCR Calculator Implementation based on CRE52 framework
 */

import {
  AssetClass,
  TransactionType,
  PositionType,
  MarginType,
  SACCRInput,
  SACCRResult,
  ReplacementCostResult,
  PotentialFutureExposureResult,
  SpecificTradeData,
  InterestRateTradeData,
  ForeignExchangeTradeData,
  CreditTradeData,
  EquityTradeData,
  CommodityTradeData,
  TradeData,
  OptionType,
  SACCRFormInput,
} from './types';

// Supervisory factors by asset class as per CRE52
const SUPERVISORY_FACTORS = {
  [AssetClass.INTEREST_RATE]: {
    // Based on maturity buckets
    DEFAULT: 0.005, // 0.5%
    // Specific factors for different currencies and tenors would be implemented here
  },
  [AssetClass.FOREIGN_EXCHANGE]: {
    DEFAULT: 0.04, // 4%
  },
  [AssetClass.CREDIT]: {
    // Based on credit quality and entity type
    INVESTMENT_GRADE_SINGLE_NAME: 0.05, // 5%
    SPECULATIVE_GRADE_SINGLE_NAME: 0.1, // 10%
    INVESTMENT_GRADE_INDEX: 0.03, // 3%
    SPECULATIVE_GRADE_INDEX: 0.06, // 6%
    DEFAULT: 0.05, // 5%
  },
  [AssetClass.EQUITY]: {
    SINGLE_NAME: 0.32, // 32%
    INDEX: 0.2, // 20%
    DEFAULT: 0.32, // 32%
  },
  [AssetClass.COMMODITY]: {
    ELECTRICITY: 0.4, // 40%
    OIL_GAS: 0.18, // 18%
    METALS: 0.18, // 18%
    AGRICULTURAL: 0.18, // 18%
    OTHER: 0.18, // 18%
    DEFAULT: 0.18, // 18%
  },
};

// Supervisory correlation parameters by asset class
// Commented out as it's currently unused but may be needed in future implementations
// const SUPERVISORY_CORRELATIONS = {
//   [AssetClass.INTEREST_RATE]: 0.5,
//   [AssetClass.FOREIGN_EXCHANGE]: 0.5,
//   [AssetClass.CREDIT]: {
//     SINGLE_NAME: 0.5,
//     INDEX: 0.8,
//     DEFAULT: 0.5,
//   },
//   [AssetClass.EQUITY]: {
//     SINGLE_NAME: 0.5,
//     INDEX: 0.8,
//     DEFAULT: 0.5,
//   },
//   [AssetClass.COMMODITY]: {
//     ELECTRICITY: 0.4,
//     SAME_TYPE: 0.6,
//     DIFFERENT_TYPE: 0.2,
//     DEFAULT: 0.4,
//   },
// };

// Supervisory option volatilities by asset class
// Commented out as it's currently unused but may be needed in future implementations
// const SUPERVISORY_OPTION_VOLATILITIES = {
//   [AssetClass.INTEREST_RATE]: 0.5,
//   [AssetClass.FOREIGN_EXCHANGE]: 0.15,
//   [AssetClass.CREDIT]: 1.0,
//   [AssetClass.EQUITY]: 0.8,
//   [AssetClass.COMMODITY]: 0.7,
// };

/**
 * Standard normal cumulative distribution function
 * @param x Input value
 * @returns Probability
 */
function normalCDF(x: number): number {
  // Approximation of the cumulative distribution function of the standard normal distribution
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}

/**
 * Calculate d1 parameter for Black-Scholes formula
 * @param S Current price of the underlying asset
 * @param K Strike price
 * @param r Risk-free interest rate
 * @param sigma Volatility
 * @param T Time to maturity in years
 * @returns d1 parameter
 */
function calculateD1(S: number, K: number, r: number, sigma: number, T: number): number {
  return (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
}

/**
 * Calculate option delta using Black-Scholes model
 * @param S Current price of the underlying asset
 * @param K Strike price
 * @param r Risk-free interest rate
 * @param sigma Volatility
 * @param T Time to maturity in years
 * @param isCall Whether the option is a call option
 * @returns Option delta
 */
function calculateOptionDelta(S: number, K: number, r: number, sigma: number, T: number, isCall: boolean): number {
  const d1 = calculateD1(S, K, r, sigma, T);
  
  if (isCall) {
    return normalCDF(d1);
  } else {
    return normalCDF(d1) - 1;
  }
}

/**
 * Calculate the Replacement Cost (RC) component of SACCR
 * @param input SACCR input data
 * @returns Replacement Cost result
 */
export function calculateReplacementCost(
  input: SACCRInput
): ReplacementCostResult {
  const { trades, nettingSet, collateral } = input;

  // Calculate current exposure (V)
  const currentExposure = trades.reduce(
    (sum, trade) => sum + trade.currentMarketValue,
    0
  );

  // Calculate total collateral (C)
  const totalCollateral = (collateral || []).reduce(
    (sum, col) => sum + col.collateralAmount,
    0
  );

  // Calculate variation margin (VM) if applicable
  const variationMargin = nettingSet.variationMargin || 0;

  // Calculate RC based on margin type
  let rcValue = 0;
  const components: ReplacementCostResult['components'] = {
    currentExposure,
  };

  if (nettingSet.marginType === MarginType.UNMARGINED) {
    // For unmargined transactions: RC = max(V - C, 0)
    rcValue = Math.max(currentExposure - totalCollateral, 0);
    components.variationMargin = 0;
  } else {
    // For margined transactions: RC = max(V - C, TH + MTA - NICA, 0)
    const threshold = nettingSet.thresholdAmount || 0;
    const minimumTransferAmount = nettingSet.minimumTransferAmount || 0;
    const independentCollateralAmount =
      nettingSet.independentCollateralAmount || 0;

    rcValue = Math.max(
      currentExposure - variationMargin - totalCollateral,
      threshold + minimumTransferAmount - independentCollateralAmount,
      0
    );

    components.variationMargin = variationMargin;
    components.threshold = threshold;
    components.minimumTransferAmount = minimumTransferAmount;
    components.independentCollateralAmount = independentCollateralAmount;
  }

  return {
    value: rcValue,
    components,
  };
}

/**
 * Calculate the maturity factor based on CRE52 rules
 * @param trade Trade data
 * @param nettingSet Netting set information
 * @returns Maturity factor
 */
function calculateMaturityFactor(
  trade: SpecificTradeData,
  nettingSet: SACCRInput['nettingSet']
): number {
  const startDate = new Date(trade.startDate);
  const maturityDate = new Date(trade.maturityDate);
  const currentDate = new Date();

  // Calculate maturity in years
  const maturityInYears =
    (maturityDate.getTime() -
      Math.max(startDate.getTime(), currentDate.getTime())) /
    (365 * 24 * 60 * 60 * 1000);

  if (nettingSet.marginType === MarginType.UNMARGINED) {
    // For unmargined: MF = sqrt(min(M, 1 year) / 1 year)
    return Math.sqrt(Math.min(maturityInYears, 1));
  } else {
    // For margined: MF = 1.5 * sqrt(MPOR/1 year)
    const mpor = nettingSet.marginPeriodOfRisk || 10; // Default 10 days if not specified
    return 1.5 * Math.sqrt(mpor / 365);
  }
}

/**
 * Calculate the supervisory delta adjustment according to CRE52 framework
 * @param trade Trade data
 * @returns Supervisory delta adjustment
 */
function calculateSupervisoryDelta(trade: SpecificTradeData): number {
  // For linear transactions
  if (trade.transactionType === TransactionType.LINEAR) {
    return trade.positionType === PositionType.LONG ? 1 : -1;
  }

  // For options, implement the Black-Scholes based formula as per CRE52
  if (trade.transactionType === TransactionType.OPTION) {
    // Check if we have all required option parameters
    if (trade.optionType === undefined || trade.strikePrice === undefined || trade.underlyingPrice === undefined) {
      throw new Error('Missing required option parameters: optionType, strikePrice, or underlyingPrice');
    }

    // Default values if not provided
    const volatility = trade.volatility || 0.2; // Default 20% volatility
    
    // Calculate time to maturity in years
    const maturityDate = new Date(trade.maturityDate);
    const currentDate = new Date();
    const timeToMaturity = trade.timeToMaturity || 
      Math.max(0.01, (maturityDate.getTime() - currentDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
    
    // Risk-free rate (simplified, could be based on currency)
    const riskFreeRate = 0.02; // 2% risk-free rate
    
    // Calculate option delta using Black-Scholes
    const isCall = trade.optionType === OptionType.CALL;
    const optionDelta = calculateOptionDelta(
      trade.underlyingPrice,
      trade.strikePrice,
      riskFreeRate,
      volatility,
      timeToMaturity,
      isCall
    );
    
    // Apply position type (long/short)
    const sign = trade.positionType === PositionType.LONG ? 1 : -1;
    return sign * Math.abs(optionDelta);
  }

  // For basis and volatility transactions
  if (trade.transactionType === TransactionType.BASIS || 
      trade.transactionType === TransactionType.VOLATILITY) {
    return 1;
  }

  // Default fallback
  return 1;
}

/**
 * Calculate the add-on for a specific asset class
 * @param trades Trades of a specific asset class
 * @param nettingSet Netting set information
 * @returns Add-on value for the asset class
 */
function calculateAssetClassAddOn(
  trades: SpecificTradeData[],
  nettingSet: SACCRInput['nettingSet'],
  assetClass: AssetClass
): number {
  if (trades.length === 0) return 0;

  // Group trades by hedging sets
  const hedgingSets: { [key: string]: SpecificTradeData[] } = {};

  trades.forEach((trade) => {
    let hedgingSetKey = 'DEFAULT';

    // Define hedging set key based on asset class
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        hedgingSetKey =
          (trade as InterestRateTradeData).referenceCurrency || 'DEFAULT';
        break;
      case AssetClass.FOREIGN_EXCHANGE:
        hedgingSetKey =
          (trade as ForeignExchangeTradeData).currencyPair || 'DEFAULT';
        break;
      case AssetClass.CREDIT:
        hedgingSetKey = (trade as CreditTradeData).referenceEntity || 'DEFAULT';
        break;
      case AssetClass.EQUITY:
        hedgingSetKey = (trade as EquityTradeData).issuer || 'DEFAULT';
        break;
      case AssetClass.COMMODITY:
        hedgingSetKey =
          (trade as CommodityTradeData).commodityType || 'DEFAULT';
        break;
    }

    if (!hedgingSets[hedgingSetKey]) {
      hedgingSets[hedgingSetKey] = [];
    }

    hedgingSets[hedgingSetKey].push(trade);
  });

  // Calculate add-on for each hedging set
  let totalAddOn = 0;

  Object.keys(hedgingSets).forEach((hedgingSetKey) => {
    const hedgingSetTrades = hedgingSets[hedgingSetKey];
    let effectiveNotional = 0;

    // Calculate effective notional for the hedging set
    hedgingSetTrades.forEach((trade) => {
      // Uncomment if needed in future calculations
      // const supervisoryFactor = getSupervisoryFactor(trade);
      const maturityFactor = calculateMaturityFactor(trade, nettingSet);
      const delta = calculateSupervisoryDelta(trade);

      // Effective notional = delta * notional * maturityFactor
      const tradeEffectiveNotional =
        delta * trade.notionalAmount * maturityFactor;
      effectiveNotional += tradeEffectiveNotional;
    });

    // Apply supervisory factor to the effective notional
    const supervisoryFactor = getSupervisoryFactor(hedgingSetTrades[0]);
    const hedgingSetAddOn = Math.abs(effectiveNotional) * supervisoryFactor;

    totalAddOn += hedgingSetAddOn;
  });

  return totalAddOn;
}

/**
 * Get the appropriate supervisory factor for a trade
 * @param trade Trade data
 * @returns Supervisory factor
 */
function getSupervisoryFactor(trade: SpecificTradeData): number {
  const { assetClass } = trade;

  switch (assetClass) {
    case AssetClass.INTEREST_RATE:
      return SUPERVISORY_FACTORS[AssetClass.INTEREST_RATE].DEFAULT;

    case AssetClass.FOREIGN_EXCHANGE:
      return SUPERVISORY_FACTORS[AssetClass.FOREIGN_EXCHANGE].DEFAULT;

    case AssetClass.CREDIT:
      const creditTrade = trade as CreditTradeData;
      if (creditTrade.referenceEntity?.includes('INDEX')) {
        return creditTrade.creditQuality === 'INVESTMENT_GRADE'
          ? SUPERVISORY_FACTORS[AssetClass.CREDIT].INVESTMENT_GRADE_INDEX
          : SUPERVISORY_FACTORS[AssetClass.CREDIT].SPECULATIVE_GRADE_INDEX;
      } else {
        return creditTrade.creditQuality === 'INVESTMENT_GRADE'
          ? SUPERVISORY_FACTORS[AssetClass.CREDIT].INVESTMENT_GRADE_SINGLE_NAME
          : SUPERVISORY_FACTORS[AssetClass.CREDIT]
              .SPECULATIVE_GRADE_SINGLE_NAME;
      }

    case AssetClass.EQUITY:
      const equityTrade = trade as EquityTradeData;
      return equityTrade.issuer?.includes('INDEX')
        ? SUPERVISORY_FACTORS[AssetClass.EQUITY].INDEX
        : SUPERVISORY_FACTORS[AssetClass.EQUITY].SINGLE_NAME;

    case AssetClass.COMMODITY:
      const commodityTrade = trade as CommodityTradeData;
      const commodityType = commodityTrade.commodityType;

      if (commodityType === 'ELECTRICITY') {
        return SUPERVISORY_FACTORS[AssetClass.COMMODITY].ELECTRICITY;
      } else if (['OIL', 'GAS'].includes(commodityType)) {
        return SUPERVISORY_FACTORS[AssetClass.COMMODITY].OIL_GAS;
      } else if (commodityType === 'METALS') {
        return SUPERVISORY_FACTORS[AssetClass.COMMODITY].METALS;
      } else if (commodityType === 'AGRICULTURAL') {
        return SUPERVISORY_FACTORS[AssetClass.COMMODITY].AGRICULTURAL;
      } else {
        return SUPERVISORY_FACTORS[AssetClass.COMMODITY].OTHER;
      }

    default:
      return 0.05; // Default factor
  }
}

/**
 * Calculate the Potential Future Exposure (PFE) component of SACCR
 * @param input SACCR input data
 * @param replacementCost Replacement Cost result
 * @returns Potential Future Exposure result
 */
export function calculatePotentialFutureExposure(
  input: SACCRInput,
  replacementCost: ReplacementCostResult
): PotentialFutureExposureResult {
  const { trades, nettingSet } = input;

  // Group trades by asset class
  const tradesByAssetClass: { [key in AssetClass]?: SpecificTradeData[] } = {};

  trades.forEach((trade) => {
    if (!tradesByAssetClass[trade.assetClass]) {
      tradesByAssetClass[trade.assetClass] = [];
    }

    tradesByAssetClass[trade.assetClass]!.push(trade);
  });

  // Calculate add-on for each asset class
  const addOnComponents: { [key in AssetClass]?: number } = {};
  let totalAddOn = 0;

  Object.keys(tradesByAssetClass).forEach((assetClass) => {
    const assetClassTrades = tradesByAssetClass[assetClass as AssetClass]!;
    const assetClassAddOn = calculateAssetClassAddOn(
      assetClassTrades,
      nettingSet,
      assetClass as AssetClass
    );

    addOnComponents[assetClass as AssetClass] = assetClassAddOn;
    totalAddOn += assetClassAddOn;
  });

  // Calculate multiplier
  // multiplier = min{1, 0.05 + 0.95 × exp(V-C/2 × AddOn)}
  const currentExposure = replacementCost.components.currentExposure || 0;
  const variationMargin = replacementCost.components.variationMargin || 0;
  const netCurrentExposure = currentExposure - variationMargin;

  let multiplier = 1;
  if (totalAddOn > 0) {
    const exponent = Math.exp(netCurrentExposure / (2 * totalAddOn));
    multiplier = Math.min(1, 0.05 + 0.95 * exponent);
  }

  // Calculate PFE = multiplier × AddOn
  const pfeValue = multiplier * totalAddOn;

  return {
    value: pfeValue,
    multiplier,
    aggregateAddOn: totalAddOn,
  };
}

/**
 * Calculate the complete SACCR Exposure at Default (EAD)
 * @param input SACCR input data
 * @returns SACCR calculation result
 */
export function calculateSACCR(input: SACCRInput): SACCRResult {
  // Validate input
  validateInput(input);

  // Calculate Replacement Cost (RC)
  const replacementCost = calculateReplacementCost(input);

  // Calculate Potential Future Exposure (PFE)
  const potentialFutureExposure = calculatePotentialFutureExposure(
    input,
    replacementCost
  );

  // Calculate EAD = alpha * (RC + PFE)
  const alpha = 1.4; // Alpha factor as per CRE52
  const exposureAtDefault =
    alpha * (replacementCost.value + potentialFutureExposure.value);

  // Prepare input summary
  const assetClasses = [
    ...new Set(input.trades.map((trade) => trade.assetClass)),
  ];
  const totalNotional = input.trades.reduce(
    (sum, trade) => sum + trade.notionalAmount,
    0
  );

  return {
    exposureAtDefault,
    replacementCost,
    potentialFutureExposure,
    timestamp: new Date().toISOString(),
    inputSummary: {
      nettingSetId: input.nettingSet.nettingAgreementId,
      tradeCount: input.trades.length,
      assetClasses,
      marginType: input.nettingSet.marginType,
      totalNotional,
    },
  };
}

/**
 * Validate the SACCR input data
 * @param input SACCR input data
 * @throws Error if input is invalid
 */
function validateInput(input: SACCRInput): void {
  // Check if trades array exists and is not empty
  if (!input.trades || input.trades.length === 0) {
    throw new Error('No trades provided for SACCR calculation');
  }

  // Check if netting set information is provided
  if (!input.nettingSet) {
    throw new Error(
      'Netting set information is required for SACCR calculation'
    );
  }

  // Validate each trade
  input.trades.forEach((trade: TradeData, index) => {
    if (!trade.id) {
      throw new Error(`Trade at index ${index} is missing an ID`);
    }

    if (!trade.assetClass) {
      throw new Error(`Trade ${trade.id} is missing asset class`);
    }

    if (!trade.transactionType) {
      throw new Error(`Trade ${trade.id} is missing transaction type`);
    }

    if (!trade.positionType) {
      throw new Error(`Trade ${trade.id} is missing position type`);
    }

    if (trade.notionalAmount <= 0) {
      throw new Error(`Trade ${trade.id} has invalid notional amount`);
    }

    if (!trade.maturityDate) {
      throw new Error(`Trade ${trade.id} is missing maturity date`);
    }

    // Validate maturity date is in the future
    const maturityDate = new Date(trade.maturityDate);
    if (isNaN(maturityDate.getTime())) {
      throw new Error(`Trade ${trade.id} has invalid maturity date format`);
    }

    // Additional asset class specific validations could be added here
  });
}

/**
 * Parse and convert CSV data to SACCR input format
 * @param csvData Array of CSV row objects
 * @returns SACCR input data
 */
export function parseCSVToSACCRInput(
  csvData: Record<string, string>[]
): SACCRInput {
  if (!csvData || csvData.length === 0) {
    throw new Error('No CSV data provided');
  }

  // Extract netting set information from the first row
  // Assuming the CSV has columns for netting set information
  const firstRow = csvData[0];
  const nettingSet: SACCRInput['nettingSet'] = {
    nettingAgreementId: firstRow.nettingAgreementId || 'DEFAULT',
    marginType:
      firstRow.marginType === 'MARGINED'
        ? MarginType.MARGINED
        : MarginType.UNMARGINED,
  };

  if (nettingSet.marginType === MarginType.MARGINED) {
    nettingSet.thresholdAmount = parseFloat(
      String(firstRow.thresholdAmount || '0')
    );
    nettingSet.minimumTransferAmount = parseFloat(
      String(firstRow.minimumTransferAmount || '0')
    );
    nettingSet.independentCollateralAmount = parseFloat(
      String(firstRow.independentCollateralAmount || '0')
    );
    nettingSet.variationMargin = parseFloat(
      String(firstRow.variationMargin || '0')
    );
    nettingSet.marginPeriodOfRisk = parseFloat(
      String(firstRow.marginPeriodOfRisk || '10')
    );
  }

  // Parse trades from CSV data
  const trades: SpecificTradeData[] = csvData.map((row) => {
    const baseTradeData = {
      id: row.id,
      assetClass: row.assetClass as AssetClass,
      transactionType: row.transactionType as TransactionType,
      positionType: row.positionType as PositionType,
      notionalAmount: parseFloat(String(row.notionalAmount)),
      currency: row.currency,
      maturityDate: row.maturityDate,
      startDate: row.startDate || new Date().toISOString().split('T')[0],
      currentMarketValue: parseFloat(String(row.currentMarketValue || '0')),
    };

    // Add asset class specific fields
    switch (baseTradeData.assetClass) {
      case AssetClass.INTEREST_RATE:
        return {
          ...baseTradeData,
          referenceCurrency: row.referenceCurrency || baseTradeData.currency,
          paymentFrequency: parseFloat(String(row.paymentFrequency || '3')),
          resetFrequency: parseFloat(String(row.resetFrequency || '3')),
          indexName: row.indexName,
          basis: row.basis,
        } as InterestRateTradeData;

      case AssetClass.FOREIGN_EXCHANGE:
        return {
          ...baseTradeData,
          currencyPair: row.currencyPair || `${baseTradeData.currency}/USD`,
          settlementDate: row.settlementDate || baseTradeData.maturityDate,
        } as ForeignExchangeTradeData;

      case AssetClass.CREDIT:
        return {
          ...baseTradeData,
          referenceEntity: row.referenceEntity,
          seniority: row.seniority || 'SENIOR',
          sector: row.sector || 'CORPORATE',
          creditQuality: row.creditQuality,
        } as CreditTradeData;

      case AssetClass.EQUITY:
        return {
          ...baseTradeData,
          issuer: row.issuer,
          market: row.market || 'DEFAULT',
          sector: row.sector || 'DEFAULT',
        } as EquityTradeData;

      case AssetClass.COMMODITY:
        return {
          ...baseTradeData,
          commodityType: row.commodityType,
          subType: row.subType || 'DEFAULT',
        } as CommodityTradeData;

      default:
        return baseTradeData as SpecificTradeData;
    }
  });

  // Process collateral
  const collateral: SACCRInput['collateral'] = [];
  if (
    firstRow.collateralAmount &&
    parseFloat(String(firstRow.collateralAmount)) > 0
  ) {
    collateral.push({
      collateralAmount: parseFloat(String(firstRow.collateralAmount)),
      collateralCurrency: firstRow.collateralCurrency || 'USD',
      haircut: parseFloat(String(firstRow.haircut || '0')),
    });
  }

  return {
    trades,
    nettingSet,
    collateral: collateral.length > 0 ? collateral : undefined,
  };
}

/**
 * Convert form input to SACCR input format
 * @param formData Form input data
 * @returns SACCR input data
 */
export function convertFormToSACCRInput(formData: SACCRFormInput): SACCRInput {
  // Extract netting set information
  const nettingSet: SACCRInput['nettingSet'] = {
    nettingAgreementId: formData.nettingSet.nettingAgreementId,
    marginType: formData.nettingSet.marginType as MarginType,
  };

  if (nettingSet.marginType === MarginType.MARGINED) {
    nettingSet.thresholdAmount = parseFloat(
      String(formData.nettingSet.thresholdAmount)
    );
    nettingSet.minimumTransferAmount = parseFloat(
      String(formData.nettingSet.minimumTransferAmount)
    );
    nettingSet.independentCollateralAmount = parseFloat(
      String(formData.nettingSet.independentCollateralAmount)
    );
    nettingSet.variationMargin = parseFloat(
      String(formData.nettingSet.variationMargin)
    );
    nettingSet.marginPeriodOfRisk = parseFloat(
      String(formData.nettingSet.marginPeriodOfRisk)
    );
  }

  // Extract trade information
  const baseTradeData: Partial<TradeData> = {
    id: formData.trade.id as string,
    assetClass: formData.trade.assetClass as AssetClass,
    transactionType: formData.trade.transactionType as TransactionType,
    positionType: formData.trade.positionType as PositionType,
    notionalAmount: parseFloat(String(formData.trade.notionalAmount)),
    currency: formData.trade.currency as string,
    maturityDate: formData.trade.maturityDate as string,
    startDate:
      (formData.trade.startDate as string) || new Date().toISOString().split('T')[0],
    currentMarketValue: parseFloat(
      String(formData.trade.currentMarketValue || '0')
    ),
  };

  // Handle option-specific fields if transaction type is OPTION
  if (baseTradeData.transactionType === TransactionType.OPTION) {
    const optionTradeData = baseTradeData as Partial<TradeData & {
      optionType: OptionType;
      strikePrice: number;
      underlyingPrice: number;
      volatility: number;
      timeToMaturity: number;
    }>;
    
    optionTradeData.optionType = formData.trade.optionType as OptionType;
    optionTradeData.strikePrice = parseFloat(String(formData.trade.strikePrice || '0'));
    optionTradeData.underlyingPrice = parseFloat(String(formData.trade.underlyingPrice || '0'));
    optionTradeData.volatility = parseFloat(String(formData.trade.volatility || '0.2'));
    optionTradeData.timeToMaturity = calculateTimeToMaturity(baseTradeData.maturityDate as string);
  }

  // Create specific trade data based on asset class
  let specificTradeData: SpecificTradeData;

  switch (baseTradeData.assetClass) {
    case AssetClass.INTEREST_RATE:
      specificTradeData = {
        ...baseTradeData,
        referenceCurrency:
          formData.trade.referenceCurrency || baseTradeData.currency,
        paymentFrequency: parseFloat(
          String(formData.trade.paymentFrequency || '3')
        ),
        resetFrequency: parseFloat(
          String(formData.trade.resetFrequency || '3')
        ),
        indexName: formData.trade.indexName,
        basis: formData.trade.basis,
      } as InterestRateTradeData;
      break;

    case AssetClass.FOREIGN_EXCHANGE:
      specificTradeData = {
        ...baseTradeData,
        currencyPair:
          formData.trade.currencyPair || `${baseTradeData.currency}/USD`,
        settlementDate:
          formData.trade.settlementDate || baseTradeData.maturityDate,
      } as ForeignExchangeTradeData;
      break;

    case AssetClass.CREDIT:
      specificTradeData = {
        ...baseTradeData,
        referenceEntity: formData.trade.referenceEntity,
        seniority: formData.trade.seniority || 'SENIOR',
        sector: formData.trade.sector || 'CORPORATE',
        creditQuality: formData.trade.creditQuality,
        isIndex: Boolean(formData.trade.isIndex),
      } as CreditTradeData;
      break;

    case AssetClass.EQUITY:
      specificTradeData = {
        ...baseTradeData,
        issuer: formData.trade.issuer,
        market: formData.trade.market || 'DEFAULT',
        sector: formData.trade.sector || 'DEFAULT',
        isIndex: Boolean(formData.trade.isIndex),
      } as EquityTradeData;
      break;

    case AssetClass.COMMODITY:
      specificTradeData = {
        ...baseTradeData,
        commodityType: formData.trade.commodityType,
        subType: formData.trade.subType || 'DEFAULT',
        isElectricity: Boolean(formData.trade.isElectricity),
      } as CommodityTradeData;
      break;

    default:
      specificTradeData = baseTradeData as SpecificTradeData;
  }

  // Process collateral
  const collateral: SACCRInput['collateral'] = [];
  if (formData.collateral && formData.collateral.length > 0) {
    formData.collateral.forEach((item) => {
      if (item.collateralAmount && item.collateralCurrency) {
        collateral.push({
          collateralAmount: parseFloat(String(item.collateralAmount)),
          collateralCurrency: item.collateralCurrency,
          haircut: parseFloat(String(item.haircut || 0)),
        });
      }
    });
  }

  return {
    trades: [specificTradeData],
    nettingSet,
    collateral: collateral.length > 0 ? collateral : undefined,
  };
}

function calculateTimeToMaturity(maturityDate: string): number {
  const maturityDateObject = new Date(maturityDate);
  const currentDate = new Date();
  return Math.max(0.01, (maturityDateObject.getTime() - currentDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
}
