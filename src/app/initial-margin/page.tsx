import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, BarChart3, FileSpreadsheet } from 'lucide-react';

export default function InitialMarginPage() {
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
              <h1 className="text-2xl font-bold">Initial Margin Calculator</h1>
              <p className="text-muted-foreground">
                Calculate initial margin for non-centrally cleared derivatives
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Grid/Schedule Approach Card */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Grid/Schedule Approach
              </CardTitle>
              <CardDescription>
                BCBS-IOSCO standardized table-based methodology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calculate initial margin using the standardized approach from the BCBS-IOSCO framework. 
                This method applies predefined percentages to notional amounts based on asset class and maturity.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Standardized calculation with predefined risk weights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Support for all major asset classes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Simplified implementation with regulatory compliance</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/initial-margin/grid-schedule" className="w-full">
                <Button className="w-full">
                  Use Grid/Schedule Approach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* ISDA SIMM Card */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                ISDA SIMM Approach
              </CardTitle>
              <CardDescription>
                Risk-sensitive model-based methodology (v2.6)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calculate initial margin using the ISDA Standard Initial Margin Model (SIMM), 
                a risk-sensitive approach that computes sensitivities to various market risk factors.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Advanced risk-factor based calculation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Sophisticated correlation and aggregation methodology</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full bg-primary/10 p-1 text-primary">✓</span>
                  <span>Typically results in more economically efficient margin requirements</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/initial-margin/isda-simm" className="w-full">
                <Button className="w-full">
                  Use ISDA SIMM Approach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
          <p>Initial Margin Calculator - Implementing BCBS-IOSCO and ISDA SIMM methodologies</p>
        </div>
      </footer>
    </div>
  );
}
