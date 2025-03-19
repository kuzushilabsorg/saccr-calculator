"use client";

import { UseFormReturn } from 'react-hook-form';
import { MarginType } from '@/lib/saccr/types';
import { PFECalculationMethod, PFEConfidenceLevel, PFETimeHorizon } from '@/lib/pfe/types';
import { z } from 'zod';
import { pfeFormSchema } from '@/lib/pfe/schema';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// Define the form type using Zod schema
type PFEFormSchemaType = z.infer<typeof pfeFormSchema>;

interface PFENettingSetFormProps {
  form: UseFormReturn<PFEFormSchemaType>;
}

export default function PFENettingSetForm({ form }: PFENettingSetFormProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Netting Agreement ID */}
          <FormField
            control={form.control}
            name="nettingSet.nettingAgreementId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Netting Agreement ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter netting agreement ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Margin Type */}
          <FormField
            control={form.control}
            name="nettingSet.marginType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Margin Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select margin type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={MarginType.MARGINED}>Margined</SelectItem>
                    <SelectItem value={MarginType.UNMARGINED}>Unmargined</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Threshold Amount */}
          <FormField
            control={form.control}
            name="nettingSet.thresholdAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threshold Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Minimum Transfer Amount */}
          <FormField
            control={form.control}
            name="nettingSet.minimumTransferAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Transfer Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Margin Period of Risk */}
          <FormField
            control={form.control}
            name="nettingSet.marginPeriodOfRisk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Margin Period of Risk (days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Horizon */}
          <FormField
            control={form.control}
            name="nettingSet.timeHorizon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Horizon</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time horizon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PFETimeHorizon.ONE_WEEK}>1 Week</SelectItem>
                    <SelectItem value={PFETimeHorizon.TWO_WEEKS}>2 Weeks</SelectItem>
                    <SelectItem value={PFETimeHorizon.ONE_MONTH}>1 Month</SelectItem>
                    <SelectItem value={PFETimeHorizon.THREE_MONTHS}>3 Months</SelectItem>
                    <SelectItem value={PFETimeHorizon.SIX_MONTHS}>6 Months</SelectItem>
                    <SelectItem value={PFETimeHorizon.ONE_YEAR}>1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confidence Level */}
          <FormField
            control={form.control}
            name="nettingSet.confidenceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confidence Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PFEConfidenceLevel.NINETY_FIVE_PERCENT}>95%</SelectItem>
                    <SelectItem value={PFEConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT}>97.5%</SelectItem>
                    <SelectItem value={PFEConfidenceLevel.NINETY_NINE_PERCENT}>99%</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Calculation Method */}
          <FormField
            control={form.control}
            name="nettingSet.calculationMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calculation Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select calculation method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PFECalculationMethod.REGULATORY_STANDARDISED_APPROACH}>Regulatory Standardised Approach</SelectItem>
                    <SelectItem value={PFECalculationMethod.INTERNAL_MODEL_METHOD}>Internal Model Method</SelectItem>
                    <SelectItem value={PFECalculationMethod.HISTORICAL_SIMULATION_METHOD}>Historical Simulation Method</SelectItem>
                    <SelectItem value={PFECalculationMethod.MONTE_CARLO_SIMULATION}>Monte Carlo Simulation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
