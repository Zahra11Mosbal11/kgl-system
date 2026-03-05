// Load Google Charts
google.charts.load('current', { packages: ['corechart'] });

document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "manager") {
        window.location.href = "../index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `${session.username} <span>(${session.role})</span>`;
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

    // Fetch Dashboard Data
    try {
        const [inventoryRes, salesRes, procurementRes, suppliersRes] = await Promise.all([
            api.get('/inventory'),
            api.get('/sales'),
            api.get('/procurement'),
            api.get('/suppliers')
        ]);

        if (inventoryRes.success && salesRes.success && procurementRes.purchases && suppliersRes.success) {
            const data = {
                inventory: inventoryRes.inventory,
                sales: salesRes,
                purchases: procurementRes.purchases,
                suppliers: suppliersRes.suppliers
            };
            
            updateDashboard(data);
            google.charts.setOnLoadCallback(() => drawCharts(data));
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }

    function updateDashboard(data) {
        const branch = session.branch || 'Maganjo'; // Default if not found
        
        // Filter data for the manager's branch
        const branchSalesCash = data.sales.cashSales.filter(s => s.branch === branch);
        const branchSalesCredit = data.sales.creditSales.filter(s => s.branch === branch);
        const branchPurchases = data.purchases.filter(p => p.branch === branch);
        const branchInventory = data.inventory.filter(i => i.branch === branch);
        const branchSuppliers = data.suppliers.filter(s => s.branch === branch);

        // Calculate Metrics
        const totalStockQty = branchInventory.reduce((sum, i) => sum + i.quantity, 0);
        const totalSalesVal = branchSalesCash.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalPurchaseVal = branchPurchases.reduce((sum, p) => sum + p.cost, 0);
        
        // Calculate "To be received" (Pending Purchases)
        const toBeReceived = branchPurchases
            .filter(p => p.paymentStatus && p.paymentStatus === 'Pending')
            .reduce((sum, p) => sum + (p.tonnage || 0), 0);
        
        // Update Stats Cards
        const invInHandEl = document.getElementById('invInHand');
        const invToReceiveEl = document.getElementById('invToReceive');
        if (invInHandEl) invInHandEl.textContent = totalStockQty.toLocaleString();
        if (invToReceiveEl) invToReceiveEl.textContent = toBeReceived.toLocaleString();

        const cards = document.querySelectorAll('.stat-card');
        if (cards.length >= 4) {
            // Sales Overview (Index 1)
            cards[1].querySelectorAll('.stat-value')[0].textContent = (branchSalesCash.length + branchSalesCredit.length).toLocaleString();
            cards[1].querySelectorAll('.stat-value')[1].textContent = `${totalSalesVal.toLocaleString()} UGX`;

            // Product Summary
            cards[2].querySelectorAll('.stat-value')[0].textContent = branchSuppliers.length.toLocaleString();
            const products = [...new Set(branchInventory.map(i => i.produceName))];
            cards[2].querySelectorAll('.stat-value')[1].textContent = products.length.toLocaleString();

            // Purchase Overview
            cards[3].querySelectorAll('.stat-value')[0].textContent = branchPurchases.length.toLocaleString();
            cards[3].querySelectorAll('.stat-value')[1].textContent = `${totalPurchaseVal.toLocaleString()} UGX`;
        }

        // Low Stock List
        const lowStockContainer = document.querySelector('.low-stock-items');
        if (lowStockContainer) {
            lowStockContainer.innerHTML = '';
            const lowStockItems = branchInventory.filter(i => i.quantity < 100).slice(0, 3);
            
            if (lowStockItems.length === 0) {
                lowStockContainer.innerHTML = '<p class="p-3 text-muted">All stock levels are healthy.</p>';
            } else {
                lowStockItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'stock-item';
                    itemDiv.innerHTML = `
                        <div class="stock-details">
                            <h4>${item.produceName}</h4>
                            <p>Remaining Quantity : ${item.quantity.toLocaleString()} kg</p>
                        </div>
                    `;
                    lowStockContainer.appendChild(itemDiv);
                });
            }
        }

        // Top Selling Stock
        const salesStats = {};
        branchSalesCash.forEach(s => {
            if (!salesStats[s.produceName]) {
                salesStats[s.produceName] = { qty: 0, revenue: 0 };
            }
            salesStats[s.produceName].qty += s.tonnage;
            salesStats[s.produceName].revenue += s.amountPaid;
        });

        const sortedSales = Object.entries(salesStats).sort((a,b) => b[1].qty - a[1].qty).slice(0, 5);
        const topSellingTableBody = document.querySelector('.top-selling-section tbody');
        if (topSellingTableBody) {
            topSellingTableBody.innerHTML = '';

            if (sortedSales.length === 0) {
                topSellingTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No sales recorded yet.</td></tr>';
            } else {
                sortedSales.forEach(([name, stats]) => {
                    const invItem = branchInventory.find(i => i.produceName === name);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${name}</td>
                        <td>${stats.qty.toLocaleString()} kg</td>
                        <td>${invItem ? invItem.quantity.toLocaleString() : 0} kg</td>
                        <td>UGX ${stats.revenue.toLocaleString()}</td>
                    `;
                    topSellingTableBody.appendChild(tr);
                });
            }
        }

        // Remove loading states
        document.querySelectorAll('.stats-cards, .low-stock-section, .top-selling-section')
            .forEach(el => el.classList.remove('loading'));

        // Check for Out of Stock items
        showStockAlerts(branchInventory);
    }

    function showStockAlerts(inventory) {
        const alertContainer = document.getElementById('stockAlerts');
        if (!alertContainer) return;
        
        const outOfStock = inventory.filter(i => i.quantity === 0);
        
        if (outOfStock.length > 0) {
            const list = outOfStock.map(i => i.produceName).join(', ');
            alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert" style="border-radius: 12px; border: none; background: #fee2e2; color: #991b1b;">
                    <strong>Out of Stock Alert:</strong> The following items are out of stock in your branch: <strong>${list}</strong>. Please restock immediately.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        } else {
            alertContainer.innerHTML = '';
        }
    }

    function drawCharts(data) {
        const branch = session.branch || 'Maganjo';
        const branchSales = data.sales.cashSales.filter(s => s.branch === branch);
        const branchPurchases = data.purchases.filter(p => p.branch === branch);

        const monthlyData = {};
        
        const process = (items, key, valueField) => {
            items.forEach(item => {
                const dateObj = new Date(item.date);
                const month = dateObj.toLocaleString('default', { month: 'short' });
                if (!monthlyData[month]) monthlyData[month] = { Sales: 0, Purchase: 0 };
                monthlyData[month][key] += item[valueField];
            });
        };

        process(branchSales, 'Sales', 'amountPaid');
        process(branchPurchases, 'Purchase', 'cost');

        const chartDataArray = [['Month', 'Sales', 'Purchase']];
        const months = Object.keys(monthlyData).sort((a, b) => {
            const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return m.indexOf(a) - m.indexOf(b);
        });
        
        if (months.length === 0) {
            chartDataArray.push(['Current', 0, 0]);
        } else {
            months.forEach(m => {
                chartDataArray.push([m, monthlyData[m].Sales, monthlyData[m].Purchase]);
            });
        }

        const gData = google.visualization.arrayToDataTable(chartDataArray);

        const options = {
            title: 'Sales & Purchase Overview (UGX)',
            titleTextStyle: { color: '#1f3d2b', fontSize: 18, bold: true },
            backgroundColor: '#ffffff',
            colors: ['#6EC1F4', '#5AD469'],
            legend: { position: 'bottom', textStyle: { color: '#7A869A' } },
            hAxis: { textStyle: { color: '#7A869A' }, gridlines: { color: '#f1f1f1' } },
            vAxis: { 
                textStyle: { color: '#7A869A' }, 
                gridlines: { color: '#f1f1f1' },
                format: 'short' 
            },
            seriesType: 'bars',
            bar: { groupWidth: '50%' },
            chartArea: { width: '85%', height: '70%' },
        };

        const chartElement = document.getElementById('chart_div');
        if (chartElement) {
            const chart = new google.visualization.ComboChart(chartElement);
            chart.draw(gData, options);
        }
    }
});
