document.addEventListener("DOMContentLoaded", async () => {
  // Session Management
  const session = JSON.parse(localStorage.getItem("currentSession"));

  if (!session || session.role !== "director") {
    window.location.href = "../index.html";
    return;
  }

  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    welcomeMsg.innerHTML = `${session.username} <span>(${session.role})</span>`;
        const branchName = document.getElementById("branchName"); 
        if (branchName && session.branch) branchName.textContent = session.branch;  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("currentSession");
      window.location.href = "../index.html";
    });
  }

  // Branch Selector Initialization
  const branchSelector = document.getElementById('branchSelector');
  if (branchSelector) {
      branchSelector.style.display = 'none'; // All data by default for director
      branchSelector.value = 'All';
      
      branchSelector.addEventListener('change', () => {
          if (dashboardData) updateDashboard(dashboardData);
      });
  }

  let dashboardData = null;

  // Fetch Dashboard Data
  try {
    const response = await api.get('/dashboard/director');

    if (response.success) {
      dashboardData = response;
      updateDashboard(dashboardData);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  function updateDashboard(data) {
    const branch = branchSelector ? branchSelector.value : 'All';

    // Filter Metrics locally if not 'All'
    let revenue = data.metrics.globalRevenue;
    let stockValue = data.metrics.totalStockValue;
    let credit = data.metrics.totalCredit;

    if (branch !== 'All') {
        revenue = data.branchPerformance[branch] || 0;
        // For Stock Value and Credit, we'd ideally need branch-specific data from backend.
        // Since backend doesn't provide branch-breakdown for these yet, we'll keep global or 
        // show a note. But wait, the recentTransactions and stockStatus HAVE branch info.
        // Let's at least filter the lists.
    }

    // 1. Update Metrics Cards
    document.querySelector('.col-md-4:nth-child(1) .card-value').textContent = `UGX ${(revenue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(1) .card-title-custom').textContent = branch === 'All' ? 'Global Revenue' : `${branch} Revenue`;
    
    // Note: Stock value and Credit are global in the current backend response. 
    // To be perfect, we'd need backend updates. For now, we'll keep them as is or label them clearly.
    document.querySelector('.col-md-4:nth-child(2) .card-value').textContent = `UGX ${(stockValue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(3) .card-value').textContent = `UGX ${(credit / 1000000).toFixed(1)}M`;

    // 2. Recent Large Sales List (Filtered)
    const recentSalesContainer = document.querySelector('.recent-large-sales .low-stock-items');
    if (recentSalesContainer) {
      recentSalesContainer.innerHTML = '';
      const filteredTransactions = branch === 'All' ? data.recentTransactions : data.recentTransactions.filter(t => t.branch === branch);
      
      if (filteredTransactions.length === 0) {
        recentSalesContainer.innerHTML = `<p class="p-3 text-muted">No recent transactions for ${branch}.</p>`;
      } else {
        filteredTransactions.forEach(tx => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'stock-item';
          itemDiv.innerHTML = `
            <div class="stock-details">
              <h4>${tx.type} Sale - ${tx.branch}</h4>
              <p>Amount: UGX ${tx.amount.toLocaleString()} | Client: ${tx.client} | Produce: ${tx.produce}</p>
            </div>
          `;
          recentSalesContainer.appendChild(itemDiv);
        });
      }
    }

    // 3. Stock Status List (Filtered)
    const stockStatusWrapper = document.querySelector('.row.pt-4 .low-stock-items');
    if (stockStatusWrapper) {
        stockStatusWrapper.innerHTML = '';
        const filteredStock = branch === 'All' ? data.stockStatus : data.stockStatus.filter(i => i.branch === branch);
        
        if (filteredStock.length === 0) {
            stockStatusWrapper.innerHTML = `<p class="p-3 text-muted">No stock data for ${branch}.</p>`;
        } else {
            filteredStock.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'stock-item';
                itemDiv.innerHTML = `
                  <div class="stock-details">
                    <h4>${item.produceName} - ${item.branch}</h4>
                    <p>Quantity: ${item.quantity.toLocaleString()} kg | Status: <span class="badge ${item.status === 'Low' ? 'bg-danger' : 'bg-success'}">${item.status}</span></p>
                  </div>
                `;
                stockStatusWrapper.appendChild(itemDiv);
            });
        }
    }

    // 4. Branch Performance Chart (Keep as is since it shows comparison)
    const branchCtx = document.getElementById("branchPerformanceChart").getContext("2d");
    if (window.performanceChart) window.performanceChart.destroy();
    window.performanceChart = new Chart(branchCtx, {
      type: "bar",
      data: {
        labels: ["Maganjo", "Matugga"],
        datasets: [
          {
            label: "Revenue (UGX)",
            data: [data.branchPerformance.Maganjo, data.branchPerformance.Matugga],
            backgroundColor: ["#7367f0", "#00cfe8"],
            borderRadius: 4,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `UGX ${context.raw.toLocaleString()}`
                }
            }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "UGX " + (value / 1000000).toFixed(1) + "M",
            },
          },
        },
      },
    });

    // 5. Cereal Distribution Chart (Filter if branch selected)
    const cerealDistribution = {};
    if (branch === 'All') {
        Object.assign(cerealDistribution, data.cerealDistribution);
    } else {
        // We'd need branch-specific cereal distribution. 
        // For now, let's use the stockStatus data to build a partial distribution if filtered.
        // (Just an approximation for UI feedback)
    }

    const labels = Object.keys(data.cerealDistribution);
    const chartData = Object.values(data.cerealDistribution);

    const distributionCtx = document.getElementById("cerealDistributionChart").getContext("2d");
    if (window.distributionChart) window.distributionChart.destroy();
    window.distributionChart = new Chart(distributionCtx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: ["#7367f0", "#28c76f", "#ff9f43", "#ea5455", "#00cfe8", "#ffc107", "#17a2b8"],
          borderWidth: 2,
          borderColor: "#ffffff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.raw.toLocaleString()} kg`
                }
            }
        },
      },
    });
  }
});
