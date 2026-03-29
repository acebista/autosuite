import { Lead, Vehicle, ServiceJob, Customer, Invoice, Part, Campaign, Appointment, User, DashboardExceptions, GatePass, Organization } from './types';

// Mock Organizations
export const MOCK_ORGANIZATIONS: Organization[] = [
    {
        id: 'demo-org',
        name: 'Kathmandu Automotive',
        slug: 'kathmandu-auto',
        subscription_status: 'active',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'org-2',
        name: 'Lumbini Motors',
        slug: 'lumbini-motors',
        subscription_status: 'active',
        createdAt: '2024-02-15T00:00:00Z'
    }
];

// Mock Dashboard Exceptions
export const MOCK_DASHBOARD_EXCEPTIONS: DashboardExceptions = {
    overdueFollowups: 12,
    stuckLeads: 8,
    agedInventory: 5,
    overdueJobs: 3,
    lowStockParts: 7,
    pendingInvoices: 15
};

// Mock Leads - Deepal EV Prospects
export const MOCK_LEADS: Lead[] = [
    {
        id: 'L001',
        name: 'Rajesh Kumar',
        phone: '+977 9851234567',
        email: 'rajesh.kumar@example.com',
        address: 'Baneshwor, Kathmandu',
        source: 'Facebook Ads',
        modelInterest: 'Deepal E07',
        vehicleColor: 'Aurora White',
        budget: 9500000,
        status: 'Test Drive',
        temperature: 'Hot',
        createdAt: '2024-12-20T10:30:00Z',
        updatedAt: '2024-12-25T14:20:00Z',
        testDriveDate: '2024-12-24T11:00:00Z',
        nextFollowUpDate: '2024-12-27T10:00:00Z',
        aiScore: 98,
        ownerId: 'U001',
        branchId: 'B001',
        quotationIssued: true,
        exchange: {
            hasExchange: true,
            vehicleModel: 'Honda City 2018',
            expectedValue: 1800000,
            offeredValue: 1650000
        },
        remarks: 'Very interested in E07 trunk transformation feature',
        notes: []
    },
    {
        id: 'L002',
        name: 'Sita Sharma',
        phone: '+977 9841234567',
        email: 'sita.sharma@example.com',
        source: 'Walk-in',
        modelInterest: 'Deepal S07',
        budget: 7500000,
        status: 'Proposal',
        temperature: 'Warm',
        createdAt: '2024-12-18T09:15:00Z',
        updatedAt: '2024-12-23T16:45:00Z',
        nextFollowUpDate: '2024-12-26T14:00:00Z',
        aiScore: 85,
        ownerId: 'U002',
        branchId: 'B001',
        quotationIssued: true,
        exchange: { hasExchange: false },
        notes: []
    },
    {
        id: 'L003',
        name: 'Amit Thapa',
        phone: '+977 9861234567',
        email: 'amit.thapa@example.com',
        source: 'Google Search',
        modelInterest: 'Deepal S05',
        budget: 5800000,
        status: 'New',
        temperature: 'Cold',
        createdAt: '2024-12-26T08:00:00Z',
        updatedAt: '2024-12-26T08:00:00Z',
        nextFollowUpDate: '2024-12-27T09:00:00Z',
        aiScore: 62,
        ownerId: 'U001',
        branchId: 'B001',
        quotationIssued: false,
        exchange: { hasExchange: false },
        notes: []
    },
    {
        id: 'L004',
        name: 'Priya Rai',
        phone: '+977 9871234567',
        email: 'priya.rai@example.com',
        source: 'Referral',
        modelInterest: 'Deepal L07',
        vehicleColor: 'Midnight Blue',
        budget: 9000000,
        status: 'Negotiation',
        temperature: 'Hot',
        createdAt: '2024-12-15T11:00:00Z',
        updatedAt: '2024-12-26T09:30:00Z',
        nextFollowUpDate: '2024-12-28T11:00:00Z',
        aiScore: 92,
        ownerId: 'U002',
        branchId: 'B001',
        quotationIssued: true,
        exchange: { hasExchange: false },
        remarks: 'Interested in EREV variant for long range capability',
        notes: []
    }
];

