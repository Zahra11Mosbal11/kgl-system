
// Procurement Standalone Page Logic
document.addEventListener("DOMContentLoaded", () => {
    // Check if shared logic is available
    if (typeof initProcurementForm === 'function') {
        initProcurementForm();
    } else {
        console.error("Shared procurement form logic not found! Please ensure procurement-form.js is loaded.");
    }
});
