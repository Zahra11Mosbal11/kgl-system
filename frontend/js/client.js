// Client Management Logic
document.addEventListener("DOMContentLoaded", () => {
  // Auth Check
  const session = JSON.parse(localStorage.getItem("currentSession"));
  
  if (!session || !session.username) {
    window.location.href = "index.html";
    return;
  }

  const welcomeMsg = document.querySelector(".header h2");
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

  const clientsTableBody = document.getElementById("clientsTableBody");
  const clientSearchInput = document.getElementById("clientSearch");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Initial load
  fetchClients();

  // Fetch and display clients
  async function fetchClients() {
    console.log("Fetching clients...");
    try {
      const data = await api.get("/clients");
      console.log("Clients API Response:", data);
      if (data.success) {
        if (!data.clients || data.clients.length === 0) {
          console.log("No clients found.");
          if (clientsTableBody) {
            clientsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No clients found. Click "Add New Client" to start.</td></tr>';
          }
        } else {
          renderClientsTable(data.clients);
        }
      } else {
        console.error("Failed to fetch clients:", data.error);
        if (clientsTableBody) {
          clientsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error: ${data.error || 'Failed to load clients'}</td></tr>`;
        }
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      if (clientsTableBody) {
        clientsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Network Error: ${err.message || 'Could not connect to server'}</td></tr>`;
      }
    }
  }

  function renderClientsTable(clients) {
    if (!clientsTableBody) return;
    clientsTableBody.innerHTML = "";

    clients.forEach(client => {
      const row = document.createElement("tr");
      // Determine status (this could be more complex in real logic)
      const status = client.totalDebt > 0 ? "credit" : "active";
      row.dataset.status = status;

      row.innerHTML = `
        <td>
          <div class="client-details">
            <strong>${client.name}</strong>
            <p>ID: ${client._id.substring(client._id.length - 6).toUpperCase()}</p>
          </div>
        </td>
        <td>${client.totalPurchases || 0}</td>
        <td>
          <div>${client.contact}</div>
          <small class="text-muted">${client.location}</small>
        </td>
        <td class="${client.totalDebt > 0 ? 'text-warning' : 'text-success'}">
          ${(client.totalDebt || 0).toLocaleString()} UGX
        </td>
        <td><span class="badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td>${client.updatedAt ? new Date(client.updatedAt).toISOString().split('T')[0] : '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-view" title="View Details" onclick="viewClient('${client._id}')">
              <i>View</i>
            </button>
            <button class="btn-action btn-edit" title="Edit Client" onclick="editClient('${client._id}')">
              <i>Edit</i>
            </button>
          </div>
        </td>
      `;
      clientsTableBody.appendChild(row);
    });
  }

  // Filter Logic
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      const rows = clientsTableBody.querySelectorAll("tr");
      rows.forEach(row => {
        const status = row.dataset.status;
        row.style.display = (filter === "all" || status === filter) ? "" : "none";
      });
    });
  });

  // Search Logic
  if (clientSearchInput) {
    clientSearchInput.addEventListener("input", function () {
      const value = this.value.toLowerCase();
      const rows = clientsTableBody.querySelectorAll("tr");
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
      });
    });
  }
});

