document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Procurement Reports <span>(${session.role})</span>`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }

    // Fetch and Update Procurement Data
    try {
        const response = await api.get('/procurement');
        if (response.success) {
            updateProcurementUI(response.purchases);
        }
    } catch (error) {
        console.error("Error fetching procurement reports:", error);
    }

    function updateProcurementUI(purchases) {
        // Summary Cards
        const totalProcurement = purchases.reduce((sum, p) => sum + p.cost, 0);
        const pendingCount = purchases.filter(p => p.paymentStatus?.toLowerCase() === 'pending').length;

        const totalCardValue = document.getElementById('totalProcurementValue');
        if (totalCardValue) {
            totalCardValue.textContent = `UGX ${(totalProcurement / 1000000).toFixed(1)}M`;
        }
        
        const pendingCardValue = document.getElementById('pendingDeliveriesValue');
        if (pendingCardValue) {
            pendingCardValue.textContent = `${pendingCount} Orders`;
        }

        // Procurement Table
        const tableBody = document.getElementById('procurementTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            // Sort by date descending
            const sorted = [...purchases].sort((a,b) => new Date(b.date) - new Date(a.date));
            
            sorted.slice(0, 15).forEach(item => {
                const tr = document.createElement('tr');
                const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '-';
                const statusBadge = item.paymentStatus === 'Paid' ? '<span class="badge bg-success">Received</span>' : '<span class="badge bg-warning">Pending</span>';

                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${item.dealerName}</td>
                    <td>${item.produceName}</td>
                    <td>${item.branch}</td>
                    <td>${item.tonnage.toLocaleString()} kg</td>
                    <td>UGX ${(item.cost / 1000000).toFixed(1)}M</td>
                    <td>${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }
});