// Mock Vehicles - Deepal EV Lineup (Consolidated with Color Options)
export const MOCK_VEHICLES: Vehicle[] = [
    // ============================================
    // DEEPAL E07 - Electric SUV Coupe
    // Colors: Hematite Grey, Quartz White, Obsidian Black
    // ============================================
    {
        id: 'V001',
        model: 'Deepal E07',
        variant: 'EV 530',
        year: 2025,
        color: 'Quartz White',
        vin: 'LSDC3A2G1PA000001',
        price: 8990000,
        cost: 7800000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 5,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png',
        availableColors: [
            { color: 'Quartz White', image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png' },
            { color: 'Hematite Grey', image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png' },
            { color: 'Obsidian Black', image: 'https://changannepal.com/assets/frontend/images/car/E07/3.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '190 kW (255 HP)' },
            { label: 'Battery Capacity', value: '71.8 kWh' },
            { label: 'Range (CLTC)', value: '530 km' },
            { label: '0-100 km/h', value: '3.96 seconds' },
            { label: 'Ground Clearance', value: '195 mm' },
            { label: 'Dimensions (LxWxH)', value: '4880 x 1995 x 1580 mm' }
        ],
        agingBucket: '0-30'
    },
    {
        id: 'V002',
        model: 'Deepal E07',
        variant: 'EV 620',
        year: 2025,
        color: 'Hematite Grey',
        vin: 'LSDC3A2G1PA000002',
        price: 9990000,
        cost: 8700000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 8,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png',
        availableColors: [
            { color: 'Quartz White', image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png' },
            { color: 'Hematite Grey', image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png' },
            { color: 'Obsidian Black', image: 'https://changannepal.com/assets/frontend/images/car/E07/3.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '190 kW (255 HP)' },
            { label: 'Battery Capacity', value: '80.5 kWh' },
            { label: 'Range (CLTC)', value: '620 km' },
            { label: '0-100 km/h', value: '3.96 seconds' },
            { label: 'Ground Clearance', value: '195 mm' },
            { label: 'Dimensions (LxWxH)', value: '4880 x 1995 x 1580 mm' }
        ],
        agingBucket: '0-30'
    },

    // ============================================
    // DEEPAL S07 - Smart Lifestyle SUV
    // Colors: Lunar Gray, Comet White, Eclipse Black, Nebula Green, Sunset Orange
    // ============================================
    {
        id: 'V003',
        model: 'Deepal S07',
        variant: 'EV 500',
        year: 2025,
        color: 'Comet White',
        vin: 'LSDC3A2G1PA000003',
        price: 7200000,
        cost: 6300000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 12,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png',
        availableColors: [
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/1.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png' },
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/4.png' },
            { color: 'Sunset Orange', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/5.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '160 kW (215 HP)' },
            { label: 'Battery Capacity', value: '66.8 kWh' },
            { label: 'Range (CLTC)', value: '520 km' },
            { label: 'Ground Clearance', value: '190 mm' },
            { label: 'Dimensions (LxWxH)', value: '4750 x 1930 x 1625 mm' },
            { label: 'Wheelbase', value: '2900 mm' }
        ],
        agingBucket: '0-30'
    },
    {
        id: 'V004',
        model: 'Deepal S07',
        variant: 'EV 620',
        year: 2025,
        color: 'Eclipse Black',
        vin: 'LSDC3A2G1PA000004',
        price: 7900000,
        cost: 6900000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 7,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png',
        availableColors: [
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/1.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png' },
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/4.png' },
            { color: 'Sunset Orange', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/5.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '175 kW (235 HP)' },
            { label: 'Battery Capacity', value: '79.97 kWh' },
            { label: 'Range (CLTC)', value: '620 km' },
            { label: 'Ground Clearance', value: '190 mm' },
            { label: 'Dimensions (LxWxH)', value: '4750 x 1930 x 1625 mm' },
            { label: 'Wheelbase', value: '2900 mm' }
        ],
        agingBucket: '0-30'
    },

    // ============================================
    // DEEPAL L07 - Premium Electric Fastback
    // Colors: Stellar Blue, Nebula Green, Lunar Gray, Comet White, Eclipse Black
    // ============================================
    {
        id: 'V005',
        model: 'Deepal L07',
        variant: 'EV 530',
        year: 2025,
        color: 'Stellar Blue',
        vin: 'LSDC3A2G1PA000005',
        price: 7500000,
        cost: 6500000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 15,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/6.png',
        availableColors: [
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/2.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/3.png' },
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/4.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/5.png' },
            { color: 'Stellar Blue', image: 'https://changannepal.com/assets/frontend/images/car/6.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '160 kW (215 HP)' },
            { label: 'Battery Capacity', value: '66.8 kWh' },
            { label: 'Range (CLTC)', value: '530 km' },
            { label: 'Ground Clearance', value: '125 mm' },
            { label: 'Dimensions (LxWxH)', value: '4820 x 1890 x 1480 mm' },
            { label: 'Wheelbase', value: '2785 mm' }
        ],
        agingBucket: '0-30'
    },
    {
        id: 'V006',
        model: 'Deepal L07',
        variant: 'EREV (Extended Range)',
        year: 2025,
        color: 'Nebula Green',
        vin: 'LSDC3A2G1PA000006',
        price: 8900000,
        cost: 7700000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 10,
        fuelType: 'Hybrid',
        image: 'https://changannepal.com/assets/frontend/images/car/5.png',
        availableColors: [
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/2.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/3.png' },
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/4.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/5.png' },
            { color: 'Stellar Blue', image: 'https://changannepal.com/assets/frontend/images/car/6.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '175 kW (235 HP)' },
            { label: 'Battery Capacity', value: '31.6 kWh' },
            { label: 'Pure Electric Range', value: '200 km' },
            { label: 'Total Range (CLTC)', value: '1200+ km' },
            { label: 'Engine', value: '1.5L Range Extender' },
            { label: 'Dimensions (LxWxH)', value: '4820 x 1890 x 1480 mm' }
        ],
        agingBucket: '0-30'
    },

    // ============================================
    // DEEPAL S05 - Compact Electric SUV
    // Colors: Mercury Silver, Deep Space Black, Andromeda Blue, Ganymede Grey, Moonlight White
    // ============================================
    {
        id: 'V007',
        model: 'Deepal S05',
        variant: 'EV 420',
        year: 2025,
        color: 'Moonlight White',
        vin: 'LSDC3A2G1PA000007',
        price: 5500000,
        cost: 4800000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 20,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '160 kW (215 HP)' },
            { label: 'Battery Capacity', value: '52.3 kWh' },
            { label: 'Range (CLTC)', value: '420 km' },
            { label: 'Ground Clearance', value: '175 mm' },
            { label: 'Dimensions (LxWxH)', value: '4400 x 1875 x 1580 mm' },
            { label: 'Remote Park', value: 'In & Out' }
        ],
        agingBucket: '0-30'
    },
    {
        id: 'V008',
        model: 'Deepal S05',
        variant: 'EV 520',
        year: 2025,
        color: 'Andromeda Blue',
        vin: 'LSDC3A2G1PA000008',
        price: 5990000,
        cost: 5200000,
        status: 'In Stock',
        branchId: 'B001',
        daysInStock: 14,
        fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ],
        specifications: [
            { label: 'Motor Peak Power', value: '160 kW (215 HP)' },
            { label: 'Battery Capacity', value: '66.8 kWh' },
            { label: 'Range (CLTC)', value: '520 km' },
            { label: 'Ground Clearance', value: '175 mm' },
            { label: 'Dimensions (LxWxH)', value: '4400 x 1875 x 1580 mm' },
            { label: 'Remote Park', value: 'In & Out' }
        ],
        agingBucket: '0-30'
    }
];

// Mock Service Jobs
export const MOCK_SERVICE_JOBS: ServiceJob[] = [
    {
        id: 'SJ001',
        customerId: 'C001',
        customerName: 'Rajesh Kumar',
        vehicleModel: 'Toyota Fortuner',
        regNumber: 'BA 12 PA 1234',
        type: 'Periodic',
        status: 'In Progress',
        technicianId: 'T001',
        branchId: 'B001',
        createdAt: '2024-12-24T08:00:00Z',
        promisedAt: '2024-12-26T17:00:00Z',
        costEstimate: 15000,
        actualCost: 14500,
        isOverdue: false,
        notes: []
    },
    {
        id: 'SJ002',
        customerId: 'C002',
        customerName: 'Sita Sharma',
        vehicleModel: 'Honda City',
        regNumber: 'BA 15 CHA 5678',
        type: 'Repair',
        status: 'Waiting Parts',
        technicianId: 'T002',
        branchId: 'B001',
        createdAt: '2024-12-22T10:30:00Z',
        promisedAt: '2024-12-25T16:00:00Z',
        costEstimate: 25000,
        actualCost: 0,
        isOverdue: true,
        notes: []
    },
    {
        id: 'SJ003',
        customerId: 'C003',
        customerName: 'Amit Thapa',
        vehicleModel: 'Hyundai i20',
        regNumber: 'BA 10 KHA 9012',
        type: 'Warranty',
        status: 'Ready',
        technicianId: 'T001',
        branchId: 'B001',
        createdAt: '2024-12-23T14:00:00Z',
        promisedAt: '2024-12-26T12:00:00Z',
        costEstimate: 0,
        actualCost: 0,
        isOverdue: false,
        notes: []
    }
];

// Mock Customers
export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'C001',
        name: 'Rajesh Kumar',
        phone: '+977 9851234567',
        email: 'rajesh.kumar@example.com',
        branchId: 'B001',
        location: 'Baneshwor, Kathmandu',
        ltv: 650000,
        lastServiceAt: '2024-11-15T10:00:00Z',
        nextServiceDueAt: '2025-02-15',
        carsOwned: [
            { model: 'Toyota Fortuner', plate: 'BA 12 PA 1234', status: 'Active' },
            { model: 'Honda City', plate: 'BA 08 CHA 5678', status: 'Sold' }
        ],
        referrals: 2
    },
    {
        id: 'C002',
        name: 'Sita Sharma',
        phone: '+977 9841234567',
        email: 'sita.sharma@example.com',
        branchId: 'B001',
        location: 'Lalitpur',
        ltv: 320000,
        lastServiceAt: '2024-12-10T14:30:00Z',
        nextServiceDueAt: '2025-03-10',
        carsOwned: [
            { model: 'Honda City', plate: 'BA 15 CHA 5678', status: 'Active' }
        ],
        referrals: 1
    },
    {
        id: 'C003',
        name: 'Amit Thapa',
        phone: '+977 9861234567',
        email: 'amit.thapa@example.com',
        branchId: 'B001',
        location: 'Bhaktapur',
        ltv: 180000,
        lastServiceAt: '2024-10-20T09:00:00Z',
        nextServiceDueAt: '2025-01-20',
        carsOwned: [
            { model: 'Hyundai i20', plate: 'BA 10 KHA 9012', status: 'Active' }
        ],
        referrals: 0
    },
    {
        id: 'C004',
        name: 'Priya Rai',
        phone: '+977 9871234567',
        email: 'priya.rai@example.com',
        branchId: 'B001',
        location: 'Patan',
        ltv: 950000,
        lastServiceAt: '2024-12-01T11:00:00Z',
        nextServiceDueAt: '2025-03-01',
        carsOwned: [
            { model: 'Toyota Fortuner', plate: 'BA 18 PA 3456', status: 'Active' },
            { model: 'Suzuki Swift', plate: 'BA 12 KHA 7890', status: 'Active' }
        ],
        referrals: 4
    }
];

// Mock Invoices
export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'INV001',
        customerId: 'C001',
        customerName: 'Rajesh Kumar',
        date: '2024-12-24',
        dueDate: '2025-01-08',
        status: 'Sent',
        items: [
            { id: 'I1', description: 'Engine Oil Change', quantity: 1, unitPrice: 3500, total: 3500, type: 'Labor' },
            { id: 'I2', description: 'Oil Filter', quantity: 1, unitPrice: 850, total: 850, type: 'Part' },
            { id: 'I3', description: 'Air Filter', quantity: 1, unitPrice: 1200, total: 1200, type: 'Part' }
        ],
        subtotal: 5550,
        tax: 721.5,
        total: 6271.5,
        type: 'Service'
    },
    {
        id: 'INV002',
        customerId: 'C002',
        customerName: 'Sita Sharma',
        date: '2024-12-20',
        dueDate: '2024-12-27',
        status: 'Overdue',
        items: [
            { id: 'I1', description: 'Brake Pad Replacement', quantity: 1, unitPrice: 8500, total: 8500, type: 'Labor' },
            { id: 'I2', description: 'Front Brake Pads', quantity: 1, unitPrice: 4500, total: 4500, type: 'Part' }
        ],
        subtotal: 13000,
        tax: 1690,
        total: 14690,
        type: 'Service'
    },
    {
        id: 'INV003',
        customerId: 'C004',
        customerName: 'Priya Rai',
        date: '2024-12-15',
        dueDate: '2024-12-22',
        status: 'Paid',
        items: [
            { id: 'I1', description: 'Toyota Fortuner Legender', quantity: 1, unitPrice: 5850000, total: 5850000, type: 'Vehicle' }
        ],
        subtotal: 5850000,
        tax: 760500,
        total: 6610500,
        type: 'Sales'
    }
];

// Mock Parts
export const MOCK_PARTS: Part[] = [
    {
        id: 'P001',
        sku: 'TOY-OIL-5W30',
        name: 'Engine Oil 5W-30',
        description: 'Fully synthetic engine oil for Toyota vehicles',
        category: 'Fluid',
        price: 3500,
        cost: 2800,
        stock: 45,
        minStockLevel: 20,
        binLocation: 'A-12',
        supplier: 'Toyota Genuine Parts',
        status: 'In Stock'
    },
    {
        id: 'P002',
        sku: 'HYU-BRAKE-PAD-F',
        name: 'Front Brake Pads',
        description: 'Ceramic brake pads for Hyundai models',
        category: 'Part',
        price: 4500,
        cost: 3200,
        stock: 8,
        minStockLevel: 10,
        binLocation: 'B-05',
        supplier: 'Hyundai Parts Center',
        status: 'Low Stock'
    },
    {
        id: 'P003',
        sku: 'UNI-AIR-FILTER',
        name: 'Air Filter Universal',
        description: 'High-flow air filter compatible with multiple models',
        category: 'Part',
        price: 1200,
        cost: 850,
        stock: 0,
        minStockLevel: 15,
        binLocation: 'C-08',
        supplier: 'Auto Parts Nepal',
        status: 'Out of Stock'
    },
    {
        id: 'P004',
        sku: 'TOY-WIPER-BLADE',
        name: 'Wiper Blade Set',
        description: 'Premium silicone wiper blades',
        category: 'Accessory',
        price: 1800,
        cost: 1200,
        stock: 32,
        minStockLevel: 10,
        binLocation: 'D-15',
        supplier: 'Toyota Genuine Parts',
        status: 'In Stock'
    }
];

// Mock Campaigns
export const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: 'CAM001',
        name: 'Year-End Clearance Sale',
        channel: 'Facebook',
        status: 'Active',
        spend: 85000,
        leadsGenerated: 127,
        conversionRate: 12.5,
        revenueGenerated: 8500000,
        roi: 100
    },
    {
        id: 'CAM002',
        name: 'EV Awareness Campaign',
        channel: 'WhatsApp',
        status: 'Active',
        spend: 25000,
        leadsGenerated: 45,
        conversionRate: 8.2,
        revenueGenerated: 1800000,
        roi: 72
    },
    {
        id: 'CAM003',
        name: 'Service Reminder SMS',
        channel: 'SMS',
        status: 'Completed',
        spend: 15000,
        leadsGenerated: 89,
        conversionRate: 22.5,
        revenueGenerated: 450000,
        roi: 30
    }
];

