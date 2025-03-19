import {
  PFEInput,
  PFEResult,
  PFETradeData,
  PFETimeHorizon,
  PFEConfidenceLevel,
  PFECalculationMethod,
} from './types';
import { AssetClass, MarginType, TransactionType, PositionType } from '../saccr/types';

/**
 * Calculator for Potential Future Exposure (PFE) based on the SA-CCR framework
 * 
 * This class implements the calculation of PFE for derivative portfolios
 * following the Basel Committee on Banking Supervision's SA-CCR methodology.
 */
export class PFECalculator {
  /**
   * Calculate Potential Future Exposure (PFE) for a portfolio of trades
   * 
   * @param input The PFE calculation input
   * @returns The PFE calculation result
   */
  public static calculatePFE(input: PFEInput): PFEResult {
    // Extract input parameters
    const { trades, nettingSet } = input;
    
    // Calculate total notional and identify asset classes
    const totalNotional = trades.reduce((sum, trade) => sum + trade.notionalAmount, 0);
    const assetClasses = Array.from(new Set(trades.map(trade => trade.assetClass)));
    
    // Calculate PFE based on calculation method
    let potentialFutureExposure = 0;
    let expectedExposure = 0;
    let peakExposure = 0;
    let stressedPFE: number | undefined = undefined;
    
    // Initialize asset class breakdown
    const assetClassBreakdown: Record<string, number> = {};
    assetClasses.forEach(assetClass => {
      assetClassBreakdown[assetClass] = 0;
    });
    
    // Calculate PFE based on calculation method
    switch (nettingSet.calculationMethod) {
      case PFECalculationMethod.REGULATORY_STANDARDISED_APPROACH:
        // Implement SA-CCR methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingStandardisedApproach(trades, nettingSet, assetClassBreakdown));
        break;
      
      case PFECalculationMethod.MONTE_CARLO_SIMULATION:
        // Implement Monte Carlo simulation methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingMonteCarloSimulation(trades, nettingSet, assetClassBreakdown));
        break;
      
      case PFECalculationMethod.INTERNAL_MODEL_METHOD:
        // Implement internal model methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingInternalModel(trades, nettingSet, assetClassBreakdown));
        break;
      
      case PFECalculationMethod.HISTORICAL_SIMULATION_METHOD:
        // Implement historical simulation methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingHistoricalSimulation(trades, nettingSet, assetClassBreakdown));
        break;
      
      default:
        // Default to Standardised Approach
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingStandardisedApproach(trades, nettingSet, assetClassBreakdown));
    }
    
    // Generate exposure profile over time
    const exposureProfile = this.generateExposureProfile(trades, nettingSet);
    
