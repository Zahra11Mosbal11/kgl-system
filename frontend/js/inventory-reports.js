
// Inventory Reports Management Logic
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
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderReport);
    }

    fetchInventory();
});

let allInventoryData = [];

async function fetchInventory() {
    console.log("Fetching inventory data...");
    const reportTableBody = document.getElementById('reportTableBody');
    if (reportTableBody) {
        reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading inventory data...</td></tr>';
    }

    try {
        const data = await api.get("/inventory");
        console.log("API Response:", data);
        if (data.success) {
            allInventoryData = data.inventory || [];
            console.log(`Loaded ${allInventoryData.length} inventory items`);
            renderReport();
        } else {
            console.error("Failed to fetch inventory data:", data.error);
            if (reportTableBody) {
                reportTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error: ${data.error}</td></tr>`;
            }
        }
    } catch (err) {
        console.error("Error fetching inventory data:", err);
        if (reportTableBody) {
            reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Failed to connect to server</td></tr>';
        }
    }
}

function renderReport() {
    console.log("Rendering inventory report...");
    const reportTableBody = document.getElementById('reportTableBody');
    if (!reportTableBody) return;

    const statusValue = document.getElementById('statusFilter').value;
    
    // Filter Data
    const filteredData = allInventoryData.filter(item => {
        const quantity = item.quantity || 0;
        
        if (statusValue === 'all') return true;
        if (statusValue === 'in-stock') return quantity > 500;
        if (statusValue === 'low-stock') return quantity > 0 && quantity <= 500;
        if (statusValue === 'out-of-stock') return quantity === 0;
        
        return true;
    });

    // Update Table
    reportTableBody.innerHTML = '';
    if (filteredData.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No inventory items found for selected filter</td></tr>';
    } else {
        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            
            const quantity = item.quantity || 0;
            let statusBadge = '';
            
            if (quantity > 500) {
                statusBadge = '<span class="badge active">In Stock</span>';
            } else if (quantity > 0) {
                statusBadge = '<span class="badge credit">Low Stock</span>';
            } else {
                statusBadge = '<span class="badge danger" style="background-color: #e74c3c;">Out of Stock</span>';
            }

            const totalValue = (quantity * (item.latestCost || 0)).toLocaleString();
            const unitPrice = (item.latestCost || 0).toLocaleString();

            tr.innerHTML = `
                <td style="text-transform: capitalize;">${item.produceName}</td>
                <td>${quantity.toLocaleString()} Tonnes</td>
                <td>UGX ${unitPrice}</td>
                <td>UGX ${totalValue}</td>
                <td>${statusBadge}</td>
            `;
            reportTableBody.appendChild(tr);
        });
    }
}
