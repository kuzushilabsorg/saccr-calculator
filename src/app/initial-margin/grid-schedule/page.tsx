import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GridScheduleForm from '@/components/initial-margin/grid-schedule-form';

export default function GridSchedulePage() {
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
              <h1 className="text-2xl font-bold">Grid/Schedule Approach</h1>
              <p className="text-muted-foreground">
                BCBS-IOSCO standardized table-based methodology
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <GridScheduleForm />
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
          <p>Initial Margin Calculator - Grid/Schedule Approach</p>
        </div>
      </footer>
    </div>
  );
}