// Mock Appointments
export const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: 'APT001',
        title: 'Test Drive - Rajesh Kumar',
        start: '2024-12-27T10:00:00Z',
        end: '2024-12-27T11:00:00Z',
        type: 'Test Drive',
        resourceId: 'V001',
        customerId: 'C001',
        customerName: 'Rajesh Kumar',
        status: 'Confirmed',
        notes: 'Interested in Fortuner Legender'
    },
    {
        id: 'APT002',
        title: 'Service - Sita Sharma',
        start: '2024-12-27T14:00:00Z',
        end: '2024-12-27T16:00:00Z',
        type: 'Service',
        customerId: 'C002',
        customerName: 'Sita Sharma',
        status: 'Confirmed',
        notes: 'Regular maintenance'
    },
    {
        id: 'APT003',
        title: 'Delivery - Priya Rai',
        start: '2024-12-28T11:00:00Z',
        end: '2024-12-28T12:00:00Z',
        type: 'Delivery',
        resourceId: 'V001',
        customerId: 'C004',
        customerName: 'Priya Rai',
        status: 'Pending',
        notes: 'Final payment pending'
    }
];

// Mock Users
export const MOCK_USERS: User[] = [
    {
        id: 'U001',
        name: 'Ramesh Adhikari',
        email: 'ramesh@kathmanduauto.com',
        role: 'SalesManager',
        branchId: 'B001',
        avatar: 'https://i.pravatar.cc/150?img=12',
        status: 'Active'
    },
    {
        id: 'U002',
        name: 'Sunita Karki',
        email: 'sunita@kathmanduauto.com',
        role: 'SalesRep',
        branchId: 'B001',
        avatar: 'https://i.pravatar.cc/150?img=45',
        status: 'Active'
    },
    {
        id: 'U003',
        name: 'Bikash Shrestha',
        email: 'bikash@kathmanduauto.com',
        role: 'ServiceAdvisor',
        branchId: 'B001',
        avatar: 'https://i.pravatar.cc/150?img=33',
        status: 'Active'
    },
    {
        id: 'U004',
        name: 'Anita Gurung',
        email: 'anita@kathmanduauto.com',
        role: 'Admin',
        branchId: 'B001',
        avatar: 'https://i.pravatar.cc/150?img=28',
        status: 'Active'
    },
    {
        id: 'SUPER_ADMIN_001',
        name: 'Dank Therapy Admin',
        email: 'danktherapy@gmail.com',
        role: 'SuperAdmin',
        branchId: 'B001',
        avatar: 'https://i.pravatar.cc/150?img=12',
        status: 'Active',
        password: 'Sachu123!'
    } as any
];

// Mock Gate Passes
export const MOCK_GATE_PASSES: any[] = [
    {
        id: 'GP001',
        passCode: 'GP-2026-0001',
        qrData: '{}',
        vehicleId: 'V001',
        vehicleModel: 'Deepal E07',
        vehicleRegNumber: 'BA 1 PA 1234',
        customerName: 'Rajesh Kumar',
        passType: 'test_drive',
        issuedBy: 'U001',
        issuedAt: '2024-12-27T09:00:00Z',
        validUntil: '2024-12-27T13:00:00Z',
        status: 'active'
    },
    {
        id: 'GP002',
        passCode: 'GP-2026-0002',
        qrData: '{}',
        vehicleId: 'V003',
        vehicleModel: 'Deepal S07',
        vehicleRegNumber: 'BA 2 PA 5678',
        customerName: 'Sita Sharma',
        passType: 'delivery',
        issuedBy: 'U002',
        issuedAt: '2024-12-27T11:00:00Z',
        validUntil: '2024-12-27T15:00:00Z',
        status: 'active',
        exitedAt: '2024-12-27T11:15:00Z'
    }
];
