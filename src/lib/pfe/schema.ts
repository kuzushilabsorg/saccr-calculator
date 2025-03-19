import { z } from 'zod';
import { AssetClass, MarginType, PositionType, TransactionType } from '../saccr/types';
import { PFECalculationMethod, PFEConfidenceLevel, PFETimeHorizon } from './types';

// PFE Netting Set Schema
const pfeNettingSetSchema = z.object({
  nettingAgreementId: z.string(),
  marginType: z.nativeEnum(MarginType),
  thresholdAmount: z.union([z.string(), z.number()]).optional(),
  minimumTransferAmount: z.union([z.string(), z.number()]).optional(),
  marginPeriodOfRisk: z.union([z.string(), z.number()]).optional(),
  timeHorizon: z.nativeEnum(PFETimeHorizon),
  confidenceLevel: z.nativeEnum(PFEConfidenceLevel),
  calculationMethod: z.nativeEnum(PFECalculationMethod),
});

// PFE Trade Schema
const pfeTradeSchema = z.object({
  id: z.string(),
  assetClass: z.nativeEnum(AssetClass),
  transactionType: z.nativeEnum(TransactionType),
  positionType: z.nativeEnum(PositionType),
  notionalAmount: z.union([z.string(), z.number()]),
  currency: z.string(),
  maturityDate: z.string(),
  startDate: z.string(),
  currentMarketValue: z.union([z.string(), z.number()]),
  volatility: z.union([z.string(), z.number()]).optional(),
  stressScenario: z.string().optional(),
});

// PFE Collateral Schema
const pfeCollateralSchema = z.object({
  collateralAmount: z.union([z.string(), z.number()]),
  collateralCurrency: z.string(),
  haircut: z.union([z.string(), z.number()]).optional(),
  stressedHaircut: z.union([z.string(), z.number()]).optional(),
});

// Complete PFE Form Schema
export const pfeFormSchema = z.object({
  nettingSet: pfeNettingSetSchema,
  trades: z.array(pfeTradeSchema),
  collateral: z.array(pfeCollateralSchema).optional(),
});

// Type inference
export type PFEFormSchemaType = z.infer<typeof pfeFormSchema>;
