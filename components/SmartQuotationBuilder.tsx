import React, { useState } from 'react';
import { Vehicle, Lead } from '../types';
import {
    generateSmartQuotation,
    NEPAL_FINANCE_OPTIONS,
    formatNPR,
    estimateExchangeValue
} from '../lib/quotationEngine';
import { Calculator, FileText, TrendingDown, Percent, Car } from 'lucide-react';
import { Button, Card } from '../UI';

interface SmartQuotationBuilderProps {
    lead: Lead;
    vehicle: Vehicle;
    onGenerate: (quotation: any) => void;
}

export const SmartQuotationBuilder: React.FC<SmartQuotationBuilderProps> = ({
    lead,
    vehicle,
    onGenerate
}) => {
    const [includeInsurance, setIncludeInsurance] = useState(true);
    const [includeWarranty, setIncludeWarranty] = useState(false);
    const [accessories, setAccessories] = useState(0);

    // Exchange details
    const [hasExchange, setHasExchange] = useState(lead.exchange?.hasExchange || false);
    const [exchangeModel, setExchangeModel] = useState(lead.exchange?.vehicleModel || '');
    const [exchangeYear, setExchangeYear] = useState(new Date().getFullYear() - 5);
    const [exchangeKm, setExchangeKm] = useState(50000);
    const [exchangeCondition, setExchangeCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');

    // Finance details
    const [includeFinance, setIncludeFinance] = useState(false);
    const [selectedBank, setSelectedBank] = useState(NEPAL_FINANCE_OPTIONS[0].bankName);
    const [downPaymentPercent, setDownPaymentPercent] = useState(30);
    const [tenure, setTenure] = useState(48);

    // Generate quotation preview
    const exchangeData = hasExchange && exchangeModel ? {
        vehicleModel: exchangeModel,
        yearOfManufacture: exchangeYear,
        currentOdometer: exchangeKm,
        condition: exchangeCondition
    } : undefined;

    const estimatedExchange = exchangeData ? estimateExchangeValue(exchangeData) : undefined;

    const quotation = generateSmartQuotation(lead.id, vehicle, {
        includeInsurance,
        includeExtendedWarranty: includeWarranty,
        accessories,
        exchange: exchangeData,
        financeBank: includeFinance ? selectedBank : undefined,
        downPaymentPercent: includeFinance ? downPaymentPercent : undefined,
        tenure: includeFinance ? tenure : undefined
    });

    const selectedBankData = NEPAL_FINANCE_OPTIONS.find(b => b.bankName === selectedBank);

    return (
        <div className="space-y-6">
            {/* Vehicle Summary */}
            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Car className="text-white" size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            {vehicle.model} {vehicle.variant}
                        </h2>
                        <div className="text-sm text-slate-600">
                            {vehicle.year} • {vehicle.color} • {vehicle.daysInStock} days in stock
                        </div>
                    </div>
                </div>

                {vehicle.daysInStock > 45 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <TrendingDown className="text-amber-600" size={18} />
                        <div className="text-sm text-amber-900">
                            <strong>Aging Discount Applied:</strong> {formatNPR(quotation.pricing.agingDiscount)}
                            ({vehicle.daysInStock} days in stock)
                        </div>
                    </div>
                )}
            </Card>

            {/* Options */}
            <Card>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={18} />
                    Quotation Options
                </h3>

                <div className="space-y-4">
                    {/* Additional Items */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={includeInsurance}
                                onChange={(e) => setIncludeInsurance(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-sm text-slate-700">
                                Include Insurance (1st Year) - ₹50,000
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={includeWarranty}
                                onChange={(e) => setIncludeWarranty(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-sm text-slate-700">
                                Include Extended Warranty (3 years) - ₹35,000
                            </span>
                        </label>
                    </div>

                    {/* Accessories */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Accessories (Optional)
                        </label>
                        <input
                            type="number"
                            value={accessories}
                            onChange={(e) => setAccessories(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            placeholder="e.g., 25000"
                        />
                    </div>
                </div>
            </Card>

            {/* Exchange */}
            <Card>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Car size={18} />
                    Exchange Vehicle
                </h3>

                <label className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        checked={hasExchange}
                        onChange={(e) => setHasExchange(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-slate-700">Customer has exchange vehicle</span>
                </label>

                {hasExchange && (
                    <div className="space-y-3 pl-6">
                        <input
                            type="text"
                            value={exchangeModel}
                            onChange={(e) => setExchangeModel(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            placeholder="Vehicle Model (e.g., Maruti Swift)"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Year</label>
                                <input
                                    type="number"
                                    value={exchangeYear}
                                    onChange={(e) => setExchangeYear(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Kilometers</label>
                                <input
                                    type="number"
                                    value={exchangeKm}
                                    onChange={(e) => setExchangeKm(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Condition</label>
                            <select
                                value={exchangeCondition}
                                onChange={(e) => setExchangeCondition(e.target.value as any)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>

                        {estimatedExchange && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <div className="text-sm font-semibold text-green-900">
                                    Estimated Exchange Value: {formatNPR(estimatedExchange.estimatedValue)}
                                </div>
                                <div className="text-xs text-green-700 mt-1">
                                    Depreciation: {(estimatedExchange.depreciationFactor * 100).toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Finance */}
            <Card>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator size={18} />
                    Finance Options
                </h3>

                <label className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        checked={includeFinance}
                        onChange={(e) => setIncludeFinance(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-slate-700">Include financing details</span>
                </label>

                {includeFinance && (
                    <div className="space-y-3 pl-6">
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Select Bank</label>
                            <select
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            >
                                {NEPAL_FINANCE_OPTIONS.map(bank => (
                                    <option key={bank.bankName} value={bank.bankName}>
                                        {bank.bankName} ({bank.interestRate}% p.a.)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">
                                Down Payment: {downPaymentPercent}%
                            </label>
                            <input
                                type="range"
                                min={selectedBankData?.downPaymentMin || 20}
                                max={selectedBankData?.downPaymentMax || 50}
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Tenure (Months)</label>
                            <select
                                value={tenure}
                                onChange={(e) => setTenure(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            >
                                {selectedBankData?.tenure.map(t => (
                                    <option key={t} value={t}>{t} months ({(t / 12).toFixed(1)} years)</option>
                                ))}
                            </select>
                        </div>

                        {quotation.financeOptions && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-700">Down Payment:</span>
                                    <span className="font-bold text-indigo-900">
                                        {formatNPR(quotation.financeOptions.emi.downPayment)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-700">Loan Amount:</span>
                                    <span className="font-bold text-indigo-900">
                                        {formatNPR(quotation.financeOptions.emi.loanAmount)}
                                    </span>
                                </div>
                                <div className="border-t border-indigo-300 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-bold text-indigo-900">Monthly EMI:</span>
                                        <span className="text-2xl font-black text-indigo-900">
                                            {formatNPR(quotation.financeOptions.emi.monthlyEMI)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-indigo-600">
                                    Total Interest: {formatNPR(quotation.financeOptions.emi.totalInterest)} •
                                    Total Payable: {formatNPR(quotation.financeOptions.emi.totalPayable)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Pricing Summary */}
            <Card>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Percent size={18} />
                    Price Breakdown
                </h3>

                <div className="space-y-2">
                    <PriceRow label="Base Price" amount={quotation.pricing.basePrice} />
                    <PriceRow label="VAT (13%)" amount={quotation.pricing.taxAmount} />
                    <PriceRow label="Registration Fee" amount={quotation.pricing.registrationFee} />

                    {quotation.pricing.insuranceFirstYear > 0 && (
                        <PriceRow label="Insurance (1st Year)" amount={quotation.pricing.insuranceFirstYear} />
                    )}

                    {quotation.pricing.extendedWarranty > 0 && (
                        <PriceRow label="Extended Warranty" amount={quotation.pricing.extendedWarranty} />
                    )}

                    {quotation.pricing.accessories > 0 && (
                        <PriceRow label="Accessories" amount={quotation.pricing.accessories} />
                    )}

                    <div className="border-t border-slate-200 pt-2">
                        <PriceRow label="Subtotal" amount={quotation.pricing.subtotal} bold />
                    </div>

                    {quotation.pricing.agingDiscount > 0 && (
                        <PriceRow
                            label="Aging Discount"
                            amount={-quotation.pricing.agingDiscount}
                            isDiscount
                        />
                    )}

                    {quotation.pricing.exchangeBonus > 0 && (
                        <PriceRow
                            label="Exchange Bonus"
                            amount={-quotation.pricing.exchangeBonus}
                            isDiscount
                        />
                    )}

                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mt-4">
                        <div className="flex justify-between items-center text-white">
                            <span className="text-lg font-bold">Final Price</span>
                            <span className="text-3xl font-black">
                                {formatNPR(quotation.pricing.finalPrice)}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Generate Button */}
            <Button
                onClick={() => onGenerate(quotation)}
                className="w-full"
            >
                Generate Quotation
            </Button>
        </div>
    );
};

const PriceRow: React.FC<{
    label: string;
    amount: number;
    bold?: boolean;
    isDiscount?: boolean;
}> = ({ label, amount, bold, isDiscount }) => (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold' : ''}`}>
        <span className="text-slate-600">{label}</span>
        <span className={isDiscount ? 'text-green-600' : 'text-slate-900'}>
            {formatNPR(amount)}
        </span>
    </div>
);
