function initSupplierForm() {
    const form = document.getElementById("supplierForm");
    const errorMsg = document.getElementById("supplierErrorMsg");

    if (!form) {
        console.error("Supplier form not found!");
        return;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Clear previous errors
        if (errorMsg) {
            errorMsg.classList.add("d-none");
            errorMsg.innerHTML = "";
        }

        // Collect Form Data
        const name = document.getElementById("supplierName").value.trim();
        const contactPerson = document.getElementById("contactPerson").value.trim();
        const contact = document.getElementById("supplierContact").value.trim();
        const location = document.getElementById("supplierLocation").value.trim();

        // Validation
        const errors = [];
        if (name.length < 3) errors.push("Supplier name must be at least 3 characters");
        if (contactPerson.length < 2) errors.push("Contact person name is too short");
        if (!/^[0-9]{10}$/.test(contact)) errors.push("Phone number must be exactly 10 digits");
        if (location.length < 2) errors.push("Location is too short");

        if (errors.length > 0) {
            if (errorMsg) {
                errorMsg.classList.remove("d-none");
                errorMsg.innerHTML = `<ul style="list-style: none; padding: 0; margin: 0;">${errors.map(err => `<li>⚠️ ${err}</li>`).join("")}</ul>`;
            }
            return;
        }

        const session = JSON.parse(localStorage.getItem("currentSession"));
        
        const payload = {
            name,
            contactPerson,
            contact,
            location,
            branch: (session && session.branch) ? session.branch : 'Maganjo',
            status: 'Active'
        };

        try {
            const response = await api.post('/suppliers', payload);
            
            if (response.success) {
                // Success Handling
                const modalElement = document.getElementById('addSupplierModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();

                // Refresh the table if we are on the suppliers page
                if (window.loadSuppliers) {
                    await window.loadSuppliers();
                }

                alert("Supplier added successfully!");
            } else {
                throw new Error(response.error || "Failed to save supplier");
            }
        } catch (error) {
            console.error("Submission error:", error);
            if (errorMsg) {
                errorMsg.classList.remove("d-none");
                errorMsg.innerHTML = `❌ ${error.message}`;
            }
        }
    });
}
