import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Car, Wrench, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeads, useInventory, useServiceJobs, useCustomers } from '../api';

interface SearchResult {
    id: string;
    type: 'Lead' | 'Vehicle' | 'Service' | 'Customer';
    title: string;
    subtitle: string;
    path: string;
}

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch data via hooks (cached by React Query)
    const { data: leads = [] } = useLeads();
    const { data: inventory = [] } = useInventory();
    const { data: jobs = [] } = useServiceJobs();
    const { data: customers = [] } = useCustomers();

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const searchResults: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        // Search Leads
        leads.forEach(lead => {
            if (
                lead.name.toLowerCase().includes(lowerQuery) ||
                lead.phone.includes(query) ||
                lead.modelInterest.toLowerCase().includes(lowerQuery)
            ) {
                searchResults.push({
                    id: lead.id,
                    type: 'Lead',
                    title: lead.name,
                    subtitle: `${lead.phone} • ${lead.modelInterest}`,
                    path: '/sales'
                });
            }
        });

        // Search Inventory
        inventory.forEach(vehicle => {
            if (
                vehicle.model.toLowerCase().includes(lowerQuery) ||
                vehicle.vin.toLowerCase().includes(lowerQuery)
            ) {
                searchResults.push({
                    id: vehicle.id,
                    type: 'Vehicle',
                    title: `${vehicle.model} ${vehicle.variant}`,
                    subtitle: `VIN: ${vehicle.vin} • ${vehicle.status}`,
                    path: '/inventory'
                });
            }
        });

        // Search Service Jobs
        jobs.forEach(job => {
            if (
                job.customerName.toLowerCase().includes(lowerQuery) ||
                job.regNumber.toLowerCase().includes(lowerQuery) ||
                job.id.toLowerCase().includes(lowerQuery)
            ) {
                searchResults.push({
                    id: job.id,
                    type: 'Service',
                    title: job.customerName,
                    subtitle: `${job.regNumber} • ${job.vehicleModel}`,
                    path: '/service'
                });
            }
        });

        // Search Customers
        customers.forEach(customer => {
            if (
                customer.name.toLowerCase().includes(lowerQuery) ||
                customer.phone.includes(query)
            ) {
                searchResults.push({
                    id: customer.id,
                    type: 'Customer',
                    title: customer.name,
                    subtitle: `${customer.phone} • ${customer.location}`,
                    path: '/customers'
                });
            }
        });

        setResults(searchResults.slice(0, 8)); // Limit to 8 results
        setIsOpen(searchResults.length > 0);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        navigate(result.path);
        setQuery('');
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Lead':
            case 'Customer':
                return <User size={16} className="text-blue-600" />;
            case 'Vehicle':
                return <Car size={16} className="text-green-600" />;
            case 'Service':
                return <Wrench size={16} className="text-orange-600" />;
            default:
                return <Search size={16} className="text-slate-400" />;
        }
    };

    return (
        <div ref={searchRef} className="relative">
            <div className="relative group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                    placeholder="Global Search (Entity / VIN / Phone)..."
                    className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm w-80 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3">
                            {results.length} Result{results.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {results.map((result) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleResultClick(result)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left group"
                            >
                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    {getIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                                            {result.title}
                                        </p>
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                                            {result.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{result.subtitle}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
