document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "manager") {
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

    let purchasesData = [];

    // Fetch Purchases Data
    window.loadPurchases = async function() {
        try {
            const response = await api.get('/procurement');
            if (response.purchases) {
                purchasesData = response.purchases.filter(p => p.branch === session.branch);
                renderPurchasesTable(purchasesData);
            }
        } catch (error) {
            console.error("Error fetching purchases data:", error);
        }
    };

    function renderPurchasesTable(data) {
        const tableBody = document.getElementById('purchasesTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No procurement records found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', item.paymentStatus?.toLowerCase() || 'received');
            
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'N/A';
            const statusClass = item.paymentStatus === 'Paid' ? 'active' : 'credit';

            tr.innerHTML = `
                <td>#PUR-${item._id.slice(-6).toUpperCase()}</td>
                <td>${dateStr}</td>
                <td>${item.dealerName}</td>
                <td>${item.produceName}</td>
                <td>${item.tonnage.toLocaleString()} kg</td>
                <td>UGX ${item.cost.toLocaleString()}</td>
                <td><span class="badge ${statusClass}">${item.paymentStatus || 'Received'}</span></td>
                <td>
                    <div class="action-buttons">
                        <span class="btn-view" style="cursor: pointer; color: #1a73e8;">View</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Initial Load
    await window.loadPurchases();

    // Search and Filter Logic
    const searchInput = document.getElementById('purchasesSearch');
    const filterBtns = document.querySelectorAll('.filter-btn:not([type="date"])');

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');

        const filteredData = purchasesData.filter(item => {
            const rowStr = `${item.dealerName} ${item.produceName} ${item._id}`.toLowerCase();
            const matchesSearch = rowStr.includes(searchTerm);
            
            const status = item.paymentStatus?.toLowerCase() || 'received';
            const matchesFilter = activeFilter === 'all' || activeFilter === status;
            
            return matchesSearch && matchesFilter;
        });

        renderPurchasesTable(filteredData);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTable();
        });
    });

    // Handle Date Filtering
    const dateFilter = document.querySelector('input[type="date"]');
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            const selectedDate = dateFilter.value;
            if (!selectedDate) {
                renderPurchasesTable(purchasesData);
                return;
            }
            const filteredData = purchasesData.filter(item => {
                const itemDate = new Date(item.date).toISOString().split('T')[0];
                return itemDate === selectedDate;
            });
            renderPurchasesTable(filteredData);
        });
    }
});

// Fetch modal helper (global for onclick in HTML)
window.fetchModal = function(modalPath) {
    fetch(modalPath)
        .then(res => res.text())
        .then(data => {
            const container = document.getElementById("modal-container");
            if (container) {
                container.innerHTML = data;
                // Re-calculate totals if quantity/price change
                const qtyInput = document.getElementById("quantity");
                const priceInput = document.getElementById("price");
                if (qtyInput && priceInput) {
                    const calc = () => {
                        const q = Number(qtyInput.value);
                        const p = Number(priceInput.value);
                        const total = document.getElementById("total");
                        if (total) total.value = (q && p) ? (q * p).toFixed(0) : "";
                    };
                    qtyInput.addEventListener('input', calc);
                    priceInput.addEventListener('input', calc);
                }
                
                // Set default date to today
                const dateInput = document.getElementById("purchaseDate");
                const deliveryInput = document.getElementById("deliveryDate");
                const today = new Date().toISOString().split('T')[0];
                if (dateInput) dateInput.value = today;
                if (deliveryInput) deliveryInput.value = today;
            }
        })
        .catch(err => console.error("Modal load error:", err));
};
