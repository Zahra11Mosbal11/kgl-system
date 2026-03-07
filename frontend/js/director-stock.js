document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "../index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Stock Valuation <span>(${session.role})</span>`;
        const branchName = document.getElementById("branchName"); 
        if (branchName && session.branch) branchName.textContent = session.branch;    }

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
        branchSelector.style.display = 'none'; // All data by default
        branchSelector.value = 'All';
        
        branchSelector.addEventListener('change', () => {
            if (stockData) {
                updateStockUI(stockData);
                renderCharts(stockData);
            }
        });
    }

    let stockData = null;

    // Fetch and Update Stock Data
    try {
        const response = await api.get('/inventory/valuation');
        if (response.success) {
            stockData = response;
            updateStockUI(stockData);
            renderCharts(stockData);
        }
    } catch (error) {
        console.error("Error fetching stock valuation:", error);
    }

    function updateStockUI(data) {
        const branch = branchSelector ? branchSelector.value : 'All';

        // Summary Cards
        const totalValueCard = document.getElementById('totalStockValue');
        if (totalValueCard) {
            let val = data.totalValuation.totalCostValue;
            if (branch === 'Maganjo') val = data.totalValuation.maganjoCostValue;
            else if (branch === 'Matugga') val = data.totalValuation.matuggaCostValue;
            totalValueCard.textContent = `UGX ${(val / 1000000).toFixed(1)}M`;
        }

        const lowStockCard = document.getElementById('lowStockAlertCount');
        if (lowStockCard) {
            const lowStockItems = data.inventory.filter(i => {
                const matchesBranch = branch === 'All' || i.branch === branch;
                return matchesBranch && i.quantity <= 500;
            });
            lowStockCard.textContent = `${lowStockItems.length} Items`;
            
            const cardHeader = lowStockCard.previousElementSibling;
            if (cardHeader) cardHeader.textContent = `Low Stock Alerts (${branch})`;
        }

        // Progress Bars
        const maganjoBar = document.getElementById('maganjoBar');
        const matuggaBar = document.getElementById('matuggaBar');
        if (maganjoBar && matuggaBar) {
            if (branch === 'Maganjo') {
                maganjoBar.style.width = '100%';
                matuggaBar.style.width = '0%';
            } else if (branch === 'Matugga') {
                maganjoBar.style.width = '0%';
                matuggaBar.style.width = '100%';
            } else {
                const total = data.totalValuation.totalCostValue || 1;
                maganjoBar.style.width = `${(data.totalValuation.maganjoCostValue / total) * 100}%`;
                matuggaBar.style.width = `${(data.totalValuation.matuggaCostValue / total) * 100}%`;
            }
        }

        // Stock Table
        const tableBody = document.getElementById('stockTableBody');
        const tableHeader = document.querySelector('.table.table-hover thead tr');
        if (tableBody) {
            tableBody.innerHTML = '';
            
            // Adjust headers based on branch
            if (tableHeader) {
                if (branch === 'All') {
                    tableHeader.innerHTML = `
                        <th>Product</th>
                        <th>Maganjo (KG)</th>
                        <th>Matugga (KG)</th>
                        <th>Total Value</th>
                        <th>Status</th>
                    `;
                } else {
                    tableHeader.innerHTML = `
                        <th>Product</th>
                        <th>${branch} Quantity (KG)</th>
                        <th>Unit Value</th>
                        <th>Total Value</th>
                        <th>Status</th>
                    `;
                }
            }

            // Group inventory by produceName if 'All' branch
            let itemsToRender = [];
            if (branch === 'All') {
                const grouped = {};
                data.inventory.forEach(i => {
                    if (!grouped[i.produceName]) grouped[i.produceName] = { produceName: i.produceName, Maganjo: 0, Matugga: 0, value: 0 };
                    grouped[i.produceName][i.branch] = i.quantity;
                    grouped[i.produceName].value += (i.quantity * i.latestCost);
                });
                itemsToRender = Object.values(grouped);
            } else {
                itemsToRender = data.inventory.filter(i => i.branch === branch).map(i => ({
                    ...i,
                    value: i.quantity * i.latestCost
                }));
            }

            if (itemsToRender.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No stock found for ${branch}.</td></tr>`;
            } else {
                itemsToRender.forEach(item => {
                    const tr = document.createElement('tr');
                    const totalQty = branch === 'All' ? (item.Maganjo + item.Matugga) : item.quantity;
                    const statusClass = totalQty <= 500 ? 'text-danger' : 'text-success';
                    const statusText = totalQty <= 500 ? 'Low Stock' : 'Healthy';

                    if (branch === 'All') {
                        tr.innerHTML = `
                            <td><strong>${item.produceName}</strong></td>
                            <td>${item.Maganjo.toLocaleString()}</td>
                            <td>${item.Matugga.toLocaleString()}</td>
                            <td>UGX ${item.value.toLocaleString()}</td>
                            <td><span class="${statusClass}">${statusText}</span></td>
                        `;
                    } else {
                        tr.innerHTML = `
                            <td><strong>${item.produceName}</strong></td>
                            <td>${item.quantity.toLocaleString()}</td>
                            <td>UGX ${item.latestCost.toLocaleString()}</td>
                            <td>UGX ${item.value.toLocaleString()}</td>
                            <td><span class="${statusClass}">${statusText}</span></td>
                        `;
                    }
                    tableBody.appendChild(tr);
                });
            }
        }
    }

    function renderCharts(data) {
        const branch = branchSelector ? branchSelector.value : 'All';

        // Distribution Chart
        const distributionCtx = document.getElementById("stockCerealChart")?.getContext("2d");
        if (distributionCtx) {
            if (window.distChart) window.distChart.destroy();
            
            const labels = [...new Set(data.inventory.map(i => i.produceName))];
            const maganjoData = labels.map(l => {
                const item = data.inventory.find(i => i.produceName === l && i.branch === 'Maganjo');
                return item ? item.quantity : 0;
            });
            const matuggaData = labels.map(l => {
                const item = data.inventory.find(i => i.produceName === l && i.branch === 'Matugga');
                return item ? item.quantity : 0;
            });

            let datasets = [];
            if (branch === 'All' || branch === 'Maganjo') {
                datasets.push({
                    label: "Maganjo Stock (kg)",
                    data: maganjoData,
                    backgroundColor: "#7367f0",
                });
            }
            if (branch === 'All' || branch === 'Matugga') {
                datasets.push({
                    label: "Matugga Stock (kg)",
                    data: matuggaData,
                    backgroundColor: "#00cfe8",
                });
            }

            window.distChart = new Chart(distributionCtx, {
                type: "bar",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Value Pie Chart
        const valueCtx = document.getElementById("stockValueChart")?.getContext("2d");
        if (valueCtx) {
            if (window.vChart) window.vChart.destroy();
            
            const grouped = {};
            data.inventory.forEach(i => {
                if (branch === 'All' || i.branch === branch) {
                   grouped[i.produceName] = (grouped[i.produceName] || 0) + (i.quantity * i.latestCost);
                }
            });

            window.vChart = new Chart(valueCtx, {
                type: "doughnut",
                data: {
                    labels: Object.keys(grouped),
                    datasets: [{
                        data: Object.values(grouped),
                        backgroundColor: ["#7367f0", "#28c76f", "#ff9f43", "#ea5455", "#00cfe8"]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    }
});
