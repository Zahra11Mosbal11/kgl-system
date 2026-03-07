
// Shared Sales Form Logic (Used by both Sales Agent and Manager)

/**
 * Initializes the sales form logic once the modal is loaded.
 * Handles:
 * - Form data collection and validation
 * - Dynamic pricing calculations
 * - Stock checking
 * - Toggling credit-specific fields
 * - Submitting to the correct API endpoint
 */
function initSalesForm() {
    console.log("Initializing Shared Sales Form...");
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

    // Get current session for branch and user info
    const sessionString = localStorage.getItem("currentSession");
    let currentUserBranch = "";
    let isGlobalUser = false;
    if (sessionString) {
        const session = JSON.parse(sessionString);
        currentUserBranch = session.branch;
        isGlobalUser = session.role === 'manager' || session.role === 'director';
        const agentInput = document.getElementById("salesAgentName");
        if (session && session.username && agentInput) {
            agentInput.value = session.username;
        }

        if (isGlobalUser) {
            const branchContainer = document.getElementById("salesBranchFieldContainer");
            if (branchContainer) branchContainer.style.display = "block";
        }
    }

    // Fetch and Populate Products & Clients
    let branchInventory = [];
    const fetchFormOptions = async () => {
        try {
            // 1. Fetch Inventory for dropdown
            const invData = await api.get("/inventory");
            if (invData.success) {
                const branchSelect = document.getElementById("salesBranchSelect");
                const getEffectiveBranch = () => {
                   if (isGlobalUser && branchSelect) return branchSelect.value;
                   return currentUserBranch;
                };

                const updateProductDropdown = () => {
                    const effectiveBranch = getEffectiveBranch();
                    branchInventory = invData.inventory.filter(i => i.branch === effectiveBranch);
                    
                    const productSelect = document.getElementById("produceName");
                    productSelect.innerHTML = '<option value="">Select a product...</option>';
                    branchInventory.forEach(item => {
                        const option = document.createElement("option");
                        option.value = item.produceName;
                        option.textContent = `${item.produceName} (${item.quantity} T)`;
                        productSelect.appendChild(option);
                    });
                     // Clear subtotal/total on branch change
                     if (tonnageInput) calculate();
                };

                updateProductDropdown();

                if (isGlobalUser && branchSelect) {
                    branchSelect.addEventListener("change", updateProductDropdown);
                }
                
                const productSelect = document.getElementById("produceName");
                productSelect.innerHTML = '<option value="">Select a product...</option>';
                branchInventory.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.produceName;
                    option.textContent = `${item.produceName} (${item.quantity} T)`;
                    productSelect.appendChild(option);
                });

                // Add change listener to update available stock and price
                productSelect.addEventListener("change", () => {
                    const selected = branchInventory.find(i => i.produceName === productSelect.value);
                    document.getElementById("availableStock").textContent = selected ? selected.quantity : 0;
                    
                    if (selected && selected.latestSellingPrice) {
                        unitPriceInput.value = selected.latestSellingPrice;
                        // Trigger calculation
                        tonnageInput.dispatchEvent(new Event('input'));
                    }
                });

                // Enforce read-only price for Sales Agents
                const session = JSON.parse(localStorage.getItem("currentSession"));
                if (session && session.role === 'sales_agent') {
                    unitPriceInput.readOnly = true;
                    unitPriceInput.style.backgroundColor = "#e9ecef";
                    unitPriceInput.title = "Prices are set by the Manager";
                }
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
                    if (matched) {
                        if (phoneInput) phoneInput.value = matched.contact;
                        
                        const ninInput = document.getElementById("nationalId");
                        const locInput = document.getElementById("location");
                        
                        if (ninInput && matched.nationalId) ninInput.value = matched.nationalId;
                        if (locInput && matched.location) locInput.value = matched.location;
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
        e.preventDefault();
        formErrors.classList.add("d-none");
        formErrors.innerHTML = "";

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Manual validation
        const errors = [];
        
        if (!data.produceName) errors.push("Product Name is required");
        if (!data.buyerName) errors.push("Customer Name is required");
        if (!data.salesAgentName) errors.push("Sales Person is required");
        if (!data.contact) errors.push("Customer Phone is required");
        if (!data.tonnage) errors.push("Quantity (Tonnes) is required");
        if (!data.unitPrice) errors.push("Unit Price is required");
        
        if (parseFloat(data.tonnage) <= 0) errors.push("Quantity must be greater than 0");
        if (parseFloat(data.unitPrice) <= 0) errors.push("Unit Price must be greater than 0");
        
        // Stock check
        const selectedProd = branchInventory.find(i => i.produceName === data.produceName);
        if (selectedProd && parseFloat(data.tonnage) > selectedProd.quantity) {
            errors.push(`Insufficient stock. Only ${selectedProd.quantity} Tonnes available.`);
        }    
        
        const totalVal = parseFloat(totalAmountInput.value);
        if (isNaN(totalVal) || totalVal < 10000) errors.push("Total amount must be at least 10,000 UGX");

        // Phone validation
        const phoneRegex = /^[0-9]{10}$/;
        if (data.contact && !phoneRegex.test(data.contact.trim())) {
            errors.push("Contact number must be exactly 10 digits");
        }

        if (data.paymentMethod === "Credit") {
            if (!data.nationalId) errors.push("National ID is required for credit");
            if (!data.location) errors.push("Location is required for credit");
            if (!data.dueDate) errors.push("Due Date is required for credit");

            const ninRegex = /^[A-Z]{2}[0-9A-Z]{12}$/;

            if (data.nationalId && !ninRegex.test(data.nationalId.trim().toUpperCase())) {
                errors.push("Invalid National ID format (Expected 14 characters)");
            }
        }

        if (errors.length > 0) {
            formErrors.innerHTML = `<ul class="mb-0">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
            formErrors.classList.remove("d-none");
            formErrors.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const branchSelect = document.getElementById("salesBranchSelect");
        const payload = {
            produceName: data.produceName,
            tonnage: parseFloat(data.tonnage),
            buyerName: data.buyerName,
            contact: data.contact,
            salesAgentName: data.salesAgentName,
            notes: data.notes,
            branch: isGlobalUser ? (branchSelect ? branchSelect.value : 'Maganjo') : currentUserBranch
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
            const result = await api.post(endpoint, payload);
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
