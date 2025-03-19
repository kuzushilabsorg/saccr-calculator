"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { pfeFormSchema } from "@/lib/pfe/schema";
import { AssetClass, MarginType, PositionType, TransactionType } from "@/lib/saccr/types";
import { PFECalculationMethod, PFEConfidenceLevel, PFEResult, PFETimeHorizon } from "@/lib/pfe/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import PFENettingSetForm from "./pfe-netting-set-form";
import PFETradeForm from "./pfe-trade-form";
import PFEResults from "./pfe-results";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";

// Define the form type using Zod schema
type PFEFormSchemaType = z.infer<typeof pfeFormSchema>;

export default function PFEForm() {
  const [activeTab, setActiveTab] = useState("nettingSet");
  const [result, setResult] = useState<PFEResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with default values
  const form = useForm<PFEFormSchemaType>({
    resolver: zodResolver(pfeFormSchema),
    defaultValues: {
      nettingSet: {
        nettingAgreementId: "",
        marginType: MarginType.MARGINED,
        thresholdAmount: "0",
        minimumTransferAmount: "0",
        marginPeriodOfRisk: "10",
        timeHorizon: PFETimeHorizon.ONE_MONTH,
        confidenceLevel: PFEConfidenceLevel.NINETY_FIVE_PERCENT,
        calculationMethod: PFECalculationMethod.REGULATORY_SA_CCR,
      },
      trades: [
        {
          id: `trade-${Date.now()}`,
          assetClass: AssetClass.INTEREST_RATE,
          transactionType: TransactionType.LINEAR,
          positionType: PositionType.LONG,
          notionalAmount: "1000000",
          currency: "USD",
          maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          currentMarketValue: "0",
          volatility: "",
          stressScenario: "",
        },
      ],
      collateral: [
        {
          collateralAmount: "0",
          collateralCurrency: "USD",
          haircut: "0",
          stressedHaircut: "",
        },
      ],
    },
  });

  // Setup field arrays for trades and collateral
  const {
    fields: tradeFields,
    append: appendTrade,
    remove: removeTrade,
  } = useFieldArray({
    control: form.control,
    name: "trades",
  });

  const {
    fields: collateralFields,
    append: appendCollateral,
    remove: removeCollateral,
  } = useFieldArray({
    control: form.control,
    name: "collateral",
  });

  // Handle form submission
  const onSubmit = async (data: PFEFormSchemaType) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/calculate/pfe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate PFE");
      }

      const result = await response.json();
      setResult(result);
      setActiveTab("results");
    } catch (error) {
      console.error("Error calculating PFE:", error);
      // Handle error (could add toast notification here)
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new trade
  const addTrade = () => {
    appendTrade({
      id: `trade-${Date.now()}`,
      assetClass: AssetClass.INTEREST_RATE,
      transactionType: TransactionType.LINEAR,
      positionType: PositionType.LONG,
      notionalAmount: "1000000",
      currency: "USD",
      maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      currentMarketValue: "0",
      volatility: "",
      stressScenario: "",
    });
  };

  // Add a new collateral
  const addCollateral = () => {
    appendCollateral({
      collateralAmount: "0",
      collateralCurrency: "USD",
      haircut: "0",
      stressedHaircut: "",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nettingSet">Netting Set</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="collateral">Collateral</TabsTrigger>
              <TabsTrigger value="results" disabled={!result}>
                Results
              </TabsTrigger>
            </TabsList>

            {/* Netting Set Tab */}
            <TabsContent value="nettingSet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Netting Set Information</CardTitle>
                  <CardDescription>
                    Enter the details of the netting set for PFE calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PFENettingSetForm form={form} />
                </CardContent>
              </Card>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("trades")}>
                  Next: Trades
                </Button>
              </div>
            </TabsContent>

            {/* Trades Tab */}
            <TabsContent value="trades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade Information</CardTitle>
                  <CardDescription>
                    Enter the details of the trades in the netting set
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tradeFields.map((field, index) => (
                      <PFETradeForm
                        key={field.id}
                        form={form}
                        index={index}
                        onRemove={() => removeTrade(index)}
                        canRemove={tradeFields.length > 1}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addTrade}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("nettingSet")}
                >
                  Previous: Netting Set
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("collateral")}
                >
                  Next: Collateral
                </Button>
              </div>
            </TabsContent>

            {/* Collateral Tab */}
            <TabsContent value="collateral" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collateral Information</CardTitle>
                  <CardDescription>
                    Enter the details of any collateral for the netting set
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {collateralFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-md relative"
                      >
                        <div className="absolute right-2 top-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCollateral(index)}
                            disabled={collateralFields.length <= 1}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </Button>
                        </div>
                        <h3 className="font-medium mb-4">
                          Collateral {index + 1}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Collateral Amount */}
                          <FormField
                            control={form.control}
                            name={`collateral.${index}.collateralAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Collateral Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter collateral amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Collateral Currency */}
                          <FormField
                            control={form.control}
                            name={`collateral.${index}.collateralCurrency`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Collateral Currency</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter currency (e.g., USD)"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Haircut */}
                          <FormField
                            control={form.control}
                            name={`collateral.${index}.haircut`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Haircut (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter haircut percentage"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Stressed Haircut */}
                          <FormField
                            control={form.control}
                            name={`collateral.${index}.stressedHaircut`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stressed Haircut (%) (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter stressed haircut percentage"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addCollateral}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Collateral
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("trades")}
                >
                  Previous: Trades
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Calculating..." : "Calculate PFE"}
                </Button>
              </div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              {result ? (
                <PFEResults 
                  result={result} 
                  formData={form.getValues()} 
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    Submit the form to see results
                  </p>
                </div>
              )}
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("collateral")}
                >
                  Back to Form
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
