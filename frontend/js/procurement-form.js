
// Shared Procurement Form Logic (Used by both Manager Dashboard and Procurement Page)

/**
 * Initializes the procurement form logic.
 * Handles:
 * - Automatic calculations (Tonnage * Unit Price)
 * - Form validation (Min qty, min total, selling price > cost)
 * - API submission to /procurement
 * - Default date settings
 */
function initProcurementForm() {
    console.log("Initializing Shared Procurement Form...");
    const form = document.getElementById("procurementForm");
    if (!form) {
        console.error("Form #procurementForm not found!");
        return;
    }

    const qtyInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    const totalInput = document.getElementById("total");
    const sellingPriceInput = document.getElementById("sellingPrice");
    const produceTypeInput = document.getElementById("produceType");
    const errorMsg = document.getElementById("errorMsg");
    const formErrors = document.getElementById("formErrors");

    if (!qtyInput || !priceInput || !totalInput) {
        console.error("Missing required calculation fields!");
        return;
    }

    // Calculation Logic
    const calculateTotal = () => {
        const q = Number(qtyInput.value);
        const p = Number(priceInput.value);
        if (q > 0 && p > 0) {
            totalInput.value = (q * p).toFixed(0);
        } else {
            totalInput.value = "";
        }
    };

    qtyInput.addEventListener('input', calculateTotal);
    priceInput.addEventListener('input', calculateTotal);

    // Set default dates
    const dateInput = document.getElementById("purchaseDate");
    const deliveryInput = document.getElementById("deliveryDate");
    const today = new Date().toISOString().split('T')[0];
    if (dateInput && !dateInput.value) dateInput.value = today;
    if (deliveryInput && !deliveryInput.value) deliveryInput.value = today;

    // Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        formErrors.classList.add("d-none");
        formErrors.innerHTML = "";
        if (errorMsg) errorMsg.textContent = "";

        // Collect Form Data
        const supplier = document.getElementById("supplierName").value.trim();
        const contact = document.getElementById("supplierContact").value.trim();
        const product = document.getElementById("ProductName").value.trim();
        const qty = Number(qtyInput.value);
        const unitPrice = Number(priceInput.value);
        const sellingPrice = sellingPriceInput ? Number(sellingPriceInput.value) : 0;
        const total = Number(totalInput.value);
        const date = dateInput.value;
        const produceType = produceTypeInput ? produceTypeInput.value.trim() : "";
        
        const paymentMethod = form.querySelector('input[name="payment_method"]:checked');
        const paymentStatus = form.querySelector('input[name="payment_status"]:checked');

        // Validation
        const errors = [];
        if (supplier.length < 3) errors.push("Supplier name must be at least 3 characters");
        if (!/^[0-9]{10}$/.test(contact)) errors.push("Contact number must be exactly 10 digits (e.g., 0712345678)");
        if (qty < 100) errors.push("Quantity must be at least 100 kg");
        if (total < 10000) errors.push("Total cost must be at least 10,000 UGX");
        
        // Produce Type Validation (alphabets only, >= 2 chars)
        if (!/^[A-Za-z\s]{2,}$/.test(produceType)) {
            errors.push("Produce type must be alphabets only and at least 2 characters");
        }
        
        if (sellingPriceInput && sellingPrice <= unitPrice) {
            errors.push("Selling price must be greater than unit cost");
        }
        
        if (!paymentMethod || !paymentStatus) {
            errors.push("Please select payment method and status");
        }
        if (errors.length > 0) {
            formErrors.innerHTML = `<ul class="mb-0">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
            formErrors.classList.remove("d-none");
            formErrors.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if (errors.length > 0) {
            const currentErrorMsg = document.getElementById("errorMsg");
            if (currentErrorMsg) {
                currentErrorMsg.innerHTML = `<ul style="list-style: none; padding: 0; margin: 0;">${errors.map(err => `<li>⚠️ ${err}</li>`).join("")}</ul>`;
            }
            return;
        }

        const session = JSON.parse(localStorage.getItem("currentSession"));
        
        const payload = {
            produceName: product,
            produceType: produceType,
            tonnage: qty,
            cost: total,
            dealerName: supplier,
            contact: contact,
            sellingPrice: sellingPrice,
            date: date,
            time: new Date().toTimeString().split(' ')[0],
            branch: (session && session.branch) ? session.branch : 'Maganjo',
            paymentMethod: paymentMethod.value,
            paymentStatus: paymentStatus.value,
            deliveryDate: (deliveryInput ? deliveryInput.value : date),
            notes: (document.getElementById("notes") ? document.getElementById("notes").value : "")
        };

        try {
            if (errorMsg) errorMsg.textContent = "Submitting...";
            const response = await api.post('/procurement', payload);
            
            if (response.success) {
                alert("Procurement registered successfully!");
                form.reset();
                
                // Handle modal closing if in dashboard
                const modalEl = document.getElementById('addPurchasesModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }

                // Refresh table if the load function exists
                if (typeof window.loadPurchases === 'function') {
                    window.loadPurchases();
                } else {
                    // Fallback to reload if not in SPA mode
                    window.location.reload();
                }
            } else {
                if (errorMsg) errorMsg.textContent = response.error || "Submission failed";
            }
        } catch (err) {
            console.error("Procurement submission error:", err);
            if (errorMsg) errorMsg.textContent = err.message || "A network error occurred";
        }
    });
}
