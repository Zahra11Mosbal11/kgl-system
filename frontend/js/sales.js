
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
        initSalesForm();
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error("Modal element #addSalesModal not found in fetched content");
      }
    })
    .catch(err => console.error("Modal load error:", err));
}

function initSalesForm() {
  console.log("Initializing Sales Form...");
  const form = document.getElementById("addSalesForm");
  if (!form) {
    console.error("Form #addSalesForm not found!");
    return;
  }

  const paymentMethod = document.getElementById("paymentMethod");
  const creditFields = document.getElementById("creditFields");
  const tonnageInput = document.getElementById("tonnage");
  const unitPriceInput = document.getElementById("unitPrice");
  const discountInput = document.getElementById("discount");
  const subtotalInput = document.getElementById("subtotal");
  const totalAmountInput = document.getElementById("totalAmount");
  const formErrors = document.getElementById("formErrors");

  if (!paymentMethod || !tonnageInput || !unitPriceInput || !totalAmountInput) {
    console.error("One or more required form fields missing IDs");
    return;
  }

  // Set default date to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const saleDateInput = document.getElementById("saleDate");
  if (saleDateInput) saleDateInput.value = now.toISOString().slice(0, 16);

  // Set sales agent name from session
  const sessionString = localStorage.getItem("currentSession");
  let currentUserBranch = "";
  if (sessionString) {
    const session = JSON.parse(sessionString);
    currentUserBranch = session.branch;
    const agentInput = document.getElementById("salesAgentName");
    if (session && session.username && agentInput) {
      agentInput.value = session.username;
    }
  }

  // Fetch and Populate Products & Clients
  let branchInventory = [];
  const fetchFormOptions = async () => {
    try {
      // 1. Fetch Inventory for dropdown
      const invData = await api.get("/inventory");
      if (invData.success) {
        branchInventory = invData.inventory;
        const productSelect = document.getElementById("produceName");
        productSelect.innerHTML = '<option value="">Select a product...</option>';
        branchInventory.forEach(item => {
          const option = document.createElement("option");
          option.value = item.produceName;
          option.textContent = `${item.produceName} (${item.quantity} T)`;
          productSelect.appendChild(option);
        });

        // Add change listener to update available stock display
        productSelect.addEventListener("change", () => {
          const selected = branchInventory.find(i => i.produceName === productSelect.value);
          document.getElementById("availableStock").textContent = selected ? selected.quantity : 0;
        });
      }

      // 2. Fetch Clients for datalist
      const clientData = await api.get("/clients");
      if (clientData.success) {
        const clientList = document.getElementById("clientList");
        clientList.innerHTML = "";
        window.allClients = clientData.clients; // Store globally for phone autocomplete
        clientData.clients.forEach(client => {
          const option = document.createElement("option");
          option.value = client.name;
          clientList.appendChild(option);
        });

        // Add input listener to buyerName for phone autocomplete
        const buyerInput = document.getElementById("buyerName");
        const phoneInput = document.getElementById("contact");
        buyerInput.addEventListener("input", () => {
          const matched = window.allClients.find(c => c.name.toLowerCase() === buyerInput.value.toLowerCase());
          if (matched && phoneInput) {
            phoneInput.value = matched.contact;
          }
        });
      }
    } catch (err) {
      console.error("Error fetching form options:", err);
    }
  };
  fetchFormOptions();

  // Toggle Credit Fields
  paymentMethod.addEventListener("change", () => {
    console.log("Payment method changed to:", paymentMethod.value);
    if (paymentMethod.value === "Credit") {
      creditFields.classList.remove("d-none");
      document.getElementById("nationalId").required = true;
      document.getElementById("location").required = true;
      document.getElementById("dueDate").required = true;
    } else {
      creditFields.classList.add("d-none");
      document.getElementById("nationalId").required = false;
      document.getElementById("location").required = false;
      document.getElementById("dueDate").required = false;
    }
  });

  // Calculation Logic
  const calculate = () => {
    const tonnage = parseFloat(tonnageInput.value) || 0;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    const subtotal = tonnage * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;

    if (subtotalInput) subtotalInput.value = Math.round(subtotal);
    totalAmountInput.value = Math.round(total);
  };

  [tonnageInput, unitPriceInput, discountInput].forEach(input => {
    if (input) input.addEventListener("input", calculate);
  });

  // Form Submission
  form.addEventListener("submit", async (e) => {
    console.log("Form submit triggered");
    e.preventDefault();
    formErrors.classList.add("d-none");
    formErrors.innerHTML = "";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log("Form Data Collected:", data);
    
    // Manual validation
    const errors = [];
    
    // Check for empty fields
    if (!data.produceName || !data.produceName.trim()) errors.push("Product Name is required");
    if (!data.buyerName || !data.buyerName.trim()) errors.push("Customer Name is required");
    if (!data.salesAgentName || !data.salesAgentName.trim()) errors.push("Sales Person is required");
    if (!data.contact || !data.contact.trim()) errors.push("Customer Phone is required");
    if (!data.tonnage) errors.push("Quantity (Tonnes) is required");
    if (!data.unitPrice) errors.push("Unit Price is required");
    
    // Constraint checks
    if (parseFloat(data.tonnage) <= 0) errors.push("Quantity must be greater than 0");
    if (parseFloat(data.unitPrice) <= 0) errors.push("Unit Price must be greater than 0");
    
    // Stock check
    const selectedProd = branchInventory.find(i => i.produceName === data.produceName);
    if (selectedProd && parseFloat(data.tonnage) > selectedProd.quantity) {
      errors.push(`Insufficient stock. Only ${selectedProd.quantity} Tonnes available for ${data.produceName}.`);
    }    
    const totalVal = parseFloat(totalAmountInput.value);
    if (isNaN(totalVal) || totalVal < 10000) errors.push("Total amount must be at least 10,000 UGX");

    // Contact validation for all sales (Mandatory and 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    const contactVal = data.contact ? data.contact.trim() : "";
    
    if (!contactVal) {
      errors.push("Customer Phone is required");
    } else if (!phoneRegex.test(contactVal)) {
      errors.push("Contact number must be exactly 10 digits (e.g., 0712345678)");
    }

    if (data.paymentMethod === "Credit") {
      if (!data.nationalId || !data.nationalId.trim()) errors.push("National ID (NIN) is required for credit sales");
      if (!data.location || !data.location.trim()) errors.push("Location is required for credit sales");
      if (!data.dueDate) errors.push("Due Date is required for credit sales");

      const ninRegex = /^[A-Z]{2}\d{7}[A-Z]{4}\d[A-Z]$/;
      if (data.nationalId && !ninRegex.test(data.nationalId.trim())) errors.push("Invalid National ID (NIN) format (e.g., CM12345678ABCD9E)");
    }

    if (errors.length > 0) {
      console.log("Validation errors found:", errors);
      formErrors.innerHTML = `<ul class="mb-0">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
      formErrors.classList.remove("d-none");
      formErrors.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Map frontend names to backend expectations
    const payload = {
      produceName: data.produceName,
      tonnage: parseFloat(data.tonnage),
      buyerName: data.buyerName,
      contact: data.contact, // Added contact to all sales
      salesAgentName: data.salesAgentName,
      notes: data.notes
    };

    let endpoint = "/sales/cash";
    if (data.paymentMethod === "Credit") {
      endpoint = "/sales/credit";
      payload.amountDue = totalVal;
      payload.nationalId = data.nationalId;
      payload.location = data.location;
      payload.dueDate = data.dueDate;
      payload.produceType = "Common"; 
    } else {
      payload.amountPaid = totalVal;
    }

    try {
      console.log("Sending payload to", endpoint, payload);
      const result = await api.post(endpoint, payload);
      console.log("API Result:", result);

      if (result.success) {
        const modalElement = document.getElementById('addSalesModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        if (modal) modal.hide();
        window.location.reload(); 
      } else {
        formErrors.innerHTML = result.error || "Failed to save sale";
        formErrors.classList.remove("d-none");
      }
    } catch (err) {
      console.error("Submission error:", err);
      formErrors.innerHTML = err.message || "A network error occurred";
      formErrors.classList.remove("d-none");
    }
  });
}
