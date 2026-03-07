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
    const searchInput = document.getElementById('purchasesSearch');
    const filterBtns = document.querySelectorAll('.filter-btn:not([type="date"])');
    const branchSelector = document.getElementById('branchSelector');

    let purchasesData = [];

    // Fetch Purchases Data
    window.loadPurchases = async function() {
        try {
            const response = await api.get('/procurement');
            if (response.purchases) {
                purchasesData = response.purchases;
                filterTable();
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
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No procurement records found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', item.paymentStatus?.toLowerCase() || 'received');
            
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '-';
            const isDelivered = item.deliveryDate && new Date(item.deliveryDate) <= new Date();
            const deliveryClass = isDelivered ? 'active' : 'credit';
            const deliveryText = isDelivered ? 'Received' : 'In Way';

            const paymentClass = item.paymentStatus === 'Paid' ? 'badge bg-success' : 'badge bg-warning text-dark';
            const paymentText = item.paymentStatus || 'Pending';

            const hasBranchColumn = branchSelector && branchSelector.value === 'All';

            tr.innerHTML = `
                <td>#PUR-${item._id.slice(-6).toUpperCase()}</td>
                <td>${dateStr}</td>
                ${hasBranchColumn ? `<td>${item.branch}</td>` : ''}
                <td>${item.dealerName}</td>
                <td>${item.produceName}</td>
                <td>${item.tonnage.toLocaleString()} kg</td>
                <td>UGX ${item.cost.toLocaleString()}</td>
                <td><span class="badge ${deliveryClass}">${deliveryText}</span></td>
                <td><span class="${paymentClass}">${paymentText}</span></td>
                <td>
                    ${item.paymentStatus !== 'Paid' ? `
                        <button class="btn btn-sm btn-success" onclick="markAsPaid('${item._id}')">Mark as Paid</button>
                    ` : '<span class="text-muted small">Completed</span>'}
                </td>
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
                headerRow.insertBefore(th, headerRow.children[2]);
            } else if (!shouldHaveBranchHeader && hasBranchHeader) {
                headerRow.children[2].remove();
            }
        }

        // Remove loading state
        document.querySelector('.purchases-table-container')?.classList.remove('loading');
    }

    // Initial Load
    await window.loadPurchases();

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

        const filteredData = purchasesData.filter(item => {
            const rowStr = `${item.dealerName} ${item.produceName} ${item._id}`.toLowerCase();
            const matchesSearch = rowStr.includes(searchTerm);
            
            const isDelivered = item.deliveryDate && new Date(item.deliveryDate) <= new Date();
            let matchesFilter = activeFilter === 'all';
            
            if (activeFilter === 'received') {
                matchesFilter = isDelivered;
            } else if (activeFilter === 'in_way') {
                matchesFilter = !isDelivered;
            }
            
            const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;

            return matchesSearch && matchesFilter && matchesBranch;
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
                
                // Initialize the modal programmatically
                const modalElement = document.getElementById('addPurchasesModal');
                if (modalElement) {
                    // initProcurementForm is now globally available via procurement-form.js
                    if (typeof initProcurementForm === 'function') {
                        initProcurementForm();
                    } else {
                        console.error("initProcurementForm not found! Make sure procurement-form.js is loaded.");
                    }
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.error("Modal element #addPurchasesModal not found in fetched content");
                }
            }
        })
        .catch(err => console.error("Modal load error:", err));
};