    // Return result
    return {
      potentialFutureExposure,
      expectedExposure,
      peakExposure,
      stressedPFE,
      exposureProfile,
      assetClassBreakdown,
      timestamp: new Date().toISOString(),
      inputSummary: {
        nettingSetId: nettingSet.nettingAgreementId,
        tradeCount: trades.length,
        totalNotional,
        assetClasses,
        timeHorizon: nettingSet.timeHorizon,
        confidenceLevel: nettingSet.confidenceLevel,
        calculationMethod: nettingSet.calculationMethod,
        marginType: nettingSet.marginType,
      },
    };
  }
  
  /**
   * Calculate PFE using the Standardised Approach methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingStandardisedApproach(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate add-on for each asset class
      const assetClassAddOn = this.calculateAddOn(assetClassTrades);
      
      // Calculate PFE contribution for this asset class
      const pfeFactor = this.getPFEFactor(assetClass as AssetClass, nettingSet.timeHorizon, nettingSet.confidenceLevel);
      const assetClassPFE = assetClassAddOn * pfeFactor;
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure (typically lower than PFE)
      // Different asset classes have different EE/PFE ratios
      let eeFactor = 0.7; // Default
      
      // Adjust EE factor based on asset class
      switch (assetClass) {
        case AssetClass.INTEREST_RATE:
          eeFactor = 0.65; // Interest rates tend to be more stable
          break;
        case AssetClass.FOREIGN_EXCHANGE:
          eeFactor = 0.7;
          break;
        case AssetClass.CREDIT:
          eeFactor = 0.75; // Credit can have jump-to-default risk
          break;
        case AssetClass.EQUITY:
          eeFactor = 0.8; // Equities can be more volatile
          break;
        case AssetClass.COMMODITY:
          eeFactor = 0.75; // Commodities can have seasonal patterns
          break;
      }
      
      const assetClassEE = assetClassPFE * eeFactor;
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Apply netting set adjustments
    if (nettingSet.marginType === MarginType.MARGINED) {
      // Apply margin period of risk adjustment
      const mporFactor = Math.sqrt(nettingSet.marginPeriodOfRisk || 10) / Math.sqrt(10);
      totalPFE *= mporFactor;
      totalEE *= mporFactor;
      maxPFE *= mporFactor;
    }
    
    // Calculate stressed PFE (typically 2-3x normal PFE)
    // Different asset classes may have different stress factors
    const stressedPFE = totalPFE * 2.5;
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Calculate PFE using Monte Carlo simulation methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingMonteCarloSimulation(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Implementation of Monte Carlo simulation methodology
    
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Monte Carlo simulation parameters
    const numSimulations = 10000;
    const numTimeSteps = this.getTimeStepsForHorizon(nettingSet.timeHorizon);
    const confidenceLevel = this.getConfidenceLevelPercentile(nettingSet.confidenceLevel);
    
    // Initialize simulation results arrays
    const simulationResults: number[] = new Array(numSimulations).fill(0);
    const timeStepResults: number[][] = Array(numTimeSteps).fill(0).map(() => new Array(numSimulations).fill(0));
    
    // Run Monte Carlo simulations
    for (let sim = 0; sim < numSimulations; sim++) {
      // Initialize market factors for this simulation
      const marketFactors = this.initializeMarketFactors(trades);
      
      // Simulate market factor paths over time steps
      const marketFactorPaths = this.simulateMarketFactorPaths(marketFactors, numTimeSteps);
      
      // Calculate portfolio value at each time step
      for (let step = 0; step < numTimeSteps; step++) {
        let portfolioValue = 0;
        
        // Calculate value for each asset class
        Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
          const assetClassValue = this.calculateAssetClassValue(
            assetClassTrades, 
            marketFactorPaths[step][assetClass as AssetClass],
            step,
            numTimeSteps
          );
          
          // Add to portfolio value for this time step and simulation
          portfolioValue += assetClassValue;
          
          // Store in time step results
          timeStepResults[step][sim] = portfolioValue;
        });
        
        // Store maximum exposure across time steps for this simulation
        if (portfolioValue > simulationResults[sim]) {
          simulationResults[sim] = portfolioValue;
        }
      }
    }
    
    // Sort simulation results for percentile calculation
    simulationResults.sort((a, b) => a - b);
    
    // Calculate PFE at the specified confidence level
    const pfeIndex = Math.floor(numSimulations * confidenceLevel);
    const potentialFutureExposure = simulationResults[pfeIndex];
    
    // Calculate expected exposure (average across simulations)
    const expectedExposure = simulationResults.reduce((sum, val) => sum + val, 0) / numSimulations;
    
    // Calculate peak exposure (maximum across all simulations)
    const peakExposure = Math.max(...simulationResults);
    
    // Calculate stressed PFE (using stress scenarios)
    const stressedPFE = this.calculateStressedPFE(simulationResults, trades);
    
    // Calculate asset class breakdown
    Object.keys(assetClassBreakdown).forEach(assetClass => {
      // Calculate contribution of each asset class to total PFE
      const assetClassTrades = tradesByAssetClass[assetClass] || [];
      if (assetClassTrades.length > 0) {
        const assetClassWeight = assetClassTrades.reduce((sum, trade) => sum + trade.notionalAmount, 0) / 
          trades.reduce((sum, trade) => sum + trade.notionalAmount, 0);
        
        // Apply some diversification benefit
        const diversificationFactor = 0.85; // Assets are not perfectly correlated
        assetClassBreakdown[assetClass] = potentialFutureExposure * assetClassWeight * diversificationFactor;
      } else {
        assetClassBreakdown[assetClass] = 0;
      }
    });
    
    return {
      potentialFutureExposure,
      expectedExposure,
      peakExposure,
      stressedPFE,
    };
  }
  
  /**
   * Initialize market factors for Monte Carlo simulation
   * 
   * @param trades The trades to initialize market factors for
   * @returns The initialized market factors
   */
  private static initializeMarketFactors(trades: PFETradeData[]): Record<AssetClass, number> {
    // Initialize market factors for each asset class
    const marketFactors: Record<AssetClass, number> = {} as Record<AssetClass, number>;
    
    // Get unique asset classes
    const assetClasses = Array.from(new Set(trades.map(trade => trade.assetClass)));
    
    // Initialize market factors with base values
    assetClasses.forEach(assetClass => {
      // Base market factor (starting point for simulation)
      marketFactors[assetClass] = 1.0;
    });
    
    return marketFactors;
  }
  
  /**
   * Simulate market factor paths for Monte Carlo simulation
   * 
   * @param initialMarketFactors The initial market factors
   * @param numTimeSteps The number of time steps to simulate
   * @returns The simulated market factor paths
   */
  private static simulateMarketFactorPaths(
    initialMarketFactors: Record<AssetClass, number>,
    numTimeSteps: number
  ): Array<Record<AssetClass, number>> {
    // Simulate market factor paths using Geometric Brownian Motion
    const marketFactorPaths: Array<Record<AssetClass, number>> = [];
    
    // Initialize with initial market factors
    marketFactorPaths.push({...initialMarketFactors});
    
    // Simulate for each time step
    for (let step = 1; step < numTimeSteps; step++) {
      const newMarketFactors: Record<AssetClass, number> = {} as Record<AssetClass, number>;
      
      // Simulate each asset class
      Object.entries(initialMarketFactors).forEach(([assetClass]) => {
        // Get parameters for this asset class
        const drift = this.getAssetClassDrift(assetClass as AssetClass);
        const volatility = this.getAssetClassVolatility(assetClass as AssetClass);
        
        // Time increment (normalized to 1 year)
        const dt = 1.0 / numTimeSteps;
        
        // Previous value
        const prevValue = marketFactorPaths[step - 1][assetClass as AssetClass];
        
        // Generate random normal variable
        const randomNormal = this.generateNormalRandom();
        
        // Geometric Brownian Motion formula
        const newValue = prevValue * Math.exp(
          (drift - 0.5 * volatility * volatility) * dt + 
          volatility * Math.sqrt(dt) * randomNormal
        );
        
        newMarketFactors[assetClass as AssetClass] = newValue;
      });
      
      marketFactorPaths.push(newMarketFactors);
    }
    
    return marketFactorPaths;
  }
  
  /**
   * Calculate asset class value for Monte Carlo simulation
   * 
   * @param trades The trades in the asset class
   * @param marketFactor The market factor for the asset class
   * @param timeStep The current time step
   * @param totalTimeSteps The total number of time steps
   * @returns The asset class value
   */
  private static calculateAssetClassValue(
    trades: PFETradeData[],
    marketFactor: number,
    timeStep: number,
    totalTimeSteps: number
  ): number {
    // Calculate value for each trade
    return trades.reduce((sum, trade) => {
      // Calculate time to maturity
      const maturityDate = new Date(trade.maturityDate);
      const today = new Date();
      const maturityInYears = (maturityDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000);
      
      // Calculate time factor (fraction of time step to maturity)
      const timeToMaturityInSteps = (maturityInYears * totalTimeSteps) - timeStep;
      const timeFactor = Math.max(0, Math.min(1, timeToMaturityInSteps / totalTimeSteps));
      
      // Calculate trade value based on market factor and time to maturity
      let tradeValue = trade.notionalAmount * (marketFactor - 1.0) * timeFactor;
      
      // Apply adjustments based on transaction type
      if (trade.transactionType === TransactionType.OPTION) {
        // Option valuation (simplified)
        if (trade.positionType === PositionType.LONG) {
          // Long option - value can't be negative
          tradeValue = Math.max(0, tradeValue);
        } else {
          // Short option - value is capped
          tradeValue = Math.min(0, tradeValue);
        }
      }
      
      return sum + tradeValue;
    }, 0);
  }
  
  /**
   * Calculate stressed PFE from simulation results
   * 
   * @param simulationResults The simulation results
   * @param trades The trades in the portfolio
   * @returns The stressed PFE
   */
  private static calculateStressedPFE(simulationResults: number[], trades: PFETradeData[]): number {
    // Calculate stressed PFE by applying stress factors to simulation results
    
    // Get maximum exposure from simulations
    const maxExposure = Math.max(...simulationResults);
    
    // Apply stress factor based on asset class composition
    const assetClassWeights: Record<AssetClass, number> = {} as Record<AssetClass, number>;
    const totalNotional = trades.reduce((sum, trade) => sum + trade.notionalAmount, 0);
    
    // Calculate weights by asset class
    trades.forEach(trade => {
      if (!assetClassWeights[trade.assetClass]) {
        assetClassWeights[trade.assetClass] = 0;
      }
      assetClassWeights[trade.assetClass] += trade.notionalAmount / totalNotional;
    });
    
    // Apply stress factors by asset class
    let stressFactor = 0;
    Object.entries(assetClassWeights).forEach(([assetClass, weight]) => {
      // Get stress factor for this asset class
      const assetClassStressFactor = this.getAssetClassStressFactor(assetClass as AssetClass);
      stressFactor += weight * assetClassStressFactor;
    });
    
    // Apply minimum stress factor
    stressFactor = Math.max(1.5, stressFactor);
    
    return maxExposure * stressFactor;
  }
  
  /**
   * Generate a random number from a standard normal distribution
   * 
   * @returns A random number from a standard normal distribution
   */
  private static generateNormalRandom(): number {
    // Box-Muller transform to generate normal random variable
    const u1 = Math.random();
    const u2 = Math.random();
    
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
  
  /**
   * Get the number of time steps for a time horizon
   * 
   * @param timeHorizon The time horizon
   * @returns The number of time steps
   */
  private static getTimeStepsForHorizon(timeHorizon: PFETimeHorizon): number {
    // Map time horizon to number of time steps
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        return 5; // Daily steps for a week
      case PFETimeHorizon.TWO_WEEKS:
        return 10; // Daily steps for two weeks
      case PFETimeHorizon.ONE_MONTH:
        return 21; // Daily steps for a month
      case PFETimeHorizon.THREE_MONTHS:
        return 63; // Daily steps for three months
      case PFETimeHorizon.SIX_MONTHS:
        return 126; // Daily steps for six months
      case PFETimeHorizon.ONE_YEAR:
        return 252; // Daily steps for a year
      default:
        return 21; // Default to one month
    }
  }
  
  /**
   * Get the percentile value for a confidence level
   * 
   * @param confidenceLevel The confidence level
   * @returns The percentile value
   */
  private static getConfidenceLevelPercentile(confidenceLevel: PFEConfidenceLevel): number {
    // Map confidence level to percentile
    switch (confidenceLevel) {
      case PFEConfidenceLevel.NINETY_FIVE_PERCENT:
        return 0.95;
      case PFEConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT:
        return 0.975;
      case PFEConfidenceLevel.NINETY_NINE_PERCENT:
        return 0.99;
      default:
        return 0.95; // Default to 95%
    }
  }
  
  /**
   * Get the drift parameter for an asset class
   * 
   * @param assetClass The asset class
   * @returns The drift parameter
   */
  private static getAssetClassDrift(assetClass: AssetClass): number {
    // Drift parameters by asset class (annualized)
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.005; // 0.5% drift for interest rates
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.01; // 1% drift for FX
      case AssetClass.CREDIT:
        return 0.02; // 2% drift for credit
      case AssetClass.EQUITY:
        return 0.07; // 7% drift for equity
      case AssetClass.COMMODITY:
        return 0.03; // 3% drift for commodities
      default:
        return 0.02; // Default drift
    }
  }
  
  /**
   * Get the stress factor for an asset class
   * 
   * @param assetClass The asset class
   * @returns The stress factor
   */
  private static getAssetClassStressFactor(assetClass: AssetClass): number {
    // Stress factors by asset class
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 1.5; // Lower stress for interest rates
      case AssetClass.FOREIGN_EXCHANGE:
        return 2.0; // Medium stress for FX
      case AssetClass.CREDIT:
        return 2.5; // Higher stress for credit
      case AssetClass.EQUITY:
        return 3.0; // Highest stress for equity
      case AssetClass.COMMODITY:
        return 2.5; // Higher stress for commodities
      default:
        return 2.0; // Default stress factor
    }
  }
  
  /**
   * Calculate add-on for a set of trades
   * 
   * @param trades The trades to calculate add-on for
   * @returns The add-on amount
   */
  private static calculateAddOn(
    trades: PFETradeData[]
  ): number {
    // Implementation of add-on calculation based on SA-CCR
    
    // Calculate adjusted notional
    const adjustedNotional = trades.reduce((sum, trade) => {
      // Apply adjustments based on transaction type
      let adjustment = 1.0;
      
      // Apply delta adjustment for options
      if (trade.transactionType === TransactionType.OPTION) {
        // Calculate delta based on position type
        if (trade.positionType === PositionType.LONG) {
          adjustment = 0.8; // Simplified delta for long option
        } else {
          adjustment = -0.8; // Simplified delta for short option
        }
        
        // If volatility is provided, use it for more accurate delta
        if (trade.volatility) {
          // Apply volatility adjustment
          adjustment *= Math.sqrt(trade.volatility);
        }
      } else if (trade.transactionType === TransactionType.BASIS) {
        // Basis swaps have reduced risk
        adjustment = 0.5;
      } else if (trade.transactionType === TransactionType.VOLATILITY) {
        // Volatility trades have increased risk
        adjustment = 1.5;
      }
      
      // Apply maturity factor
      const maturityDate = new Date(trade.maturityDate);
      const today = new Date();
      const maturityInYears = (maturityDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000);
      const maturityFactor = Math.min(1, Math.max(0.05, maturityInYears / 5));
      
      return sum + (trade.notionalAmount * Math.abs(adjustment) * maturityFactor);
    }, 0);
    
    // Apply supervisory factor based on asset class
    const supervisoryFactor = this.getSupervisoryFactor(trades[0].assetClass);
    
    return adjustedNotional * supervisoryFactor;
  }
  
  /**
   * Get supervisory factor for an asset class
   * 
   * @param assetClass The asset class
   * @returns The supervisory factor
   */
  private static getSupervisoryFactor(assetClass: AssetClass): number {
    // Supervisory factors from SA-CCR
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.005; // 0.5%
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.04;  // 4%
      case AssetClass.CREDIT:
        return 0.05;  // 5% - could be refined based on credit quality
      case AssetClass.EQUITY:
        return 0.32;  // 32%
      case AssetClass.COMMODITY:
        return 0.18;  // 18% - could be refined based on commodity type
      default:
        return 0.15;  // Default factor
    }
  }
  
  /**
   * Calculate PFE using an internal model methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingInternalModel(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Implementation of internal model methodology
    // This is a simplified version for demonstration
    
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class using internal model
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate PFE contribution for this asset class using internal model
      const volatility = this.getAssetClassVolatility(assetClass as AssetClass);
      const timeHorizonFactor = this.getTimeHorizonFactor(nettingSet.timeHorizon);
      const confidenceFactor = this.getConfidenceFactor(nettingSet.confidenceLevel);
      
      // Internal model calculation (simplified)
      const assetClassPFE = assetClassTrades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        volatility * timeHorizonFactor * confidenceFactor;
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure
      const assetClassEE = assetClassPFE * 0.65; // Simplified approach for internal model
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Calculate stressed PFE
    const stressedPFE = totalPFE * 3.0; // Higher stress factor for internal model
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Calculate PFE using historical simulation methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingHistoricalSimulation(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Implementation of historical simulation methodology
    // This is a simplified version for demonstration
    
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class using historical simulation
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate PFE contribution for this asset class using historical data
      const historicalVolatility = this.getHistoricalVolatility(assetClass as AssetClass);
      const timeHorizonFactor = this.getTimeHorizonFactor(nettingSet.timeHorizon);
      const confidenceFactor = this.getConfidenceFactor(nettingSet.confidenceLevel);
      
      // Historical simulation calculation (simplified)
      const assetClassPFE = assetClassTrades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        historicalVolatility * timeHorizonFactor * confidenceFactor * 1.2; // Historical factor
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure
      const assetClassEE = assetClassPFE * 0.6; // Simplified approach for historical simulation
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Calculate stressed PFE
    const stressedPFE = totalPFE * 2.2; // Stress factor based on historical worst-case
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Generate exposure profile over time
   * 
   * @param trades The trades to generate profile for
   * @param nettingSet The netting set information
   * @returns The exposure profile
   */
  private static generateExposureProfile(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet']
  ): Record<string, number> {
    const profile: Record<string, number> = {};
    const end = this.getTimeHorizonInDays(nettingSet.timeHorizon);
    
    // Generate profile points
    const numPoints = 10; // Number of points in the profile
    const interval = end / numPoints;
    
    for (let i = 0; i <= numPoints; i++) {
      const days = Math.round(i * interval);
      const date = this.addDaysToToday(days);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate exposure at this point (simplified)
      const exposureFactor = this.getExposureFactor(days, end);
      const exposure = trades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        this.getPFEFactor(trades[0].assetClass, nettingSet.timeHorizon, nettingSet.confidenceLevel) * 
        exposureFactor;
      
      profile[dateStr] = exposure;
    }
    
    return profile;
  }
  
  /**
   * Get PFE factor based on asset class, time horizon, and confidence level
   * 
   * @param assetClass The asset class
   * @param timeHorizon The time horizon
   * @param confidenceLevel The confidence level
   * @returns The PFE factor
   */
  private static getPFEFactor(
    assetClass: AssetClass,
    timeHorizon: PFETimeHorizon,
    confidenceLevel: PFEConfidenceLevel
  ): number {
    // Base factor from supervisory factor
    const baseFactor = this.getSupervisoryFactor(assetClass);
    
    // Adjust for time horizon
    const timeHorizonFactor = this.getTimeHorizonFactor(timeHorizon);
    
    // Adjust for confidence level
    const confidenceFactor = this.getConfidenceFactor(confidenceLevel);
    
    return baseFactor * timeHorizonFactor * confidenceFactor;
  }
  
  /**
   * Get time horizon factor
   * 
   * @param timeHorizon The time horizon
   * @returns The time horizon factor
   */
  private static getTimeHorizonFactor(timeHorizon: PFETimeHorizon): number {
    // Time horizon factors based on square root of time
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        return Math.sqrt(7 / 365);
      case PFETimeHorizon.TWO_WEEKS:
        return Math.sqrt(14 / 365);
      case PFETimeHorizon.ONE_MONTH:
        return Math.sqrt(30 / 365);
      case PFETimeHorizon.THREE_MONTHS:
        return Math.sqrt(90 / 365);
      case PFETimeHorizon.SIX_MONTHS:
        return Math.sqrt(180 / 365);
      case PFETimeHorizon.ONE_YEAR:
        return 1.0;
      default:
        return 1.0;
    }
  }
  
  /**
   * Get confidence factor
   * 
   * @param confidenceLevel The confidence level
   * @returns The confidence factor
   */
  private static getConfidenceFactor(confidenceLevel: PFEConfidenceLevel): number {
    // Confidence factors based on normal distribution quantiles
    switch (confidenceLevel) {
      case PFEConfidenceLevel.NINETY_FIVE_PERCENT:
        return 1.645;
      case PFEConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT:
        return 1.96;
      case PFEConfidenceLevel.NINETY_NINE_PERCENT:
        return 2.326;
      default:
        return 1.645;
    }
  }
  
  /**
   * Get asset class volatility
   * 
   * @param assetClass The asset class
   * @returns The volatility
   */
  private static getAssetClassVolatility(assetClass: AssetClass): number {
    // Asset class volatilities for internal model
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.01;
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.08;
      case AssetClass.CREDIT:
        return 0.10;
      case AssetClass.EQUITY:
        return 0.20;
      case AssetClass.COMMODITY:
        return 0.15;
      default:
        return 0.12;
    }
  }
  
  /**
   * Get historical volatility
   * 
   * @param assetClass The asset class
   * @returns The historical volatility
   */
  private static getHistoricalVolatility(assetClass: AssetClass): number {
    // Historical volatilities based on stress periods
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.015;
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.12;
      case AssetClass.CREDIT:
        return 0.15;
      case AssetClass.EQUITY:
        return 0.30;
      case AssetClass.COMMODITY:
        return 0.25;
      default:
        return 0.18;
    }
  }
  
  /**
   * Get time horizon in days
   * 
   * @param timeHorizon The time horizon
   * @returns The time horizon in days
   */
  private static getTimeHorizonInDays(timeHorizon: PFETimeHorizon): number {
    // Convert time horizon to days
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        return 7;
      case PFETimeHorizon.TWO_WEEKS:
        return 14;
      case PFETimeHorizon.ONE_MONTH:
        return 30;
      case PFETimeHorizon.THREE_MONTHS:
        return 90;
      case PFETimeHorizon.SIX_MONTHS:
        return 180;
      case PFETimeHorizon.ONE_YEAR:
        return 365;
      default:
        return 365;
    }
  }
  
  /**
   * Add days to today
   * 
   * @param days The number of days to add
   * @returns The new date
   */
  private static addDaysToToday(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
  
  /**
   * Get exposure factor
   * 
   * @param days The number of days
   * @param totalDays The total number of days
   * @returns The exposure factor
   */
  private static getExposureFactor(days: number, totalDays: number): number {
    // Exposure profile shape (simplified)
    // Typically rises and then falls
    if (days === 0) {
      return 0.2; // Initial exposure
    } else if (days >= totalDays) {
      return 0.5; // Final exposure
    } else {
      // Peak in the middle
      const normalizedTime = days / totalDays;
      return 0.2 + Math.sin(normalizedTime * Math.PI) * 0.8;
    }
  }
}
