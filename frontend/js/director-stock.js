document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Stock Valuation <span>(${session.role})</span>`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }

    // Fetch and Update Stock Data
    try {
        const response = await api.get('/inventory/valuation');
        if (response.success) {
            updateStockUI(response);
            renderCharts(response);
        }
    } catch (error) {
        console.error("Error fetching stock valuation:", error);
    }

    function updateStockUI(data) {
        // Summary Cards
        const totalValueCard = document.getElementById('totalStockValue');
        if (totalValueCard) {
            totalValueCard.textContent = `UGX ${(data.totalValuation.totalCostValue / 1000000).toFixed(1)}M`;
        }

        const lowStockCard = document.getElementById('lowStockAlertCount');
        if (lowStockCard) {
            const lowStockItems = data.inventory.filter(i => i.quantity < 500);
            lowStockCard.textContent = `${lowStockItems.length} Items`;
        }

        // Progress Bars
        const maganjoBar = document.getElementById('maganjoBar');
        const matuggaBar = document.getElementById('matuggaBar');
        if (maganjoBar && matuggaBar && data.totalValuation.totalCostValue > 0) {
            const maganjoPercent = (data.branchBreakdown.Maganjo.costValue / data.totalValuation.totalCostValue) * 100;
            const matuggaPercent = (data.branchBreakdown.Matugga.costValue / data.totalValuation.totalCostValue) * 100;
            
            maganjoBar.style.width = `${maganjoPercent}%`;
            maganjoBar.setAttribute('aria-valuenow', maganjoPercent.toFixed(0));
            
            matuggaBar.style.width = `${matuggaPercent}%`;
            matuggaBar.setAttribute('aria-valuenow', matuggaPercent.toFixed(0));
        }

        // Stock Table
        const tableBody = document.getElementById('stockTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            
            // Group by produce name
            const grouped = {};
            data.inventory.forEach(item => {
                if (!grouped[item.produceName]) {
                    grouped[item.produceName] = { Maganjo: 0, Matugga: 0, totalValue: 0 };
                }
                grouped[item.produceName][item.branch] += item.quantity;
                grouped[item.produceName].totalValue += item.stockValue;
            });

            Object.entries(grouped).forEach(([name, branchData]) => {
                const tr = document.createElement('tr');
                const totalQty = branchData.Maganjo + branchData.Matugga;
                let statusBadge = '<span class="badge bg-success">Adequate</span>';
                if (totalQty < 200) statusBadge = '<span class="badge bg-danger">Critical</span>';
                else if (totalQty < 1000) statusBadge = '<span class="badge bg-warning">Low Stock</span>';

                tr.innerHTML = `
                    <td>${name}</td>
                    <td>${branchData.Maganjo.toLocaleString()}</td>
                    <td>${branchData.Matugga.toLocaleString()}</td>
                    <td>UGX ${(branchData.totalValue / 1000000).toFixed(1)}M</td>
                    <td>${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    function renderCharts(data) {
        const grouped = {};
        data.inventory.forEach(item => {
            if (!grouped[item.produceName]) grouped[item.produceName] = { Maganjo: 0, Matugga: 0, totalVal: 0 };
            grouped[item.produceName][item.branch] += item.quantity;
            grouped[item.produceName].totalVal += item.stockValue;
        });

        const labels = Object.keys(grouped);
        const maganjoData = labels.map(l => grouped[l].Maganjo);
        const matuggaData = labels.map(l => grouped[l].Matugga);

        const cerealCtx = document.getElementById('stockCerealChart');
        if (cerealCtx) {
            new Chart(cerealCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Maganjo (KG)', data: maganjoData, backgroundColor: '#2ecc71' },
                        { label: 'Matugga (KG)', data: matuggaData, backgroundColor: '#3498db' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true }, x: { stacked: true } } }
            });
        }

        const valueCtx = document.getElementById('stockValueChart');
        if (valueCtx) {
            const valueData = labels.map(l => grouped[l].totalVal);
            new Chart(valueCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valueData,
                        backgroundColor: ['#f1c40f', '#e67e22', '#95a5a6', '#7367f0', '#28c76f']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
});
