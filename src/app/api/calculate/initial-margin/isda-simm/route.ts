import { NextRequest, NextResponse } from 'next/server';
import {
  calculateISDASIMM,
  convertFormToISDASIMMInput,
  parseCSVToISDASIMMInput,
} from '@/lib/initial-margin/isda-simm-calculator';
import { isdaSimmFormSchema, isdaSimmCsvSchema } from '@/lib/initial-margin/schema';
import { ISDASIMMFormInput, ISDASIMMResult } from '@/lib/initial-margin/types';
import { MarginType } from '@/lib/saccr/types';
import { ZodError } from 'zod';

/**
 * API handler for ISDA SIMM Initial Margin calculations
 * Supports both form data and CSV uploads
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let isdaSimmInput: ISDASIMMFormInput;

    if (contentType.includes('application/json')) {
      // Handle JSON form data
      const body = await request.json();

      try {
        // Validate form data
        const validatedData = isdaSimmFormSchema.parse(body);
        isdaSimmInput = convertFormToISDASIMMInput(validatedData);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              details: error.errors,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Handle CSV upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const nettingSetId = formData.get('nettingAgreementId') as string;
      const marginType = formData.get('marginType') as string;
      const thresholdAmount = formData.get('thresholdAmount') as string;
      const minimumTransferAmount = formData.get('minimumTransferAmount') as string;

      if (!file || !nettingSetId || !marginType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields',
          },
          { status: 400 }
        );
      }

      try {
        // Parse CSV file
        const text = await file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        const csvData = [];

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          const values = rows[i].split(',');
          const row: Record<string, string> = {};

          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });

          csvData.push(row);
        }

        // Validate CSV data
        const validatedData = isdaSimmCsvSchema.parse(csvData);
        const trades = parseCSVToISDASIMMInput(validatedData);

        // Create input object
        isdaSimmInput = {
          nettingSet: {
            nettingAgreementId: nettingSetId,
            marginType: marginType as MarginType,
            thresholdAmount: thresholdAmount ? parseFloat(thresholdAmount) : undefined,
            minimumTransferAmount: minimumTransferAmount ? parseFloat(minimumTransferAmount) : undefined,
          },
          trades,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'CSV validation error',
              details: error.errors,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported content type',
        },
        { status: 415 }
      );
    }

    // Calculate Initial Margin
    const result: ISDASIMMResult = calculateISDASIMM(isdaSimmInput);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error calculating ISDA SIMM Initial Margin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
