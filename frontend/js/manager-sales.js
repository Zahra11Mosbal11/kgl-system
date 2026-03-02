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

    let allSalesData = [];

    // Fetch Sales Data
    window.loadSales = async function() {
        try {
            const response = await api.get('/sales');
            if (response.success) {
                const branch = session.branch || 'Maganjo';
                const cashSales = (response.cashSales || []).filter(s => s.branch === branch).map(s => ({...s, type: 'cash'}));
                const creditSales = (response.creditSales || []).filter(s => s.branch === branch).map(s => ({...s, type: 'credit'}));
                
                allSalesData = [...cashSales, ...creditSales].sort((a,b) => new Date(b.date) - new Date(a.date));
                renderSalesTable(allSalesData);
            }
        } catch (error) {
            console.error("Error fetching sales data:", error);
        }
    };

    function renderSalesTable(data) {
        const tableBody = document.getElementById('salesTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No sales records found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', item.type);
            
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'N/A';
            const statusClass = item.type === 'cash' ? 'active' : 'credit';
            const statusText = item.type === 'cash' ? 'Paid' : 'Credit';
            const amount = item.type === 'cash' ? (item.amountPaid || 0) : (item.amountDue || 0);

            tr.innerHTML = `
                <td>#REC-${item._id.slice(-6).toUpperCase()}</td>
                <td>${dateStr}</td>
                <td>${item.customerName || item.buyerName || 'Walk-in'}</td>
                <td>${item.produceName} (${item.tonnage.toLocaleString()} kg)</td>
                <td>UGX ${amount.toLocaleString()}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
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
    await window.loadSales();

    // Search and Filter Logic
    const searchInput = document.getElementById('salesSearch');
    const filterBtns = document.querySelectorAll('.filter-btn:not([type="date"])');

    function filterTable() {
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';

        const filteredData = allSalesData.filter(item => {
            const customer = (item.customerName || item.buyerName || 'Walk-in').toLowerCase();
            const product = (item.produceName || "").toLowerCase();
            const matchesSearch = customer.includes(searchTerm) || product.includes(searchTerm) || item._id.includes(searchTerm);
            
            const matchesFilter = activeFilter === 'all' || activeFilter === item.type;
            
            return matchesSearch && matchesFilter;
        });

        renderSalesTable(filteredData);
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
                renderSalesTable(allSalesData);
                return;
            }
            const filteredData = allSalesData.filter(item => {
                const itemDate = new Date(item.date).toISOString().split('T')[0];
                return itemDate === selectedDate;
            });
            renderSalesTable(filteredData);
        });
    }
});

// Fetch modal helper
window.fetchModal = function(modalPath) {
    fetch(modalPath)
        .then(res => res.text())
        .then(data => {
            const container = document.getElementById("modal-container");
            if (container) {
                container.innerHTML = data;
            }
        })
        .catch(err => console.error("Modal load error:", err));
};
