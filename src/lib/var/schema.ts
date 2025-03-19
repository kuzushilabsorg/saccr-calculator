import { z } from 'zod';
import {
  VaRAssetType,
  VaRTimeHorizon,
  VaRConfidenceLevel,
  VaRCalculationMethod,
} from './types';

// Schema for VaR parameters
export const varParametersSchema = z.object({
  timeHorizon: z.nativeEnum(VaRTimeHorizon),
  confidenceLevel: z.nativeEnum(VaRConfidenceLevel),
  calculationMethod: z.nativeEnum(VaRCalculationMethod),
  lookbackPeriod: z.union([
    z.string().regex(/^\d+$/, { message: 'Must be a number' }),
    z.number().int().positive(),
  ]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  includeCorrelations: z.boolean(),
});

// Schema for VaR position
export const varPositionSchema = z.object({
  id: z.string(),
  assetType: z.nativeEnum(VaRAssetType),
  assetIdentifier: z.string().min(1, { message: 'Asset identifier is required' }),
  quantity: z.union([
    z.string().regex(/^-?\d+(\.\d+)?$/, { message: 'Must be a number' }),
    z.number(),
  ]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  currentPrice: z.union([
    z.string().regex(/^\d+(\.\d+)?$/, { message: 'Must be a positive number' }),
    z.number().positive(),
  ]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  currency: z.string().min(3).max(3),
  purchaseDate: z.string().datetime().optional(),
});

// Schema for VaR form input
export const varFormSchema = z.object({
  parameters: varParametersSchema,
  positions: z.array(varPositionSchema).min(1, { message: 'At least one position is required' }),
  useExternalData: z.boolean(),
  dataSource: z.string().optional(),
});

// Type for VaR form schema
export type VaRFormSchemaType = z.infer<typeof varFormSchema>;
