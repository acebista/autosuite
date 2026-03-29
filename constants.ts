import { Vehicle, Bank } from './types';

// Deepal EV Lineup - Consolidated Vehicle Catalog (8 variants, each with color options)
export const PRODUCT_CATALOG: Vehicle[] = [
    // DEEPAL E07 - Electric SUV Coupe (2 variants)
    {
        id: 'CAT-E07-530', model: 'Deepal E07', variant: 'EV 530', year: 2025, color: 'Quartz White', status: 'In Stock',
        price: 8990000, cost: 7800000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png', vin: '',
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
        ]
    },
    {
        id: 'CAT-E07-620', model: 'Deepal E07', variant: 'EV 620', year: 2025, color: 'Hematite Grey', status: 'In Stock',
        price: 9990000, cost: 8700000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png', vin: '',
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
        ]
    },
    {
        id: 'CAT-S07-500', model: 'Deepal S07', variant: 'EV 500', year: 2025, color: 'Comet White', status: 'In Stock',
        price: 7200000, cost: 6300000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png', vin: '',
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
            { label: 'Dimensions (LxWxH)', value: '4750 x 1930 x 1625 mm' }
        ]
    },
    {
        id: 'CAT-S07-620', model: 'Deepal S07', variant: 'EV 620', year: 2025, color: 'Eclipse Black', status: 'In Stock',
        price: 7900000, cost: 6900000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png', vin: '',
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
            { label: 'Dimensions (LxWxH)', value: '4750 x 1930 x 1625 mm' }
        ]
    },
    {
        id: 'CAT-L07-530', model: 'Deepal L07', variant: 'EV 530', year: 2025, color: 'Stellar Blue', status: 'In Stock',
        price: 7500000, cost: 6500000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/car/6.png', vin: '',
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
            { label: 'Dimensions (LxWxH)', value: '4820 x 1890 x 1480 mm' }
        ]
    },
    {
        id: 'CAT-L07-EREV', model: 'Deepal L07', variant: 'EREV', year: 2025, color: 'Nebula Green', status: 'In Stock',
        price: 8900000, cost: 7700000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'Hybrid',
        image: 'https://changannepal.com/assets/frontend/images/car/5.png', vin: '',
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
            { label: 'Total Range (CLTC)', value: '1200+ km' }
        ]
    },
    {
        id: 'CAT-S05-420', model: 'Deepal S05', variant: 'EV 420', year: 2025, color: 'Moonlight White', status: 'In Stock',
        price: 5500000, cost: 4800000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png', vin: '',
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
            { label: 'Range (CLTC)', value: '420 km' }
        ]
    },
    {
        id: 'CAT-S05-520', model: 'Deepal S05', variant: 'EV 520', year: 2025, color: 'Andromeda Blue', status: 'In Stock',
        price: 5990000, cost: 5200000, branchId: 'B1', daysInStock: 0, agingBucket: '0-30', fuelType: 'EV',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png', vin: '',
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
            { label: 'Range (CLTC)', value: '520 km' }
        ]
    }
];

export const LOCAL_BANKS: Bank[] = [
    { id: 'B1', name: 'Siddhartha Bank Limited', branch: 'Kalyanpur, Saptari', address: 'Kalyanpur, Saptari' },
    { id: 'B2', name: 'Nabil Bank', branch: 'Biratnagar', address: 'Mahendra Chowk, Biratnagar' },
    { id: 'B3', name: 'Global IME Bank', branch: 'Itahari', address: 'Main Road, Itahari' },
    { id: 'B4', name: 'Everest Bank', branch: 'Kathmandu', address: 'Lazimpat, Kathmandu' },
];
