// Load Google Charts
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(drawVisualization);

function drawVisualization() {
  // Director Level Data: Revenue vs Profit
  var data = google.visualization.arrayToDataTable([
    ["Month", "Revenue", "Profit"],
    ["Jan", 165000, 45000],
    ["Feb", 135000, 35000],
    ["Mar", 157000, 40000],
    ["Apr", 150000, 38000],
    ["May", 180000, 55000],
    ["Jun", 136000, 25000],
  ]);

  var options = {
    title: "Financial Overview (Revenue vs Profit)",
    titleTextStyle: {
      color: "#1f3d2b",
      fontSize: 18,
      bold: true,
    },
    backgroundColor: "#ffffff",
    colors: ["#ff9f43", "#28c76f"], // Orange & Green

    legend: { position: "bottom", textStyle: { color: "#7A869A" } },
    hAxis: {
      textStyle: { color: "#7A869A" },
      gridlines: { color: "#f1f1f1" },
    },
    vAxis: {
      textStyle: { color: "#7A869A" },
      gridlines: { color: "#f1f1f1" },
    },
    seriesType: "bars",
    bar: { groupWidth: "50%" },
    chartArea: { width: "85%", height: "70%" },
  };

  var chart = new google.visualization.ComboChart(
    document.getElementById("chart_div")
  );
  chart.draw(data, options);
}

document.addEventListener("DOMContentLoaded", () => {
  // Branch Performance Chart (Side-by-side Bar Chart)
  const branchCtx = document
    .getElementById("branchPerformanceChart")
    .getContext("2d");
  new Chart(branchCtx, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Maganjo",
          data: [
            65000000, 59000000, 80000000, 81000000, 56000000, 55000000,
          ],
          backgroundColor: "#7367f0",
          borderRadius: 4,
        },
        {
          label: "Matugga",
          data: [
            45000000, 48000000, 40000000, 19000000, 86000000, 27000000,
          ],
          backgroundColor: "#00cfe8",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "UGX " + value / 1000000 + "M";
            },
          },
        },
      },
    },
  });

  // Cereal Distribution Chart (Pie Chart)
  const distributionCtx = document
    .getElementById("cerealDistributionChart")
    .getContext("2d");
  new Chart(distributionCtx, {
    type: "pie",
    data: {
      labels: ["Maize", "Beans", "Cowpeas", "G-nuts", "Soybeans"],
      datasets: [
        {
          data: [45, 25, 15, 10, 5],
          backgroundColor: [
            "#7367f0",
            "#28c76f",
            "#ff9f43",
            "#ea5455",
            "#00cfe8",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });

  // Session Management
  const session = JSON.parse(localStorage.getItem("currentSession"));

  if (session) {
    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `${session.username} <span>(${session.role})</span>`;
    }

    // Simple role check to ensure only Directors access this
    if (session.role !== "Director") {
      // In a real app, you'd redirect to the correct dashboard
      // window.location.href = "login.html";
      console.log("Access Warning: Not a Director");
    }
  } else {
    window.location.href = "login.html";
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("currentSession");
      window.location.href = "login.html";
    });
  }
});
