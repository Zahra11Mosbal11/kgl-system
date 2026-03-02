
// Sales Reports Management Logic
document.addEventListener("DOMContentLoaded", () => {
  // Auth Check
  const session = JSON.parse(localStorage.getItem("currentSession"));
  
  if (!session || !session.username) {
    window.location.href = "index.html";
    return;
  }

  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    welcomeMsg.innerHTML = `${session.username} <span>(${session.role})</span>`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("currentSession");
      window.location.href = "index.html";
    });
  }

  // --- Filter Component Initialization ---
  const reportType = document.getElementById('reportType');
  const dateRangeGroup = document.getElementById('dateRangeGroup');
  const branchFilterEl = document.getElementById('branchFilter');
  const productFilterEl = document.getElementById('productFilter');
  const startDateEl = document.getElementById('startDate');
  const endDateEl = document.getElementById('endDate');

  // Toggle Date Range Visibility
  if (reportType) {
    reportType.addEventListener('change', () => {
      if (reportType.value === 'custom') {
        dateRangeGroup.style.display = 'block';
      } else {
        dateRangeGroup.style.display = 'none';
        generateReport();
      }
    });
  }

  // Add event listeners to all filter elements
  [branchFilterEl, productFilterEl, startDateEl, endDateEl].forEach(el => {
    if (el) el.addEventListener('change', generateReport);
  });

  const customGenerateBtn = document.querySelector('#dateRangeGroup .gold-btn');
  if (customGenerateBtn) {
    customGenerateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateReport();
    });
  }

  // Initial load from backend
  if (session.role === 'sales_agent' && session.branch) {
    if (branchFilterEl) {
      branchFilterEl.value = session.branch;
      // Hide the entire filter group (label + select)
      const group = branchFilterEl.closest('.filter-group');
      if (group) group.style.display = 'none';
      
      // Update label just in case it's ever shown
      const label = document.getElementById('branchLabel');
      if (label) label.textContent = `Branch (Fixed: ${session.branch})`;
    }
  }

  fetchAndGenerate();
});

let allSalesData = [];

async function fetchAndGenerate() {
  console.log("Fetching sales data...");
  try {
    const data = await api.get("/sales");
    console.log("API Response:", data);
    if (data.success) {
      const cashSales = (data.cashSales || []).map(s => ({ ...s, type: 'cash' }));
      const creditSales = (data.creditSales || []).map(s => ({ ...s, type: 'credit' }));
      allSalesData = [...cashSales, ...creditSales];
      console.log(`Loaded ${allSalesData.length} records`);
      generateReport();
    } else {
      console.error("Failed to fetch sales data:", data.error);
      // Even if it fails, call generateReport to clear the "Calculating..." text
      generateReport();
    }
  } catch (err) {
    console.error("Error fetching sales data:", err);
    // Even if it fails, call generateReport to clear the "Calculating..." text
    generateReport();
  }
}

function generateReport() {
  console.log("Generating report...");
  const reportTableBody = document.getElementById('reportTableBody');
  if (!reportTableBody) return;

  const type = document.getElementById('reportType').value;
  const branch = document.getElementById('branchFilter').value;
  const product = document.getElementById('productFilter').value;
  
  console.log(`Filters: type=${type}, branch=${branch}, product=${product}`);

  const today = new Date();
  let startDate, endDate;

  // Date Filtering Logic
  if (type === 'custom') {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }
  } else {
    endDate = new Date();
    startDate = new Date();
    
    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (type === 'weekly') {
      startDate.setDate(today.getDate() - 7);
    } else if (type === 'monthly') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (type === 'yearly') {
      startDate.setFullYear(today.getFullYear() - 1);
    }
  }

  // Apply Filters to allSalesData
  const filteredData = (allSalesData || []).filter(item => {
    const itemDate = new Date(item.date);
    const dateMatch = (!startDate || !endDate) ? true : (itemDate >= startDate && itemDate <= endDate);
    
    // Branch filter: 'all', or matching branch name
    const branchMatch = (branch === 'all') || (item.branch && item.branch.toLowerCase() === branch.toLowerCase());
    
    // Product filter: 'all', or matching produceName
    const productMatch = (product === 'all') || (item.produceName && item.produceName.toLowerCase() === product.toLowerCase());
    
    return dateMatch && branchMatch && productMatch;
  });

  console.log(`Filtered data count: ${filteredData.length}`);

  // Calculate Stats
  let totalRevenue = 0;
  let cashRevenue = 0;
  let creditRevenue = 0;
  
  const productStats = {};

  filteredData.forEach(item => {
    const revenue = item.type === 'cash' ? (item.amountPaid || 0) : (item.amountDue || 0);
    totalRevenue += revenue;

    if (item.type === 'cash') {
      cashRevenue += revenue;
    } else {
      creditRevenue += revenue;
    }

    const prodKey = item.produceName || 'Unknown';
    if (!productStats[prodKey]) {
      productStats[prodKey] = { quantity: 0, revenue: 0 };
    }
    productStats[prodKey].quantity += (item.tonnage || 0);
    productStats[prodKey].revenue += revenue;
  });

  // Update UI Stats
  const totalEl = document.getElementById('totalSales');
  const cashEl = document.getElementById('cashSales');
  const creditEl = document.getElementById('creditSales');
  
  if (totalEl) totalEl.textContent = `${totalRevenue.toLocaleString()} UGX`;
  if (cashEl) cashEl.textContent = `${cashRevenue.toLocaleString()} UGX`;
  if (creditEl) creditEl.textContent = `${creditRevenue.toLocaleString()} UGX`;

  // Update Labels
  const label = type === 'custom' ? 'Custom Range' : 
               (type === 'daily' ? 'Today' : 
               (type === 'weekly' ? 'Last 7 Days' : 
               (type === 'monthly' ? 'Last 30 Days' : 'Last Year')));
  
  const periods = ['quantityPeriod', 'cashPeriod', 'creditPeriod'];
  periods.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });

  // Update Table
  reportTableBody.innerHTML = '';
  if (Object.keys(productStats).length === 0) {
    reportTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No records found for selected filters</td></tr>';
  } else {
    for (const [prodName, stats] of Object.entries(productStats)) {
      const row = `
        <tr>
          <td style="text-transform: capitalize;">${prodName}</td>
          <td>${stats.quantity.toLocaleString()} T</td>
          <td>UGX ${stats.revenue.toLocaleString()}</td>
        </tr>
      `;
      reportTableBody.innerHTML += row;
    }
  }
}
