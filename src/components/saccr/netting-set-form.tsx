'use client';

import { UseFormReturn } from 'react-hook-form';
import { MarginType } from '@/lib/saccr/types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NettingSetFormProps {
  form: UseFormReturn<any>;
  className?: string;
}

export default function NettingSetForm({
  form,
  className = '',
}: NettingSetFormProps) {
  const marginType = form.watch('nettingSet.marginType');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Netting Set Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <FormField
          control={form.control}
          name="nettingSet.marginType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margin Type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value)}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select margin type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={MarginType.UNMARGINED}>
                    Unmargined
                  </SelectItem>
                  <SelectItem value={MarginType.MARGINED}>Margined</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {marginType === MarginType.MARGINED && (
          <>
            <FormField
              control={form.control}
              name="nettingSet.thresholdAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Threshold Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nettingSet.minimumTransferAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Transfer Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nettingSet.independentCollateralAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Independent Collateral Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nettingSet.variationMargin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variation Margin</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nettingSet.marginPeriodOfRisk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margin Period of Risk (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
