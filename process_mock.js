const fs = require('fs');
const mockDataPath = '/Users/babi/Downloads/autosuite-ai (1)/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf8');

const newMockVehicles = `export const MOCK_VEHICLES: Vehicle[] = [
    // ============================================
    // DEEPAL E07 - Electric SUV Coupe
    // Colors: Hematite Grey, Quartz White, Obsidian Black
    // ============================================
    {
        id: 'V001',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-001',
        lcNo: 'LC-E07-001',
        motorNo: 'MOT-E07-1001',
        registrationNo: 'BA-02-PA-9901'
    },
    {
        id: 'V002',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-002',
        lcNo: 'LC-E07-002',
        motorNo: 'MOT-E07-1002',
        registrationNo: 'BA-02-PA-9902'
    },
    {
        id: 'V003',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-003',
        lcNo: 'LC-S07-003',
        motorNo: 'MOT-S07-2003',
        registrationNo: ''
    },
    {
        id: 'V004',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-004',
        lcNo: 'LC-S07-004',
        motorNo: 'MOT-S07-2004',
        registrationNo: ''
    },
    {
        id: 'V005',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-005',
        lcNo: 'LC-L07-005',
        motorNo: 'MOT-L07-3005',
        registrationNo: 'BA-02-PA-8855'
    },
    {
        id: 'V006',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-006',
        lcNo: 'LC-L07-006',
        motorNo: 'MOT-L07-3006',
        registrationNo: ''
    },
    {
        id: 'V007',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-007',
        lcNo: 'LC-S05-007',
        motorNo: 'MOT-S05-4007',
        registrationNo: ''
    },
    {
        id: 'V008',
        orgId: '30938fab-84fc-44d2-b522-c96d827c64b3',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-008',
        lcNo: 'LC-S05-008',
        motorNo: 'MOT-S05-4008',
        registrationNo: ''
    },
    // ============================================
    // MOCK DATA FOR SARVA MOTORS (3eb655a1-872f-4bff-8067-8fc62ef50b89)
    // ============================================
    {
        id: 'V001-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal E07',
        variant: 'EV 530',
        year: 2025,
        color: 'Quartz White',
        vin: 'LSDC3A2G1PA000001-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-001',
        lcNo: 'LC-E07-001-S',
        motorNo: 'MOT-E07-1001-S',
        registrationNo: ''
    },
    {
        id: 'V002-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal E07',
        variant: 'EV 620',
        year: 2025,
        color: 'Hematite Grey',
        vin: 'LSDC3A2G1PA000002-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-002',
        lcNo: 'LC-E07-002-S',
        motorNo: 'MOT-E07-1002-S',
        registrationNo: ''
    },
    {
        id: 'V003-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal S07',
        variant: 'EV 500',
        year: 2025,
        color: 'Comet White',
        vin: 'LSDC3A2G1PA000003-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-003',
        lcNo: 'LC-S07-003-S',
        motorNo: 'MOT-S07-2003-S',
        registrationNo: ''
    },
    {
        id: 'V004-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal S07',
        variant: 'EV 620',
        year: 2025,
        color: 'Eclipse Black',
        vin: 'LSDC3A2G1PA000004-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-004',
        lcNo: 'LC-S07-004-S',
        motorNo: 'MOT-S07-2004-S',
        registrationNo: ''
    },
    {
        id: 'V005-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal L07',
        variant: 'EV 530',
        year: 2025,
        color: 'Stellar Blue',
        vin: 'LSDC3A2G1PA000005-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-005',
        lcNo: 'LC-L07-005-S',
        motorNo: 'MOT-L07-3005-S',
        registrationNo: ''
    },
    {
        id: 'V006-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal L07',
        variant: 'EREV (Extended Range)',
        year: 2025,
        color: 'Nebula Green',
        vin: 'LSDC3A2G1PA000006-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-006',
        lcNo: 'LC-L07-006-S',
        motorNo: 'MOT-L07-3006-S',
        registrationNo: ''
    },
    {
        id: 'V007-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal S05',
        variant: 'EV 420',
        year: 2025,
        color: 'Moonlight White',
        vin: 'LSDC3A2G1PA000007-S',
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
        agingBucket: '0-30',
        proformaInvoiceNo: 'PI-2025-007',
        lcNo: 'LC-S05-007-S',
        motorNo: 'MOT-S05-4007-S',
        registrationNo: ''
    },
    {
        id: 'V008-S',
        orgId: '3eb655a1-872f-4bff-8067-8fc62ef50b89',
        model: 'Deepal S05',
        variant: 'EV 520',
        year: 2025,
        color: 'Andromeda Blue',
        vin: 'LSDC3A2G1PA000008-S',
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
        agingBucket: '0-30',.trim();
const endIdx = content.indexOf('export const MOCK_SERVICE_JOBS');
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newMockVehicles + '\n\n' + content.substring(endIdx);
  fs.writeFileSync(mockDataPath, content, 'utf8');
  console.log('Successfully updated mockData.ts');
} else {
  console.error('Could not find mock vehicles block in mockData.ts');
}
