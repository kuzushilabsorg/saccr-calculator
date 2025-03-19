import { z } from 'zod';
import { AssetClass, MarginType } from '../saccr/types';
import { MaturityBucket, RiskFactorType } from './types';

// Common schemas
const nettingSetSchema = z.object({
  nettingAgreementId: z.string().min(1, 'Netting agreement ID is required'),
  marginType: z.nativeEnum(MarginType),
  thresholdAmount: z.union([z.string(), z.number()]).optional(),
  minimumTransferAmount: z.union([z.string(), z.number()]).optional(),
});

const collateralSchema = z.object({
  assetClass: z.string(),
  value: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) || 0 : val
  ),
  haircut: z.union([z.string(), z.number(), z.undefined()]).optional().transform(val => 
    typeof val === 'string' ? parseFloat(val) || undefined : val
  ),
});

// Grid/Schedule specific schemas
const gridScheduleTradeSchema = z.object({
  id: z.string().optional(),
  assetClass: z.nativeEnum(AssetClass),
  notionalAmount: z.union([z.string(), z.number()]),
  currency: z.string().min(1, 'Currency is required'),
  maturityDate: z.string().min(1, 'Maturity date is required'),
  startDate: z.string().optional(),
  maturityBucket: z.nativeEnum(MaturityBucket),
});

// ISDA SIMM specific schemas
const riskFactorSchema = z.object({
  type: z.nativeEnum(RiskFactorType),
  bucket: z.number(),
  label: z.string(),
  value: z.number(),
});

const isdaSimmTradeSchema = z.object({
  id: z.string().optional(),
  assetClass: z.nativeEnum(AssetClass),
  notionalAmount: z.union([z.string(), z.number()]),
  currency: z.string().min(1, 'Currency is required'),
  maturityDate: z.string().min(1, 'Maturity date is required'),
  startDate: z.string().optional(),
  riskFactors: z.array(riskFactorSchema),
  sensitivityValue: z.union([z.string(), z.number()]),
});

// Form schemas
export const gridScheduleFormSchema = z.object({
  nettingSet: nettingSetSchema,
  trades: z.array(gridScheduleTradeSchema).min(1, 'At least one trade is required'),
  collateral: z.array(collateralSchema).optional(),
});

export const isdaSimmFormSchema = z.object({
  nettingSet: nettingSetSchema,
  trades: z.array(isdaSimmTradeSchema).min(1, 'At least one trade is required'),
  collateral: z.array(collateralSchema).optional(),
});

// CSV upload schemas
export const gridScheduleCsvSchema = z.array(gridScheduleTradeSchema);
export const isdaSimmCsvSchema = z.array(isdaSimmTradeSchema);

// Create a named object for export
const schemas = {
  gridSchedule: gridScheduleFormSchema,
  isdaSimm: isdaSimmFormSchema,
};

export default schemas;
