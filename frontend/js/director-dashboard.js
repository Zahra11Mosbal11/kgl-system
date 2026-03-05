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

  // Fetch Dashboard Data
  try {
    const response = await api.get('/dashboard/director');

    if (response.success) {
      updateDashboard(response);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  function updateDashboard(data) {
    // 1. Update Metrics Cards
    document.querySelector('.col-md-4:nth-child(1) .card-value').textContent = `UGX ${(data.metrics.globalRevenue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(2) .card-value').textContent = `UGX ${(data.metrics.totalStockValue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(3) .card-value').textContent = `UGX ${(data.metrics.totalCredit / 1000000).toFixed(1)}M`;

    // 2. Recent Large Sales List
    const recentSalesContainer = document.querySelector('.recent-large-sales .low-stock-items');
    if (recentSalesContainer) {
      recentSalesContainer.innerHTML = '';
      if (data.recentTransactions.length === 0) {
        recentSalesContainer.innerHTML = '<p class="p-3 text-muted">No recent transactions.</p>';
      } else {
        data.recentTransactions.forEach(tx => {
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

    // 3. Stock Status List
    const stockStatusContainer = document.querySelector('.col-md-5 .low-stock-items');
    if (stockStatusContainer && !stockStatusContainer.closest('.recent-large-sales')) { // Avoid confusion with recent sales which uses same class
        // Re-selecting specifically for stock status
        const stockStatusWrapper = document.querySelector('.row.pt-4 .low-stock-items');
        if (stockStatusWrapper) {
            stockStatusWrapper.innerHTML = '';
            data.stockStatus.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'stock-item';
                itemDiv.innerHTML = `
                  <div class="stock-details">
                    <h4>${item.produceName} - ${item.branch}</h4>
                    <p>Quantity: ${item.quantity.toLocaleString()} tonnes | Status: <span class="badge ${item.status === 'Low' ? 'bg-danger' : 'bg-success'}">${item.status}</span></p>
                  </div>
                `;
                stockStatusWrapper.appendChild(itemDiv);
            });
        }
    }

    // 4. Branch Performance Chart
    const branchCtx = document.getElementById("branchPerformanceChart").getContext("2d");
    new Chart(branchCtx, {
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

    // 5. Cereal Distribution Chart
    const labels = Object.keys(data.cerealDistribution);
    const chartData = Object.values(data.cerealDistribution);

    const distributionCtx = document.getElementById("cerealDistributionChart").getContext("2d");
    new Chart(distributionCtx, {
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
                    label: (context) => `${context.label}: ${context.raw.toLocaleString()} tonnes`
                }
            }
        },
      },
    });
  }
});
