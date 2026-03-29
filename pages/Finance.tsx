import React, { useMemo } from 'react';
import { PageHeader, Card, Badge, Button, Skeleton } from '../UI';
import { FileText, Plus, DollarSign, Download, Send } from 'lucide-react';
import { useInvoices } from '../api';

const Finance: React.FC = () => {
    const { data: invoices = [], isLoading } = useInvoices();

    if (isLoading) return <div className="space-y-6 animate-fade-in"><Skeleton className="h-12 w-1/4" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div><Skeleton className="h-96" /></div>;

    // Calculate KPIs from invoice data
    const kpis = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Total revenue for current month (Paid invoices)
        const currentMonthRevenue = invoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return inv.status === 'Paid' &&
                    invDate.getMonth() === currentMonth &&
                    invDate.getFullYear() === currentYear;
            })
            .reduce((sum, inv) => sum + inv.total, 0);

        // Last month revenue for comparison
        const lastMonthRevenue = invoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return inv.status === 'Paid' &&
                    invDate.getMonth() === lastMonth &&
                    invDate.getFullYear() === lastMonthYear;
            })
            .reduce((sum, inv) => sum + inv.total, 0);

        // Pending payments (Sent + Overdue)
        const pendingInvoices = invoices.filter(inv =>
            inv.status === 'Sent' || inv.status === 'Overdue'
        );
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Draft quotes
        const draftQuotes = invoices.filter(inv => inv.status === 'Draft');
        const draftValue = draftQuotes.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate percentage change
        const revenueChange = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        return {
            totalRevenue: currentMonthRevenue,
            revenueChange,
            pendingAmount,
            pendingCount: pendingInvoices.length,
            draftCount: draftQuotes.length,
            draftValue
        };
    }, [invoices]);

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) { // 1 Crore
            return `₹${(amount / 10000000).toFixed(2)} Cr`;
        } else if (amount >= 100000) { // 1 Lakh
            return `₹${(amount / 100000).toFixed(1)} L`;
        } else {
            return `₹${amount.toLocaleString()}`;
        }
    };

    // Get current month name
    const currentMonthName = new Date().toLocaleString('default', { month: 'short' });

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Finance & Billing"
                subtitle="Invoicing, Quotations, and Revenue Tracking."
                actions={<Button icon={Plus}>Create New Invoice</Button>}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 text-white border-none">
                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign size={16} className="text-white" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white">
                                Total Revenue ({currentMonthName})
                            </span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            {formatCurrency(kpis.totalRevenue)}
                        </p>
                        <div className="mt-4 text-xs font-medium text-slate-300">
                            <span className={kpis.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {kpis.revenueChange >= 0 ? '▲' : '▼'} {Math.abs(kpis.revenueChange).toFixed(1)}%
                            </span> vs last month
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <FileText size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Pending Payments</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">
                            {formatCurrency(kpis.pendingAmount)}
                        </p>
                        <div className="mt-4 text-xs font-medium text-slate-400">
                            Across {kpis.pendingCount} invoice{kpis.pendingCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <FileText size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Draft Quotes</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{kpis.draftCount}</p>
                        <div className="mt-4 text-xs font-medium text-slate-400">
                            Potential value: {formatCurrency(kpis.draftValue)}
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-900">Recent Invoices</h3>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Filter by Status</Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Invoice #</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-4 bg-slate-100 rounded-2xl mb-4"><FileText size={32} className="text-slate-400" /></div>
                                            <p className="font-semibold text-slate-700">No invoices yet</p>
                                            <p className="text-sm text-slate-500 mt-1">Invoices will appear here once deals are closed</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : invoices.map(inv => (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-mono text-sm font-bold text-blue-600">{inv.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                                        <div className="text-xs text-slate-500">{inv.customerId}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{inv.date}</td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">{inv.type}</span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-900">
                                        {inv.total > 0 ? `₹${inv.total.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4">
                                        <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : inv.status === 'Sent' ? 'warning' : 'neutral'}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Download PDF"><Download size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="Send Email"><Send size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Finance;