// Modal Interaction Logic
function fetchModal(modalPath, clientId = null) {
  fetch(modalPath)
    .then(res => res.text())
    .then(data => {
      document.getElementById("modal-container").innerHTML = data;
      
      if (modalPath.includes('add-client.html')) {
        const modalElement = document.getElementById('addClientModal');
        if (modalElement) {
          initAddClientForm();
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      } else if (modalPath.includes('view-client.html') && clientId) {
        const modalElement = document.getElementById('clientDetailsModal');
        if (modalElement) {
          loadClientDetails(clientId);
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      } else if (modalPath.includes('edit-client.html') && clientId) {
        const modalElement = document.getElementById('editClientModal');
        if (modalElement) {
          initEditClientForm(clientId);
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }
    })
    .catch(err => console.error("Modal load error:", err));
}

async function loadClientDetails(id) {
  try {
    const clients = await api.get("/clients");
    const client = clients.clients.find(c => c._id === id);
    if (!client) return;

    // Populate Info
    document.getElementById("viewName").textContent = client.name;
    document.getElementById("viewContact").textContent = client.contact;
    document.getElementById("viewLocation").textContent = client.location;
    document.getElementById("viewNIN").textContent = client.nationalId || "N/A";
    document.getElementById("viewTotalDebt").textContent = `${(client.totalDebt || 0).toLocaleString()} UGX`;
    document.getElementById("viewBranch").textContent = client.branch;

    // Fetch transactions linked to this client
    // We'll search for sales where buyerName matches client.name
    const salesData = await api.get("/sales");
    const historyBody = document.getElementById("clientHistoryBody");
    historyBody.innerHTML = "";

    const allSales = [
      ...(salesData.cashSales || []).map(s => ({ ...s, type: 'cash' })),
      ...(salesData.creditSales || []).map(s => ({ ...s, type: 'credit' }))
    ].filter(s => s.buyerName === client.name || s.nationalId === client.nationalId)
     .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allSales.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found</td></tr>';
    } else {
      allSales.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(s.date).toISOString().split('T')[0]}</td>
          <td>${s.produceName}</td>
          <td>${s.tonnage} T</td>
          <td>${(s.amountPaid || s.amountDue).toLocaleString()}</td>
          <td><span class="badge ${s.type === 'credit' ? 'bg-warning text-dark' : 'bg-success'}">${s.type}</span></td>
        `;
        historyBody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Error loading client details:", err);
  }
}

async function initEditClientForm(id) {
  const form = document.getElementById("editClientForm");
  const formErrors = document.getElementById("editFormErrors");
  if (!form) return;

  try {
    // 1. Fetch current client data
    const clients = await api.get("/clients");
    const client = clients.clients.find(c => c._id === id);
    if (!client) return;

    // 2. Pre-fill form
    document.getElementById("editClientId").value = client._id;
    document.getElementById("editClientName").value = client.name;
    document.getElementById("editClientPhone").value = client.contact;
    document.getElementById("editClientLocation").value = client.location;
    if (document.getElementById("editClientNIN")) document.getElementById("editClientNIN").value = client.nationalId || "";
    // Note: Other fields (type, email, notes) might not be in the minimal schema but we'll try
    // Since the schema only has [name, contact, location, nationalId, totalDebt, branch]
    
  } catch (err) {
    console.error("Error fetching client for edit:", err);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErrors.classList.add("d-none");
    formErrors.innerHTML = "";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validation
    const errors = [];
    if (!data.name.trim()) errors.push("Name is required");
    if (!data.location.trim()) errors.push("Location is required");
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!data.contact || !phoneRegex.test(data.contact.trim())) {
      errors.push("Contact number must be exactly 10 digits (e.g., 0712345678)");
    }

    if (errors.length > 0) {
      formErrors.innerHTML = `<ul class="mb-0">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
      formErrors.classList.remove("d-none");
      return;
    }

    try {
      const result = await api.put(`/clients/${id}`, data);
      if (result.success) {
        const modalElement = document.getElementById('editClientModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        if (modal) modal.hide();
        window.location.reload(); 
      } else {
        formErrors.innerHTML = result.error || "Failed to update client";
        formErrors.classList.remove("d-none");
      }
    } catch (err) {
      console.error("Update error:", err);
      formErrors.innerHTML = err.message || "A network error occurred";
      formErrors.classList.remove("d-none");
    }
  });
}

function initAddClientForm() {
  const form = document.getElementById("addClientForm");
  const formErrors = document.getElementById("formErrors");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErrors.classList.add("d-none");
    formErrors.innerHTML = "";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validation
    const errors = [];
    if (!data.name.trim()) errors.push("Name is required");
    if (!data.location.trim()) errors.push("Location is required");
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!data.contact || !phoneRegex.test(data.contact.trim())) {
      errors.push("Contact number must be exactly 10 digits (e.g., 0712345678)");
    }

    if (data.nationalId && data.nationalId.trim()) {
      const ninRegex = /^[A-Z]{2}\d{7}[A-Z]{4}\d[A-Z]$/;
      if (!ninRegex.test(data.nationalId.trim())) {
        errors.push("Invalid National ID (NIN) format (e.g., CM12345678ABCD9E)");
      }
    }

    if (errors.length > 0) {
      formErrors.innerHTML = `<ul class="mb-0">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
      formErrors.classList.remove("d-none");
      return;
    }

    try {
      const result = await api.post("/clients", data);
      if (result.success) {
        const modalElement = document.getElementById('addClientModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        if (modal) modal.hide();
        window.location.reload(); 
      } else {
        formErrors.innerHTML = result.error || "Failed to save client";
        formErrors.classList.remove("d-none");
      }
    } catch (err) {
      console.error("Submission error:", err);
      formErrors.innerHTML = err.message || "A network error occurred";
      formErrors.classList.remove("d-none");
    }
  });
}

// Global functions for view/edit buttons in table
function viewClient(id) {
  fetchModal('modal/view-client.html', id);
}

function editClient(id) {
  fetchModal('modal/edit-client.html', id);
}