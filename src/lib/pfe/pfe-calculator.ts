import { AssetClass, MarginType } from '../saccr/types';
import { PFECalculationMethod, PFEConfidenceLevel, PFEInput, PFEResult, PFETimeHorizon } from './types';

/**
 * Potential Future Exposure (PFE) Calculator based on SA-CCR framework
 * 
 * This calculator implements the Standardised Approach for Counterparty Credit Risk (SA-CCR)
 * as defined by the Basel Committee on Banking Supervision in March 2014, with subsequent
 * updates from BIS's CRE52 calibration insights.
 */
export class PFECalculator {
  // Supervisory factors by asset class (from CRE52)
  private static SUPERVISORY_FACTORS: Record<AssetClass, number> = {
    [AssetClass.INTEREST_RATE]: 0.005,
    [AssetClass.FOREIGN_EXCHANGE]: 0.04,
    [AssetClass.CREDIT]: 0.05,
    [AssetClass.EQUITY]: 0.32,
    [AssetClass.COMMODITY]: 0.18,
  };

  // Confidence level multipliers
  private static CONFIDENCE_LEVEL_MULTIPLIERS: Record<PFEConfidenceLevel, number> = {
    [PFEConfidenceLevel.NINETY_FIVE_PERCENT]: 1.645,
    [PFEConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT]: 1.96,
    [PFEConfidenceLevel.NINETY_NINE_PERCENT]: 2.326,
  };

  // Time horizon scaling factors
  private static TIME_HORIZON_FACTORS: Record<PFETimeHorizon, number> = {
    [PFETimeHorizon.ONE_WEEK]: 0.2,
    [PFETimeHorizon.TWO_WEEKS]: 0.28,
    [PFETimeHorizon.ONE_MONTH]: 0.45,
    [PFETimeHorizon.THREE_MONTHS]: 0.77,
    [PFETimeHorizon.SIX_MONTHS]: 1.0,
    [PFETimeHorizon.ONE_YEAR]: 1.41,
  };

