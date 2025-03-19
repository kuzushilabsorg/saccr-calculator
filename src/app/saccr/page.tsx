import SACCRForm from '@/components/saccr/saccr-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SACCRPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">SACCR Calculator</h1>
              <p className="text-muted-foreground">
                Standardized Approach for Counterparty Credit Risk (SA-CCR)
              </p>
            </div>
          </div>
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
    </div>
  );
}
