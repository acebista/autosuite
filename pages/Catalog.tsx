import React, { useState } from 'react';
import { PageHeader, Card, Button, Badge, useToast, Skeleton, Input, Select } from '../UI';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Car, Settings, Check, Palette } from 'lucide-react';
import { Vehicle } from '../types';
import { useInventory, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '../api';

// Color mapping for visual swatches
const COLOR_MAP: Record<string, string> = {
    // E07 Colors
    'Quartz White': '#F5F5F5', 'Hematite Grey': '#4A4A4A', 'Obsidian Black': '#1A1A1A',
    // S07 Colors
    'Lunar Gray': '#B0B0B0', 'Comet White': '#FFFFFF', 'Eclipse Black': '#0D0D0D',
    'Nebula Green': '#2E7D32', 'Sunset Orange': '#E64A19',
    // L07 Colors
    'Stellar Blue': '#1976D2', 'Aurora Blue': '#1565C0',
    // S05 Colors
    'Mercury Silver': '#C0C0C0', 'Deep Space Black': '#0A0A0A', 'Andromeda Blue': '#3F51B5',
    'Ganymede Grey': '#757575', 'Moonlight White': '#FAFAFA',
    // Additional Colors
    'Galaxy Silver': '#9E9E9E', 'Cosmic Red': '#C62828', 'Starlight Silver': '#CFD8DC'
};

const LIGHT_COLORS = ['Quartz White', 'Comet White', 'Galaxy Silver', 'Starlight Silver', 'Lunar Gray', 'Mercury Silver', 'Moonlight White'];

// ProductCard component with interactive color selection
interface ProductCardProps {
    product: Vehicle;
    onEdit: (product: Vehicle) => void;
    onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
    const [previewColor, setPreviewColor] = useState<string>(product.color);

    // Get the image for the currently previewed color
    const getPreviewImage = () => {
        if (product.availableColors && product.availableColors.length > 0) {
            const colorMatch = product.availableColors.find(c => c.color === previewColor);
            if (colorMatch) return colorMatch.image;
        }
        return product.image;
    };

    const currentImage = getPreviewImage();

    return (
        <Card noPadding className="group overflow-hidden flex flex-col">
            <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 border-b border-slate-100 overflow-hidden">
                {currentImage ? (
                    <img
                        src={currentImage}
                        alt={`${product.model} - ${previewColor}`}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                        <ImageIcon size={48} />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <Badge variant="neutral" size="sm">{product.fuelType}</Badge>
                </div>
                {previewColor && previewColor !== product.color && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg">
                        {previewColor}
                    </div>
                )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-black text-lg text-slate-800">{product.model}</h3>
                        <p className="text-xs font-bold text-slate-500">{product.variant} • {product.year}</p>
                    </div>
                    <p className="font-black text-blue-700">₹{(product.price! / 100000).toFixed(1)}L</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 my-4 space-y-1">
                    {product.specifications?.slice(0, 3).map((spec, i) => (
                        <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">{spec.label}</span>
                            <span className="text-slate-800 font-bold">{spec.value}</span>
                        </div>
                    ))}
                    {(product.specifications?.length || 0) > 3 && (
                        <p className="text-[10px] text-center text-blue-600 font-bold pt-1">
                            + {(product.specifications?.length || 0) - 3} more specs
                        </p>
                    )}
                </div>

                {/* Interactive Color Selector */}
                {product.availableColors && product.availableColors.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Palette size={12} className="text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Click to preview</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {product.availableColors.map((colorOpt) => {
                                const bgColor = COLOR_MAP[colorOpt.color] || '#888';
                                const isLight = LIGHT_COLORS.includes(colorOpt.color);
                                const isSelected = previewColor === colorOpt.color;
                                return (
                                    <button
                                        key={colorOpt.color}
                                        type="button"
                                        title={colorOpt.color}
                                        onClick={() => setPreviewColor(colorOpt.color)}
                                        className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center ${isSelected
                                            ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                                            : 'border-slate-200 hover:scale-110'
                                            }`}
                                        style={{
                                            backgroundColor: bgColor,
                                            boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {isSelected && (
                                            <Check size={10} className={isLight ? 'text-slate-700' : 'text-white'} strokeWidth={3} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4 flex gap-3">
                    <button
                        onClick={() => onEdit(product)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    <button
                        onClick={() => product.id && onDelete(product.id)}
                        className="p-2 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </Card>
    );
};

const Catalog: React.FC = () => {
    const { data: products = [], isLoading } = useInventory();
    const createVehicle = useCreateVehicle();
    const updateVehicle = useUpdateVehicle();
    const deleteVehicle = useDeleteVehicle();
    const { addToast } = useToast();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Vehicle | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Vehicle>>({ specifications: [] });

    const handleOpenEditor = (product?: Vehicle) => {
        if (product) {
            setFormData(JSON.parse(JSON.stringify(product))); // Deep copy
            setEditingProduct(product);
        } else {
            setFormData({
                specifications: [{ label: 'Engine/Motor', value: '' }],
                year: new Date().getFullYear(),
                fuelType: 'Petrol',
                status: 'In Stock'
            });
            setEditingProduct(null);
        }
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        if (!formData.model || !formData.price) {
            addToast('Please fill in Model Name and Price', 'error');
            return;
        }

        try {
            if (editingProduct && editingProduct.id) {
                await updateVehicle.mutateAsync({ id: editingProduct.id, patch: formData });
                addToast(`Updated ${formData.model}`, 'success');
            } else {
                await createVehicle.mutateAsync(formData);
                addToast(`Created ${formData.model}`, 'success');
            }
            setIsEditorOpen(false);
        } catch (err) {
            addToast('Failed to save product', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this model?')) {
            try {
                await deleteVehicle.mutateAsync(id);
                addToast('Product deleted', 'success');
            } catch (err) {
                addToast('Delete failed', 'error');
            }
        }
    };

    const addSpecRow = () => {
        setFormData({
            ...formData,
            specifications: [...(formData.specifications || []), { label: '', value: '' }]
        });
    };

    const updateSpec = (index: number, field: 'label' | 'value', text: string) => {
        const newSpecs = [...(formData.specifications || [])];
        newSpecs[index][field] = text;
        setFormData({ ...formData, specifications: newSpecs });
    };

    const removeSpec = (index: number) => {
        const newSpecs = [...(formData.specifications || [])];
        newSpecs.splice(index, 1);
        setFormData({ ...formData, specifications: newSpecs });
    };

    // Available Colors Management
    const addColorRow = () => {
        setFormData({
            ...formData,
            availableColors: [...(formData.availableColors || []), { color: '', image: '' }]
        });
    };

    const updateColor = (index: number, field: 'color' | 'image', text: string) => {
        const newColors = [...(formData.availableColors || [])];
        newColors[index][field] = text;
        setFormData({ ...formData, availableColors: newColors });
    };

    const removeColor = (index: number) => {
        const newColors = [...(formData.availableColors || [])];
        newColors.splice(index, 1);
        setFormData({ ...formData, availableColors: newColors });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Product Catalog Manager"
                subtitle="Manage master data for vehicles, specifications, and pricing."
                actions={<Button icon={Plus} onClick={() => handleOpenEditor()}>Add New Model</Button>}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-96" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleOpenEditor}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* PRODUCT EDITOR DRAWER */}
            {isEditorOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-xs text-slate-500">Define master data for use in quotes and inventory.</p>
                            </div>
                            <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Basic Info */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Car size={14} /> Basic Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Model Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                                placeholder="e.g. Deepal S07"
                                                value={formData.model || ''}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Variant</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                placeholder="e.g. EV 500"
                                                value={formData.variant || ''}
                                                onChange={e => setFormData({ ...formData, variant: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Fuel Type</label>
                                            <select
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                value={formData.fuelType}
                                                // @ts-ignore
                                                onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                                            >
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="EV">Electric (EV)</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Year</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                value={formData.year}
                                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Standard Showroom Price (NPR)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                                placeholder="0.00"
                                                value={formData.price || ''}
                                                onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Image */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ImageIcon size={14} /> Brochure Image
                                </h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-500"
                                        placeholder="https://..."
                                        value={formData.image || ''}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    />
                                    {formData.image && (
                                        <img src={formData.image} className="h-10 w-16 object-cover rounded-lg border border-slate-200" alt="Preview" />
                                    )}
                                </div>
                            </section>

                            {/* Dynamic Specs Editor */}
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Settings size={14} /> Specifications
                                    </h3>
                                    <Button size="sm" variant="outline" onClick={addSpecRow} icon={Plus} className="h-7 text-xs">
                                        Add Spec
                                    </Button>
                                </div>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    {formData.specifications?.map((spec, idx) => (
                                        <div key={idx} className="flex gap-2 group">
                                            <input
                                                type="text"
                                                value={spec.label}
                                                onChange={(e) => updateSpec(idx, 'label', e.target.value)}
                                                className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white transition-colors"
                                                placeholder="Label (e.g. Battery)"
                                            />
                                            <input
                                                type="text"
                                                value={spec.value}
                                                onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white transition-colors"
                                                placeholder="Value (e.g. 60 kWh)"
                                            />
                                            <button
                                                onClick={() => removeSpec(idx)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.specifications?.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-xs italic">
                                            No specs defined. Add rows to define technical details for the quotation.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Available Colors Editor */}
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Palette size={14} /> Available Colors
                                    </h3>
                                    <Button size="sm" variant="outline" onClick={addColorRow} icon={Plus} className="h-7 text-xs">
                                        Add Color
                                    </Button>
                                </div>
                                <div className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                                    {formData.availableColors?.map((colorOpt, idx) => {
                                        const colorMap: Record<string, string> = {
                                            'Quartz White': '#F5F5F5', 'Hematite Grey': '#4A4A4A', 'Obsidian Black': '#1A1A1A',
                                            'Lunar Gray': '#B0B0B0', 'Comet White': '#FFFFFF', 'Eclipse Black': '#0D0D0D',
                                            'Nebula Green': '#2E7D32', 'Sunset Orange': '#E64A19', 'Aurora Blue': '#1565C0',
                                            'Galaxy Silver': '#9E9E9E', 'Cosmic Red': '#C62828', 'Starlight Silver': '#CFD8DC'
                                        };
                                        const bgColor = colorMap[colorOpt.color] || '#ddd';
                                        return (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <div
                                                    className="w-8 h-8 rounded-lg border-2 border-slate-200 flex-shrink-0"
                                                    style={{ backgroundColor: bgColor }}
                                                />
                                                <input
                                                    type="text"
                                                    value={colorOpt.color}
                                                    onChange={(e) => updateColor(idx, 'color', e.target.value)}
                                                    className="w-1/3 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white transition-colors"
                                                    placeholder="Color name"
                                                />
                                                <input
                                                    type="text"
                                                    value={colorOpt.image}
                                                    onChange={(e) => updateColor(idx, 'image', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 focus:bg-white transition-colors"
                                                    placeholder="Image URL for this color"
                                                />
                                                {colorOpt.image && (
                                                    <img src={colorOpt.image} className="h-8 w-12 object-cover rounded border border-slate-200" alt="Preview" />
                                                )}
                                                <button
                                                    onClick={() => removeColor(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {(!formData.availableColors || formData.availableColors.length === 0) && (
                                        <div className="text-center py-6 text-slate-400 text-xs italic">
                                            No colors defined. Add color options that customers can choose from.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4">
                            <Button variant="secondary" onClick={() => setIsEditorOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} icon={Check} className="flex-1 bg-green-600 hover:bg-green-700">
                                Save Product
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalog;
