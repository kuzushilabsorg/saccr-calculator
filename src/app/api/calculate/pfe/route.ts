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
    const body = await request.json();
    
    // Validate input
    if (!body.nettingSet || !body.trades) {
      return NextResponse.json(
        { error: "Missing required fields: nettingSet and trades" },
        { status: 400 }
      );
    }
    
    // Prepare input for PFE calculator
    const input: PFEInput = {
      nettingSet: body.nettingSet,
      trades: body.trades,
      collateral: body.collateral || [],
    };
    
    // Calculate PFE
    const result = PFECalculator.calculatePFE(input);
    
    // Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating PFE:", error);
    return NextResponse.json(
      { error: "Failed to calculate PFE" },
      { status: 500 }
    );
  }
}
