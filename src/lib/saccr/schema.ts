/**
 * Validation schemas for SACCR calculator forms
 */

import { z } from 'zod';
import { AssetClass, MarginType, PositionType, TransactionType } from './types';

// Helper function to handle both string and number inputs
const numberSchema = z.union([
  z.string().transform((val) => (val ? parseFloat(val) : 0)),
  z.number()
]);

// Netting Set Schema
export const nettingSetSchema = z.object({
  nettingAgreementId: z.string().min(1, 'Netting agreement ID is required'),
  marginType: z.nativeEnum(MarginType),
  thresholdAmount: numberSchema.optional().default(0),
  minimumTransferAmount: numberSchema.optional().default(0),
  independentCollateralAmount: numberSchema.optional().default(0),
  variationMargin: numberSchema.optional().default(0),
  marginPeriodOfRisk: numberSchema.optional().default(10),
});

// Base Trade Schema
const baseTradeSchema = z.object({
  id: z.string().min(1, 'Trade ID is required'),
  assetClass: z.nativeEnum(AssetClass),
  transactionType: z.nativeEnum(TransactionType),
  positionType: z.nativeEnum(PositionType),
  notionalAmount: z.union([
    z.string().min(1, 'Notional amount is required'),
    z.number().min(0.01, 'Notional amount is required')
  ]).transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .refine(
      (val) => !isNaN(val) && val > 0,
      'Notional amount must be a positive number'
    ),
  currency: z.string().min(1, 'Currency is required'),
  maturityDate: z
    .string()
    .min(1, 'Maturity date is required')
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  startDate: z
    .string()
    .optional()
    .transform((val) => val || new Date().toISOString().split('T')[0])
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  currentMarketValue: z.union([
    z.string().transform((val) => (val ? parseFloat(val) : 0)),
    z.number().default(0)
  ]).refine((val) => !isNaN(val), 'Current market value must be a number'),
});

// Interest Rate Trade Schema
export const interestRateTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.INTEREST_RATE),
  referenceCurrency: z.string().optional(),
  paymentFrequency: numberSchema.optional().default(3),
  resetFrequency: numberSchema.optional().default(3),
  indexName: z.string().optional(),
  basis: z.string().optional(),
});

// Foreign Exchange Trade Schema
export const foreignExchangeTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.FOREIGN_EXCHANGE),
  currencyPair: z.string().optional(),
  settlementDate: z
    .string()
    .optional()
    .transform((val) => val || new Date().toISOString().split('T')[0])
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date format'),
});

// Credit Trade Schema
export const creditTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.CREDIT),
  referenceEntity: z.string().min(1, 'Reference entity is required'),
  seniority: z.string().optional().default('SENIOR'),
  sector: z.string().optional().default('CORPORATE'),
  creditQuality: z.string().optional(),
});

// Equity Trade Schema
export const equityTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.EQUITY),
  issuer: z.string().min(1, 'Issuer is required'),
  market: z.string().optional().default('DEFAULT'),
  sector: z.string().optional().default('DEFAULT'),
});

// Commodity Trade Schema
export const commodityTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.COMMODITY),
  commodityType: z.string().min(1, 'Commodity type is required'),
  subType: z.string().optional().default('DEFAULT'),
});

// Discriminated union of all trade schemas
export const tradeSchema = z.discriminatedUnion('assetClass', [
  interestRateTradeSchema,
  foreignExchangeTradeSchema,
  creditTradeSchema,
  equityTradeSchema,
  commodityTradeSchema,
]);

// Collateral Schema
export const collateralSchema = z.object({
  collateralAmount: numberSchema.default(0),
  collateralCurrency: z.string().default('USD'),
  haircut: numberSchema.default(0),
});

// CSV Upload Schema
export const csvUploadSchema = z.array(
  z.record(z.string(), z.string())
);

// Form Schema
export const formSchema = z.object({
  nettingSet: nettingSetSchema,
  trade: tradeSchema,
  collateral: collateralSchema.optional(),
});

// Export all schemas
export default {
  nettingSetSchema,
  tradeSchema,
  collateralSchema,
  formSchema,
  csvUploadSchema,
};
