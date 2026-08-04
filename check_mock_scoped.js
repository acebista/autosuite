import fs from 'fs';

// Read mockData.ts
const mockDataContent = fs.readFileSync('mockData.ts', 'utf8');
const lines = mockDataContent.split('\n');

let inVehicles = false;
let vehiclesBlock = [];
for (let line of lines) {
  if (line.includes('export const MOCK_VEHICLES')) {
    inVehicles = true;
  }
  if (inVehicles) {
    vehiclesBlock.push(line);
    if (line.trim() === '];') {
      inVehicles = false;
    }
  }
}

const vehiclesText = vehiclesBlock.join('\n');
console.log('Vehicles block length:', vehiclesText.length);

// Let's find each vehicle object in vehiclesText
// A simple way to do this is splitting by "},"
const vehiclesRaw = vehiclesText.split('},');
console.log('Total mock vehicles count:', vehiclesRaw.length);

const apolloS05 = [];
const sarvaS05 = [];
const otherS05 = [];

vehiclesRaw.forEach((vText, idx) => {
  if (vText.includes("model: 'Deepal S05'")) {
    const vin = vText.match(/vin:\s*'([^']+)'/)?.[1];
    const orgId = vText.match(/orgId:\s*'([^']+)'/)?.[1];
    const status = vText.match(/status:\s*'([^']+)'/)?.[1];
    const id = vText.match(/id:\s*'([^']+)'/)?.[1];
    const days = vText.match(/daysInStock:\s*(\d+)/)?.[1];
    const item = { id, vin, orgId, status, days };
    
    if (orgId === '30938fab-84fc-44d2-b522-c96d827c64b3') {
      apolloS05.push(item);
    } else if (orgId === '3eb655a1-872f-4bff-8067-8fc62ef50b89') {
      sarvaS05.push(item);
    } else {
      otherS05.push(item);
    }
  }
});

console.log('--- Apollo Motors S05 ---');
console.log(apolloS05);

console.log('--- Sarva Motors S05 ---');
console.log(sarvaS05);

console.log('--- Other Org S05 ---');
console.log(otherS05);
