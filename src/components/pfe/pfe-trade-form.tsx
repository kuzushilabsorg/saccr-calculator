"use client";

import { UseFormReturn } from 'react-hook-form';
import { AssetClass, PositionType, TransactionType } from '@/lib/saccr/types';
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
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Define the form type using Zod schema
type PFEFormSchemaType = z.infer<typeof pfeFormSchema>;

interface PFETradeFormProps {
  form: UseFormReturn<PFEFormSchemaType>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export default function PFETradeForm({
  form,
  index,
  onRemove,
  canRemove,
}: PFETradeFormProps) {
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

        {/* Transaction Type */}
        <FormField
          control={form.control}
          name={`trades.${index}.transactionType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TransactionType.LINEAR}>
                    Linear
                  </SelectItem>
                  <SelectItem value={TransactionType.OPTION}>
                    Option
                  </SelectItem>
                  <SelectItem value={TransactionType.BASIS}>
                    Basis
                  </SelectItem>
                  <SelectItem value={TransactionType.VOLATILITY}>
                    Volatility
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Position Type */}
        <FormField
          control={form.control}
          name={`trades.${index}.positionType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PositionType.LONG}>
                    Long
                  </SelectItem>
                  <SelectItem value={PositionType.SHORT}>
                    Short
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trade ID */}
        <FormField
          control={form.control}
          name={`trades.${index}.id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter trade ID" {...field} />
              </FormControl>
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

        {/* Current Market Value */}
        <FormField
          control={form.control}
          name={`trades.${index}.currentMarketValue`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Market Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter current market value"
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

        {/* Volatility - Only show for certain transaction types */}
        {form.watch(`trades.${index}.transactionType`) === TransactionType.OPTION ||
         form.watch(`trades.${index}.transactionType`) === TransactionType.VOLATILITY ? (
          <FormField
            control={form.control}
            name={`trades.${index}.volatility`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volatility (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter volatility"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {/* Stress Scenario - Optional field */}
        <FormField
          control={form.control}
          name={`trades.${index}.stressScenario`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stress Scenario (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Historical, Hypothetical"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
