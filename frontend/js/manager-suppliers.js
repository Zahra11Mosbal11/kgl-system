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

    let suppliersData = [];

    // Fetch Suppliers Data
    window.loadSuppliers = async function() {
        try {
            const response = await api.get('/suppliers');
            if (response.success) {
                suppliersData = response.suppliers.filter(s => s.branch === session.branch);
                renderSuppliersTable(suppliersData);
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

            tr.innerHTML = `
                <td>
                    <div class="client-details">
                        <strong>${item.name}</strong>
                        <p>ID: ${item._id.slice(-6).toUpperCase()}</p>
                    </div>
                </td>
                <td>${item.contactPerson || '-'}</td>
                <td>${item.contact}</td>
                <td>${(item.productsSupplied || []).join(', ') || '-'}</td>
                <td><span class="badge ${statusClass}">${item.status || 'Active'}</span></td>
                <td>${lastDelivery}</td>
                <td>
                    <div class="action-buttons">
                        <span class="btn-view" style="cursor: pointer; color: #1a73e8;">View</span>
                        <span class="btn-edit" style="cursor: pointer; color: #34a853; margin-left: 10px;">Edit</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Remove loading state
        document.querySelector('.table-section')?.classList.remove('loading');
    }

    // Initial Load
    await window.loadSuppliers();

    // Search and Filter Logic
    const searchInput = document.getElementById('supplierSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function filterTable() {
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';

        const filteredData = suppliersData.filter(item => {
            const rowStr = `${item.name} ${item.contact} ${item.contactPerson}`.toLowerCase();
            const matchesSearch = rowStr.includes(searchTerm);
            
            const status = item.status?.toLowerCase() || 'active';
            const matchesFilter = activeFilter === 'all' || activeFilter === status;
            
            return matchesSearch && matchesFilter;
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
