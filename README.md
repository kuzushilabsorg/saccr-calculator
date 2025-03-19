# Kuzushi Labs Risk & Regulatory Suite

A comprehensive web application suite for financial risk management and regulatory compliance, featuring tools for SA-CCR calculation, Potential Future Exposure (PFE), Value at Risk (VaR), Initial Margin calculation, and VM-CSA document analysis.

![Risk Suite Screenshot](https://via.placeholder.com/800x400?text=Kuzushi+Labs+Risk+Suite)

## Overview

The Kuzushi Labs Risk & Regulatory Suite is a full-stack application designed for risk managers, analysts, and regulatory compliance professionals. This comprehensive toolkit implements various methodologies defined in the Basel framework and other regulatory standards, providing accurate calculations for risk management, regulatory reporting, and trading decision support.

### Key Features

#### 1. SA-CCR Calculator
- **Manual Calculation Interface**: Input trade details, netting set information, and collateral data through an intuitive form interface
- **CSV Upload Functionality**: Process batch calculations by uploading trade data in CSV format
- **Comprehensive Results**: View detailed breakdown of exposure calculations including Replacement Cost (RC) and Potential Future Exposure (PFE)
- **Asset Class Support**: Calculate exposures for various asset classes including Interest Rate, Foreign Exchange, Credit, Equity, and Commodity derivatives
- **Margin Agreement Handling**: Support for both margined and unmargined netting sets
- **Regulatory Compliance**: Fully aligned with Basel III SA-CCR requirements
- **Audit Trail**: Detailed calculation steps for regulatory transparency

#### 2. Potential Future Exposure (PFE) Calculator
- **Advanced Simulation**: Monte Carlo simulation for potential future exposure calculations
- **Risk Factor Modeling**: Sophisticated modeling of market risk factors
- **Flexible Time Horizons**: Calculate PFE across various time horizons
- **Comprehensive Reporting**: Detailed PFE profiles and statistics

#### 3. Value at Risk (VaR) Calculator
- **Multiple Methodologies**: Support for Historical Simulation, Monte Carlo, and Parametric approaches
- **Configurable Parameters**: Adjustable confidence levels and time horizons
- **Portfolio Analysis**: Asset contribution and diversification benefit analysis
- **External Data Integration**: Connect to various market data providers
- **Stress Testing**: Scenario analysis and stress testing capabilities

#### 4. Initial Margin Calculator
- **Dual Approach Support**: Implementations for both Grid/Schedule (BCBS-IOSCO) and ISDA SIMM methodologies
- **Asset Class Coverage**: Support for all major asset classes
- **Netting Set Analysis**: Proper handling of netting and collateral
- **Regulatory Alignment**: Compliant with UMR (Uncleared Margin Rules) requirements

#### 5. VM-CSA Analysis Tool
- **Document Analysis**: Upload and analyze VM-CSA documents with AI assistance
- **Trading Recommendations**: Generate insights for trading decisions based on legal agreement terms
- **Client Data Integration**: Combine document analysis with client trading data
- **Regulatory Compliance**: Ensure trading activities align with legal agreement constraints

## SA-CCR Regulatory Framework

The Standardized Approach for Counterparty Credit Risk (SA-CCR) is a regulatory framework introduced by the Basel Committee on Banking Supervision in March 2014 (BCBS 279) and finalized in the Basel III post-crisis reforms (BCBS 424) in December 2017. It replaces the Current Exposure Method (CEM) and Standardized Method (SM) for measuring counterparty credit risk exposures.

### Regulatory Timeline and Implementation

- **March 2014**: Initial publication of SA-CCR framework (BCBS 279)
- **December 2017**: Finalization in Basel III reforms (BCBS 424)
- **January 2022**: Implementation deadline for most Basel Committee member jurisdictions
- **January 2023**: Implementation in remaining jurisdictions

### Key Regulatory Components

#### 1. Exposure at Default (EAD) Calculation

The SA-CCR exposure calculation follows this formula:

```
Exposure at Default (EAD) = alpha × (Replacement Cost + Potential Future Exposure)
```

Where:

- **alpha** = 1.4 (regulatory constant)
- **Replacement Cost (RC)**: Represents the loss that would occur if the counterparty defaulted today
- **Potential Future Exposure (PFE)**: Represents the potential increase in exposure over a one-year time horizon

#### 2. Replacement Cost (RC) Formulas

For **unmargined** transactions:

```
RC = max(V - C, 0)
```

For **margined** transactions:

```
RC = max(V - C, TH + MTA - NICA, 0)
```

Where:

- V = Current market value of derivatives
- C = Haircut value of net collateral
- TH = Threshold amount
- MTA = Minimum transfer amount
- NICA = Net independent collateral amount

#### 3. Potential Future Exposure (PFE) Calculation

```
PFE = multiplier × AddOn(aggregate)
```

Where:

- **multiplier** = min{1; 0.05 + 0.95 × exp(V - C) / (2 × AddOn(aggregate))}
- **AddOn(aggregate)** = Sum of add-ons across all asset classes

#### 4. Add-On Calculations by Asset Class

The add-on for each asset class is calculated using specific methodologies:

- **Interest Rate**: Based on maturity buckets and currency
- **Foreign Exchange**: Based on currency pairs
- **Credit**: Based on reference entity, credit quality, and maturity
- **Equity**: Based on single names or indices
- **Commodity**: Based on commodity types

#### 5. Supervisory Parameters

The framework specifies supervisory parameters including:

- **Supervisory delta adjustments**: For options and other non-linear products
- **Supervisory correlation parameters**: For aggregating risk positions
- **Supervisory factors**: For volatility estimation by asset class
- **Maturity factors**: For time scaling of potential exposure

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn UI components
- **Backend**: Next.js API routes
- **Validation**: Zod schema validation
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React Hook Form for form state
- **Data Processing**: Custom utilities for numerical calculations
- **Data Visualization**: Recharts for interactive charts and graphs
- **AI Integration**: Document analysis capabilities for VM-CSA tool
- **External APIs**: Integration with market data providers for VaR calculations
- **Mathematical Models**: Implementation of various risk models (Monte Carlo, Historical Simulation, Parametric)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/saccr-calculator.git
   cd saccr-calculator
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### 1. SA-CCR Calculator

#### Manual Calculation
1. Navigate to the SACCR Calculator form
2. Fill in the Netting Set details (ID, margin type, threshold amount, etc.)
3. Add trade information (asset class, transaction type, notional amount, etc.)
4. Add collateral information if applicable
5. Click "Calculate" to view the SACCR exposure results

#### CSV Upload
1. Prepare a CSV file with trade data following the template format
2. Navigate to the CSV Upload tab
3. Upload your CSV file
4. Review the imported data and make any necessary adjustments
5. Click "Calculate" to process all trades and view the results

### 2. Potential Future Exposure (PFE) Calculator

1. Navigate to the PFE Calculator page
2. Configure simulation parameters (number of simulations, time steps, etc.)
3. Enter portfolio positions and risk factor details
4. Run the simulation to generate PFE profiles
5. Analyze the results through interactive charts and data tables

### 3. Value at Risk (VaR) Calculator

1. Navigate to the VaR Calculator page
2. Select calculation parameters (confidence level, time horizon, method)
3. Input portfolio positions with asset details
4. Choose whether to use external market data or synthetic data
5. Calculate to view VaR results, including asset contributions and stress scenarios

### 4. Initial Margin Calculator

#### Grid/Schedule Approach
1. Navigate to the Initial Margin Grid/Schedule page
2. Enter portfolio details and select asset classes
3. Input position data for each asset class
4. Apply any applicable netting sets
5. Calculate to view the initial margin requirements

#### ISDA SIMM Approach
1. Navigate to the ISDA SIMM page
2. Enter portfolio details with risk sensitivities
3. Configure SIMM parameters according to ISDA specifications
4. Apply any applicable risk weight adjustments
5. Calculate to view the SIMM-based initial margin requirements

### 5. VM-CSA Analysis Tool

1. Navigate to the VM-CSA Analysis Tool page
2. Upload VM-CSA documents for analysis
3. Review the extracted key terms and conditions
4. Input client trading data if available
5. Generate trading recommendations based on document analysis

## Key Code Components

### 1. Schema Validation (schema.ts)

The application uses Zod for robust schema validation, ensuring that all inputs conform to the expected types and formats:

```typescript
// Example of the schema validation for numeric fields
export const numberSchema = z
  .union([
    z
      .string()
      .refine((val) => !isNaN(parseFloat(val)), {
        message: 'Must be a valid number',
      }),
    z.number(),
  ])
  .transform((val) => {
    if (typeof val === 'string') {
      return parseFloat(val);
    }
    return val;
  });

// Netting set schema with validation
export const nettingSetSchema = z.object({
  nettingAgreementId: z.string().min(1, 'Netting agreement ID is required'),
  marginType: z.nativeEnum(MarginType),
  thresholdAmount: numberSchema,
  minimumTransferAmount: numberSchema,
  independentCollateralAmount: numberSchema,
  variationMargin: numberSchema,
  marginPeriodOfRisk: numberSchema.default(10),
});
```

### 2. SACCR Calculation Logic (calculator.ts)

The core calculation logic implements the SA-CCR methodology:

```typescript
// Example of the EAD calculation function
export function calculateExposureAtDefault(
  replacementCost: number,
  potentialFutureExposure: number
): number {
  const alpha = 1.4; // Regulatory constant
  return alpha * (replacementCost + potentialFutureExposure);
}

// Example of the RC calculation for unmargined netting sets
export function calculateReplacementCostUnmargined(
  currentMarketValue: number,
  collateralValue: number
): number {
  return Math.max(currentMarketValue - collateralValue, 0);
}

// Example of the PFE multiplier calculation
export function calculateMultiplier(
  currentMarketValue: number,
  collateralValue: number,
  aggregateAddOn: number
): number {
  const floor = 0.05;
  const exp = Math.exp(
    (currentMarketValue - collateralValue) / (2 * aggregateAddOn)
  );
  return Math.min(1, floor + 0.95 * exp);
}
```

### 3. Form Component (saccr-form.tsx)

The main form component manages user inputs and API interactions:

```typescript
// Example of the form submission handler
const onSubmit = async (data: FormData) => {
  setIsLoading(true);
  setError(null);

  try {
    // Convert number values to strings for API compatibility
    const processedData = {
      ...data,
      nettingSet: {
        ...data.nettingSet,
        thresholdAmount: data.nettingSet.thresholdAmount.toString(),
        minimumTransferAmount: data.nettingSet.minimumTransferAmount.toString(),
        // ... other conversions
      },
      // ... process other fields
    };

    const response = await fetch('/api/calculate/saccr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      throw new Error('Calculation failed');
    }

    const result = await response.json();
    setResult(result);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

### 4. API Route (route.ts)

The API endpoint processes calculation requests:

```typescript
// Example of the SACCR calculation API endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the input data against the schema
    const validatedData = formSchema.parse(body);

    // Extract data for calculation
    const { nettingSet, trade, collateral } = validatedData;

    // Perform SACCR calculations
    const replacementCost = calculateReplacementCost(
      nettingSet,
      trade.currentMarketValue,
      collateral?.collateralAmount || 0
    );

    const addOn = calculateAddOn(trade);
    const multiplier = calculateMultiplier(
      trade.currentMarketValue,
      collateral?.collateralAmount || 0,
      addOn
    );

    const potentialFutureExposure = multiplier * addOn;
    const exposureAtDefault = calculateExposureAtDefault(
      replacementCost,
      potentialFutureExposure
    );

    // Prepare and return the result
    return NextResponse.json({
      exposureAtDefault,
      replacementCost: {
        value: replacementCost,
        // ... detailed components
      },
      potentialFutureExposure: {
        value: potentialFutureExposure,
        multiplier,
        aggregateAddOn: addOn,
      },
      // ... other result data
    });
  } catch (error) {
    // Handle and return appropriate errors
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
```

### 5. Result Display (result-display.tsx)

The component that visualizes calculation results:

```typescript
// Example of formatting and displaying results
const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Component rendering example (simplified)
return (
  <div className="space-y-6">
    <Card>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3>Exposure at Default (EAD)</h3>
            <p>{formatNumber(result.exposureAtDefault)}</p>
          </div>
          <div>
            <h3>Replacement Cost (RC)</h3>
            <p>{formatNumber(result.replacementCost.value)}</p>
          </div>
          <div>
            <h3>Potential Future Exposure (PFE)</h3>
            <p>{formatNumber(result.potentialFutureExposure.value)}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Detailed result tables */}
  </div>
);
```

## Development

### Project Structure

```
saccr-calculator/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js app router
│   │   ├── api/       # API routes
│   │   │   └── calculate/
│   │   │       └── saccr/
│   │   │           └── route.ts  # SACCR calculation endpoint
│   │   └── page.tsx  # Main application page
│   ├── components/   # React components
│   │   ├── saccr/    # SACCR-specific components
│   │   │   ├── collateral-form.tsx  # Collateral input form
│   │   │   ├── csv-upload-form.tsx  # CSV upload functionality
│   │   │   ├── netting-set-form.tsx # Netting set input form
│   │   │   ├── result-display.tsx   # Results visualization
│   │   │   ├── saccr-form.tsx       # Main form container
│   │   │   └── trade-form.tsx       # Trade details input form
│   │   └── ui/      # Reusable UI components
│   │       ├── form.tsx       # Form components
│   │       ├── input.tsx      # Input components
│   │       ├── select.tsx     # Select components
│   │       ├── tabs.tsx       # Tab components
│   │       └── ...            # Other UI components
│   └── lib/         # Utility functions and business logic
│       ├── utils.ts  # General utilities
│       └── saccr/   # SACCR calculation logic
│           ├── calculator.ts  # Core calculation functions
│           ├── schema.ts      # Validation schemas
│           └── types.ts       # TypeScript type definitions
├── .env             # Environment variables (create from .env.example)
├── next.config.js   # Next.js configuration
└── tailwind.config.js # Tailwind CSS configuration
```

### Key Type Definitions (types.ts)

```typescript
// Asset Classes
export enum AssetClass {
  INTEREST_RATE = 'INTEREST_RATE',
  FOREIGN_EXCHANGE = 'FOREIGN_EXCHANGE',
  CREDIT = 'CREDIT',
  EQUITY = 'EQUITY',
  COMMODITY = 'COMMODITY',
}

