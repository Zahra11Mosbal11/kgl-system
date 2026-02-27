const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:3000';
const SECRET = process.env.JWT_SECRET || "OHdE49SfW/2no4qTD1Z+4bydZOk+G151Q3idv7u54XU=";

// Mock user tokens
const managerToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'manager', branch: 'Maganjo' }, SECRET);
const salesToken = jwt.sign({ id: '507f1f77bcf86cd799439012', role: 'sales_agent', branch: 'Maganjo' }, SECRET);

const headers = (token) => ({ 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` 
});

async function runTests() {
  console.log('--- Inventory System Verification ---');

  try {
    // 1. Record a Purchase (Increments stock)
    console.log('\nSTEP 1: Recording Purchase (1000 units of Maize)...');
    const purchaseRes = await fetch(`${API_URL}/procurement`, {
      method: 'POST',
      headers: headers(managerToken),
      body: JSON.stringify({
        produceName: 'Maize',
        produceType: 'Cereal',
        tonnage: 1000,
        cost: 15000,
        dealerName: 'Test Dealer',
        branch: 'Maganjo',
        contact: '0700000000',
        sellingPrice: 20000,
        date: new Date(),
        time: '12:00'
      })
    });
    const purchaseData = await purchaseRes.json();
    console.log('Purchase Response:', purchaseData.message || purchaseData.error);

    // 2. Check Inventory
    console.log('\nSTEP 2: Checking Inventory...');
    const invRes = await fetch(`${API_URL}/inventory`, { headers: headers(managerToken) });
    const invData = await invRes.json();
    const maize = invData.inventory.find(i => i.produceName === 'Maize');
    console.log(`Current Stock for Maize in Maganjo: ${maize ? maize.quantity : 0}`);

    // 3. Record a Sale (Decrements stock)
    console.log('\nSTEP 3: Recording Cash Sale (400 units)...');
    const saleRes = await fetch(`${API_URL}/sales/cash`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        produceName: 'Maize',
        tonnage: 400,
        amountPaid: 20000,
        buyerName: 'Test Buyer',
        salesAgentName: 'Test Agent'
      })
    });
    const saleData = await saleRes.json();
    console.log('Sale Response:', saleData.message || saleData.error);

    // 4. Verify Stock after sale
    console.log('\nSTEP 4: Verifying Stock decrease...');
    const invRes2 = await fetch(`${API_URL}/inventory`, { headers: headers(managerToken) });
    const invData2 = await invRes2.json();
    const maize2 = invData2.inventory.find(i => i.produceName === 'Maize');
    console.log(`New Stock for Maize in Maganjo: ${maize2 ? maize2.quantity : 0}`);

    // 5. Test Insufficient Stock
    console.log('\nSTEP 5: Testing Insufficient Stock (Attempting to sell 1000 units)...');
    const failRes = await fetch(`${API_URL}/sales/cash`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        produceName: 'Maize',
        tonnage: 1000,
        amountPaid: 50000,
        buyerName: 'Test Buyer',
        salesAgentName: 'Test Agent'
      })
    });
    const failData = await failRes.json();
    console.log('Expected Error received:', failData.error);

    // 6. Test Valuation
    console.log('\nSTEP 6: Testing Stock Valuation...');
    const valRes = await fetch(`${API_URL}/inventory/valuation`, { headers: headers(managerToken) });
    const valData = await valRes.json();
    console.log('Valuation Result:', JSON.stringify(valData.totalValuation, null, 2));

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

runTests();
