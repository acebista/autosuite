-- Seed Catalog Models for Apollo Motors and Sarva Motors

-- Delete any existing catalog items first to prevent duplication
DELETE FROM vehicles WHERE vin LIKE 'CAT-%';

-- Insert Catalog Models for Apollo Motors (30938fab-84fc-44d2-b522-c96d827c64b3)
INSERT INTO vehicles (model, variant, year, color, vin, price, cost, status, fuel_type, image_url, specifications, available_colors, org_id) VALUES
('Deepal E07', 'EV 530', 2025, 'Quartz White', 'CAT-30938fab-E07-530', 8990000, 7800000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/E07/1.png', 
 '[{"label": "Motor Peak Power", "value": "190 kW (255 HP)"}, {"label": "Battery Capacity", "value": "71.8 kWh"}, {"label": "Range (CLTC)", "value": "530 km"}, {"label": "0-100 km/h", "value": "3.96 seconds"}, {"label": "Ground Clearance", "value": "195 mm"}, {"label": "Dimensions (LxWxH)", "value": "4880 x 1995 x 1580 mm"}]'::jsonb,
 '[{"color": "Quartz White", "image": "https://changannepal.com/assets/frontend/images/car/E07/1.png"}, {"color": "Hematite Grey", "image": "https://changannepal.com/assets/frontend/images/car/E07/2.png"}, {"color": "Obsidian Black", "image": "https://changannepal.com/assets/frontend/images/car/E07/3.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal E07', 'EV 620', 2025, 'Hematite Grey', 'CAT-30938fab-E07-620', 9990000, 8700000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/E07/2.png', 
 '[{"label": "Motor Peak Power", "value": "190 kW (255 HP)"}, {"label": "Battery Capacity", "value": "80.5 kWh"}, {"label": "Range (CLTC)", "value": "620 km"}, {"label": "0-100 km/h", "value": "3.96 seconds"}, {"label": "Ground Clearance", "value": "195 mm"}, {"label": "Dimensions (LxWxH)", "value": "4880 x 1995 x 1580 mm"}]'::jsonb,
 '[{"color": "Quartz White", "image": "https://changannepal.com/assets/frontend/images/car/E07/1.png"}, {"color": "Hematite Grey", "image": "https://changannepal.com/assets/frontend/images/car/E07/2.png"}, {"color": "Obsidian Black", "image": "https://changannepal.com/assets/frontend/images/car/E07/3.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal S07', 'EV 500', 2025, 'Comet White', 'CAT-30938fab-S07-500', 7200000, 6300000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "520 km"}, {"label": "Ground Clearance", "value": "190 mm"}, {"label": "Dimensions (LxWxH)", "value": "4750 x 1930 x 1625 mm"}]'::jsonb,
 '[{"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/1.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/2.png"}, {"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/3.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/4.png"}, {"color": "Sunset Orange", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/5.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal S07', 'EV 620', 2025, 'Eclipse Black', 'CAT-30938fab-S07-620', 7900000, 6900000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png', 
 '[{"label": "Motor Peak Power", "value": "175 kW (235 HP)"}, {"label": "Battery Capacity", "value": "79.97 kWh"}, {"label": "Range (CLTC)", "value": "620 km"}, {"label": "Ground Clearance", "value": "190 mm"}, {"label": "Dimensions (LxWxH)", "value": "4750 x 1930 x 1625 mm"}]'::jsonb,
 '[{"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/1.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/2.png"}, {"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/3.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/4.png"}, {"color": "Sunset Orange", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/5.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal L07', 'EV 530', 2025, 'Stellar Blue', 'CAT-30938fab-L07-530', 7500000, 6500000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/6.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "530 km"}, {"label": "Ground Clearance", "value": "125 mm"}, {"label": "Dimensions (LxWxH)", "value": "4820 x 1890 x 1480 mm"}]'::jsonb,
 '[{"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/2.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/3.png"}, {"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/4.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/5.png"}, {"color": "Stellar Blue", "image": "https://changannepal.com/assets/frontend/images/car/6.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal L07', 'EREV', 2025, 'Nebula Green', 'CAT-30938fab-L07-EREV', 8900000, 7700000, 'In Stock', 'Hybrid', 'https://changannepal.com/assets/frontend/images/car/5.png', 
 '[{"label": "Motor Peak Power", "value": "175 kW (235 HP)"}, {"label": "Battery Capacity", "value": "31.6 kWh"}, {"label": "Total Range (CLTC)", "value": "1200+ km"}]'::jsonb,
 '[{"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/2.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/3.png"}, {"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/4.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/5.png"}, {"color": "Stellar Blue", "image": "https://changannepal.com/assets/frontend/images/car/6.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal S05', 'EV 420', 2025, 'Moonlight White', 'CAT-30938fab-S05-420', 5500000, 4800000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/s05/color/5.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "52.3 kWh"}, {"label": "Range (CLTC)", "value": "420 km"}]'::jsonb,
 '[{"color": "Mercury Silver", "image": "https://changannepal.com/assets/frontend/images/s05/color/1.png"}, {"color": "Deep Space Black", "image": "https://changannepal.com/assets/frontend/images/s05/color/2.png"}, {"color": "Andromeda Blue", "image": "https://changannepal.com/assets/frontend/images/s05/color/3.png"}, {"color": "Ganymede Grey", "image": "https://changannepal.com/assets/frontend/images/s05/color/4.png"}, {"color": "Moonlight White", "image": "https://changannepal.com/assets/frontend/images/s05/color/5.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3'),

