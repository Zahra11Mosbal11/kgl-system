document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Credit Reports <span>(${session.role})</span>`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }

    // Fetch and Update Credit Data
    try {
        const response = await api.get('/sales'); // Credit sales are part of /sales
        if (response.success) {
            const creditSales = response.creditSales || [];
            updateCreditUI(creditSales);
            renderCharts(creditSales);
        }
    } catch (error) {
        console.error("Error fetching credit reports:", error);
    }

    function updateCreditUI(creditSales) {
        const tableBody = document.getElementById('creditTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        const sorted = [...creditSales].sort((a,b) => b.amountDue - a.amountDue);
        
        if (sorted.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No outstanding credit found.</td></tr>';
            return;
        }

        sorted.slice(0, 15).forEach(item => {
            const tr = document.createElement('tr');
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = dueDate && dueDate < new Date() && item.paymentStatus !== 'Completed';
            
            tr.innerHTML = `
                <td>${item.clientName}</td>
                <td>UGX ${item.amountDue.toLocaleString()}</td>
                <td>${dueDate ? dueDate.toLocaleDateString() : 'N/A'}</td>
                <td>${item.branch}</td>
                <td>
                    ${isOverdue ? '<button class="btn btn-sm btn-danger">Overdue</button>' : '<button class="btn btn-sm btn-outline-primary">Follow Up</button>'}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    function renderCharts(creditSales) {
        const canvas = document.getElementById('creditAgingChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const now = new Date();
        const buckets = [0, 0, 0, 0];
        
        creditSales.forEach(s => {
            if (!s.dueDate) return;
            const diffDays = Math.floor((now - new Date(s.dueDate)) / (1000 * 60 * 60 * 24));
            if (diffDays <= 15) buckets[0] += s.amountDue;
            else if (diffDays <= 30) buckets[1] += s.amountDue;
            else if (diffDays <= 60) buckets[2] += s.amountDue;
            else buckets[3] += s.amountDue;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-15 Days', '16-30 Days', '31-60 Days', '60+ Days'],
                datasets: [{
                    label: 'Amount (Millions UGX)',
                    data: buckets.map(b => b / 1000000),
                    backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});
