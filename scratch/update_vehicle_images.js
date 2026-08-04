import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Deepal EV Lineup - Consolidated Vehicle Catalog
const PRODUCT_CATALOG = [
    {
        model: 'Deepal E07', variant: 'EV 530',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png',
        availableColors: [
            { color: 'Quartz White', image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png' },
            { color: 'Hematite Grey', image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png' },
            { color: 'Obsidian Black', image: 'https://changannepal.com/assets/frontend/images/car/E07/3.png' }
        ]
    },
    {
        model: 'Deepal E07', variant: 'EV 620',
        image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png',
        availableColors: [
            { color: 'Quartz White', image: 'https://changannepal.com/assets/frontend/images/car/E07/1.png' },
            { color: 'Hematite Grey', image: 'https://changannepal.com/assets/frontend/images/car/E07/2.png' },
            { color: 'Obsidian Black', image: 'https://changannepal.com/assets/frontend/images/car/E07/3.png' }
        ]
    },
    {
        model: 'Deepal S07', variant: 'EV 500',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png',
        availableColors: [
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/1.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png' },
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/4.png' },
            { color: 'Sunset Orange', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/5.png' }
        ]
    },
    {
        model: 'Deepal S07', variant: 'EV 620',
        image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png',
        availableColors: [
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/1.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/2.png' },
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/3.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/4.png' },
            { color: 'Sunset Orange', image: 'https://changannepal.com/assets/frontend/images/car/S07/body/5.png' }
        ]
    },
    {
        model: 'Deepal L07', variant: 'EV 530',
        image: 'https://changannepal.com/assets/frontend/images/car/6.png',
        availableColors: [
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/2.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/3.png' },
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/4.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/5.png' },
            { color: 'Stellar Blue', image: 'https://changannepal.com/assets/frontend/images/car/6.png' }
        ]
    },
    {
        model: 'Deepal L07', variant: 'EREV',
        image: 'https://changannepal.com/assets/frontend/images/car/5.png',
        availableColors: [
            { color: 'Eclipse Black', image: 'https://changannepal.com/assets/frontend/images/car/2.png' },
            { color: 'Comet White', image: 'https://changannepal.com/assets/frontend/images/car/3.png' },
            { color: 'Lunar Gray', image: 'https://changannepal.com/assets/frontend/images/car/4.png' },
            { color: 'Nebula Green', image: 'https://changannepal.com/assets/frontend/images/car/5.png' },
            { color: 'Stellar Blue', image: 'https://changannepal.com/assets/frontend/images/car/6.png' }
        ]
    },
    {
        model: 'Deepal S05', variant: 'EV 420',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ]
    },
    {
        model: 'Deepal S05', variant: 'EV 520',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ]
    },
    {
        model: 'Deepal S05 MAX', variant: 'Orange Interior',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ]
    },
    {
        model: 'Deepal S05 MAX', variant: 'Black Interior',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ]
    },
    {
        model: 'Deepal S05 Plus', variant: 'Black Interior',
        image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png',
        availableColors: [
            { color: 'Mercury Silver', image: 'https://changannepal.com/assets/frontend/images/s05/color/1.png' },
            { color: 'Deep Space Black', image: 'https://changannepal.com/assets/frontend/images/s05/color/2.png' },
            { color: 'Andromeda Blue', image: 'https://changannepal.com/assets/frontend/images/s05/color/3.png' },
            { color: 'Ganymede Grey', image: 'https://changannepal.com/assets/frontend/images/s05/color/4.png' },
            { color: 'Moonlight White', image: 'https://changannepal.com/assets/frontend/images/s05/color/5.png' }
        ]
    }
];

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: vehicles, error } = await supabase.from('vehicles').select('*');
  if (error) {
    console.error('Error fetching vehicles:', error);
    return;
  }

  console.log(`Checking ${vehicles.length} vehicles...`);

  for (const v of vehicles) {
    // Find matching catalog item
    const catalogItem = PRODUCT_CATALOG.find(c => 
      c.model.toLowerCase().trim() === v.model.toLowerCase().trim() && 
      c.variant.toLowerCase().trim() === v.variant.toLowerCase().trim()
    );

    if (catalogItem) {
      const colorMatch = catalogItem.availableColors.find(col => 
        col.color.toLowerCase().trim() === v.color.toLowerCase().trim()
      );
      const matchedImageUrl = colorMatch ? colorMatch.image : catalogItem.image;

      if (v.image_url !== matchedImageUrl) {
        console.log(`Updating ${v.model} (${v.variant}) - Color: ${v.color} to image: ${matchedImageUrl}`);
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ image_url: matchedImageUrl })
          .eq('id', v.id);
        
        if (updateError) {
          console.error(`Error updating vehicle ${v.id}:`, updateError);
        } else {
          console.log(`Successfully updated vehicle ${v.id}`);
        }
      } else {
        console.log(`Vehicle ${v.model} (${v.variant}) already has correct image: ${v.image_url}`);
      }
    } else {
      console.log(`No catalog match found for model: "${v.model}", variant: "${v.variant}"`);
    }
  }
}

run();