  /**
   * Calculate Potential Future Exposure (PFE) based on input data
   * @param input PFE calculation input data
   * @returns PFE calculation results
   */
  public static calculatePFE(input: PFEInput): PFEResult {
    // Extract input data
    const { trades, nettingSet, collateral } = input;
    const { timeHorizon, confidenceLevel, calculationMethod } = nettingSet;

    // Calculate based on selected method
    let potentialFutureExposure = 0;
    let expectedExposure = 0;
    let peakExposure = 0;
    let stressedPFE = 0;
    let exposureProfile: Record<string, number> = {};
    let assetClassBreakdown: Partial<Record<AssetClass, number>> = {};

    // Initialize asset class breakdown
    Object.values(AssetClass).forEach(assetClass => {
      assetClassBreakdown[assetClass] = 0;
    });

    // Calculate total notional
    const totalNotional = trades.reduce((sum, trade) => sum + Number(trade.notionalAmount), 0);

    // Get unique asset classes
    const assetClasses = [...new Set(trades.map(trade => trade.assetClass))];

    if (calculationMethod === PFECalculationMethod.REGULATORY_SA_CCR) {
      // Implement SA-CCR based PFE calculation
      potentialFutureExposure = this.calculateSACCRPFE(trades, nettingSet, collateral);
      
      // Calculate asset class breakdown
      assetClasses.forEach(assetClass => {
        const assetClassTrades = trades.filter(trade => trade.assetClass === assetClass);
        const assetClassNotional = assetClassTrades.reduce((sum, trade) => sum + Number(trade.notionalAmount), 0);
        const assetClassPFE = this.calculateAssetClassPFE(assetClassTrades, nettingSet, collateral);
        assetClassBreakdown[assetClass] = assetClassPFE;
      });

      // Generate exposure profile
      exposureProfile = this.generateExposureProfile(trades, nettingSet, collateral);
      
      // Calculate expected and peak exposures
      expectedExposure = Object.values(exposureProfile).reduce((sum, value) => sum + value, 0) / 
                         Object.values(exposureProfile).length;
      peakExposure = Math.max(...Object.values(exposureProfile));
      
      // Calculate stressed PFE (1.5x multiplier as a simple stress scenario)
      stressedPFE = potentialFutureExposure * 1.5;
    } else if (calculationMethod === PFECalculationMethod.INTERNAL_MODEL) {
      // Simplified internal model calculation
      potentialFutureExposure = this.calculateInternalModelPFE(trades, nettingSet, collateral);
      
      // Asset class breakdown for internal model
      assetClasses.forEach(assetClass => {
        const assetClassTrades = trades.filter(trade => trade.assetClass === assetClass);
        const assetClassPFE = this.calculateInternalModelAssetClassPFE(assetClassTrades, nettingSet);
        assetClassBreakdown[assetClass] = assetClassPFE;
      });
      
      // Generate exposure profile
      exposureProfile = this.generateInternalModelExposureProfile(trades, nettingSet, collateral);
      
      // Calculate expected and peak exposures
      expectedExposure = Object.values(exposureProfile).reduce((sum, value) => sum + value, 0) / 
                         Object.values(exposureProfile).length;
      peakExposure = Math.max(...Object.values(exposureProfile));
      
      // Calculate stressed PFE
      stressedPFE = potentialFutureExposure * 1.8; // Higher stress multiplier for internal model
    } else if (calculationMethod === PFECalculationMethod.HISTORICAL_SIMULATION) {
      // Simplified historical simulation calculation
      potentialFutureExposure = this.calculateHistoricalSimulationPFE(trades, nettingSet, collateral);
      
      // Asset class breakdown for historical simulation
      assetClasses.forEach(assetClass => {
        const assetClassTrades = trades.filter(trade => trade.assetClass === assetClass);
        const assetClassPFE = this.calculateHistoricalSimulationAssetClassPFE(assetClassTrades, nettingSet);
        assetClassBreakdown[assetClass] = assetClassPFE;
      });
      
      // Generate exposure profile
      exposureProfile = this.generateHistoricalSimulationExposureProfile(trades, nettingSet, collateral);
      
      // Calculate expected and peak exposures
      expectedExposure = Object.values(exposureProfile).reduce((sum, value) => sum + value, 0) / 
                         Object.values(exposureProfile).length;
      peakExposure = Math.max(...Object.values(exposureProfile));
      
      // Calculate stressed PFE
      stressedPFE = potentialFutureExposure * 2.0; // Higher stress multiplier for historical simulation
    }

    // Return results
    return {
      potentialFutureExposure,
      expectedExposure,
      peakExposure,
      exposureProfile,
      stressedPFE,
      assetClassBreakdown,
      timestamp: new Date().toISOString(),
      inputSummary: {
        nettingSetId: nettingSet.nettingAgreementId,
        tradeCount: trades.length,
        assetClasses,
        marginType: nettingSet.marginType,
        totalNotional,
        timeHorizon,
        confidenceLevel,
        calculationMethod,
      },
    };
  }

