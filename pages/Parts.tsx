import React, { useState } from 'react';
import { PageHeader, Card, Badge, Button, Skeleton, useToast } from '../UI';
import { Package, Search, AlertCircle, ShoppingCart, X, Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { useParts, useUpdatePartStock } from '../api';

const Parts: React.FC = () => {
    const { addToast } = useToast();
    const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'receive' | 'issue' | 'transfer' | null>(null);
    const { data: parts = [], isLoading } = useParts();
    const updateStock = useUpdatePartStock();

    // Form states
    const [selectedPartId, setSelectedPartId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) return <div className="space-y-6 animate-fade-in"><Skeleton className="h-12 w-1/3" /><div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><Skeleton className="h-96 lg:col-span-3" /><Skeleton className="h-64" /></div></div>;

    const handleCreatePO = (e: React.FormEvent) => {
        e.preventDefault();
        addToast('Purchase Order #PO-' + Date.now() + ' created successfully!', 'success');
        setIsPurchaseOrderOpen(false);
    };

    const handleActionSubmit = async (e: React.FormEvent, type: 'receive' | 'issue' | 'transfer') => {
        e.preventDefault();
        if (!selectedPartId || quantity <= 0) {
            addToast('Please select a part and valid quantity', 'error');
            return;
        }

        const part = parts.find(p => p.id === selectedPartId);
        if (!part) return;

        let newStock = part.stock;
        if (type === 'receive') newStock += quantity;
        else if (type === 'issue') {
            if (part.stock < quantity) {
                addToast('Insufficient stock', 'error');
                return;
            }
            newStock -= quantity;
        }
        // Transfer doesn't change total stock but might change location (if we tracked it by location)
        // For now, we'll just keep it as a UI update or log

        try {
            await updateStock.mutateAsync({ id: selectedPartId, newStock });
            addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} processed successfully!`, 'success');
            setActiveModal(null);
            setSelectedPartId('');
            setQuantity(0);
        } catch (err) {
            addToast('Failed to update stock', 'error');
        }
    };

    const filteredParts = parts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockCount = parts.filter(p => p.stock <= p.minStockLevel).length;

    return (
        <>
            <div className="space-y-8 animate-fade-in">
                <PageHeader
                    title="Parts Inventory"
                    subtitle="Manage stock levels, reorders, and supplier catalog."
                    actions={
                        <Button
                            icon={ShoppingCart}
                            onClick={() => setIsPurchaseOrderOpen(true)}
                        >
                            Create Purchase Order
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <div className="relative group">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by SKU, Name..."
                                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm">Download Master</Button>
                                <Button variant="secondary" size="sm">Stock Take</Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4">SKU / Name</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Bin</th>
                                        <th className="p-4 text-right">Cost</th>
                                        <th className="p-4 text-right">Price</th>
                                        <th className="p-4 text-center">Stock</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 bg-slate-100 rounded-2xl mb-4"><Package size={32} className="text-slate-400" /></div>
                                                    <p className="font-semibold text-slate-700">{searchTerm ? 'No matching parts found' : 'No parts in inventory'}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{searchTerm ? 'Try a different search term' : 'Create a purchase order to add parts'}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredParts.map(part => (
                                        <tr key={part.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{part.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{part.sku}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{part.category}</span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 font-mono">{part.binLocation}</td>
                                            <td className="p-4 text-right text-sm text-slate-600">₹{part.cost}</td>
                                            <td className="p-4 text-right text-sm font-bold text-slate-900">₹{part.price}</td>
                                            <td className="p-4 text-center">
                                                <div className={`text-sm font-bold ${part.stock <= part.minStockLevel ? 'text-red-600' : 'text-slate-900'}`}>
                                                    {part.stock}
                                                </div>
                                                <div className="text-[10px] text-slate-400">Min: {part.minStockLevel}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={part.status === 'In Stock' ? 'success' : part.status === 'Low Stock' ? 'warning' : 'danger'}>
                                                    {part.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-amber-50 border-amber-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900">Low Stock Alert</h4>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        You have {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below minimum stock level.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3 w-full bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
                                        onClick={() => setIsPurchaseOrderOpen(true)}
                                    >
                                        Auto-Reorder
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => { setActiveModal('receive'); setSelectedPartId(''); setQuantity(0); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors flex items-center gap-3"
                                >
                                    <ArrowDownLeft size={16} className="text-emerald-500" />
                                    Receive Shipment
                                </button>
                                <button
                                    onClick={() => { setActiveModal('issue'); setSelectedPartId(''); setQuantity(0); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors flex items-center gap-3"
                                >
                                    <ArrowUpRight size={16} className="text-blue-500" />
                                    Issue to Job Card
                                </button>
                                <button
                                    onClick={() => { setActiveModal('transfer'); setSelectedPartId(''); setQuantity(0); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors flex items-center gap-3"
                                >
                                    <ArrowLeftRight size={16} className="text-purple-500" />
                                    Internal Transfer
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Purchase Order Modal */}
            {isPurchaseOrderOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black">Create Purchase Order</h2>
                                <p className="text-purple-100 text-sm mt-1">Order parts from supplier</p>
                            </div>
                            <button onClick={() => setIsPurchaseOrderOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePO} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Supplier *</label>
                                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                                    <option value="">Select supplier</option>
                                    <option value="LubeCorp">LubeCorp Nepal</option>
                                    <option value="AutoParts">AutoParts Distributors</option>
                                    <option value="SpareHub">Spare Hub Pvt. Ltd.</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Parts to Order *</label>
                                <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                                    {parts.filter(p => p.stock <= p.minStockLevel).map(part => (
                                        <label key={part.id} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                                            <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-slate-900">{part.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {part.sku} | Current: {part.stock}</div>
                                            </div>
                                            <input
                                                type="number"
                                                defaultValue={part.minStockLevel * 2}
                                                min="1"
                                                className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                                            />
                                        </label>
                                    ))}
                                    {parts.filter(p => p.stock <= p.minStockLevel).length === 0 && (
                                        <p className="text-sm text-slate-500 text-center py-4">All parts are above minimum stock levels</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Expected Delivery</label>
                                    <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Payment Terms</label>
                                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="COD">Cash on Delivery</option>
                                        <option value="NET30">Net 30 Days</option>
                                        <option value="NET60">Net 60 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Notes</label>
                                <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none" placeholder="Additional instructions..." />
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t">
                                <Button type="button" variant="secondary" onClick={() => setIsPurchaseOrderOpen(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Create PO</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Shipment Modal */}
            {activeModal === 'receive' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black">Receive Shipment</h2>
                                <p className="text-emerald-100 text-sm mt-1">Record incoming parts delivery</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => handleActionSubmit(e, 'receive')} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">PO Reference *</label>
                                <input type="text" required placeholder="e.g. PO-20260312" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Part *</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value)}
                                >
                                    <option value="">Select part</option>
                                    {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Quantity Received *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="0"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={quantity || ''}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Bin Location</label>
                                    <input type="text" placeholder="e.g. A1-03" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" isLoading={updateStock.isPending}>Confirm Receipt</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Issue to Job Card Modal */}
            {activeModal === 'issue' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black">Issue to Job Card</h2>
                                <p className="text-blue-100 text-sm mt-1">Allocate parts to a service job</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => handleActionSubmit(e, 'issue')} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Job Card # *</label>
                                <input type="text" required placeholder="e.g. JOB-12345" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Part *</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value)}
                                >
                                    <option value="">Select part</option>
                                    {parts.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Quantity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="0"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={quantity || ''}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1" isLoading={updateStock.isPending}>Issue Parts</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Internal Transfer Modal */}
            {activeModal === 'transfer' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black">Internal Transfer</h2>
                                <p className="text-purple-100 text-sm mt-1">Move parts between locations</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => handleActionSubmit(e, 'transfer')} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Part *</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value)}
                                >
                                    <option value="">Select part</option>
                                    {parts.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">From Location *</label>
                                    <input type="text" required placeholder="e.g. Warehouse A" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">To Location *</label>
                                    <input type="text" required placeholder="e.g. Showroom B1" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Quantity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="0"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={quantity || ''}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)} className="flex-1">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" isLoading={updateStock.isPending}>Transfer</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Parts;
