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
    const searchInput = document.getElementById('supplierSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const branchSelector = document.getElementById('branchSelector');

    let suppliersData = [];

    // Fetch Suppliers Data
    window.loadSuppliers = async function() {
        try {
            const response = await api.get('/suppliers');
            if (response.success) {
                suppliersData = response.suppliers;
                filterTable();
            }
        } catch (error) {
            console.error("Error fetching suppliers data:", error);
        }
    };

    function renderSuppliersTable(data) {
        const tableBody = document.getElementById('suppliersTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No suppliers found for this branch.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', item.status?.toLowerCase() || 'active');
            
            const lastDelivery = item.lastDelivery ? new Date(item.lastDelivery).toLocaleDateString() : '-';
            const statusClass = item.status === 'Active' ? 'active' : 'inactive';

            const hasBranchColumn = branchSelector && branchSelector.value === 'All';

            tr.innerHTML = `
                <td>
                    <div class="client-details">
                        <strong>${item.name}</strong>
                        <p>ID: ${item._id.slice(-6).toUpperCase()}</p>
                    </div>
                </td>
                ${hasBranchColumn ? `<td>${item.branch}</td>` : ''}
                <td>${item.contact}</td>
                <td>${(item.productsSupplied || []).join(', ') || '-'}</td>
                <td><span class="badge ${statusClass}">${item.status || 'Active'}</span></td>
                <td>${lastDelivery}</td>
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
        document.querySelector('.table-section')?.classList.remove('loading');
    }

    // Initial Load
    await window.loadSuppliers();

    if (branchSelector) {
        if (session.role === 'manager' || session.role === 'director') {
            branchSelector.style.display = 'none'; // Divisions canceled for managers
            branchSelector.value = 'All';
        } else {
            branchSelector.style.display = 'block';
            branchSelector.value = session.branch || 'Maganjo';
        }

        branchSelector.addEventListener('change', () => {
            filterTable();
        });
    }

    function filterTable() {
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        const selectedBranch = branchSelector ? branchSelector.value : session.branch;

        const filteredData = suppliersData.filter(item => {
            const rowStr = `${item.name} ${item.contact} ${item.contactPerson}`.toLowerCase();
            const matchesSearch = rowStr.includes(searchTerm);
            
            const status = item.status?.toLowerCase() || 'active';
            const matchesFilter = activeFilter === 'all' || activeFilter === status;
            const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;
            
            return matchesSearch && matchesFilter && matchesBranch;
        });

        renderSuppliersTable(filteredData);
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

    // Global fetchModal function
    window.fetchModal = function(modalPath) {
        fetch(modalPath)
            .then(res => res.text())
            .then(data => {
                const container = document.getElementById("modal-container");
                if (container) {
                    container.innerHTML = data;
                    const modalElement = document.getElementById('addSupplierModal');
                    if (modalElement) {
                        if (typeof initSupplierForm === 'function') {
                            initSupplierForm();
                        }
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                }
            })
            .catch(err => console.error("Modal load error:", err));
    };
});
