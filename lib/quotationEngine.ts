import { Vehicle } from '../types';

/**
 * Smart Quotation Engine
 * Phase 2: Profit & Intelligence
 * 
 * Dynamically calculates pricing with:
 * - Inventory aging discounts
 * - Finance EMI calculations
 * - Exchange value assessment
 * - Competitor price matching
 */

export interface FinanceOption {
    bankName: string;
    downPaymentMin: number; // Minimum down payment (%)
    downPaymentMax: number; // Maximum down payment (%)
    tenure: number[]; // Available tenures in months
    interestRate: number; // Annual interest rate (%)
    processingFee: number; // Flat processing fee
}

export interface ExchangeValuation {
    vehicleModel: string;
    yearOfManufacture: number;
    currentOdometer: number;
    condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    estimatedValue: number;
    depreciationFactor: number;
}

export interface PricingBreakdown {
    basePrice: number;
    taxAmount: number; // 13% VAT in Nepal
    registrationFee: number;
    insuranceFirstYear: number;
    accessories: number;
    extendedWarranty: number;
    agingDiscount: number;
    seasonalDiscount: number;
    exchangeBonus: number;
    subtotal: number;
    finalPrice: number;
}

export interface EMICalculation {
    downPayment: number;
    loanAmount: number;
    tenure: number; // months
    interestRate: number; // %
    monthlyEMI: number;
    totalInterest: number;
    totalPayable: number;
}

export interface SmartQuotation {
    id: string;
    leadId: string;
    vehicleId: string;
    vehicleDetails: {
        model: string;
        variant: string;
        color: string;
        vin: string;
        year: number;
    };
    pricing: PricingBreakdown;
    financeOptions?: {
        selectedBank: string;
        emi: EMICalculation;
    };
    exchange?: ExchangeValuation;
    validUntil: string;
    generatedAt: string;
    createdBy: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
}

/**
 * Calculate aging-based discount for inventory
 */
export const calculateAgingDiscount = (vehicle: Vehicle): number => {
    const { daysInStock } = vehicle;

    if (daysInStock < 30) return 0;
    if (daysInStock < 45) return vehicle.price * 0.01; // 1% for 30-45 days
    if (daysInStock < 60) return vehicle.price * 0.02; // 2% for 45-60 days
    if (daysInStock < 90) return vehicle.price * 0.03; // 3% for 60-90 days
    return vehicle.price * 0.05; // 5% for 90+ days (toxic stock)
};

/**
 * Calculate monthly EMI
 * Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
export const calculateEMI = (
    principal: number,
    annualInterestRate: number,
    tenureMonths: number
): EMICalculation => {
    const monthlyRate = annualInterestRate / 12 / 100;
    const n = tenureMonths;

    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, n) /
        (Math.pow(1 + monthlyRate, n) - 1);

    const totalPayable = emi * n;
    const totalInterest = totalPayable - principal;

    return {
        downPayment: 0, // Set separately
        loanAmount: principal,
        tenure: tenureMonths,
        interestRate: annualInterestRate,
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(totalPayable)
    };
};

/**
 * Estimate exchange vehicle value based on depreciation
 */
export const estimateExchangeValue = (
    exchange: Omit<ExchangeValuation, 'estimatedValue' | 'depreciationFactor'>
): ExchangeValuation => {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - exchange.yearOfManufacture;

    // Base depreciation: 15% first year, 10% thereafter
    let depreciationFactor = 0.15 + (vehicleAge - 1) * 0.10;
    depreciationFactor = Math.min(depreciationFactor, 0.80); // Max 80% depreciation

    // Condition adjustments
    const conditionMultipliers = {
        'Excellent': 1.0,
        'Good': 0.90,
        'Fair': 0.75,
        'Poor': 0.60
    };

    // Odometer penalty (>100k km)
    let odometerPenalty = 0;
    if (exchange.currentOdometer > 100000) {
        odometerPenalty = 0.05;
    }

    // Assume an original price (would come from market data)
    const estimatedOriginalPrice = 2000000; // ₹20L baseline for mid-range car

    const finalDepreciation = depreciationFactor + odometerPenalty;
    const conditionMultiplier = conditionMultipliers[exchange.condition];

    const estimatedValue = Math.round(
        estimatedOriginalPrice * (1 - finalDepreciation) * conditionMultiplier
    );

    return {
        ...exchange,
        estimatedValue,
        depreciationFactor: finalDepreciation
    };
};

/**
 * Generate complete pricing breakdown
 */
