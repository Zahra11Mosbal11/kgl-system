
// Sales Agent Dashboard Logic
document.addEventListener("DOMContentLoaded", () => {
  const salesTableBody = document.getElementById("salesTableBody");
  const salesSearchInput = document.getElementById("salesSearch");
  const salesFilterButtons = document.querySelectorAll(".sales-filter-btn");

  // Load sales data on page load
  fetchSales();

  // Helper: Fetch and display sales
  async function fetchSales() {
    try {
      const data = await api.get("/sales");

      if (data.success) {
        renderSalesTable(data.cashSales, data.creditSales);
      } else {
        console.error("Failed to fetch sales:", data.error);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  }

  function renderSalesTable(cashSales, creditSales) {
    salesTableBody.innerHTML = "";
    
    // Update Overall Stats
    const totalCash = cashSales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const totalCredit = creditSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
    const totalSales = totalCash + totalCredit;

    const totalSalesElem = document.getElementById("totalSalesVal");
    const cashSalesElem = document.getElementById("cashSalesVal");
    const creditSalesElem = document.getElementById("creditSalesVal");

    if (totalSalesElem) totalSalesElem.textContent = `${totalSales.toLocaleString()} UGX`;
    if (cashSalesElem) cashSalesElem.textContent = `${totalCash.toLocaleString()} UGX`;
    if (creditSalesElem) creditSalesElem.textContent = `${totalCredit.toLocaleString()} UGX`;

    const allSales = [
      ...cashSales.map(s => ({ ...s, type: 'cash' })),
      ...creditSales.map(s => ({ ...s, type: 'credit' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    allSales.forEach(sale => {
      const row = document.createElement("tr");
      row.dataset.status = sale.type;
      row.innerHTML = `
        <td>${sale._id.substring(sale._id.length - 6).toUpperCase()}</td>
        <td>${sale.produceName}</td>
        <td>${sale.tonnage} Tonnes</td>
        <td>${(sale.amountPaid || sale.amountDue).toLocaleString()} UGX</td>
        <td class="${sale.type === 'credit' ? 'text-warning' : ''}">${sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}</td>
      `;
      salesTableBody.appendChild(row);
    });
  }

  // Filter Sales Logic
  salesFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      salesFilterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      const rows = salesTableBody.querySelectorAll("tr");
      rows.forEach(row => {
        const status = row.dataset.status;
        row.style.display = (filter === "all" || status === filter) ? "" : "none";
      });
    });
  });

  // Search Logic
  if (salesSearchInput) {
    salesSearchInput.addEventListener("input", function () {
      const value = this.value.toLowerCase();
      const rows = salesTableBody.querySelectorAll("tr");
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
      });
    });
  }
});

// Modal Interaction Logic
function fetchModal(modalPath) {
  console.log("Fetching modal:", modalPath);
  fetch(modalPath)
    .then(res => res.text())
    .then(data => {
      document.getElementById("modal-container").innerHTML = data;
      
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
    })
    .catch(err => console.error("Modal load error:", err));
}
