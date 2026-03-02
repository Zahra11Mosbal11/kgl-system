document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Sales Reports <span>(${session.role})</span>`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }

    // Fetch and Update Sales Data
    try {
        const response = await api.get('/sales');
        if (response.success) {
            updateSalesUI(response);
            renderCharts(response);
        }
    } catch (error) {
        console.error("Error fetching sales reports:", error);
    }

    function updateSalesUI(data) {
        const tableBody = document.getElementById('salesBreakdownBody');
        if (!tableBody) return;

        const cashSales = data.cashSales || [];
        const branches = ['Maganjo', 'Matugga'];
        
        tableBody.innerHTML = '';
        branches.forEach(branch => {
            const branchSales = cashSales.filter(s => s.branch === branch);
            const totalRevenue = branchSales.reduce((sum, s) => sum + s.amountPaid, 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${branch}</td>
                <td>${branchSales.length}</td>
                <td>UGX ${(totalRevenue / 1000000).toFixed(1)}M</td>
                <td><span class="text-success">+0%</span></td> 
            `;
            tableBody.appendChild(tr);
        });
    }

    function renderCharts(data) {
        const cashSales = data.cashSales || [];
        
        // Branch Sales Chart
        const maganjoSales = cashSales.filter(s => s.branch === 'Maganjo').reduce((sum, s) => sum + s.amountPaid, 0);
        const matuggaSales = cashSales.filter(s => s.branch === 'Matugga').reduce((sum, s) => sum + s.amountPaid, 0);

        const branchCtx = document.getElementById('branchSalesChart');
        if (branchCtx) {
            new Chart(branchCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Maganjo', 'Matugga'],
                    datasets: [{
                        label: 'Sales (Millions UGX)',
                        data: [maganjoSales / 1000000, matuggaSales / 1000000],
                        backgroundColor: ['#2ecc71', '#3498db']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Product Distribution Chart
        const distribution = {};
        cashSales.forEach(s => {
            distribution[s.produceName] = (distribution[s.produceName] || 0) + s.amountPaid;
        });

        const prodCtx = document.getElementById('productSalesChart');
        if (prodCtx) {
            new Chart(prodCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: Object.keys(distribution),
                    datasets: [{
                        data: Object.values(distribution),
                        backgroundColor: ['#e74c3c', '#f1c40f', '#9b59b6', '#34495e', '#2ecc71']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
});