('Deepal S05', 'EV 520', 2025, 'Andromeda Blue', 'CAT-30938fab-S05-520', 5990000, 5200000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/s05/color/3.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "520 km"}]'::jsonb,
 '[{"color": "Mercury Silver", "image": "https://changannepal.com/assets/frontend/images/s05/color/1.png"}, {"color": "Deep Space Black", "image": "https://changannepal.com/assets/frontend/images/s05/color/2.png"}, {"color": "Andromeda Blue", "image": "https://changannepal.com/assets/frontend/images/s05/color/3.png"}, {"color": "Ganymede Grey", "image": "https://changannepal.com/assets/frontend/images/s05/color/4.png"}, {"color": "Moonlight White", "image": "https://changannepal.com/assets/frontend/images/s05/color/5.png"}]'::jsonb,
 '30938fab-84fc-44d2-b522-c96d827c64b3');

-- Insert Catalog Models for Sarva Motors (3eb655a1-872f-4bff-8067-8fc62ef50b89)
INSERT INTO vehicles (model, variant, year, color, vin, price, cost, status, fuel_type, image_url, specifications, available_colors, org_id) VALUES
('Deepal E07', 'EV 530', 2025, 'Quartz White', 'CAT-3eb655a1-E07-530', 8990000, 7800000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/E07/1.png', 
 '[{"label": "Motor Peak Power", "value": "190 kW (255 HP)"}, {"label": "Battery Capacity", "value": "71.8 kWh"}, {"label": "Range (CLTC)", "value": "530 km"}, {"label": "0-100 km/h", "value": "3.96 seconds"}, {"label": "Ground Clearance", "value": "195 mm"}, {"label": "Dimensions (LxWxH)", "value": "4880 x 1995 x 1580 mm"}]'::jsonb,
 '[{"color": "Quartz White", "image": "https://changannepal.com/assets/frontend/images/car/E07/1.png"}, {"color": "Hematite Grey", "image": "https://changannepal.com/assets/frontend/images/car/E07/2.png"}, {"color": "Obsidian Black", "image": "https://changannepal.com/assets/frontend/images/car/E07/3.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal E07', 'EV 620', 2025, 'Hematite Grey', 'CAT-3eb655a1-E07-620', 9990000, 8700000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/E07/2.png', 
 '[{"label": "Motor Peak Power", "value": "190 kW (255 HP)"}, {"label": "Battery Capacity", "value": "80.5 kWh"}, {"label": "Range (CLTC)", "value": "620 km"}, {"label": "0-100 km/h", "value": "3.96 seconds"}, {"label": "Ground Clearance", "value": "195 mm"}, {"label": "Dimensions (LxWxH)", "value": "4880 x 1995 x 1580 mm"}]'::jsonb,
 '[{"color": "Quartz White", "image": "https://changannepal.com/assets/frontend/images/car/E07/1.png"}, {"color": "Hematite Grey", "image": "https://changannepal.com/assets/frontend/images/car/E07/2.png"}, {"color": "Obsidian Black", "image": "https://changannepal.com/assets/frontend/images/car/E07/3.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal S07', 'EV 500', 2025, 'Comet White', 'CAT-3eb655a1-S07-500', 7200000, 6300000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "520 km"}, {"label": "Ground Clearance", "value": "190 mm"}, {"label": "Dimensions (LxWxH)", "value": "4750 x 1930 x 1625 mm"}]'::jsonb,
 '[{"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/1.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/2.png"}, {"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/3.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/4.png"}, {"color": "Sunset Orange", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/5.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal S07', 'EV 620', 2025, 'Eclipse Black', 'CAT-3eb655a1-S07-620', 7900000, 6900000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png', 
 '[{"label": "Motor Peak Power", "value": "175 kW (235 HP)"}, {"label": "Battery Capacity", "value": "79.97 kWh"}, {"label": "Range (CLTC)", "value": "620 km"}, {"label": "Ground Clearance", "value": "190 mm"}, {"label": "Dimensions (LxWxH)", "value": "4750 x 1930 x 1625 mm"}]'::jsonb,
 '[{"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/1.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/2.png"}, {"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/3.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/4.png"}, {"color": "Sunset Orange", "image": "https://changannepal.com/assets/frontend/images/car/S07/body/5.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal L07', 'EV 530', 2025, 'Stellar Blue', 'CAT-3eb655a1-L07-530', 7500000, 6500000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/car/6.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "530 km"}, {"label": "Ground Clearance", "value": "125 mm"}, {"label": "Dimensions (LxWxH)", "value": "4820 x 1890 x 1480 mm"}]'::jsonb,
 '[{"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/2.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/3.png"}, {"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/4.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/5.png"}, {"color": "Stellar Blue", "image": "https://changannepal.com/assets/frontend/images/car/6.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal L07', 'EREV', 2025, 'Nebula Green', 'CAT-3eb655a1-L07-EREV', 8900000, 7700000, 'In Stock', 'Hybrid', 'https://changannepal.com/assets/frontend/images/car/5.png', 
 '[{"label": "Motor Peak Power", "value": "175 kW (235 HP)"}, {"label": "Battery Capacity", "value": "31.6 kWh"}, {"label": "Total Range (CLTC)", "value": "1200+ km"}]'::jsonb,
 '[{"color": "Eclipse Black", "image": "https://changannepal.com/assets/frontend/images/car/2.png"}, {"color": "Comet White", "image": "https://changannepal.com/assets/frontend/images/car/3.png"}, {"color": "Lunar Gray", "image": "https://changannepal.com/assets/frontend/images/car/4.png"}, {"color": "Nebula Green", "image": "https://changannepal.com/assets/frontend/images/car/5.png"}, {"color": "Stellar Blue", "image": "https://changannepal.com/assets/frontend/images/car/6.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal S05', 'EV 420', 2025, 'Moonlight White', 'CAT-3eb655a1-S05-420', 5500000, 4800000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/s05/color/5.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "52.3 kWh"}, {"label": "Range (CLTC)", "value": "420 km"}]'::jsonb,
 '[{"color": "Mercury Silver", "image": "https://changannepal.com/assets/frontend/images/s05/color/1.png"}, {"color": "Deep Space Black", "image": "https://changannepal.com/assets/frontend/images/s05/color/2.png"}, {"color": "Andromeda Blue", "image": "https://changannepal.com/assets/frontend/images/s05/color/3.png"}, {"color": "Ganymede Grey", "image": "https://changannepal.com/assets/frontend/images/s05/color/4.png"}, {"color": "Moonlight White", "image": "https://changannepal.com/assets/frontend/images/s05/color/5.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89'),

('Deepal S05', 'EV 520', 2025, 'Andromeda Blue', 'CAT-3eb655a1-S05-520', 5990000, 5200000, 'In Stock', 'EV', 'https://changannepal.com/assets/frontend/images/s05/color/3.png', 
 '[{"label": "Motor Peak Power", "value": "160 kW (215 HP)"}, {"label": "Battery Capacity", "value": "66.8 kWh"}, {"label": "Range (CLTC)", "value": "520 km"}]'::jsonb,
 '[{"color": "Mercury Silver", "image": "https://changannepal.com/assets/frontend/images/s05/color/1.png"}, {"color": "Deep Space Black", "image": "https://changannepal.com/assets/frontend/images/s05/color/2.png"}, {"color": "Andromeda Blue", "image": "https://changannepal.com/assets/frontend/images/s05/color/3.png"}, {"color": "Ganymede Grey", "image": "https://changannepal.com/assets/frontend/images/s05/color/4.png"}, {"color": "Moonlight White", "image": "https://changannepal.com/assets/frontend/images/s05/color/5.png"}]'::jsonb,
 '3eb655a1-872f-4bff-8067-8fc62ef50b89');
