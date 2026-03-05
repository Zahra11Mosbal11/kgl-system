
/**
 * Shared Sidebar Logic
 * Renders role-based navigation menu and handles active states.
 */
document.addEventListener("DOMContentLoaded", () => {
    const session = JSON.parse(localStorage.getItem("currentSession"));
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    renderSidebar(session);
});

function renderSidebar(session) {
    const navMenu = document.querySelector(".nav-menu");
    if (!navMenu) return;

    const currentPath = window.location.pathname.split("/").pop();
    const role = session.role;

    const menus = {
        director: [
            { href: "director-dashboard.html", icon: "Rectangle 2804.svg", label: "Dashboard" },
            { href: "director-procurement-reports.html", icon: "report.svg", label: "Procurement Reports" },
            { href: "director-sales-reports.html", icon: "sales.svg", label: "Sales Reports" },
            { href: "director-credit-reports.html", icon: "checklist 1.svg", label: "Credit Reports" },
            { href: "director-stock-valuation.html", icon: "store.svg", label: "Stock Valuation" },
            { href: "director-user-management.html", icon: "suppliers.svg", label: "User Management" }
        ],
        manager: [
            { href: "manager-dashboard.html", icon: "Rectangle 2804.svg", label: "Dashboard" },
            { href: "manager-inventory.html", icon: "inventory.svg", label: "Inventory" },
            { href: "manager-sales.html", icon: "sales.svg", label: "Sales" },
            { href: "manager-purchases.html", icon: "checklist 1.svg", label: "Purchases" },
            { href: "manager-suppliers.html", icon: "suppliers.svg", label: "Suppliers" },
            { href: "manager-reports.html", icon: "report.svg", label: "Reports" },
            { href: "director-user-management.html", icon: "store.svg", label: "User Management" }
        ],
        sales: [
            { href: "sales-agent-dashboard.html", icon: "Rectangle 2804.svg", label: "Dashboard" },
            { href: "client.html", icon: "suppliers.svg", label: "Clients" },
            { href: "sales-reports.html", icon: "report.svg", label: "Reports" }
        ]
    };

    // Normalize role name (some might be 'sales_agent' or 'sales')
    let userRole = role === 'sales_agent' ? 'sales' : role;
    const menuItems = menus[userRole] || [];

    let html = '';
    menuItems.forEach(item => {
        const isActive = currentPath === item.href ? 'active' : '';
        html += `
            <a href="${item.href}" class="nav-item ${isActive}">
                <img src="assets/icons/${item.icon}" alt="" />
                <span>${item.label}</span>
            </a>
        `;
    });

    // Add Settings and Logout
    const settingsActive = currentPath === 'settings.html' ? 'active' : '';
    html += `
        <div class="settings-logout">
            <a href="settings.html" class="nav-item ${settingsActive}">
                <img src="assets/icons/settings.svg" alt="" />
                <span>Settings</span>
            </a>
            <a href="#" class="nav-item" id="logoutBtn">
                <img src="assets/icons/log_out.svg" alt="" />
                <span>Log Out</span>
            </a>
        </div>
    `;

    navMenu.innerHTML = html;

    // Attach Logout Event
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                // Notify backend of logout to clear isOnline flag
                await api.post('/users/logout', { username: session.username });
            } catch (err) {
                console.warn("Logout notification failed:", err);
            }
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }
}
