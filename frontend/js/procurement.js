
document.addEventListener("input", function (e) {
  if (e.target.id === "quantity" || e.target.id === "price") {
    calculateTotal();
  }
});

function calculateTotal() {
  const qty = document.getElementById("quantity");
  const price = document.getElementById("price");
  const total = document.getElementById("total");

  if (qty && price && total) {
    const q = Number(qty.value);
    const p = Number(price.value);

    if (q > 0 && p > 0) {
      total.value = (q * p).toFixed(2);
    } else {
      total.value = "";
    }
  }
}

document.addEventListener("submit", async function (e) {
  if (e.target.id === "procurementForm") {
    e.preventDefault();

    const form = e.target;
    const error = document.getElementById("errorMsg");
    
    // Get fields
    const supplier = document.getElementById("supplierName").value;
    const contact = document.getElementById("supplierContact").value;
    const product = document.getElementById("ProductName").value;
    const type = document.getElementById("Category").value;
    const qty = Number(document.getElementById("quantity").value);
    const unitPrice = Number(document.getElementById("price").value);
    const sellingPrice = Number(document.getElementById("sellingPrice").value);
    const total = Number(document.getElementById("total").value);
    const date = document.getElementById("purchaseDate").value;
    
    const paymentMethod = form.querySelector('input[name="payment_method"]:checked');
    const paymentStatus = form.querySelector('input[name="payment_status"]:checked');

    // Basic Validation
    if (supplier.length < 3) {
      error.textContent = "Supplier name is required";
      return;
    } 
    if (!/^[0-9]{10}$/.test(contact)) {
      error.textContent = "Contact number must be 10 digits";
      return;
    }
    if (qty < 100) {
      error.textContent = "Quantity must be at least 100 kg";
      return;
    }
    if (total < 10000) {
      error.textContent = "Total cost must be at least 10,000 UGX";
      return;
    }
    if (sellingPrice <= unitPrice) {
        error.textContent = "Selling price must be greater than unit cost";
        return;
    }
    if (!paymentMethod || !paymentStatus) {
      error.textContent = "Please select payment method and status";
      return;
    }

    const session = JSON.parse(localStorage.getItem("currentSession"));
    
    const formData = {
        produceName: product,
        produceType: type,
        tonnage: qty,
        cost: total,
        dealerName: supplier,
        contact: contact,
        sellingPrice: sellingPrice,
        date: date,
        time: new Date().toTimeString().split(' ')[0],
        branch: session.branch || 'Maganjo',
        invoiceNumber: document.getElementById("invoiceNumber").value,
        paymentMethod: paymentMethod.value,
        paymentStatus: paymentStatus.value,
        deliveryDate: document.getElementById("deliveryDate").value,
        notes: document.getElementById("notes").value
    };

    try {
        error.textContent = "Submitting...";
        const response = await api.post('/procurement', formData);
        
        if (response.success) {
            error.textContent = "";
            alert("Procurement registered successfully!");
            form.reset();
            
            // Close modal
            const modalEl = document.getElementById('addPurchasesModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            // Refresh the list if we are on the purchases page
            if (typeof window.loadPurchases === 'function') {
                window.loadPurchases();
            }
        }
    } catch (err) {
        error.textContent = err.message || "Failed to submit procurement";
        console.error("Procurement submission error:", err);
    }
  }
});

