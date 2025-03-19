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
import { z } from 'zod';
import { isdaSimmFormSchema } from '@/lib/initial-margin/schema';

// Define the type for the ISDA SIMM form
type ISDASIMMFormType = z.infer<typeof isdaSimmFormSchema>;

interface ISDASIMMNettingSetFormProps {
  form: UseFormReturn<ISDASIMMFormType>;
  className?: string;
}

export default function ISDASIMMNettingSetForm({
  form,
  className = '',
}: ISDASIMMNettingSetFormProps) {
  const marginType = form.watch('nettingSet.marginType');

  return (
    <div className={`space-y-4 ${className}`}>
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
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select margin type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={MarginType.UNMARGINED}>Unmargined</SelectItem>
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
                  <Input
                    type="number"
                    placeholder="Enter threshold amount"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : e.target.value;
                      field.onChange(value);
                    }}
                  />
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
                  <Input
                    type="number"
                    placeholder="Enter minimum transfer amount"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : e.target.value;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
