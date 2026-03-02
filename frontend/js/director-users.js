document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const session = JSON.parse(localStorage.getItem("currentSession"));

    if (!session || session.role !== "director") {
        window.location.href = "index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `User Management <span>(${session.role})</span>`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "index.html";
        });
    }

    let allUsers = [];

    // Fetch and Render Users
    async function loadUsers() {
        try {
            const response = await api.get('/users');
            if (response.success) {
                allUsers = response.users;
                renderUsersTable(allUsers);
                updateSummaryCards(allUsers);
            }
        } catch (error) {
            console.error("Error loading users:", error);
        }
    }

    function renderUsersTable(users) {
        const tableBody = document.getElementById('userTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                <td>${user.branch}</td>
                <td><span class="badge bg-success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary">Edit</button>
                    ${user.username !== session.username ? `<button class="btn btn-sm btn-outline-danger" onclick="deactivateUser('${user._id}')">Deactivate</button>` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateSummaryCards(users) {
        const total = users.length;
        const managers = users.filter(u => u.role === 'manager').length;
        const sales = users.filter(u => u.role === 'sales').length;
        const others = total - managers - sales;

        const cardValue = document.querySelector('.card-value');
        if (cardValue) cardValue.textContent = total;
        
        const cardSummary = document.querySelector('.text-muted.small');
        if (cardSummary) cardSummary.textContent = `${sales} Sales | ${managers} Managers | ${others} Others`;
    }

    // Add User Form Submission
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorMsg = document.getElementById('errorMsg');
            
            const userData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                role: document.getElementById('role').value,
                fullName: document.getElementById('fullName').value,
                branch: document.getElementById('branch').value,
                phone: document.getElementById('phone').value
            };

            try {
                const response = await api.post('/users/register', userData);
                if (response.success) {
                    alert('User created successfully!');
                    addUserForm.reset();
                    const modalEl = document.getElementById('addUserModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    loadUsers(); // Refresh list
                }
            } catch (error) {
                errorMsg.textContent = error.message || 'Failed to create user';
            }
        });
    }

    // Search and Filter logic
    const searchInput = document.querySelector('input[placeholder="Search staff..."]');
    const roleFilter = document.querySelector('select.form-select-sm');

    function filterUsers() {
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const activeRole = (roleFilter?.value || "All Roles").toLowerCase();

        const filtered = allUsers.filter(user => {
            const matchesSearch = user.fullName.toLowerCase().includes(searchTerm) || 
                                user.username.toLowerCase().includes(searchTerm);
            const matchesRole = activeRole === 'all roles' || user.role.toLowerCase() === activeRole;
            return matchesSearch && matchesRole;
        });

        renderUsersTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);

    // Initial load
    loadUsers();
});

// Global deactivation helper
window.deactivateUser = async (id) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
        alert('Deactivation feature coming soon.');
    }
};
