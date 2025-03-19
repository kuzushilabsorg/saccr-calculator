import { Metadata } from 'next';
import { VaRForm } from '@/components/var/var-form';

export const metadata: Metadata = {
  title: 'Historical VaR Calculator',
  description: 'Calculate Value at Risk (VaR) using historical market data',
};

/**
 * Historical VaR Calculator Page
 * 
 * This page provides a calculator for Value at Risk (VaR) based on
 * historical market data for various asset classes.
 */
export default function VaRPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Historical VaR Calculator</h1>
        <p className="text-muted-foreground">
          Calculate Value at Risk (VaR) for your portfolio using historical market data.
          This tool supports multiple asset classes and calculation methodologies.
        </p>
      </div>
      
      <VaRForm />
    </div>
  );
}
