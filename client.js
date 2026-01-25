
// Client Management Dashboard - Filter Clients by Status
const filterButtons = document.querySelectorAll(".filter-btn");
const rows = document.querySelectorAll("#clientsTableBody tr");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    rows.forEach(row => {
      const status = row.dataset.status;

      if (filter === "all" || status === filter) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
});


// Client Management Dashboard - Search Clients by Name or Email
document.getElementById("clientSearch").addEventListener("input", function () {
  const value = this.value.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(value) ? "" : "none";
  });
});

/*Example of setting data-status attribute based on client data
document.querySelectorAll("#clientsTableBody tr").forEach(row => {
  const status = row.querySelector("td.status").textContent.toLowerCase();
  row.dataset.status = status;
});*/

// fatch modal
function fetchModal(modalPath) {
  fetch(modalPath)
    .then(res => res.text())
    .then(data => {
      document.getElementById("modal-container").innerHTML = data;
    })
    .catch(err => console.error("Modal load error:", err));
}

let viewBtns = document.querySelector(".btn-view");
let editBtns = document.querySelector(".btn-edit");

viewBtns.addEventListener("click", function() {
  fetchModal('modals/viewClient.html');
}); 
editBtns.addEventListener("click", function() {
 alert("hello");
});