  /**
   * Calculate PFE using SA-CCR methodology
   */
  private static calculateSACCRPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): number {
    // Extract parameters
    const { timeHorizon, confidenceLevel, marginType } = nettingSet;
    
    // Get multipliers
    const confidenceMultiplier = this.CONFIDENCE_LEVEL_MULTIPLIERS[confidenceLevel];
    const timeHorizonFactor = this.TIME_HORIZON_FACTORS[timeHorizon];
    
    // Calculate add-on by asset class
    let totalAddOn = 0;
    
    // Group trades by asset class
    const tradesByAssetClass = trades.reduce((groups, trade) => {
      const assetClass = trade.assetClass;
      if (!groups[assetClass]) {
        groups[assetClass] = [];
      }
      groups[assetClass].push(trade);
      return groups;
    }, {} as Record<AssetClass, PFEInput['trades']>);
    
    // Calculate add-on for each asset class
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      const supervisoryFactor = this.SUPERVISORY_FACTORS[assetClass as AssetClass];
      
      // Calculate effective notional for the asset class
      const effectiveNotional = assetClassTrades.reduce((sum, trade) => {
        const adjustedNotional = Number(trade.notionalAmount);
        const maturityFactor = this.calculateMaturityFactor(trade.startDate, trade.maturityDate);
        return sum + (adjustedNotional * maturityFactor);
      }, 0);
      
      // Calculate asset class add-on
      const assetClassAddOn = effectiveNotional * supervisoryFactor;
      totalAddOn += assetClassAddOn;
    });
    
    // Apply margin type adjustment
    const marginFactor = marginType === MarginType.MARGINED ? 0.85 : 1.0;
    
    // Calculate replacement cost
    const replacementCost = this.calculateReplacementCost(trades, nettingSet, collateral);
    
    // Calculate PFE multiplier
    const multiplier = Math.min(1, 0.05 + 0.95 * Math.exp(replacementCost / (2 * totalAddOn * marginFactor)));
    
    // Calculate final PFE
    const pfe = multiplier * totalAddOn * marginFactor * confidenceMultiplier * timeHorizonFactor;
    
    return pfe;
  }

  /**
   * Calculate PFE for a specific asset class using SA-CCR
   */
  private static calculateAssetClassPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): number {
    if (trades.length === 0) return 0;
    
    const { timeHorizon, confidenceLevel, marginType } = nettingSet;
    const assetClass = trades[0].assetClass;
    
    // Get multipliers
    const confidenceMultiplier = this.CONFIDENCE_LEVEL_MULTIPLIERS[confidenceLevel];
    const timeHorizonFactor = this.TIME_HORIZON_FACTORS[timeHorizon];
    const supervisoryFactor = this.SUPERVISORY_FACTORS[assetClass];
    
    // Calculate effective notional
    const effectiveNotional = trades.reduce((sum, trade) => {
      const adjustedNotional = Number(trade.notionalAmount);
      const maturityFactor = this.calculateMaturityFactor(trade.startDate, trade.maturityDate);
      return sum + (adjustedNotional * maturityFactor);
    }, 0);
    
    // Apply margin type adjustment
    const marginFactor = marginType === MarginType.MARGINED ? 0.85 : 1.0;
    
    // Calculate asset class PFE
    const assetClassPFE = effectiveNotional * supervisoryFactor * marginFactor * confidenceMultiplier * timeHorizonFactor;
    
    return assetClassPFE;
  }

  /**
   * Calculate replacement cost
   */
  private static calculateReplacementCost(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): number {
    // Calculate current market value
    const currentMarketValue = trades.reduce((sum, trade) => sum + Number(trade.currentMarketValue), 0);
    
    // Calculate collateral value
    const collateralValue = collateral ? collateral.reduce((sum, col) => {
      const haircut = col.haircut ? Number(col.haircut) : 0;
      return sum + (Number(col.collateralAmount) * (1 - haircut));
    }, 0) : 0;
    
    // Calculate threshold and minimum transfer amount
    const threshold = nettingSet.thresholdAmount ? Number(nettingSet.thresholdAmount) : 0;
    const minimumTransferAmount = nettingSet.minimumTransferAmount ? Number(nettingSet.minimumTransferAmount) : 0;
    
    // Calculate replacement cost
    const replacementCost = Math.max(0, currentMarketValue - collateralValue + threshold + minimumTransferAmount);
    
    return replacementCost;
  }

  /**
   * Calculate maturity factor based on start and maturity dates
   */
  private static calculateMaturityFactor(startDate: string, maturityDate: string): number {
    const start = new Date(startDate);
    const maturity = new Date(maturityDate);
    const now = new Date();
    
    // Calculate time in years
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const timeToMaturity = Math.max(0, (maturity.getTime() - now.getTime()) / oneYearInMs);
    
    // Apply floor of 10 days (10/365)
    const flooredTimeToMaturity = Math.max(10/365, timeToMaturity);
    
    // Calculate maturity factor
    const maturityFactor = Math.sqrt(Math.min(1, flooredTimeToMaturity));
    
    return maturityFactor;
  }

  /**
   * Generate exposure profile over time
   */
  private static generateExposureProfile(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): Record<string, number> {
    const profile: Record<string, number> = {};
    const now = new Date();
    
    // Generate time points based on time horizon
    const timePoints = this.generateTimePoints(nettingSet.timeHorizon);
    
    // Calculate exposure for each time point
    timePoints.forEach(timePoint => {
      const futureDate = new Date(now.getTime() + timePoint.milliseconds);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      // Calculate PFE for this time point
      const timePointPFE = this.calculateTimePointPFE(trades, nettingSet, timePoint.factor, collateral);
      
      profile[futureDateString] = timePointPFE;
    });
    
    return profile;
  }

  /**
   * Generate time points for exposure profile
   */
  private static generateTimePoints(timeHorizon: PFETimeHorizon): { milliseconds: number, factor: number }[] {
    const timePoints: { milliseconds: number, factor: number }[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Define time points based on time horizon
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        for (let i = 1; i <= 7; i++) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 7 });
        }
        break;
      case PFETimeHorizon.TWO_WEEKS:
        for (let i = 1; i <= 14; i += 2) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 14 });
        }
        break;
      case PFETimeHorizon.ONE_MONTH:
        for (let i = 1; i <= 30; i += 5) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 30 });
        }
        break;
      case PFETimeHorizon.THREE_MONTHS:
        for (let i = 1; i <= 90; i += 15) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 90 });
        }
        break;
      case PFETimeHorizon.SIX_MONTHS:
        for (let i = 1; i <= 180; i += 30) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 180 });
        }
        break;
      case PFETimeHorizon.ONE_YEAR:
        for (let i = 1; i <= 365; i += 60) {
          timePoints.push({ milliseconds: i * oneDay, factor: i / 365 });
        }
        break;
    }
    
    return timePoints;
  }

  /**
   * Calculate PFE for a specific time point
   */
  private static calculateTimePointPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], timeFactor: number, collateral?: PFEInput['collateral']): number {
    // Calculate base PFE
    const basePFE = this.calculateSACCRPFE(trades, nettingSet, collateral);
    
    // Apply time factor
    const timePointPFE = basePFE * Math.sqrt(timeFactor);
    
    return timePointPFE;
  }

  /**
   * Calculate PFE using internal model methodology (simplified)
   */
  private static calculateInternalModelPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): number {
    // This is a simplified version of an internal model calculation
    // In a real implementation, this would use Monte Carlo simulation or other advanced techniques
    
    // Calculate base PFE using SA-CCR
    const basePFE = this.calculateSACCRPFE(trades, nettingSet, collateral);
    
    // Apply internal model adjustment (simplified)
    // In reality, this would be based on historical data, correlations, etc.
    const internalModelPFE = basePFE * 0.9; // Typically internal models produce lower PFE than standardized approaches
    
    return internalModelPFE;
  }

  /**
   * Calculate PFE for a specific asset class using internal model
   */
  private static calculateInternalModelAssetClassPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet']): number {
    if (trades.length === 0) return 0;
    
    // Calculate base asset class PFE
    const baseAssetClassPFE = this.calculateAssetClassPFE(trades, nettingSet);
    
    // Apply internal model adjustment
    const internalModelAssetClassPFE = baseAssetClassPFE * 0.9;
    
    return internalModelAssetClassPFE;
  }

  /**
   * Generate exposure profile using internal model
   */
  private static generateInternalModelExposureProfile(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): Record<string, number> {
    // Generate base exposure profile
    const baseProfile = this.generateExposureProfile(trades, nettingSet, collateral);
    
    // Apply internal model adjustments
    const internalModelProfile: Record<string, number> = {};
    
    Object.entries(baseProfile).forEach(([date, exposure]) => {
      // Apply internal model adjustment
      internalModelProfile[date] = exposure * 0.9;
    });
    
    return internalModelProfile;
  }

  /**
   * Calculate PFE using historical simulation methodology (simplified)
   */
  private static calculateHistoricalSimulationPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): number {
    // This is a simplified version of a historical simulation calculation
    // In a real implementation, this would use actual historical market data
    
    // Calculate base PFE using SA-CCR
    const basePFE = this.calculateSACCRPFE(trades, nettingSet, collateral);
    
    // Apply historical simulation adjustment (simplified)
    // In reality, this would be based on actual historical scenarios
    const historicalSimulationPFE = basePFE * 1.1; // Historical simulation often produces higher PFE due to fat tails
    
    return historicalSimulationPFE;
  }

  /**
   * Calculate PFE for a specific asset class using historical simulation
   */
  private static calculateHistoricalSimulationAssetClassPFE(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet']): number {
    if (trades.length === 0) return 0;
    
    // Calculate base asset class PFE
    const baseAssetClassPFE = this.calculateAssetClassPFE(trades, nettingSet);
    
    // Apply historical simulation adjustment
    const historicalSimulationAssetClassPFE = baseAssetClassPFE * 1.1;
    
    return historicalSimulationAssetClassPFE;
  }

  /**
   * Generate exposure profile using historical simulation
   */
  private static generateHistoricalSimulationExposureProfile(trades: PFEInput['trades'], nettingSet: PFEInput['nettingSet'], collateral?: PFEInput['collateral']): Record<string, number> {
    // Generate base exposure profile
    const baseProfile = this.generateExposureProfile(trades, nettingSet, collateral);
    
    // Apply historical simulation adjustments
    const historicalSimulationProfile: Record<string, number> = {};
    
    Object.entries(baseProfile).forEach(([date, exposure]) => {
      // Apply historical simulation adjustment
      historicalSimulationProfile[date] = exposure * 1.1;
    });
    
    return historicalSimulationProfile;
  }
}
