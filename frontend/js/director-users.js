
// User Management Logic
let allUsers = [];
let session = JSON.parse(localStorage.getItem("currentSession"));

document.addEventListener("DOMContentLoaded", async () => {
    // Session Management
    const allowedRoles = ["director", "manager"];

    if (!session || !allowedRoles.includes(session.role)) {
        window.location.href = "../index.html";
        return;
    }

    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `${session.role === 'director' ? 'User Management' : 'Staff Management'} <span>(${session.role})</span>`;
        const branchName = document.getElementById("branchName"); 
        if (branchName && session.branch) branchName.textContent = session.branch;    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("currentSession");
            window.location.href = "../index.html";
        });
    }

    // Search and Filter logic
    const searchInput = document.querySelector('input[placeholder="Search staff..."]');
    const roleFilter = document.querySelector('select.form-select-sm');

    if (searchInput) searchInput.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);

    // Initial load
    await loadUsers();
});

// Fetch and Render Users
async function loadUsers() {
    try {
        const response = await api.get('/users');
        if (response && response.users) {
            let users = response.users;
            // Managers only see their branch (unless they are assigned to 'All')
            if (session.role === 'manager' && session.branch !== 'All') {
                users = users.filter(u => u.branch === session.branch);
            }
            allUsers = users;
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
        const roleDisplay = user.role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        tr.innerHTML = `
            <td>${user.fullName}</td>
            <td>${roleDisplay}</td>
            <td>${user.branch}</td>
            <td><span class="badge ${user.isOnline ? 'bg-success' : 'bg-secondary'}">${user.isOnline ? 'Online' : 'Offline'}</span></td>
            <td>
                ${user.username !== session.username && !(session.role === 'manager' && user.role === 'director') 
                    ? `<button class="btn btn-sm btn-outline-danger" onclick="deactivateUser('${user._id}')">Deactivate</button>` 
                    : ''}
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateSummaryCards(users) {
    const total = users.length;
    const managers = users.filter(u => u.role === 'manager').length;
    const sales = users.filter(u => u.role === 'sales_agent' || u.role === 'sales').length;
    const others = total - managers - sales;
    const onlineCount = users.filter(u => u.isOnline).length;

    const totalCard = document.getElementById('totalEmployeesCard');
    if (totalCard) {
        const totalValue = totalCard.querySelector('.card-value');
        if (totalValue) totalValue.textContent = total;
        
        const totalSubtext = totalCard.querySelector('.text-muted.small');
        if (totalSubtext) totalSubtext.textContent = `${sales} Sales | ${managers} Managers | ${others} Others`;
    }

    const activeCard = document.getElementById('activeSessionsCard');
    if (activeCard) {
        const activeValue = activeCard.querySelector('.card-value');
        if (activeValue) {
            activeValue.textContent = onlineCount;
            activeValue.classList.remove('text-success', 'text-secondary');
            activeValue.classList.add(onlineCount > 0 ? 'text-success' : 'text-secondary');
        }
    }
}

function filterUsers() {
    const searchInput = document.querySelector('input[placeholder="Search staff..."]');
    const roleFilter = document.querySelector('select.form-select-sm');
    
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

function initUserForm() {
    console.log("Initializing User Form...");
    const addUserForm = document.getElementById('addUserForm');
    
    if (!addUserForm) {
        console.error("Form #addUserForm not found!");
        return;
    }

    // Role-based UI Adjustments
    const branchSelect = document.getElementById('branch');
    const roleSelect = document.getElementById('role');
    
    if (session.role === 'manager') {
        if (branchSelect) {
            // Remove 'All Branches' option for managers
            Array.from(branchSelect.options).forEach(opt => {
                if (opt.value === 'All') opt.remove();
            });

            if (session.branch !== 'All') {
                branchSelect.value = session.branch;
                branchSelect.disabled = true;
            } else {
                branchSelect.disabled = false;
            }
        }
        if (roleSelect) {
            roleSelect.innerHTML = '<option value="sales_agent">Sales Agent</option>';
        }
    }

    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.textContent = '';
        
        const userData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            role: session.role === 'manager' ? 'sales_agent' : document.getElementById('role').value,
            fullName: document.getElementById('fullName').value,
            branch: (session.role === 'manager' && session.branch !== 'All') ? session.branch : document.getElementById('branch').value,
            phone: document.getElementById('phone').value
        };

        try {
            const response = await api.post('/users', userData);
            if (response.success) {
                alert('User created successfully!');
                addUserForm.reset();
                const modalEl = document.getElementById('addUserModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                await loadUsers(); // Refresh list
            }
        } catch (error) {
            if (errorMsg) errorMsg.textContent = error.message || 'Failed to create user';
        }
    });
}

// Fetch modal helper
window.fetchModal = function(modalPath) {
    fetch(modalPath)
        .then(res => res.text())
        .then(data => {
            const container = document.getElementById("modal-container");
            if (container) {
                container.innerHTML = data;
                
                const modalElement = document.getElementById('addUserModal');
                if (modalElement) {
                    initUserForm();
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    console.error("Modal element #addUserModal not found in fetched content");
                }
            }
        })
        .catch(err => console.error("Modal load error:", err));
};

// Global deactivation helper
window.deactivateUser = async (id) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
        alert('Deactivation feature coming soon.');
    }
};

// Expose refresh for other components if needed
window.refreshUserList = loadUsers;