export const generatePricingBreakdown = (
    vehicle: Vehicle,
    options: {
        includeInsurance?: boolean;
        includeExtendedWarranty?: boolean;
        accessories?: number;
        exchangeValue?: number;
        customDiscount?: number;
    } = {}
): PricingBreakdown => {
    const basePrice = vehicle.price;
    const taxRate = 0.13; // 13% VAT in Nepal

    // Calculate components
    const taxAmount = Math.round(basePrice * taxRate);
    const registrationFee = 25000; // Typical Nepal registration fee
    const insuranceFirstYear = options.includeInsurance ? 50000 : 0; // Typical comprehensive
    const accessories = options.accessories || 0;
    const extendedWarranty = options.includeExtendedWarranty ? 35000 : 0;

    const agingDiscount = calculateAgingDiscount(vehicle);
    const seasonalDiscount = 0; // Would be set based on promotions
    const exchangeBonus = options.exchangeValue || 0;
    const customDiscount = options.customDiscount || 0;

    const subtotal = basePrice + taxAmount + registrationFee +
        insuranceFirstYear + accessories + extendedWarranty;

    const totalDiscounts = agingDiscount + seasonalDiscount +
        exchangeBonus + customDiscount;

    const finalPrice = Math.max(0, subtotal - totalDiscounts);

    return {
        basePrice,
        taxAmount,
        registrationFee,
        insuranceFirstYear,
        accessories,
        extendedWarranty,
        agingDiscount,
        seasonalDiscount,
        exchangeBonus,
        subtotal,
        finalPrice
    };
};

/**
 * Common finance banks in Nepal
 */
export const NEPAL_FINANCE_OPTIONS: FinanceOption[] = [
    {
        bankName: 'Nabil Bank',
        downPaymentMin: 20,
        downPaymentMax: 50,
        tenure: [12, 24, 36, 48, 60],
        interestRate: 11.5,
        processingFee: 15000
    },
    {
        bankName: 'NIC Asia Bank',
        downPaymentMin: 20,
        downPaymentMax: 50,
        tenure: [12, 24, 36, 48, 60, 72],
        interestRate: 11.0,
        processingFee: 12000
    },
    {
        bankName: 'Everest Bank',
        downPaymentMin: 25,
        downPaymentMax: 50,
        tenure: [12, 24, 36, 48, 60],
        interestRate: 12.0,
        processingFee: 18000
    },
    {
        bankName: 'Global IME Bank',
        downPaymentMin: 20,
        downPaymentMax: 50,
        tenure: [12, 24, 36, 48, 60, 72],
        interestRate: 10.5,
        processingFee: 10000
    },
    {
        bankName: 'Prabhu Bank',
        downPaymentMin: 30,
        downPaymentMax: 50,
        tenure: [12, 24, 36, 48],
        interestRate: 11.8,
        processingFee: 14000
    }
];

/**
 * Generate smart quotation with all options
 */
export const generateSmartQuotation = (
    leadId: string,
    vehicle: Vehicle,
    options: {
        includeInsurance?: boolean;
        includeExtendedWarranty?: boolean;
        accessories?: number;
        exchange?: Omit<ExchangeValuation, 'estimatedValue' | 'depreciationFactor'>;
        financeBank?: string;
        downPaymentPercent?: number;
        tenure?: number;
    } = {}
): Omit<SmartQuotation, 'id' | 'createdBy' | 'status'> => {
    // Calculate exchange value if provided
    const exchangeValuation = options.exchange
        ? estimateExchangeValue(options.exchange)
        : undefined;

    // Generate pricing
    const pricing = generatePricingBreakdown(vehicle, {
        includeInsurance: options.includeInsurance,
        includeExtendedWarranty: options.includeExtendedWarranty,
        accessories: options.accessories,
        exchangeValue: exchangeValuation?.estimatedValue
    });

    // Calculate finance if requested
    let financeOptions: SmartQuotation['financeOptions'] | undefined;
    if (options.financeBank && options.downPaymentPercent && options.tenure) {
        const bank = NEPAL_FINANCE_OPTIONS.find(b => b.bankName === options.financeBank);
        if (bank) {
            const downPayment = Math.round(pricing.finalPrice * (options.downPaymentPercent / 100));
            const loanAmount = pricing.finalPrice - downPayment + bank.processingFee;

            const emi = calculateEMI(loanAmount, bank.interestRate, options.tenure);
            emi.downPayment = downPayment;

            financeOptions = {
                selectedBank: bank.bankName,
                emi
            };
        }
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Valid for 7 days

    return {
        leadId,
        vehicleId: vehicle.id,
        vehicleDetails: {
            model: vehicle.model,
            variant: vehicle.variant,
            color: vehicle.color,
            vin: vehicle.vin,
            year: vehicle.year
        },
        pricing,
        financeOptions,
        exchange: exchangeValuation,
        validUntil: validUntil.toISOString(),
        generatedAt: now.toISOString()
    };
};

/**
 * Format currency for Nepal (NPR)
 */
export const formatNPR = (amount: number): string => {
    return `₹${amount.toLocaleString('en-NP')}`;
};
