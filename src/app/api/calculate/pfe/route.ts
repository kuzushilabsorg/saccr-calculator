import { NextRequest, NextResponse } from 'next/server';
import { PFECalculator } from '@/lib/pfe/pfe-calculator';
import { PFEInput } from '@/lib/pfe/types';

/**
 * API route for calculating Potential Future Exposure (PFE)
 * 
 * This endpoint accepts PFE calculation inputs and returns the calculated PFE results.
 * It implements the SA-CCR framework as defined by the Basel Committee on Banking Supervision.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData = await request.json();
    
    // Validate input data
    if (!requestData.trades || !requestData.nettingSet) {
      return NextResponse.json(
        { error: 'Missing required fields: trades and nettingSet are required' },
        { status: 400 }
      );
    }
    
    // Convert string values to numbers
    const input: PFEInput = {
      trades: requestData.trades.map((trade: any) => ({
        ...trade,
        notionalAmount: Number(trade.notionalAmount),
        currentMarketValue: Number(trade.currentMarketValue),
        volatility: trade.volatility ? Number(trade.volatility) : undefined,
      })),
      nettingSet: {
        ...requestData.nettingSet,
        thresholdAmount: requestData.nettingSet.thresholdAmount ? Number(requestData.nettingSet.thresholdAmount) : undefined,
        minimumTransferAmount: requestData.nettingSet.minimumTransferAmount ? Number(requestData.nettingSet.minimumTransferAmount) : undefined,
        marginPeriodOfRisk: requestData.nettingSet.marginPeriodOfRisk ? Number(requestData.nettingSet.marginPeriodOfRisk) : undefined,
      },
      collateral: requestData.collateral ? requestData.collateral.map((col: any) => ({
        ...col,
        collateralAmount: Number(col.collateralAmount),
        haircut: col.haircut ? Number(col.haircut) : undefined,
        stressedHaircut: col.stressedHaircut ? Number(col.stressedHaircut) : undefined,
      })) : undefined,
    };
    
    // Calculate PFE
    const result = PFECalculator.calculatePFE(input);
    
    // Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating PFE:', error);
    return NextResponse.json(
      { error: 'Failed to calculate PFE', details: (error as Error).message },
      { status: 500 }
    );
  }
}
