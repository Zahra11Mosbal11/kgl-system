
// Purchase Reports Management Logic
document.addEventListener("DOMContentLoaded", () => {
    // Auth Check
    const session = JSON.parse(localStorage.getItem("currentSession"));
    
    if (!session || !session.username) {
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

    // --- Filter Initialization ---
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const supplierFilter = document.getElementById('supplierFilter');
    const productFilter = document.getElementById('productFilter');

    [startDate, endDate, supplierFilter, productFilter].forEach(el => {
        if (el) el.addEventListener('change', renderReport);
    });

    fetchSuppliers();
    fetchPurchases();
});

let allPurchasesData = [];

async function fetchSuppliers() {
    try {
        const data = await api.get("/suppliers");
        const supplierFilter = document.getElementById('supplierFilter');
        if (data.success && supplierFilter) {
            supplierFilter.innerHTML = '<option value="all">All Suppliers</option>';
            data.suppliers.forEach(s => {
                supplierFilter.innerHTML += `<option value="${s.name}">${s.name}</option>`;
            });
        }
    } catch (err) {
        console.error("Error fetching suppliers:", err);
    }
}

async function fetchPurchases() {
    console.log("Fetching purchases data...");
    const reportTableBody = document.getElementById('reportTableBody');
    if (reportTableBody) {
        reportTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading purchases data...</td></tr>';
    }

    try {
        const data = await api.get("/procurement");
        console.log("API Response:", data);
        if (data.purchases) {
            allPurchasesData = data.purchases;
            
            // Collect unique products for the product filter
            const products = [...new Set(allPurchasesData.map(p => p.produceName))];
            const productFilter = document.getElementById('productFilter');
            if (productFilter) {
                productFilter.innerHTML = '<option value="all">All Products</option>';
                products.forEach(p => {
                    productFilter.innerHTML += `<option value="${p.toLowerCase()}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`;
                });
            }

            renderReport();
        } else {
            if (reportTableBody) {
                reportTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Failed to load data</td></tr>';
            }
        }
    } catch (err) {
        console.error("Error fetching purchases:", err);
        if (reportTableBody) {
            reportTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error connecting to server</td></tr>';
        }
    }
}

function renderReport() {
    console.log("Rendering purchase report...");
    const reportTableBody = document.getElementById('reportTableBody');
    if (!reportTableBody) return;

    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const supplier = document.getElementById('supplierFilter').value;
    const product = document.getElementById('productFilter').value;

    let startDate = start ? new Date(start) : null;
    let endDate = end ? new Date(end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const filteredData = allPurchasesData.filter(item => {
        const itemDate = new Date(item.date);
        
        const dateMatch = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
        const supplierMatch = (supplier === 'all') || (item.dealerName === supplier);
        const productMatch = (product === 'all') || (item.produceName.toLowerCase() === product.toLowerCase());

        return dateMatch && supplierMatch && productMatch;
    });

    reportTableBody.innerHTML = '';
    if (filteredData.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No records found for selected filters</td></tr>';
    } else {
        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            
            const isDelivered = item.deliveryDate && new Date(item.deliveryDate) <= new Date();
            const deliveryBadge = isDelivered ? '<span class="badge active">Received</span>' : '<span class="badge credit">In Way</span>';
            const paymentBadge = item.paymentStatus === 'Paid' ? '<span class="badge bg-info">Paid</span>' : '<span class="badge bg-secondary">Pending</span>';
            
            tr.innerHTML = `
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${item.dealerName}</td>
                <td style="text-transform: capitalize;">${item.produceName}</td>
                <td>${item.tonnage.toLocaleString()} KG</td>
                <td>UGX ${item.cost.toLocaleString()}</td>
                <td>${deliveryBadge}</td>
                <td>${paymentBadge}</td>
            `;
            reportTableBody.appendChild(tr);
        });
    }
}
