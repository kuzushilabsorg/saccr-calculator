"use client";

import { useFieldArray } from 'react-hook-form';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { VaRPositionForm } from './var-position-form';
import { VaRFormSchemaType } from '@/lib/var/schema';
import { VaRAssetType } from '@/lib/var/types';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface VaRPositionsFormProps {
  form: UseFormReturn<VaRFormSchemaType>;
}

/**
 * VaR Positions Form Component
 * 
 * This component manages the list of positions in the VaR calculator.
 */
export function VaRPositionsForm({ form }: VaRPositionsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'positions',
  });

  // Add a new position to the form
  const addPosition = () => {
    append({
      id: uuidv4(),
      assetType: VaRAssetType.EQUITY,
      assetIdentifier: "",
      quantity: 0,
      currentPrice: 0,
      currency: 'USD',
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="relative">
          <VaRPositionForm
            form={form}
            index={index}
            onRemove={fields.length > 1 ? () => remove(index) : undefined}
          />
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addPosition}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Position
      </Button>
    </div>
  );
}
