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

    let inventoryData = [];

    // Fetch Inventory Data
    try {
        const response = await api.get('/inventory');
        if (response.success) {
            inventoryData = response.inventory.filter(i => i.branch === session.branch);
            renderInventoryTable(inventoryData);
        }
    } catch (error) {
        console.error("Error fetching inventory data:", error);
    }

    function renderInventoryTable(data) {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No inventory found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            
            // Status Logic (Threshold 500kg for low stock)
            let statusBadge = '';
            if (item.quantity === 0) {
                statusBadge = '<span class="badge inactive">Out of Stock</span>';
            } else if (item.quantity < 500) {
                statusBadge = '<span class="badge credit">Low Stock</span>';
            } else {
                statusBadge = '<span class="badge active">In Stock</span>';
            }

            const lastRestocked = item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A';

            tr.innerHTML = `
                <td>${item.produceName}</td>
                <td>${item.produceType || 'N/A'}</td>
                <td>${item.quantity.toLocaleString()} kg</td>
                <td>${statusBadge}</td>
                <td>${lastRestocked}</td>
                <td>
                    <div class="action-buttons">
                        <span class="btn-view" style="cursor: pointer; color: #1a73e8;">View</span>
                        <span class="btn-edit" style="cursor: pointer; color: #34a853; margin-left: 10px;">Edit</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Search and Filter Logic
    const searchInput = document.getElementById('inventorySearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');

        const filteredData = inventoryData.filter(item => {
            const matchesSearch = item.produceName.toLowerCase().includes(searchTerm);
            
            let status = 'in-stock';
            if (item.quantity === 0) status = 'out-of-stock';
            else if (item.quantity < 500) status = 'low-stock';

            const matchesFilter = activeFilter === 'all' || activeFilter === status;
            return matchesSearch && matchesFilter;
        });

        renderInventoryTable(filteredData);
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
});
