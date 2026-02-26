document.addEventListener("DOMContentLoaded", () => {
  // Auth Check
  const session = JSON.parse(localStorage.getItem("currentSession"));

  if (!session || !session.username || session.role !== "Director") {
    window.location.href = "index.html";
    return;
  }

  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    // Check if it's the dashboard or a specific report page
    if (welcomeMsg.innerText.includes("User")) {
        welcomeMsg.innerHTML = `${session.username} <span>(${session.role})</span>`;
    }
    // For other pages, keep the page title but acknowledge the user if needed
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("currentSession");
      window.location.href = "index.html";
    });
  }
});
