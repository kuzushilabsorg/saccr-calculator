import Link from 'next/link';
import { Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Calculator, FileSpreadsheet } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold">Risk & Regulatory Compliance Suite</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive tools for regulatory capital and margin calculations
          </p>
        </div>
      </header>

      <main className="container mx-auto py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* SACCR Calculator Card */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="h-6 w-6 text-primary" />
                SACCR Calculator
              </CardTitle>
              <CardDescription>
                Standardized Approach for Counterparty Credit Risk (SA-CCR)
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-muted-foreground">
                Calculate exposure at default (EAD) for derivative transactions using the Basel Committee&apos;s SA-CCR methodology (CRE52 framework).
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> 
                    Manual Calculation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Input trade details through a guided form interface
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> 
                    Batch Processing
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload CSV files for bulk trade calculations
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/saccr" className="w-full">
                <Button className="w-full">
                  Open SACCR Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Initial Margin Calculator Card */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="h-6 w-6 text-primary" />
                Initial Margin Calculator
              </CardTitle>
              <CardDescription>
                BCBS-IOSCO and ISDA SIMM Methodologies
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-muted-foreground">
                Calculate initial margin requirements for non-centrally cleared derivatives using standardized or model-based approaches.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> 
                    Grid/Schedule Approach
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    BCBS-IOSCO standardized table-based calculation
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> 
                    Model-Based Approach
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ISDA SIMM risk-sensitive methodology (v2.6)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/initial-margin" className="w-full">
                <Button className="w-full">
                  Open Initial Margin Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 text-center text-sm text-muted-foreground">
          <p>Risk & Regulatory Compliance Suite - Implementing Basel Framework</p>
          <p className="mt-1"> {new Date().getFullYear()} Kuzushi Labs</p>
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}
