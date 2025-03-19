import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ISDASIMMForm from '@/components/initial-margin/isda-simm-form';

export default function ISDASIMMPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center gap-4">
            <Link href="/initial-margin">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">ISDA SIMM Approach</h1>
              <p className="text-muted-foreground">
                Risk-sensitive model-based methodology (v2.6)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <ISDASIMMForm />
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
          <p>Initial Margin Calculator - ISDA SIMM Approach</p>
        </div>
      </footer>
    </div>
  );
}
