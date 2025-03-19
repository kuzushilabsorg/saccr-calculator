"use client";

import { useFieldArray } from 'react-hook-form';
import { AssetClass } from '@/lib/saccr/types';
import { RiskFactorType } from '@/lib/initial-margin/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { isdaSimmFormSchema } from '@/lib/initial-margin/schema';

// Define the form type using Zod schema
type ISDASIMMFormSchemaType = z.infer<typeof isdaSimmFormSchema>;

interface ISDASIMMTradeFormProps {
  form: UseFormReturn<ISDASIMMFormSchemaType>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export default function ISDASIMMTradeForm({
  form,
  index,
  onRemove,
  canRemove,
}: ISDASIMMTradeFormProps) {
  // Setup field array for risk factors
  const { fields: riskFactorFields, append: appendRiskFactor, remove: removeRiskFactor } = useFieldArray({
    control: form.control,
    name: `trades.${index}.riskFactors`,
  });

  return (
    <div className="p-4 border rounded-md relative">
      <div className="absolute right-2 top-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <h3 className="font-medium mb-4">Trade {index + 1}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Asset Class */}
        <FormField
          control={form.control}
          name={`trades.${index}.assetClass`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Class</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={AssetClass.INTEREST_RATE}>
                    Interest Rate
                  </SelectItem>
                  <SelectItem value={AssetClass.CREDIT}>
                    Credit
                  </SelectItem>
                  <SelectItem value={AssetClass.EQUITY}>
                    Equity
                  </SelectItem>
                  <SelectItem value={AssetClass.COMMODITY}>
                    Commodity
                  </SelectItem>
                  <SelectItem value={AssetClass.FOREIGN_EXCHANGE}>
                    Foreign Exchange
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notional Amount */}
        <FormField
          control={form.control}
          name={`trades.${index}.notionalAmount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notional Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter notional amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency */}
        <FormField
          control={form.control}
          name={`trades.${index}.currency`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter currency (e.g., USD)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sensitivity Value */}
        <FormField
          control={form.control}
          name={`trades.${index}.sensitivityValue`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sensitivity Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter sensitivity value"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Maturity Date */}
        <FormField
          control={form.control}
          name={`trades.${index}.maturityDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maturity Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date */}
        <FormField
          control={form.control}
          name={`trades.${index}.startDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Risk Factors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Risk Factors</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendRiskFactor({
                type: RiskFactorType.INTEREST_RATE,
                bucket: 1,
                label: `Risk Factor ${riskFactorFields.length + 1}`,
                value: 1,
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Risk Factor
          </Button>
        </div>

        <div className="space-y-4">
          {riskFactorFields.map((field, rfIndex) => (
            <div key={field.id} className="p-3 bg-muted/50 rounded-md relative">
              <div className="absolute right-2 top-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRiskFactor(rfIndex)}
                  disabled={riskFactorFields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Risk Factor Type */}
                <FormField
                  control={form.control}
                  name={`trades.${index}.riskFactors.${rfIndex}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Factor Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={RiskFactorType.INTEREST_RATE}>
                            Interest Rate
                          </SelectItem>
                          <SelectItem value={RiskFactorType.CREDIT_QUALIFYING}>
                            Credit (Qualifying)
                          </SelectItem>
                          <SelectItem value={RiskFactorType.CREDIT_NON_QUALIFYING}>
                            Credit (Non-Qualifying)
                          </SelectItem>
                          <SelectItem value={RiskFactorType.EQUITY}>
                            Equity
                          </SelectItem>
                          <SelectItem value={RiskFactorType.COMMODITY}>
                            Commodity
                          </SelectItem>
                          <SelectItem value={RiskFactorType.FX}>
                            Foreign Exchange
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Risk Factor Bucket */}
                <FormField
                  control={form.control}
                  name={`trades.${index}.riskFactors.${rfIndex}.bucket`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bucket</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter bucket"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Risk Factor Label */}
                <FormField
                  control={form.control}
                  name={`trades.${index}.riskFactors.${rfIndex}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter label"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Risk Factor Value */}
                <FormField
                  control={form.control}
                  name={`trades.${index}.riskFactors.${rfIndex}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter value"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