// Margin Types
export enum MarginType {
  MARGINED = 'MARGINED',
  UNMARGINED = 'UNMARGINED',
}

// SACCR Calculation Results
export interface SACCRResult {
  exposureAtDefault: number;
  replacementCost: ReplacementCostResult;
  potentialFutureExposure: PotentialFutureExposureResult;
  timestamp: string;
  inputSummary: {
    nettingSetId: string;
    tradeCount: number;
    assetClasses: AssetClass[];
    marginType: MarginType;
    totalNotional: number;
  };
}
```

### Building for Production

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Regulatory References

### Basel Committee Documents

1. **BCBS 279** (March 2014): "The standardized approach for measuring counterparty credit risk exposures"

   - Initial publication of the SA-CCR framework
   - [Link to document](https://www.bis.org/publ/bcbs279.htm)

2. **BCBS 424** (December 2017): "Basel III: Finalising post-crisis reforms"

   - Finalization of the SA-CCR framework within Basel III
   - [Link to document](https://www.bis.org/bcbs/publ/d424.htm)

3. **CRE52** (December 2019): "Standardised approach to counterparty credit risk"
   - Consolidated framework version of SA-CCR
   - [Link to document](https://www.bis.org/basel_framework/chapter/CRE/52.htm)

### Key Regulatory Provisions

1. **CRE52.1-52.3**: Scope of application and methods
2. **CRE52.4-52.7**: Exposure at default formula and components
3. **CRE52.8-52.19**: Replacement cost calculation methodology
4. **CRE52.20-52.76**: Potential future exposure calculation methodology
5. **CRE52.77-52.86**: Exposure calculation for margined transactions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Basel Committee on Banking Supervision for the SA-CCR framework
- Next.js team for the excellent React framework
- shadcn UI for the component library
- All contributors to the project
