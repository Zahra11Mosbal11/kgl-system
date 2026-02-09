
// Sales Agent Dashboard - Filter Sales by Status
const salesFilterButtons = document.querySelectorAll(".sales-filter-btn");
const salesRows = document.querySelectorAll("#salesTableBody tr");

salesFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    salesFilterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    salesRows.forEach(row => {
      const status = row.dataset.status;
      if (filter === "all" || status === filter) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
});

// Sales Agent Dashboard - Search Sales
const salesSearchInput = document.getElementById("salesSearch");
if (salesSearchInput) {
  salesSearchInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();

    salesRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(value) ? "" : "none";
    });
  });
}

// Fetch modal helper (can be shared or duplicated if utility file exists)
// eslint-disable-next-line no-unused-vars
function fetchModal(modalPath) {
  fetch(modalPath)
    .then(res => res.text())
    .then(data => {
      document.getElementById("modal-container").innerHTML = data;
    })
    .catch(err => console.error("Modal load error:", err));
}
