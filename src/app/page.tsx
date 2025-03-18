import SACCRForm from '@/components/saccr/saccr-form';
import { Toaster } from 'sonner';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">SACCR Calculator</h1>
          <p className="text-muted-foreground">
            Standardized Approach for Counterparty Credit Risk (SA-CCR)
          </p>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <SACCRForm />
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
          <p>SACCR Calculator - Implementing CRE52 framework</p>
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}
