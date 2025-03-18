/**
 * Validation schemas for SACCR calculator forms
 */

import { z } from 'zod';
import { AssetClass, MarginType, PositionType, TransactionType } from './types';

// Netting Set Schema
export const nettingSetSchema = z.object({
  nettingAgreementId: z.string().min(1, 'Netting agreement ID is required'),
  marginType: z.nativeEnum(MarginType),
  thresholdAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  minimumTransferAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  independentCollateralAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  variationMargin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  marginPeriodOfRisk: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 10)),
});

// Base Trade Schema
const baseTradeSchema = z.object({
  id: z.string().min(1, 'Trade ID is required'),
  assetClass: z.nativeEnum(AssetClass),
  transactionType: z.nativeEnum(TransactionType),
  positionType: z.nativeEnum(PositionType),
  notionalAmount: z
    .string()
    .min(1, 'Notional amount is required')
    .transform((val) => parseFloat(val))
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
  currentMarketValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0))
    .refine((val) => !isNaN(val), 'Current market value must be a number'),
});

// Interest Rate Trade Schema
export const interestRateTradeSchema = baseTradeSchema.extend({
  assetClass: z.literal(AssetClass.INTEREST_RATE),
  referenceCurrency: z.string().optional(),
  paymentFrequency: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 3)),
  resetFrequency: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 3)),
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

// Trade Schema (union of all trade types)
export const tradeSchema = z.discriminatedUnion('assetClass', [
  interestRateTradeSchema,
  foreignExchangeTradeSchema,
  creditTradeSchema,
  equityTradeSchema,
  commodityTradeSchema,
]);

// Collateral Schema
export const collateralSchema = z.object({
  collateralAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0))
    .refine((val) => !isNaN(val), 'Collateral amount must be a number'),
  collateralCurrency: z.string().optional().default('USD'),
  haircut: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0))
    .refine(
      (val) => !isNaN(val) && val >= 0 && val <= 1,
      'Haircut must be between 0 and 1'
    ),
});

// Form Schema
export const formSchema = z.object({
  nettingSet: nettingSetSchema,
  trade: tradeSchema,
  collateral: collateralSchema.optional(),
});

// CSV Row Schema
export const csvRowSchema = z
  .object({
    id: z.string().min(1, 'Trade ID is required'),
    assetClass: z
      .string()
      .refine(
        (val) => Object.values(AssetClass).includes(val as AssetClass),
        'Invalid asset class'
      ),
    transactionType: z
      .string()
      .refine(
        (val) =>
          Object.values(TransactionType).includes(val as TransactionType),
        'Invalid transaction type'
      ),
    positionType: z
      .string()
      .refine(
        (val) => Object.values(PositionType).includes(val as PositionType),
        'Invalid position type'
      ),
    notionalAmount: z.string().min(1, 'Notional amount is required'),
    currency: z.string().min(1, 'Currency is required'),
    maturityDate: z.string().min(1, 'Maturity date is required'),
    startDate: z.string().optional(),
    currentMarketValue: z.string().optional(),
    // Additional fields will be validated dynamically based on asset class
  })
  .passthrough();

// CSV Upload Schema
export const csvUploadSchema = z.array(csvRowSchema);
