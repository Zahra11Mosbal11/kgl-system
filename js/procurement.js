
const form = document.getElementById("procurementForm");
const error = document.getElementById("errorMsg");

const qty = document.getElementById("quantity");
const price = document.getElementById("price");
const total = document.getElementById("total");

qty.addEventListener("input", calculateTotal);
price.addEventListener("input", calculateTotal);

function calculateTotal() {
  const q = Number(qty.value);
  const p = Number(price.value);

  if (q > 0 && p > 0) {
    total.value = (q * p).toFixed(2);
  }
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const supplier = document.getElementById("supplierName").value;
const contact = document.getElementById("supplierContact").value;
const invoice = document.getElementById("invoiceNumber").value;
const product = document.getElementById("ProductName").value;
  const delivery = document.getElementById("deliveryDate").value;
  const receipt = document.getElementById("receipt").value;

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
  const paymentStatus = document.querySelector('input[name="payment_status"]:checked');

  if (supplier.length < 3) {
    error.textContent = "Supplier name is required";
  }
  else if (contact.length < 9) {
    error.textContent = "Invalid contact number";
  }
  else if (invoice === "") {
    error.textContent = "Invoice number is required";
  }
  else if (product === "") {
    error.textContent = "Product name is required";
  }
  else if (qty.value <= 0) {
    error.textContent = "Quantity must be greater than 0";
  }
  else if (price.value <= 0) {
    error.textContent = "Unit price must be greater than 0";
  }
  else if (!paymentMethod) {
    error.textContent = "Please select a payment method";
  }
  else if (!paymentStatus) {
    error.textContent = "Please select a payment status";
  }
  else if (new Date(delivery) < new Date()) {
    error.textContent = "Delivery date cannot be in the past";
  }
  else if (receipt === "") {
    error.textContent = "Please upload the receipt";
  }
  else {
    error.textContent = "";
    alert("Procurement form submitted successfully!");
    form.reset();
    total.value = "";
  }
});

