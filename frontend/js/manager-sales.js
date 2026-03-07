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
    const searchInput = document.getElementById('salesSearch');
    const filterBtns = document.querySelectorAll('.filter-btn:not([type="date"])');
    const branchSelector = document.getElementById('branchSelector');

    let allSalesData = [];

    // Fetch Sales Data
    window.loadSales = async function() {
        try {
            const response = await api.get('/sales');
            if (response.success) {
                const cashSales = (response.cashSales || []).map(s => ({...s, type: 'cash'}));
                const creditSales = (response.creditSales || []).map(s => ({
                    ...s, 
                    type: 'credit',
                    date: s.dispatchDate || s.createdAt // Normalize date field
                }));
                
                allSalesData = [...cashSales, ...creditSales].sort((a,b) => new Date(b.date) - new Date(a.date));
                filterTable();
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
            
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '-';
            const statusClass = item.type === 'cash' ? 'active' : 'credit';
            const statusText = item.type === 'cash' ? 'Paid' : 'Credit';
            const amount = item.type === 'cash' ? (item.amountPaid || 0) : (item.amountDue || 0);

            const hasBranchColumn = branchSelector && branchSelector.value === 'All';

            tr.innerHTML = `
                <td>#REC-${item._id.slice(-6).toUpperCase()}</td>
                <td>${dateStr}</td>
                ${hasBranchColumn ? `<td>${item.branch}</td>` : ''}
                <td>${item.customerName || item.buyerName || 'Walk-in'}</td>
                <td>${item.produceName} (${item.tonnage.toLocaleString()} kg)</td>
                <td>UGX ${amount.toLocaleString()}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
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
        document.querySelector('.sales-table-container')?.classList.remove('loading');
    }

    // Initial Load
    await window.loadSales();

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
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        const selectedBranch = branchSelector ? branchSelector.value : session.branch;

        const filteredData = allSalesData.filter(item => {
            const customer = (item.customerName || item.buyerName || 'Walk-in').toLowerCase();
            const product = (item.produceName || "").toLowerCase();
            const matchesSearch = customer.includes(searchTerm) || product.includes(searchTerm) || item._id.includes(searchTerm);
            
            const matchesFilter = activeFilter === 'all' || activeFilter === item.type;
            const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;

            return matchesSearch && matchesFilter && matchesBranch;
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
                
                // Initialize the modal programmatically
                const modalElement = document.getElementById('addSalesModal');
                if (modalElement) {
                    // initSalesForm is now globally available via sales-form.js
                    if (typeof initSalesForm === 'function') {
                        initSalesForm();
                    } else {
                        console.error("initSalesForm not found! Make sure sales-form.js is loaded.");
                    }
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.error("Modal element #addSalesModal not found in fetched content");
                }
            }
        })
        .catch(err => console.error("Modal load error:", err));
};
