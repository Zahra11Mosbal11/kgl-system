document.addEventListener("DOMContentLoaded", async () => {
  // Session Management
  const session = JSON.parse(localStorage.getItem("currentSession"));

  if (!session || session.role !== "director") {
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

  // Fetch Dashboard Data
  try {
    const [valuationRes, salesRes] = await Promise.all([
      api.get('/inventory/valuation'),
      api.get('/sales')
    ]);

    if (valuationRes.success && salesRes.success) {
      updateDashboard(valuationRes, salesRes);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  function updateDashboard(valuation, sales) {
    // Update Cards
    const totalRevenue = sales.cashSales.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalCredit = sales.creditSales.reduce((sum, s) => sum + s.amountDue, 0);
    
    document.querySelector('.col-md-4:nth-child(1) .card-value').textContent = `UGX ${(totalRevenue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(2) .card-value').textContent = `UGX ${(valuation.totalValuation.totalCostValue / 1000000).toFixed(1)}M`;
    document.querySelector('.col-md-4:nth-child(3) .card-value').textContent = `UGX ${(totalCredit / 1000000).toFixed(1)}M`;

    // Branch Performance Chart
    const branchCtx = document.getElementById("branchPerformanceChart").getContext("2d");
    const maganjoSales = sales.cashSales.filter(s => s.branch === 'Maganjo').reduce((sum, s) => sum + s.amountPaid, 0);
    const matuggaSales = sales.cashSales.filter(s => s.branch === 'Matugga').reduce((sum, s) => sum + s.amountPaid, 0);

    new Chart(branchCtx, {
      type: "bar",
      data: {
        labels: ["Current Performance"],
        datasets: [
          {
            label: "Maganjo",
            data: [maganjoSales],
            backgroundColor: "#7367f0",
            borderRadius: 4,
          },
          {
            label: "Matugga",
            data: [matuggaSales],
            backgroundColor: "#00cfe8",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "UGX " + value / 1000000 + "M",
            },
          },
        },
      },
    });

    // Cereal Distribution Chart
    const cereals = {};
    valuation.inventory.forEach(item => {
        cereals[item.produceName] = (cereals[item.produceName] || 0) + item.quantity;
    });

    const labels = Object.keys(cereals);
    const data = Object.values(cereals);

    const distributionCtx = document.getElementById("cerealDistributionChart").getContext("2d");
    new Chart(distributionCtx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ["#7367f0", "#28c76f", "#ff9f43", "#ea5455", "#00cfe8"],
          borderWidth: 2,
          borderColor: "#ffffff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }
});
