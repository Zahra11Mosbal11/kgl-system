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

    // Search and Filter Logic
    const searchInput = document.getElementById('inventorySearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const branchSelector = document.getElementById('branchSelector');

    let inventoryData = [];

    // Fetch Inventory Data
    try {
        const response = await api.get('/inventory');
        if (response.success) {
            inventoryData = response.inventory;
            filterTable();
        }
    } catch (error) {
        console.error("Error fetching inventory data:", error);
    }

    function renderInventoryTable(data) {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No inventory found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            
            // Status Logic (Threshold 500kg for low stock)
            let statusBadge = '';
            if (item.quantity === 0) {
                statusBadge = '<span class="badge inactive">Out of Stock</span>';
            } else if (item.quantity <= 500) {
                statusBadge = '<span class="badge credit">Low Stock</span>';
            } else {
                statusBadge = '<span class="badge active">In Stock</span>';
            }

            const lastRestocked = item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '-';

            const hasBranchColumn = branchSelector && branchSelector.value === 'All';
            
            tr.innerHTML = `
                <td>${item.produceName}</td>
                ${hasBranchColumn ? `<td>${item.branch}</td>` : ''}
                <td>${item.quantity.toLocaleString()} kg</td>
                <td>${statusBadge}</td>
                <td>${lastRestocked}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Update Header if needed
        const headerRow = document.querySelector('.clients-table thead tr');
        if (headerRow) {
            const hasBranchHeader = headerRow.innerText.includes('Branch');
            const shouldHaveBranchHeader = branchSelector && branchSelector.value === 'All';
            
            if (shouldHaveBranchHeader && !hasBranchHeader) {
                const th = document.createElement('th');
                th.textContent = 'Branch';
                headerRow.insertBefore(th, headerRow.children[1]);
            } else if (!shouldHaveBranchHeader && hasBranchHeader) {
                headerRow.children[1].remove();
            }
        }

        // Remove loading state
        document.querySelector('.inventory-table-container')?.classList.remove('loading');
    }

    if (branchSelector) {
        if (session.role === 'manager' || session.role === 'director') {
            branchSelector.style.display = 'none'; // Divisions canceled for managers
            branchSelector.value = 'All';
        } else {
            branchSelector.style.display = 'block';
            branchSelector.value = session.branch;
        }

        branchSelector.addEventListener('change', () => {
            filterTable();
        });
    }

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        const selectedBranch = branchSelector ? branchSelector.value : session.branch;

        const filteredData = inventoryData.filter(item => {
            const matchesSearch = item.produceName.toLowerCase().includes(searchTerm);
            
            const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;

            let status = 'in-stock';
            if (item.quantity === 0) status = 'out-of-stock';
            else if (item.quantity <= 500) status = 'low-stock';

            const matchesFilter = activeFilter === 'all' || activeFilter === status;
            return matchesSearch && matchesFilter && matchesBranch;
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
