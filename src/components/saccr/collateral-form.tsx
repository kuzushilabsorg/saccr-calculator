'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CollateralFormProps {
  form: UseFormReturn<any>;
  className?: string;
}

export default function CollateralForm({
  form,
  className = '',
}: CollateralFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Collateral Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="collateral.collateralAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collateral Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collateral.collateralCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collateral Currency</FormLabel>
              <FormControl>
                <Input placeholder="Enter currency (e.g., USD)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collateral.haircut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haircut (0-1)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="Enter haircut (e.g., 0.05 for 5%)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
