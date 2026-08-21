// ==========================================================================
// APPLICATION STATE & DATA CONSTANTS
// ==========================================================================

let DEPARTMENTS = JSON.parse(localStorage.getItem('edl_departments')) || {
    1: "ໜ່ວຍງານເຕັກນິກ ແລະ ວາງແຜນລະບົບໄຟຟ້າ",
    2: "ໜ່ວຍງານເຕັກນິກຄວາມປອດໄພ",
    3: "ຫ້ອງການ ເຕັກນິກ ແລະ ວາງແຜນລະບົບໄຟຟ້າ",
    4: "ຄະນະສາຂາ"
};

function isUserAdmin(user) {
    if (!user) return false;
    if (user === 'supervisor') return true;
    if (user.isSupervisor) return true;
    
    // Anyone in a department with "ຄະນະ" or "ຫ້ອງການ" in its name has full admin/creator rights
    const deptName = DEPARTMENTS[user.deptId];
    if (deptName && (deptName.includes('ຄະນະ') || deptName.includes('ຫ້ອງການ'))) {
        return true;
    }
    
    if (user.deptId === 3) return true; // Fallback
    return false;
}

function isUserDeptAdmin(user) {
    if (!user || user === 'supervisor') return false;
    
    // Global admins (ຄະນະ or ຫ້ອງການ) are not dept admins
    const deptName = DEPARTMENTS[user.deptId];
    if (deptName && (deptName.includes('ຄະນະ') || deptName.includes('ຫ້ອງການ'))) return false;
    if (user.deptId === 3) return false;

    const r = user.role ? user.role.toLowerCase() : '';
    return r.includes('ຫົວໜ້າໜ່ວຍງານ') || r.includes('ຮອງຫົວໜ້າໜ່ວຍງານ') || r.includes('ຫົວໜ້າໜ່ວຍ') || r.includes('ຮອງຫົວໜ້າໜ່ວຍ');
}

function isUserManagement(user) {
    return isUserAdmin(user) || isUserDeptAdmin(user);
}

// Default Team Members for initial load (Customized by User)
const DEFAULT_MEMBERS = [
    {"id":"m-off-1","empId":"TN1","name":"ທ່ານ ຄຳສຸກ ອ່ຽງບົວລາ","role":"ຫົວໜ້າຫ້ອງການ","deptId":3,"avatarColor":"#6366f1","password":"1234","isSupervisor":true,"profilePic":null},
    {"id":"m-off-2","empId":"TN2","name":"ທ່ານ ທະນູເພັດ","role":"ຮອງຫົວໜ້າຫ້ອງການ","deptId":3,"avatarColor":"#10b981","password":"1234","isSupervisor":true,"profilePic":null},
    {"id":"m-1","empId":"TN3","name":"ທ່ານ ໂອລາລິດ ກ້ຽວຮ່ວມເສືອງ","role":"ຫົວໜ້າໜ່ວຍງານ","deptId":1,"avatarColor":"#6366f1","password":"1234","profilePic":null},
    {"id":"m-2","empId":"TN4","name":"ທ່ານ ກິແກ້ວ ຄຳນວນ","role":"ຮອງຫົວໜ້າໜ່ວຍງານ","deptId":1,"avatarColor":"#0ea5e9","password":"1234","profilePic":null},
    {"id":"m-3","empId":"TN5","name":"ທ່ານ ກະຕິກ ໄຊຍະສິງ","role":"ວິຊາການ","deptId":1,"avatarColor":"#10b981","password":"1234","profilePic":null},
    {"id":"m-4","empId":"TN6","name":"ທ່ານ ຄອນທະລີ ແກ້ວຈັນສີ","role":"ຫົວໜ້າໜ່ວຍງານ","deptId":2,"avatarColor":"#8b5cf6","password":"1234","profilePic":null},
    {"id":"m-5","empId":"TN7","name":"ທ່ານ ວຽງໄຊ ວີເເຄລູ","role":"ຮອງຫົວໜ້າໜ່ວຍງານ","deptId":2,"avatarColor":"#f59e0b","password":"1234","profilePic":null},
    {"id":"m-1787324006166","empId":"EDL","name":"ທ່ານຈັນຖະໜອມ ແສງສະຫັວນ","role":"ຄະນະສາຂາ","deptId":4,"avatarColor":"#6366f1","password":"1234","profilePic":null}
];

// Helper to get date string relative to current time
function getDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// Play premium synthesized audio notification chime when a task is assigned
function playNotificationSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Play premium double-chime (ding-dong style)
        const now = ctx.currentTime;
        
        // Note 1 (Ding) - High pitch
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
        
        // Note 2 (Dong) - Slightly lower pitch, played slightly later
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain2.gain.setValueAtTime(0.12, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.5);
    } catch (e) {
        console.warn("Audio notification blocked or not supported:", e);
    }
}

// Default Tasks for initial load (Customized to Empty by User)
const DEFAULT_TASKS = [];

// App State variables
let members = [];
let tasks = [];
let currentUser = null; // 'supervisor' or member object
let currentAttachments = []; // Temporary store for current task attachments
let currentReportAttachments = []; // Temporary store for current report attachments
let currentMemberPhoto = null; // Base64 profile photo for team member form
let currentProfilePhoto = null; // Base64 profile photo for profile settings form

// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================================================

let useApiMode = false;

async function loadState() {
    if (window.location.protocol.startsWith('http')) {
        try {
            const res = await fetch('/api/sync');
            if (res.ok) {
                const data = await res.json();
                members = data.members || [];
                tasks = data.tasks || [];
                useApiMode = true;
                
                let merged = false;
                DEFAULT_MEMBERS.forEach(defaultMem => {
                    if (defaultMem.isSupervisor && !members.some(m => m.id === defaultMem.id || (m.empId && m.empId.toLowerCase() === defaultMem.empId.toLowerCase()))) {
                        members.unshift(defaultMem);
                        merged = true;
                    }
                });
                if (merged) {
                    await saveState();
                }
                return;
            }
        } catch (e) {
            console.warn("Could not connect to Cloudflare API, falling back to LocalStorage:", e);
        }
    }

    try {
        const storedMembers = localStorage.getItem('edl_members');
        const storedTasks = localStorage.getItem('edl_tasks');
        const storedDepts = localStorage.getItem('edl_departments');
        
        if (storedDepts) {
            DEPARTMENTS = JSON.parse(storedDepts);
        } else {
            localStorage.setItem('edl_departments', JSON.stringify(DEPARTMENTS));
        }

        if (storedMembers) {
            members = JSON.parse(storedMembers);
            DEFAULT_MEMBERS.forEach(defaultMem => {
                if (defaultMem.isSupervisor && !members.some(m => m.id === defaultMem.id || (m.empId && m.empId.toLowerCase() === defaultMem.empId.toLowerCase()))) {
                    members.unshift(defaultMem);
                }
            });
            localStorage.setItem('edl_members', JSON.stringify(members));
        } else {
            members = [...DEFAULT_MEMBERS];
            localStorage.setItem('edl_members', JSON.stringify(members));
        }

        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            tasks = [...DEFAULT_TASKS];
            localStorage.setItem('edl_tasks', JSON.stringify(tasks));
        }
    } catch (e) {
        console.error("Error loading state from localStorage, using memory storage.", e);
        members = [...DEFAULT_MEMBERS];
        tasks = [...DEFAULT_TASKS];
    }
}

async function saveState() {
    try {
        localStorage.setItem('edl_members', JSON.stringify(members));
        localStorage.setItem('edl_tasks', JSON.stringify(tasks));
        localStorage.setItem('edl_departments', JSON.stringify(DEPARTMENTS));
        
        if (useApiMode) {
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members, tasks, departments: DEPARTMENTS })
            });
        }
    } catch (e) {
        console.error("Error saving state", e);
    }
}

// Populate all select inputs with dynamic departments
function updateAllDeptDropdowns() {
    const filterDept = document.getElementById('filter-dept');
    const taskDept = document.getElementById('task-dept-input');
    const memberDept = document.getElementById('member-dept-input');

    if (!filterDept) return;
    const deptKeys = Object.keys(DEPARTMENTS).sort((a, b) => {
        const nameA = DEPARTMENTS[a] || '';
        const nameB = DEPARTMENTS[b] || '';
        const isBranchA = nameA.includes('ຄະນະ');
        const isBranchB = nameB.includes('ຄະນະ');
        const isOfficeA = nameA.includes('ຫ້ອງການ');
        const isOfficeB = nameB.includes('ຫ້ອງການ');

        if (isBranchA && !isBranchB) return -1;
        if (!isBranchA && isBranchB) return 1;
        if (isOfficeA && !isOfficeB) return -1;
        if (!isOfficeA && isOfficeB) return 1;
        return parseInt(a) - parseInt(b);
    });

    // 1. Dashboard Filter Dropdown
    const savedFilter = filterDept.value || "all";
    filterDept.innerHTML = '<option value="all">ທັງໝົດ</option>';
    deptKeys.forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.innerText = DEPARTMENTS[key];
        if (key === savedFilter) opt.selected = true;
        filterDept.appendChild(opt);
    });

    // 2. Task Form Dropdown
    if (taskDept) {
        const savedTask = taskDept.value;
        taskDept.innerHTML = '';
        deptKeys.forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = DEPARTMENTS[key];
            if (key === savedTask) opt.selected = true;
            taskDept.appendChild(opt);
        });
    }

    // 3. Member Form Dropdown
    if (memberDept) {
        const savedMember = memberDept.value;
        memberDept.innerHTML = '';
        deptKeys.forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = DEPARTMENTS[key];
            if (key === savedMember) opt.selected = true;
            memberDept.appendChild(opt);
        });
    }
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
        dismissToast(toast);
    }, 4000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timer);
        dismissToast(toast);
    });
}

function dismissToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
        toast.remove();
    }, 200);
}

// ==========================================================================
// VIEW NAVIGATION & LOGIN LOGIC
// ==========================================================================

async function initApp() {
    await loadState();
    updateAllDeptDropdowns();
    setupGlobalEventListeners();
    
    // Check for saved session
    const savedSession = localStorage.getItem('edl_current_user_session');
    if (savedSession) {
        if (savedSession === 'supervisor') {
            loginAs('supervisor');
        } else {
            const foundMember = members.find(m => m.id === savedSession);
            if (foundMember) {
                loginAs(foundMember);
            } else {
                renderLoginView();
            }
        }
    } else {
        renderLoginView();
    }
}

function renderLoginView() {
    const empInput = document.getElementById('login-emp-input');
    const pwdInput = document.getElementById('login-pwd-input');
    if (empInput) empInput.value = '';
    if (pwdInput) {
        pwdInput.value = '';
        pwdInput.type = 'password';
        const eyeIcon = pwdInput.nextElementSibling ? pwdInput.nextElementSibling.querySelector('i') : null;
        if (eyeIcon) eyeIcon.className = 'fa-solid fa-eye';
    }
}

function loginAs(role) {
    currentUser = role;
    if (currentUser === 'supervisor') {
        localStorage.setItem('edl_current_user_session', 'supervisor');
    } else if (currentUser && currentUser.id) {
        localStorage.setItem('edl_current_user_session', currentUser.id);
    }
    
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const roleBadge = document.getElementById('role-badge');
    const userNameSpan = document.getElementById('user-name');
    const userDeptSpan = document.getElementById('user-dept-name');
    const userAvatar = document.getElementById('user-avatar');
    
    loginView.classList.remove('active');
    appView.classList.add('active');

    // Reset views
    document.getElementById('supervisor-dashboard').classList.remove('active');
    document.getElementById('personal-kanban').classList.remove('active');

    const personalTabs = document.getElementById('personal-view-tabs');
    const supervisorDashboard = document.getElementById('supervisor-dashboard');
    const btnDashboard = document.getElementById('btn-tab-dashboard');

    personalTabs.style.display = 'flex';

    if (isUserManagement(currentUser)) {
        supervisorDashboard.classList.remove('member-view');
        btnDashboard.innerHTML = `<i class="fa-solid fa-chart-pie"></i> ຈັດການວຽກງານທີມ (Supervisor Dashboard)`;

        let name = '';
        let roleName = '';
        let avatarBg = '';
        let avatarHTML = '';

        if (currentUser === 'supervisor') {
            roleBadge.innerText = 'ຜູ້ຄຸມງານ / Supervisor';
            roleBadge.className = 'badge bg-indigo';
            
            name = localStorage.getItem('edl_supervisor_name') || 'ຜູ້ບໍລິຫານລະບົບ';
            roleName = 'EDL ຫົວໜ້າພາກສ່ວນ';
            
            const supPhoto = localStorage.getItem('edl_supervisor_photo');
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
            avatarHTML = supPhoto 
                ? `<img src="${supPhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : initials;
            avatarBg = supPhoto ? 'transparent' : '#6366f1';
        } else {
            const isAdmin = isUserAdmin(currentUser);
            roleBadge.innerText = `${currentUser.role} / ${isAdmin ? 'Admin' : 'Dept Admin'}`;
            roleBadge.className = 'badge bg-indigo';
            
            name = currentUser.name;
            roleName = currentUser.role;
            
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
            avatarHTML = currentUser.profilePic 
                ? `<img src="${currentUser.profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : initials;
            avatarBg = currentUser.profilePic ? 'transparent' : currentUser.avatarColor;
        }

        userNameSpan.innerText = name;
        userDeptSpan.innerText = roleName;
        userAvatar.innerHTML = avatarHTML;
        userAvatar.style.backgroundColor = avatarBg;
        
        // Reset the "show unassigned" checkbox
        document.getElementById('chk-show-unassigned').checked = false;

        // Default to supervisor dashboard tab on login
        switchPersonalTab('dashboard');
    } else {
        supervisorDashboard.classList.add('member-view');
        btnDashboard.innerHTML = `<i class="fa-solid fa-chart-pie"></i> ພາບລວມຂອງທີມງານ (Team Dashboard)`;

        const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        roleBadge.innerText = 'ສະມາຊິກທີມ / Member';
        roleBadge.className = `badge badge-dept-${currentUser.deptId || 1}`;
        userNameSpan.innerText = currentUser.name;
        userDeptSpan.innerText = currentUser.role;
        
        userAvatar.innerHTML = currentUser.profilePic 
            ? `<img src="${currentUser.profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : initials;
        userAvatar.style.backgroundColor = currentUser.profilePic ? 'transparent' : currentUser.avatarColor;

        // Reset the "show unassigned" checkbox
        document.getElementById('chk-show-unassigned').checked = false;
        
        // Default to personal Kanban tab on login
        switchPersonalTab('kanban');
    }
    showToast(`ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ລະບົບ!`, 'info');
}



// --------------------------------------------------------------------------
// PERSONAL VIEW TAB SWITCHING (Kanban vs Team Dashboard)
// --------------------------------------------------------------------------
let currentPersonalTab = 'kanban';

window.switchPersonalTab = function(tabName) {
    currentPersonalTab = tabName;
    
    const btnKanban = document.getElementById('btn-tab-kanban');
    const btnDashboard = document.getElementById('btn-tab-dashboard');
    const kanbanView = document.getElementById('personal-kanban');
    const supervisorView = document.getElementById('supervisor-dashboard');
    
    if (tabName === 'kanban') {
        btnKanban.classList.add('active');
        btnKanban.style.background = 'rgba(79, 70, 229, 0.08)';
        btnKanban.style.borderColor = 'var(--color-indigo)';
        btnKanban.style.color = 'var(--color-indigo)';
        
        btnDashboard.classList.remove('active');
        btnDashboard.style.background = 'rgba(15, 23, 42, 0.02)';
        btnDashboard.style.borderColor = 'var(--glass-border)';
        btnDashboard.style.color = 'var(--text-secondary)';
        
        kanbanView.classList.add('active');
        supervisorView.classList.remove('active');
        renderPersonalView();
    } else {
        btnDashboard.classList.add('active');
        btnDashboard.style.background = 'rgba(79, 70, 229, 0.08)';
        btnDashboard.style.borderColor = 'var(--color-indigo)';
        btnDashboard.style.color = 'var(--color-indigo)';
        
        btnKanban.classList.remove('active');
        btnKanban.style.background = 'rgba(15, 23, 42, 0.02)';
        btnKanban.style.borderColor = 'var(--glass-border)';
        btnKanban.style.color = 'var(--text-secondary)';
        
        kanbanView.classList.remove('active');
        supervisorView.classList.add('active');
        renderSupervisorDashboard();
    }
};

function logout() {
    currentUser = null;
    localStorage.removeItem('edl_current_user_session');
    document.getElementById('app-view').classList.remove('active');
    document.getElementById('login-view').classList.add('active');
    renderLoginView();
    showToast(`ອອກຈາກລະບົບຮຽບຮ້ອຍ`, 'info');
}

// ==========================================================================
// SUPERVISOR DASHBOARD LOGIC & RENDERING
// ==========================================================================

function getTaskStats(filteredTasks) {
    const stats = {
        total: filteredTasks.length,
        todo: 0,
        inprogress: 0,
        done: 0,
        overdue: 0
    };
    
    const todayStr = new Date().toISOString().split('T')[0];

    filteredTasks.forEach(t => {
        if (t.status === 'todo') stats.todo++;
        if (t.status === 'inprogress') stats.inprogress++;
        if (t.status === 'done') stats.done++;
        
        // Task is overdue if not completed and past deadline
        if (t.status !== 'done' && t.deadline < todayStr) {
            stats.overdue++;
        }
    });

    return stats;
}

let activeStatFilter = 'all'; // all, todo, inprogress, done, overdue

function renderSupervisorDashboard() {
    const filterDept = document.getElementById('filter-dept');
    if (isUserDeptAdmin(currentUser)) {
        filterDept.value = currentUser.deptId.toString();
        filterDept.disabled = true;
    } else {
        filterDept.disabled = false;
    }

    // 1. Re-populate Filter dropdowns (especially assignees list)
    populateSupervisorFilters();

    // 2. Apply Filters
    const filteredTasks = getFilteredTasks(false);
    const tasksForStats = getFilteredTasks(true);
    const stats = getTaskStats(tasksForStats);

    // 3. Render Metric Cards
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-todo').innerText = stats.todo;
    document.getElementById('stat-inprogress').innerText = stats.inprogress;
    document.getElementById('stat-done').innerText = stats.done;
    document.getElementById('stat-overdue').innerText = stats.overdue;

    // 4. Render Team Progress bars
    renderTeamProgress();

    // 5. Render Tasks Table List
    renderSupervisorTasksTable(filteredTasks);
}

function populateSupervisorFilters() {
    const selectAssignee = document.getElementById('filter-assignee');
    const selectedVal = selectAssignee.value;
    
    selectAssignee.innerHTML = `
        <option value="all">ທັງໝົດ</option>
        <option value="unassigned">ບໍ່ມີຜູ້ຮັບຜິດຊອບ</option>
    `;

    // Group members by department dynamically
    Object.keys(DEPARTMENTS).forEach(deptKey => {
        const deptId = parseInt(deptKey);
        // If department admin, only show their own department members
        if (isUserDeptAdmin(currentUser) && currentUser.deptId !== deptId) {
            return;
        }

        const deptName = DEPARTMENTS[deptId];
        const deptMembers = members.filter(m => m.deptId === deptId);

        if (deptMembers.length > 0) {
            const group = document.createElement('optgroup');
            group.label = deptName;
            deptMembers.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.innerText = m.name;
                group.appendChild(opt);
            });
            selectAssignee.appendChild(group);
        }
    });

    // Keep selected value if still valid
    if (Array.from(selectAssignee.options).some(opt => opt.value === selectedVal)) {
        selectAssignee.value = selectedVal;
    }
}

function getFilteredTasks(ignoreMetricFilter = false) {
    const searchVal = document.getElementById('search-task').value.toLowerCase().trim();
    const deptFilter = document.getElementById('filter-dept').value;
    const assigneeFilter = document.getElementById('filter-assignee').value;
    const statusFilter = document.getElementById('filter-status').value;
    const priorityFilter = document.getElementById('filter-priority').value;

    const todayStr = new Date().toISOString().split('T')[0];

    return tasks.filter(task => {
        // Search term filter
        const matchesSearch = task.name.toLowerCase().includes(searchVal) || 
                              task.desc.toLowerCase().includes(searchVal);
        
        // Department filter
        const matchesDept = (deptFilter === 'all') || (task.deptId === parseInt(deptFilter));
        
        // Assignee filter
        let matchesAssignee = true;
        if (assigneeFilter !== 'all') {
            if (assigneeFilter === 'unassigned') {
                matchesAssignee = (task.assigneeId === "");
            } else {
                matchesAssignee = (task.assigneeId === assigneeFilter);
            }
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'overdue') {
                matchesStatus = (task.status !== 'done' && task.deadline < todayStr);
            } else {
                matchesStatus = (task.status === statusFilter);
            }
        }

        // Priority filter
        const matchesPriority = (priorityFilter === 'all') || (task.priority === priorityFilter);

        // Metric Card active filter override (if clicked a specific metric card)
        let matchesMetricCard = true;
        if (!ignoreMetricFilter && activeStatFilter !== 'all') {
            if (activeStatFilter === 'todo') matchesMetricCard = (task.status === 'todo');
            if (activeStatFilter === 'inprogress') matchesMetricCard = (task.status === 'inprogress');
            if (activeStatFilter === 'done') matchesMetricCard = (task.status === 'done');
            if (activeStatFilter === 'overdue') matchesMetricCard = (task.status !== 'done' && task.deadline < todayStr);
        }

        return matchesSearch && matchesDept && matchesAssignee && matchesStatus && matchesPriority && matchesMetricCard;
    });
}

function renderTeamProgress() {
    const container = document.getElementById('dashboard-progress-groups');
    if (!container) return;
    container.innerHTML = '';

    // Render group sections for each department dynamically!
    const deptKeys = Object.keys(DEPARTMENTS).sort((a, b) => {
        const nameA = DEPARTMENTS[a] || '';
        const nameB = DEPARTMENTS[b] || '';
        const isBranchA = nameA.includes('ຄະນະ');
        const isBranchB = nameB.includes('ຄະນະ');
        const isOfficeA = nameA.includes('ຫ້ອງການ');
        const isOfficeB = nameB.includes('ຫ້ອງການ');

        if (isBranchA && !isBranchB) return -1;
        if (!isBranchA && isBranchB) return 1;
        if (isOfficeA && !isOfficeB) return -1;
        if (!isOfficeA && isOfficeB) return 1;
        return parseInt(a) - parseInt(b);
    });
    deptKeys.forEach(deptKey => {
        const deptId = parseInt(deptKey);
        const deptName = DEPARTMENTS[deptId];
        const deptMembers = members.filter(m => m.deptId === deptId);

        // Pick color/icon
        let iconClass = 'fa-building';
        let colorClass = '#0ea5e9';
        let customClass = '';
        if (deptName.includes('ໄຟຟ້າ')) { iconClass = 'fa-bolt'; colorClass = '#eab308'; customClass = 'electrical-color'; }
        else if (deptName.includes('ຄວາມປອດໄພ')) { iconClass = 'fa-shield-halved'; colorClass = '#10b981'; customClass = 'safety-color'; }

        const section = document.createElement('div');
        section.className = 'progress-section';
        
        // Show/hide add button based on role
        const isSupervisor = isUserManagement(currentUser);
        const showAddBtn = isSupervisor && (!isUserDeptAdmin(currentUser) || currentUser.deptId === deptId);
        const addBtnMarkup = showAddBtn 
            ? `<button type="button" class="add-member-btn" onclick="openAddMemberForDept(${deptId})" style="margin-left: auto; border: 1px solid ${colorClass}40; background: ${colorClass}10; color: ${colorClass}; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; font-weight: 500;"><i class="fa-solid fa-user-plus"></i> ເພີ່ມ</button>`
            : '';

        section.innerHTML = `
            <h3 class="${customClass}" style="color: ${colorClass}; display: flex; align-items: center; width: 100%;">
                <span><i class="fa-solid ${iconClass}"></i> ${deptName}</span>
                ${addBtnMarkup}
            </h3>
            <div class="progress-bar-list" id="progress-list-${deptId}"></div>
        `;

        const listDiv = section.querySelector('.progress-bar-list');

        if (deptMembers.length === 0) {
            listDiv.innerHTML = '<p class="empty-text" style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 10px 0;">ບໍ່ມີສະມາຊິກໃນໜ່ວຍງານນີ້</p>';
        } else {
            deptMembers.forEach(member => {
                const memberTasks = tasks.filter(t => t.assigneeId === member.id);
                const total = memberTasks.length;
                const done = memberTasks.filter(t => t.status === 'done').length;
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);

                const progressItem = document.createElement('div');
                progressItem.className = `progress-item dept-${member.deptId}-item`;
                
                let actionMarkup = '';
                if (isSupervisor) {
                    const canManageThisMember = !isUserDeptAdmin(currentUser) || currentUser.deptId === member.deptId;
                    if (canManageThisMember) {
                        actionMarkup = `
                            <span class="member-actions-hover" style="display: inline-flex; gap: 6px; margin-left: 8px; align-items: center; opacity: 0.8;">
                                <button type="button" class="member-action-btn edit-member-btn" onclick="openEditMemberFromDashboard('${member.id}')" title="ແກ້ໄຂສະມາຊິກ" style="border: none; background: transparent; cursor: pointer; color: #3b82f6; font-size: 0.8rem; padding: 2px;"><i class="fa-solid fa-pen"></i></button>
                                <button type="button" class="member-action-btn delete-member-btn" onclick="openDeleteMemberFromDashboard('${member.id}')" title="ລຶບສະມາຊິກ" style="border: none; background: transparent; cursor: pointer; color: #ef4444; font-size: 0.8rem; padding: 2px;"><i class="fa-solid fa-trash-can"></i></button>
                            </span>
                        `;
                    }
                }

                progressItem.innerHTML = `
                    <div class="progress-info" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span class="m-name-tag" style="display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                            <span>${member.name} <span class="m-stats-tag">(${member.role})</span></span>
                            ${actionMarkup}
                        </span>
                        <span class="pct" style="flex-shrink: 0;">${done}/${total} ວຽກ (${pct}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${pct}%"></div>
                    </div>
                `;
                listDiv.appendChild(progressItem);
            });
        }

        container.appendChild(section);
    });
}

window.openAddMemberForDept = function(deptId) {
    if (isUserDeptAdmin(currentUser) && currentUser.deptId !== deptId) {
        showToast("ທ່ານບໍ່ມີສິດເພີ່ມສະມາຊິກເຂົ້າໜ່ວຍງານອື່ນ!", "error");
        return;
    }
    openTeamManagementModal();
    const deptSelect = document.getElementById('member-dept-input');
    deptSelect.value = deptId.toString();
    document.getElementById('member-emp-id-input').focus();
};

window.openEditMemberFromDashboard = function(memberId) {
    openTeamManagementModal();
    editMember(memberId);
};

window.openDeleteMemberFromDashboard = function(memberId) {
    openTeamManagementModal();
    deleteMemberConfirm(memberId);
};

function renderSupervisorTasksTable(filteredTasks) {
    const tbody = document.getElementById('supervisor-tasks-tbody');
    const noTasksMsg = document.getElementById('no-tasks-msg');
    tbody.innerHTML = '';

    if (filteredTasks.length === 0) {
        noTasksMsg.classList.remove('hidden');
        return;
    } else {
        noTasksMsg.classList.add('hidden');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    filteredTasks.forEach(task => {
        const assignee = members.find(m => m.id === task.assigneeId);
        
        // Priority Badge markup
        let prioBadge = `<span class="badge badge-prio-medium"><i class="fa-solid fa-circle"></i> ກາງ</span>`;
        if (task.priority === 'high') prioBadge = `<span class="badge badge-prio-high"><i class="fa-solid fa-circle"></i> ສູງ</span>`;
        if (task.priority === 'low') prioBadge = `<span class="badge badge-prio-low"><i class="fa-solid fa-circle"></i> ຕໍ່າ</span>`;

        // Status Badge markup
        let isOverdue = task.status !== 'done' && task.deadline < todayStr;
        let statusBadge = `<span class="badge badge-todo">ຕ້ອງເຮັດ</span>`;
        if (task.status === 'inprogress') statusBadge = `<span class="badge badge-inprogress"><i class="fa-solid fa-spinner fa-spin"></i> ກໍາລັງເຮັດ</span>`;
        if (task.status === 'done') statusBadge = `<span class="badge badge-done"><i class="fa-solid fa-check"></i> ສໍາເລັດ</span>`;
        if (isOverdue) statusBadge += ` <span class="badge badge-overdue"><i class="fa-solid fa-triangle-exclamation"></i> ກາຍກໍານົດ</span>`;

        // Assignee cell markup
        let assigneeMarkup = '<span class="unassigned-text"><i class="fa-solid fa-circle-question"></i> ຍັງບໍ່ມອບໝາຍ</span>';
        if (assignee) {
            const initials = assignee.name.split(' ').map(n => n[0]).join('').substring(0,2);
            const avatarContent = assignee.profilePic 
                ? `<img src="${assignee.profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : initials;
            const avatarStyle = assignee.profilePic ? 'background-color: transparent;' : `background-color: ${assignee.avatarColor};`;
            
            assigneeMarkup = `
                <div class="avatar-sm" style="${avatarStyle}">${avatarContent}</div>
                <span>${assignee.name}</span>
            `;
        }

        let reportColumnMarkup = '<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">ບໍ່ທັນມີລາຍງານ</span>';
        if (task.report) {
            reportColumnMarkup = `<div class="t-report" style="font-size: 0.82rem; color: #7e22ce; display: flex; align-items: flex-start; gap: 4px;" title="${task.report}"><i class="fa-solid fa-file-signature" style="margin-top: 3px;"></i> <span>${task.report}</span></div>`;
        }

        // 1. Task Assignment Attachments column markup
        let attachmentsColumnMarkup = '<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">ບໍ່ມີໄຟລ໌ມອບວຽກ</span>';
        if (task.attachments && task.attachments.length > 0) {
            attachmentsColumnMarkup = `<div class="table-attachments-display" style="display: flex; flex-direction: column; gap: 6px;">`;
            task.attachments.forEach((file, fileIdx) => {
                let iconClass = 'fa-file-lines';
                let iconColor = '#64748b';
                if (file.name.endsWith('.pdf')) { iconClass = 'fa-file-pdf'; iconColor = '#ef4444'; }
                else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) { iconClass = 'fa-file-excel'; iconColor = '#10b981'; }
                else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) { iconClass = 'fa-file-word'; iconColor = '#3b82f6'; }
                else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) { iconClass = 'fa-file-image'; iconColor = '#a855f7'; }
                
                attachmentsColumnMarkup += `
                    <div style="display: inline-flex; align-items: center; background: rgba(15,23,42,0.02); border: 1px solid var(--glass-border); border-radius: 6px; padding: 4px 8px; gap: 6px; max-width: 200px;">
                        <a href="#" class="table-task-attachment-link" data-index="${fileIdx}" style="font-size: 0.75rem; color: var(--color-indigo); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="ຄລິກເພື່ອດາວໂຫຼດ: ${file.name} (${file.size})">
                            <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i> ${file.name}
                        </a>
                    </div>
                `;
            });
            attachmentsColumnMarkup += `</div>`;
        }

        // 2. Report Attachments column markup
        let reportAttachmentsColumnMarkup = '<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">ບໍ່ມີໄຟລ໌ລາຍງານ</span>';
        if (task.reportAttachments && task.reportAttachments.length > 0) {
            reportAttachmentsColumnMarkup = `<div class="table-attachments-display" style="display: flex; flex-direction: column; gap: 6px;">`;
            task.reportAttachments.forEach((file, fileIdx) => {
                let iconClass = 'fa-file-lines';
                let iconColor = '#64748b';
                if (file.name.endsWith('.pdf')) { iconClass = 'fa-file-pdf'; iconColor = '#ef4444'; }
                else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) { iconClass = 'fa-file-excel'; iconColor = '#10b981'; }
                else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) { iconClass = 'fa-file-word'; iconColor = '#3b82f6'; }
                else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) { iconClass = 'fa-file-image'; iconColor = '#a855f7'; }
                
                reportAttachmentsColumnMarkup += `
                    <div style="display: inline-flex; align-items: center; background: rgba(15,23,42,0.02); border: 1px solid var(--glass-border); border-radius: 6px; padding: 4px 8px; gap: 6px; max-width: 200px;">
                        <a href="#" class="table-report-attachment-link" data-index="${fileIdx}" style="font-size: 0.75rem; color: var(--color-indigo); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="ຄລິກເພື່ອດາວໂຫຼດ: ${file.name} (${file.size})">
                            <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i> ${file.name}
                        </a>
                    </div>
                `;
            });
            reportAttachmentsColumnMarkup += `</div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="t-title">${task.name}</div>
                <div class="t-desc" title="${task.desc}">${task.desc || 'ບໍ່ມີລາຍລະອຽດ...'}</div>
            </td>
            <td>
                ${reportColumnMarkup}
            </td>
            <td>
                ${attachmentsColumnMarkup}
            </td>
            <td>
                ${reportAttachmentsColumnMarkup}
            </td>
            <td>
                <span class="badge badge-dept-${task.deptId}">
                    ${DEPARTMENTS[task.deptId] || 'ທົ່ວໄປ'}
                </span>
            </td>
            <td>
                <div class="assignee-cell">${assigneeMarkup}</div>
            </td>
            <td>
                <div class="date-text">
                    <span>ເລີ່ມ: ${task.start}</span>
                    <span>ວັນທີ່ສຳເລັດ: ${task.deadline}</span>
                </div>
            </td>
            <td>${prioBadge}</td>
            <td>${statusBadge}</td>
            <td class="actions-col">
                <div class="actions-cell">
                    <button class="icon-btn edit-action" title="ແກ້ໄຂວຽກ" onclick="openEditTaskModal('${task.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delegate-action" title="ມອບວຽກຕໍ່" onclick="openDelegateModal('${task.id}')">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <button class="icon-btn delete-action" title="ລຶບວຽກ" onclick="deleteTaskConfirm('${task.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        // Attach click listeners to table attachments programmatically
        if (task.attachments && task.attachments.length > 0) {
            const links = tr.querySelectorAll('.table-task-attachment-link');
            links.forEach(link => {
                const fileIdx = parseInt(link.getAttribute('data-index'));
                const file = task.attachments[fileIdx];
                if (file) {
                    link.addEventListener('click', (e) => {
                        const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                        mockDownload(file.name, e, file.dataUrl || fallbackUrl);
                    });
                }
            });
        }

        if (task.reportAttachments && task.reportAttachments.length > 0) {
            const links = tr.querySelectorAll('.table-report-attachment-link');
            links.forEach(link => {
                const fileIdx = parseInt(link.getAttribute('data-index'));
                const file = task.reportAttachments[fileIdx];
                if (file) {
                    link.addEventListener('click', (e) => {
                        const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                        mockDownload(file.name, e, file.dataUrl || fallbackUrl);
                    });
                }
            });
        }

        tbody.appendChild(tr);
    });
}

// Global metric card click filter handler
document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
        const filterType = card.getAttribute('data-filter');
        activeStatFilter = filterType;
        
        // Add active style/indicator on cards
        document.querySelectorAll('.metric-card').forEach(c => c.style.borderColor = '');
        card.style.borderColor = 'var(--color-indigo)';
        
        renderSupervisorDashboard();
    });
});

// Add keypress handler for Search
document.getElementById('search-task').addEventListener('input', renderSupervisorDashboard);
// Add change handler for filters
document.getElementById('filter-dept').addEventListener('change', renderSupervisorDashboard);
document.getElementById('filter-assignee').addEventListener('change', renderSupervisorDashboard);
document.getElementById('filter-status').addEventListener('change', renderSupervisorDashboard);
document.getElementById('filter-priority').addEventListener('change', renderSupervisorDashboard);

// ==========================================================================
// PERSONAL KANBAN BOARD VIEW LOGIC
// ==========================================================================

function renderPersonalView() {
    const personalName = document.getElementById('personal-member-name');
    const personalDept = document.getElementById('personal-member-dept');
    
    personalName.innerText = currentUser.name;
    personalDept.innerText = DEPARTMENTS[currentUser.deptId] || 'ຫ້ອງການ';
    personalDept.className = `badge badge-dept-${currentUser.deptId || 1}`;

    // Rerender Kanban Board Columns
    renderKanbanBoard();
}

function renderKanbanBoard() {
    const todoContainer = document.getElementById('kanban-todo-container');
    const doingContainer = document.getElementById('kanban-inprogress-container');
    const doneContainer = document.getElementById('kanban-done-container');
    
    todoContainer.innerHTML = '';
    doingContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    const showUnassigned = document.getElementById('chk-show-unassigned').checked;
    
    // Filter tasks for this user
    // OR if showUnassigned is checked, show unassigned tasks belonging to their department as well
    const myTasks = tasks.filter(task => {
        const isMine = (task.assigneeId === currentUser.id);
        const isUnassignedDept = showUnassigned && (task.assigneeId === "") && (task.deptId === currentUser.deptId);
        return isMine || isUnassignedDept;
    });

    const counts = { todo: 0, inprogress: 0, done: 0 };
    const todayStr = new Date().toISOString().split('T')[0];

    myTasks.forEach(task => {
        const card = createKanbanCard(task, todayStr);
        
        if (task.status === 'todo') {
            todoContainer.appendChild(card);
            counts.todo++;
        } else if (task.status === 'inprogress') {
            doingContainer.appendChild(card);
            counts.inprogress++;
        } else if (task.status === 'done') {
            doneContainer.appendChild(card);
            counts.done++;
        }
    });

    // Update Counts badges
    document.getElementById('count-todo').innerText = counts.todo;
    document.getElementById('count-inprogress').innerText = counts.inprogress;
    document.getElementById('count-done').innerText = counts.done;

    // Update mini stats
    document.getElementById('personal-stat-todo').innerText = counts.todo;
    document.getElementById('personal-stat-doing').innerText = counts.inprogress;
    document.getElementById('personal-stat-done').innerText = counts.done;
}

function createKanbanCard(task, todayStr) {
    const isUnassigned = (task.assigneeId === "");
    const card = document.createElement('div');
    let borderClass = 'dept-3-card';
    const currentDeptName = DEPARTMENTS[task.deptId] || '';
    if (currentDeptName.includes('ໄຟຟ້າ')) borderClass = 'dept-1-card';
    else if (currentDeptName.includes('ຄວາມປອດໄພ')) borderClass = 'dept-2-card';
    
    card.className = `kanban-card ${borderClass}`;
    card.setAttribute('draggable', isUnassigned ? 'false' : 'true'); // Only draggable if assigned
    card.setAttribute('data-task-id', task.id);

    // Date Overdue detection
    const isOverdue = task.status !== 'done' && task.deadline < todayStr;
    const dateClass = isOverdue ? 'card-dates dl-overdue' : 'card-dates';

    // Badges
    const deptName = currentDeptName || 'ທົ່ວໄປ';
    const deptBadgeClass = `badge-dept-${task.deptId}`;
    
    let prioName = 'ກາງ';
    if (task.priority === 'high') prioName = 'ສູງ';
    if (task.priority === 'low') prioName = 'ຕໍ່າ';
    const prioBadgeClass = `badge-prio-${task.priority}`;

    // Assignee details
    let assigneeText = '<i class="fa-solid fa-circle-question"></i> ຍັງບໍ່ມອບໝາຍ';
    if (!isUnassigned) {
        const assignee = members.find(m => m.id === task.assigneeId);
        let avatarMarkup = `<i class="fa-solid fa-user-circle"></i>`;
        if (assignee && assignee.profilePic) {
            avatarMarkup = `<img src="${assignee.profilePic}" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover; vertical-align: middle;">`;
        }
        assigneeText = `${avatarMarkup} <span class="name-label" style="vertical-align: middle;">${assignee ? assignee.name : 'ບໍ່ພົບຂໍ້ມູນ'}</span>`;
    }

    // Action buttons
    let actionButtonsHTML = '';
    if (isUnassigned) {
        // Claim task button
        actionButtonsHTML += `
            <button class="card-btn claim-btn" onclick="claimTask('${task.id}')">
                <i class="fa-solid fa-hands-holding"></i> ຮັບວຽກ
            </button>
        `;
    } else {
        // If assigned to current user AND status is 'todo', show "ຮັບວຽກເອງ" button!
        const isMine = (task.assigneeId === currentUser.id);
        if (isMine && task.status === 'todo') {
            actionButtonsHTML += `
                <button class="card-btn accept-btn" onclick="acceptTask('${task.id}')" style="background: rgba(16, 185, 129, 0.08); color: #10b981; border-color: rgba(16, 185, 129, 0.25);">
                    <i class="fa-solid fa-play"></i> ຮັບວຽກເອງ
                </button>
            `;
        }

        // Report button, Delegate button and Quick status dropdown helper for mobile
        actionButtonsHTML += `
            <button class="card-btn report-btn" onclick="openEditTaskModal('${task.id}')" style="background: rgba(168, 85, 247, 0.08); color: #a855f7; border-color: rgba(168, 85, 247, 0.25);">
                <i class="fa-solid fa-file-signature"></i> ລາຍງານ
            </button>
            <button class="card-btn delegate-btn" onclick="openDelegateModal('${task.id}')">
                <i class="fa-solid fa-share-nodes"></i> ມອບຕໍ່
            </button>
            <select class="card-btn status-select-mobile" onchange="changeTaskStatusMobile('${task.id}', this.value)" style="max-width: 90px; padding: 2px;">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>ຕ້ອງເຮັດ</option>
                <option value="inprogress" ${task.status === 'inprogress' ? 'selected' : ''}>ກໍາລັງເຮັດ</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>ສໍາເລັດ</option>
            </select>
        `;
    }

    let reportMarkup = '';
    if (task.report) {
        reportMarkup = `
            <div class="card-report-display" style="font-size: 0.75rem; color: #a855f7; margin-top: 6px; padding: 4px 6px; background: rgba(168, 85, 247, 0.08); border-radius: 4px; border: 1px dashed rgba(168, 85, 247, 0.2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${task.report}">
                <i class="fa-solid fa-file-signature"></i> <b>ລາຍງານ:</b> ${task.report}
            </div>
        `;
    }

    let attachmentsMarkup = '';
    if (task.attachments && task.attachments.length > 0) {
        attachmentsMarkup = `<div class="card-attachments-list" style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">`;
        attachmentsMarkup += `<div style="font-size: 0.65rem; font-weight: bold; opacity: 0.7; color: var(--color-indigo); margin-bottom: 2px;"><i class="fa-solid fa-paperclip"></i> ໄຟລ໌ມອບວຽກ:</div>`;
        task.attachments.forEach((file, fileIdx) => {
            let iconClass = 'fa-file-lines';
            if (file.name.endsWith('.pdf')) iconClass = 'fa-file-pdf';
            else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fa-file-excel';
            else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-file-word';
            else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) iconClass = 'fa-file-image';
            
            attachmentsMarkup += `
                <a href="#" class="card-task-attachment-link" data-index="${fileIdx}" style="display: block; padding: 4px 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; text-decoration: none;">
                    <span style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--color-elec); font-weight: 500;">
                        <i class="fa-solid ${iconClass}"></i> ${file.name}
                    </span>
                    ${file.description ? `<span style="font-size: 0.65rem; opacity: 0.75; font-style: italic; display: block; margin-top: 2px; color: #818cf8; padding-left: 14px;">↳ ${file.description}</span>` : ''}
                </a>
            `;
        });
        attachmentsMarkup += `</div>`;
    }

    let reportAttachmentsMarkup = '';
    if (task.reportAttachments && task.reportAttachments.length > 0) {
        reportAttachmentsMarkup = `<div class="card-attachments-list" style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">`;
        reportAttachmentsMarkup += `<div style="font-size: 0.65rem; font-weight: bold; opacity: 0.7; color: #a855f7; margin-bottom: 2px;"><i class="fa-solid fa-paperclip"></i> ໄຟລ໌ລາຍງານ:</div>`;
        task.reportAttachments.forEach((file, fileIdx) => {
            let iconClass = 'fa-file-lines';
            if (file.name.endsWith('.pdf')) iconClass = 'fa-file-pdf';
            else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fa-file-excel';
            else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-file-word';
            else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) iconClass = 'fa-file-image';
            
            reportAttachmentsMarkup += `
                <a href="#" class="card-report-attachment-link" data-index="${fileIdx}" style="display: block; padding: 4px 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; text-decoration: none;">
                    <span style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--color-elec); font-weight: 500;">
                        <i class="fa-solid ${iconClass}"></i> ${file.name}
                    </span>
                    ${file.description ? `<span style="font-size: 0.65rem; opacity: 0.75; font-style: italic; display: block; margin-top: 2px; color: #818cf8; padding-left: 14px;">↳ ${file.description}</span>` : ''}
                </a>
            `;
        });
        reportAttachmentsMarkup += `</div>`;
    }

    const totalAttachmentsCount = (task.attachments ? task.attachments.length : 0) + (task.reportAttachments ? task.reportAttachments.length : 0);

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${task.name}</div>
            <span class="prio-indicator prio-${task.priority}" title="ความສໍາຄັນ: ${prioName}"></span>
        </div>
        <div class="card-desc">${task.desc || 'ບໍ່ມີລາຍລະອຽດວຽກງານ...'}</div>
        <div class="card-meta-tags">
            <span class="badge ${deptBadgeClass}">${deptName}</span>
            <span class="badge ${prioBadgeClass}">${prioName}</span>
            ${totalAttachmentsCount > 0 ? `<span class="card-attachments-summary" title="${totalAttachmentsCount} ເອກະສານແນບ"><i class="fa-solid fa-paperclip"></i> ${totalAttachmentsCount}</span>` : ''}
        </div>
        ${reportMarkup}
        ${attachmentsMarkup}
        ${reportAttachmentsMarkup}
        <div class="${dateClass}">
            <span>ເລີ່ມ: ${task.start}</span>
            <span class="dl-label">
                <i class="fa-solid fa-clock"></i> ສຳເລັດ: ${task.deadline}
            </span>
        </div>
        <div class="card-footer-actions">
            <div class="card-assignee-info">${assigneeText}</div>
            <div class="card-actions-buttons">${actionButtonsHTML}</div>
        </div>
    `;

    // Attach click listeners to card attachments programmatically
    if (task.attachments && task.attachments.length > 0) {
        const links = card.querySelectorAll('.card-task-attachment-link');
        links.forEach(link => {
            const fileIdx = parseInt(link.getAttribute('data-index'));
            const file = task.attachments[fileIdx];
            if (file) {
                link.addEventListener('click', (e) => {
                    const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                    mockDownload(file.name, e, file.dataUrl || fallbackUrl);
                });
            }
        });
    }

    if (task.reportAttachments && task.reportAttachments.length > 0) {
        const links = card.querySelectorAll('.card-report-attachment-link');
        links.forEach(link => {
            const fileIdx = parseInt(link.getAttribute('data-index'));
            const file = task.reportAttachments[fileIdx];
            if (file) {
                link.addEventListener('click', (e) => {
                    const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                    mockDownload(file.name, e, file.dataUrl || fallbackUrl);
                });
            }
        });
    }

    // DRAG AND DROP HANDLERS (for desktop)
    if (!isUnassigned) {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
            // Dynamic effect
            setTimeout(() => card.style.display = 'none', 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            card.style.display = 'block';
        });
    }

    // Double click to open full details modal
    card.addEventListener('dblclick', () => {
        openEditTaskModal(task.id);
    });

    return card;
}

// HTML5 Drag and drop setup for Kanban columns
document.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
        column.classList.remove('drag-over');
    });

    column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = column.getAttribute('data-status');
        
        updateTaskStatus(taskId, newStatus);
    });
});

function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        
        // Prevent moving unassigned tasks unless claimed
        if (task.assigneeId === "" && !isUserManagement(currentUser)) {
            showToast("ກະລຸນາກົດ 'ຮັບວຽກ' ເພື່ອເປັນຜູ້ຮັບຜິດຊອບກ່ອນຍ້າຍສະຖານະ!", "warning");
            renderKanbanBoard();
            return;
        }

        // Prevent non-supervisor and non-assignee from moving tasks
        const isSupervisor = isUserManagement(currentUser);
        const isAssignee = (currentUser && !isUserManagement(currentUser) && task.assigneeId === currentUser.id);
        if (!isSupervisor && !isAssignee) {
            showToast("ທ່ານບໍ່ມີສິດປ່ຽນສະຖານະວຽກງານຂອງສະມາຊິກຄົນອື່ນ!", "error");
            renderKanbanBoard();
            return;
        }

        const oldStatus = task.status;
        if (oldStatus !== newStatus) {
            task.status = newStatus;
            saveState();
            renderKanbanBoard();
            
            // Notification toast
            const statusNames = { todo: "ຕ້ອງເຮັດ (To Do)", inprogress: "ກໍາລັງດໍາເນີນການ (In Progress)", done: "ສໍາເລັດແລ້ວ (Done)" };
            showToast(`ອັບເດດສະຖານະວຽກງານເປັນ: ${statusNames[newStatus]}`, 'success');
        }
    }
}

// Status selection helper (non-drag & drop / mobile / desktop dropdown)
window.changeTaskStatusMobile = function(taskId, newStatus) {
    updateTaskStatus(taskId, newStatus);
};

// Claim task feature: assign to current member
window.claimTask = function(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].assigneeId = currentUser.id;
        
        // Also update task department to match member's department, to keep clean
        tasks[taskIndex].deptId = currentUser.deptId;
        
        saveState();
        renderKanbanBoard();
        showToast("ທ່ານໄດ້ຮັບວຽກງານນີ້ເຂົ້າສັງກັດຂອງຕົນເອງແລ້ວ!", 'success');
    }
};

// Accept task feature: move assigned task from todo to inprogress
window.acceptTask = function(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = 'inprogress';
        saveState();
        
        // Refresh appropriate view
        if (typeof currentPersonalTab !== 'undefined' && currentPersonalTab === 'dashboard') {
            renderSupervisorDashboard();
        } else {
            renderKanbanBoard();
        }
        
        showToast("ທ່ານໄດ້ຮັບວຽກງານ ແລະ ເລີ່ມດຳເນີນການແລ້ວ!", 'success');
    }
};

// Quick reload checkbox switch
document.getElementById('chk-show-unassigned').addEventListener('change', renderKanbanBoard);


// ==========================================================================
// MODAL DIALOG CONTROLLER & CRUD ACTIONS
// ==========================================================================

// Global Modal helper
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Setup Close buttons for all modals
document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        // Prevent form submission if in button
        if (e.target.type !== 'submit') {
            const modalId = trigger.getAttribute('data-modal');
            closeModal(modalId);
        }
    });
});

// Close modal if clicking background backdrop
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            backdrop.classList.remove('active');
        }
    });
});


// --------------------------------------------------------------------------
// 1. TASK MODAL (Create & Edit Task)
// --------------------------------------------------------------------------

// Re-populate assignees dropdown based on selected department in task form
const taskDeptSelect = document.getElementById('task-dept-input');
const taskAssigneeSelect = document.getElementById('task-assignee-input');

taskDeptSelect.addEventListener('change', () => {
    updateTaskFormAssigneeOptions(parseInt(taskDeptSelect.value), "");
});

taskAssigneeSelect.addEventListener('change', (e) => {
    const isCreateMode = !document.getElementById('task-id').value;
    if (isCreateMode) {
        document.getElementById('task-report-section').style.display = 'none';
    } else {
        const hasAssignee = !!e.target.value;
        document.getElementById('task-report-section').style.display = hasAssignee ? 'block' : 'none';
    }
});

function updateTaskFormAssigneeOptions(deptId, currentAssigneeId) {
    taskAssigneeSelect.innerHTML = '<option value="">-- ຍັງບໍ່ມອບໝາຍ (Unassigned) --</option>';
    
    // Get members of this department
    const deptMembers = members.filter(m => m.deptId === deptId);
    
    deptMembers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = m.name;
        if (m.id === currentAssigneeId) opt.selected = true;
        taskAssigneeSelect.appendChild(opt);
    });

    // Toggle report section based on assignment status and creation mode
    const isCreateMode = !document.getElementById('task-id').value;
    if (isCreateMode) {
        document.getElementById('task-report-section').style.display = 'none';
    } else {
        const hasAssignee = !!taskAssigneeSelect.value;
        document.getElementById('task-report-section').style.display = hasAssignee ? 'block' : 'none';
    }
}

// Open create modal
document.getElementById('btn-create-task').addEventListener('click', () => {
    document.getElementById('form-task').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-task-title').innerText = 'ສ້າງວຽກງານໃໝ່';
    
    currentAttachments = [];
    currentReportAttachments = [];
    renderModalAttachments();
    renderModalReportAttachments();
    document.getElementById('task-assignment-upload-container').style.display = 'block';

    // Enable all fields for new task creation
    document.getElementById('task-name-input').disabled = false;
    document.getElementById('task-desc-input').disabled = false;
    taskDeptSelect.disabled = false;
    taskAssigneeSelect.disabled = false;
    document.getElementById('task-start-input').disabled = false;
    document.getElementById('task-deadline-input').disabled = false;
    document.getElementById('task-priority-input').disabled = false;
    document.getElementById('task-status-input').disabled = false;
    document.getElementById('task-report-input').disabled = false;
    document.getElementById('btn-trigger-file').disabled = false;
    document.getElementById('btn-trigger-camera').disabled = false;
    document.getElementById('btn-trigger-report-file').disabled = true;
    document.getElementById('btn-trigger-report-camera').disabled = true;

    // Set default dates
    document.getElementById('task-start-input').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-deadline-input').value = getDateOffset(7);
    
    // Default department and dropdowns (lock if department admin)
    if (isUserDeptAdmin(currentUser)) {
        taskDeptSelect.value = currentUser.deptId.toString();
        taskDeptSelect.disabled = true;
        updateTaskFormAssigneeOptions(currentUser.deptId, "");
    } else {
        taskDeptSelect.value = "1";
        taskDeptSelect.disabled = false;
        updateTaskFormAssigneeOptions(1, "");
    }
    
    openModal('modal-task');
});

// Save task form handler
document.getElementById('form-task').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id').value;
    const name = document.getElementById('task-name-input').value.trim();
    const desc = document.getElementById('task-desc-input').value.trim();
    const deptId = parseInt(taskDeptSelect.value);
    const assigneeId = taskAssigneeSelect.value;
    const start = document.getElementById('task-start-input').value;
    const deadline = document.getElementById('task-deadline-input').value;
    const priority = document.getElementById('task-priority-input').value;
    const status = document.getElementById('task-status-input').value;
    const report = document.getElementById('task-report-input').value.trim();

    if (deadline < start) {
        showToast("ວັນທີ່ສຳເລັດຕ້ອງບໍ່ກ່ອນວັນທີເລີ່ມຕົ້ນ!", "error");
        return;
    }

    if (id) {
        // Edit mode
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            // Keep existing fields if user is a member (to prevent overwriting disabled inputs)
            const isSupervisor = isUserManagement(currentUser);
            if (isSupervisor) {
                const oldAssigneeId = tasks[index].assigneeId;
                tasks[index] = { ...tasks[index], name, desc, deptId, assigneeId, start, deadline, priority, status, report, attachments: currentAttachments, reportAttachments: currentReportAttachments };
                if (oldAssigneeId !== assigneeId && assigneeId) {
                    playNotificationSound();
                }
            } else {
                tasks[index] = { ...tasks[index], status, report, reportAttachments: currentReportAttachments };
            }
            showToast("ແກ້ໄຂຂໍ້ມູນວຽກງານສໍາເລັດ", 'success');
        }
    } else {
        // Add mode
        const currentUserId = (currentUser && typeof currentUser === 'object') ? currentUser.id : (currentUser || 'supervisor');
        const newTask = {
            id: 't-' + Date.now(),
            name, desc, deptId, assigneeId, start, deadline, priority, status, report,
            creatorId: currentUserId,
            attachments: currentAttachments,
            reportAttachments: currentReportAttachments
        };
        tasks.push(newTask);
        showToast("ເພີ່ມວຽກງານໃໝ່ສໍາເລັດ", 'success');
        if (assigneeId) {
            playNotificationSound();
        }
    }

    saveState();
    closeModal('modal-task');
    
    // Refresh active view
    if (isUserManagement(currentUser)) {
        renderSupervisorDashboard();
    } else {
        renderPersonalView();
    }
});

// Edit task action click
window.openEditTaskModal = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check department admin boundary
    if (isUserDeptAdmin(currentUser) && task.deptId !== currentUser.deptId) {
        showToast("ທ່ານບໍ່ມີສິດຈັດການວຽກງານຂອງໜ່ວຍງານອື່ນ!", "error");
        return;
    }

    const currentUserId = (currentUser && typeof currentUser === 'object') ? currentUser.id : (currentUser || 'supervisor');
    const isCreator = (task.creatorId === currentUserId) || (!task.creatorId && currentUserId === 'supervisor');
    const isSupervisor = isUserManagement(currentUser);
    const isDeptAdmin = isUserDeptAdmin(currentUser);
    const isAssignee = (currentUser && !isUserManagement(currentUser) && task.assigneeId === currentUser.id);

    // Fill form values
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-name-input').value = task.name;
    document.getElementById('task-desc-input').value = task.desc;
    taskDeptSelect.value = task.deptId.toString();
    
    updateTaskFormAssigneeOptions(task.deptId, task.assigneeId);
    
    document.getElementById('task-start-input').value = task.start;
    document.getElementById('task-deadline-input').value = task.deadline;
    document.getElementById('task-priority-input').value = task.priority;
    document.getElementById('task-status-input').value = task.status;
    document.getElementById('task-report-input').value = task.report || '';

    // Check edit permissions (Only allow the creator/assigner to edit core task info)
    const canEditCoreFields = isSupervisor && isCreator;
    
    document.getElementById('task-name-input').disabled = !canEditCoreFields;
    document.getElementById('task-desc-input').disabled = !canEditCoreFields;
    taskDeptSelect.disabled = !canEditCoreFields || isDeptAdmin;
    taskAssigneeSelect.disabled = !canEditCoreFields;
    document.getElementById('task-start-input').disabled = !canEditCoreFields;
    document.getElementById('task-deadline-input').disabled = !canEditCoreFields;
    document.getElementById('task-priority-input').disabled = !canEditCoreFields;

    // Status can be edited by the supervisor, creator, or assignee
    const canEditStatus = isSupervisor || isCreator || isAssignee;
    document.getElementById('task-status-input').disabled = !canEditStatus;

    // Report and attachments can be edited by the supervisor, creator, or assignee
    const canEditReportAndAttachments = isSupervisor || isCreator || isAssignee;
    document.getElementById('task-report-input').disabled = !canEditReportAndAttachments;
    document.getElementById('btn-trigger-file').disabled = !canEditReportAndAttachments;
    document.getElementById('btn-trigger-camera').disabled = !canEditReportAndAttachments;
    document.getElementById('btn-trigger-report-file').disabled = !canEditReportAndAttachments;
    document.getElementById('btn-trigger-report-camera').disabled = !canEditReportAndAttachments;

    // Load and render attachments after setting disabled states
    currentAttachments = task.attachments ? [...task.attachments] : [];
    currentReportAttachments = task.reportAttachments ? [...task.reportAttachments] : [];
    renderModalAttachments();
    renderModalReportAttachments();
    document.getElementById('task-assignment-upload-container').style.display = 'none';

    document.getElementById('modal-task-title').innerText = canEditCoreFields ? 'ແກ້ໄຂຂໍ້ມູນວຽກງານ' : 'ລາຍງານຄວາມຄືບໜ້າ & ສະຖານະວຽກງານ';
    openModal('modal-task');
};

// Attachment file input triggers
document.getElementById('btn-trigger-file').addEventListener('click', () => {
    document.getElementById('task-file-input').click();
});

// Helper to compress image files before storing as Base64 to save LocalStorage space
function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            // Non-image files are loaded as normal Data URL
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress as JPEG with 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

async function handleTaskFilesUpload(files, successMessage) {
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Compress image or read file
            const dataUrl = await compressImage(file);
            
            // Calculate actual size of the base64 string
            const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
            const sizeFormatted = (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
            
            currentAttachments.push({
                name: file.name,
                size: sizeFormatted,
                dataUrl: dataUrl
            });
        } catch (err) {
            console.error("Error reading/compressing file:", err);
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            currentAttachments.push({
                name: file.name,
                size: sizeMB
            });
        }
    }

    renderModalAttachments();
    showToast(successMessage, "success");
}

document.getElementById('task-file-input').addEventListener('change', async (e) => {
    await handleTaskFilesUpload(e.target.files, "ແນບໄຟລ໌ເອກະສານສໍາເລັດ");
    e.target.value = '';
});

document.getElementById('task-image-input').addEventListener('change', async (e) => {
    await handleTaskFilesUpload(e.target.files, "ແນບຮູບພາບສໍາເລັດ");
    e.target.value = '';
});

function renderModalAttachments() {
    const listContainer = document.getElementById('task-attachments-list');
    
    if (!listContainer) return;
    listContainer.innerHTML = '';

    currentAttachments.forEach((file, index) => {
        let iconClass = 'fa-file-lines';
        if (file.name.endsWith('.pdf')) iconClass = 'fa-file-pdf';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fa-file-excel';
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-file-word';
        else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) iconClass = 'fa-file-image';

        const item = document.createElement('div');
        item.className = 'attachment-item';
        
        let nameMarkup = `<span class="file-name link-style" style="cursor: pointer; text-decoration: underline; color: var(--color-elec);" title="ຄລິກເພື່ອເບິ່ງ/ດາວໂຫຼດ">${file.name}</span>`;

        const modalReadOnly = document.getElementById('task-status-input').disabled;
        const deleteButtonHTML = modalReadOnly ? '' : `<button type="button" class="attachment-delete-btn" onclick="deleteAttachment(${index})" title="ລຶບໄຟລ໌ແນບ">&times;</button>`;
        const descInputHTML = `
            <input type="text" 
                   class="attachment-desc-input" 
                   placeholder="ລາຍລະອຽດເອກະສານ..." 
                   value="${file.description || ''}" 
                   onchange="updateAttachmentDescription(${index}, this.value)" 
                   ${modalReadOnly ? 'disabled' : ''} 
                   style="margin-left: 8px; padding: 2px 8px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.15); border-radius: 4px; color: #fff; width: 160px; outline: none;">
        `;

        item.innerHTML = `
            <div class="attachment-item-left" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <i class="fa-solid ${iconClass}"></i>
                ${nameMarkup}
                <span class="file-size" style="opacity: 0.6; font-size: 0.7rem;">(${file.size})</span>
                ${descInputHTML}
            </div>
            ${deleteButtonHTML}
        `;

        // Attach click listener programmatically with fallback
        const fileLink = item.querySelector('.file-name.link-style');
        if (fileLink) {
            fileLink.addEventListener('click', (e) => {
                const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                mockDownload(file.name, e, file.dataUrl || fallbackUrl);
            });
        }

        listContainer.appendChild(item);
    });
}

window.updateAttachmentDescription = function(index, value) {
    if (currentAttachments[index]) {
        currentAttachments[index].description = value.trim();
    }
};

window.deleteAttachment = function(index) {
    currentAttachments.splice(index, 1);
    renderModalAttachments();
    showToast("ລຶບໄຟລ໌ແນບແລ້ວ", "info");
};

// Report Attachments rendering and management
function renderModalReportAttachments() {
    const listContainer = document.getElementById('report-attachments-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    currentReportAttachments.forEach((file, index) => {
        let iconClass = 'fa-file-lines';
        if (file.name.endsWith('.pdf')) iconClass = 'fa-file-pdf';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fa-file-excel';
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-file-word';
        else if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) iconClass = 'fa-file-image';

        const item = document.createElement('div');
        item.className = 'attachment-item';
        
        let nameMarkup = `<span class="file-name link-style" style="cursor: pointer; text-decoration: underline; color: var(--color-elec);" title="ຄລິກເພື່ອເບິ່ງ/ດາວໂຫຼດ">${file.name}</span>`;

        const modalReadOnly = document.getElementById('task-report-input').disabled;
        const deleteButtonHTML = modalReadOnly ? '' : `<button type="button" class="attachment-delete-btn" onclick="deleteReportAttachment(${index})" title="ລຶບໄຟລ໌ແນບ">&times;</button>`;
        const descInputHTML = `
            <input type="text" 
                   class="attachment-desc-input" 
                   placeholder="ລາຍລະອຽດເອກະສານ..." 
                   value="${file.description || ''}" 
                   onchange="updateReportAttachmentDescription(${index}, this.value)" 
                   ${modalReadOnly ? 'disabled' : ''} 
                   style="margin-left: 8px; padding: 2px 8px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.15); border-radius: 4px; color: #fff; width: 160px; outline: none;">
        `;

        item.innerHTML = `
            <div class="attachment-item-left" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <i class="fa-solid ${iconClass}"></i>
                ${nameMarkup}
                <span class="file-size" style="opacity: 0.6; font-size: 0.7rem;">(${file.size})</span>
                ${descInputHTML}
            </div>
            ${deleteButtonHTML}
        `;

        const fileLink = item.querySelector('.file-name.link-style');
        if (fileLink) {
            fileLink.addEventListener('click', (e) => {
                const fallbackUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent('ເນື້ອໃນເອກະສານຈຳລອງສຳລັບ: ' + file.name + '\n\n(ນີ້ແມ່ນໄຟລ໌ຈຳລອງໃນລະບົບ Front-end Demo)');
                mockDownload(file.name, e, file.dataUrl || fallbackUrl);
            });
        }

        listContainer.appendChild(item);
    });
}

window.updateReportAttachmentDescription = function(index, value) {
    if (currentReportAttachments[index]) {
        currentReportAttachments[index].description = value.trim();
    }
};

window.deleteReportAttachment = function(index) {
    currentReportAttachments.splice(index, 1);
    renderModalReportAttachments();
    showToast("ລຶບໄຟລ໌ແນບລາຍງານແລ້ວ", "info");
};

async function handleReportFilesUpload(files, successMessage) {
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const dataUrl = await compressImage(file);
            const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
            const sizeFormatted = (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
            
            currentReportAttachments.push({
                name: file.name,
                size: sizeFormatted,
                dataUrl: dataUrl
            });
        } catch (err) {
            console.error("Error reading/compressing file:", err);
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            currentReportAttachments.push({
                name: file.name,
                size: sizeMB
            });
        }
    }

    renderModalReportAttachments();
    showToast(successMessage, "success");
}

// Bind report attachment buttons
document.getElementById('btn-trigger-report-file').addEventListener('click', () => {
    document.getElementById('report-file-input').click();
});

document.getElementById('btn-trigger-report-camera').addEventListener('click', () => {
    document.getElementById('report-image-input').click();
});

document.getElementById('report-file-input').addEventListener('change', async (e) => {
    await handleReportFilesUpload(e.target.files, "ແນບໄຟລ໌ລາຍງານສໍາເລັດ");
    e.target.value = '';
});

document.getElementById('report-image-input').addEventListener('change', async (e) => {
    await handleReportFilesUpload(e.target.files, "ແນບຮູບລາຍງານສໍາເລັດ");
    e.target.value = '';
});

window.mockDownload = function(fileName, event, dataUrl) {
    if (event) event.preventDefault();
    if (dataUrl) {
        try {
            const previewTitle = document.getElementById('preview-title');
            const previewBody = document.getElementById('preview-body');
            
            if (previewTitle && previewBody) {
                previewTitle.innerText = fileName;
                previewBody.innerHTML = '';
                
                if (dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:img/')) {
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
                    previewBody.appendChild(img);
                    openModal('modal-preview');
                    showToast("ກຳລັງສະແດງຮູບພາບ", "success");
                } else if (dataUrl.startsWith('data:application/pdf')) {
                    const obj = document.createElement('object');
                    obj.data = dataUrl;
                    obj.type = 'application/pdf';
                    obj.style.width = '100%';
                    obj.style.height = '100%';
                    obj.style.border = 'none';
                    obj.style.borderRadius = '8px';
                    
                    obj.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #f59e0b; margin-bottom: 10px;"></i>
                            <p style="margin: 10px 0 20px 0;">ບຣາວເຊີຂອງທ່ານບໍ່ຮອງຮັບການສະແດງຜົນ PDF ໂດຍກົງ.</p>
                            <a href="${dataUrl}" download="${fileName}" class="primary-btn" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 10px 20px;">
                                <i class="fa-solid fa-cloud-arrow-down"></i> ດາວໂຫຼດໄຟລ໌ PDF
                            </a>
                        </div>
                    `;
                    previewBody.appendChild(obj);
                    openModal('modal-preview');
                    showToast("ກຳລັງສະແດງເອກະສານ PDF", "success");
                } else {
                    // Show a preview info card with a download button first
                    let iconClass = 'fa-file-lines';
                    let iconColor = '#94a3b8';
                    const nameLower = fileName.toLowerCase();
                    if (nameLower.endsWith('.pdf') || dataUrl.startsWith('data:application/pdf')) { iconClass = 'fa-file-pdf'; iconColor = '#ef4444'; }
                    else if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls')) { iconClass = 'fa-file-excel'; iconColor = '#10b981'; }
                    else if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) { iconClass = 'fa-file-word'; iconColor = '#3b82f6'; }
                    else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) { iconClass = 'fa-file-image'; iconColor = '#a855f7'; }

                    const previewCard = document.createElement('div');
                    previewCard.style.display = 'flex';
                    previewCard.style.flexDirection = 'column';
                    previewCard.style.alignItems = 'center';
                    previewCard.style.justifyContent = 'center';
                    previewCard.style.textAlign = 'center';
                    previewCard.style.padding = '40px 24px';
                    previewCard.style.background = '#ffffff';
                    previewCard.style.border = '1px solid var(--glass-border)';
                    previewCard.style.borderRadius = '12px';
                    previewCard.style.maxWidth = '400px';
                    previewCard.style.width = '90%';
                    previewCard.style.boxShadow = 'var(--shadow-lg)';

                    previewCard.innerHTML = `
                        <i class="fa-solid ${iconClass}" style="font-size: 5rem; color: ${iconColor}; margin-bottom: 20px;"></i>
                        <h3 style="margin: 0 0 10px 0; color: var(--text-primary); font-size: 1.1rem; word-break: break-all;">${fileName}</h3>
                        <p style="margin: 0 0 24px 0; color: var(--text-secondary); font-size: 0.85rem;">
                            ບໍ່ຮອງຮັບການສະແດງຜົນໃນເວັບໂດຍກົງ. ທ່ານສາມາດດາວໂຫຼດເພື່ອເປີດເບິ່ງເອກະສານນີ້.
                        </p>
                        <button type="button" class="primary-btn" id="btn-download-preview" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 500; padding: 10px 24px; cursor: pointer; border-radius: 6px;">
                            <i class="fa-solid fa-cloud-arrow-down"></i> ດາວໂຫຼດເອກະສານ
                        </button>
                    `;

                    const downloadBtn = previewCard.querySelector('#btn-download-preview');
                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', () => {
                            const a = document.createElement('a');
                            a.href = dataUrl;
                            a.download = fileName;
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            closeModal('modal-preview');
                            showToast(`ດາວໂຫຼດເອກະສານສຳເລັດ`, "success");
                        });
                    }

                    previewBody.appendChild(previewCard);
                    openModal('modal-preview');
                    showToast("ກຳລັງສະແດງລາຍລະອຽດເອກະສານ", "success");
                }
            } else {
                // Fallback direct download
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast(`ກຳລັງດາວໂຫຼດເອກະສານ: ${fileName}`, "success");
            }
        } catch(e) {
            console.error(e);
            showToast("ເກີດຂໍ້ຜິດພາດໃນການເປີດເອກະສານ", "error");
        }
    } else {
        showToast(`ບໍ່ມີຂໍ້ມູນເອກະສານສໍາລັບດາວໂຫຼດ`, "warning");
    }
};

// Camera Stream Logic
let activeStream = null;

function startCamera() {
    const video = document.getElementById('camera-stream');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }) // Prefer back camera
            .then(stream => {
                activeStream = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.error("Camera access error:", err);
                showToast("ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໄດ້", "error");
                closeModal('modal-camera');
            });
    } else {
        showToast("ບຣາວເຊີຂອງທ່ານບໍ່ຮອງຮັບການເຂົ້າເຖິງກ້ອງ", "error");
        closeModal('modal-camera');
    }
}

function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
    }
    const video = document.getElementById('camera-stream');
    if (video) {
        video.srcObject = null;
    }
    closeModal('modal-camera');
}

function capturePhoto() {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw mirrored frame matching video display
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get Base64 data URL
    const dataUrl = canvas.toDataURL('image/png');
    const photoName = `photo_${Date.now()}.png`;
    
    currentAttachments.push({
        name: photoName,
        size: '180 KB',
        dataUrl: dataUrl
    });

    renderModalAttachments();
    stopCamera();
    showToast("ຖ່າຍຮູບ ແລະ ແນບຮູບພາບສໍາເລັດ", "success");
}

// Bind camera buttons
document.getElementById('btn-trigger-camera').addEventListener('click', () => {
    document.getElementById('task-image-input').click();
});
document.getElementById('btn-close-camera').addEventListener('click', stopCamera);
document.getElementById('btn-cancel-camera').addEventListener('click', stopCamera);
document.getElementById('btn-capture-photo').addEventListener('click', capturePhoto);

// Delete task confirmation
window.deleteTaskConfirm = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentUserId = (currentUser && typeof currentUser === 'object') ? currentUser.id : (currentUser || 'supervisor');
    const isCreator = (task.creatorId === currentUserId) || (!task.creatorId && currentUserId === 'supervisor');
    if (!isCreator) {
        showToast("ທ່ານບໍ່ມີສິດລຶບວຽກງານນີ້ ເນື່ອງຈາກທ່ານບໍ່ແມ່ນຜູ້ມອບໝາຍວຽກ!", "error");
        return;
    }

    if (confirm(`ທ່ານຕ້ອງການລຶບວຽກ "${task.name}" ແທ້ ຫຼື ບໍ່?`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveState();
        renderSupervisorDashboard();
        showToast("ລຶບວຽກງານສໍາເລັດ", 'success');
    }
};

// --------------------------------------------------------------------------
// 2. DELEGATE / REASSIGN TASK MODAL
// --------------------------------------------------------------------------

window.openDelegateModal = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check department admin boundary
    if (isUserDeptAdmin(currentUser) && task.deptId !== currentUser.deptId) {
        showToast("ທ່ານບໍ່ມີສິດມອບໝາຍວຽກງານຂອງໜ່ວຍງານອື່ນ!", "error");
        return;
    }


    document.getElementById('delegate-task-id').value = task.id;
    document.getElementById('delegate-task-name').innerText = task.name;

    const selectAssignee = document.getElementById('delegate-assignee-input');
    selectAssignee.innerHTML = '<option value="">-- ບໍ່ມອບໝາຍ (Unassigned) --</option>';

    // Group members by department in the delegate dropdown dynamically
    Object.keys(DEPARTMENTS).forEach(deptKey => {
        const deptId = parseInt(deptKey);
        // If department admin, only allow delegating to members of their own department
        if (isUserDeptAdmin(currentUser) && currentUser.deptId !== deptId) {
            return;
        }
        
        const deptName = DEPARTMENTS[deptId];
        const deptMembers = members.filter(m => m.deptId === deptId);
        
        if (deptMembers.length > 0) {
            const group = document.createElement('optgroup');
            group.label = deptName;
            deptMembers.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.innerText = m.name;
                if (m.id === task.assigneeId) opt.selected = true;
                group.appendChild(opt);
            });
            selectAssignee.appendChild(group);
        }
    });

    openModal('modal-delegate');
};

// Handle Delegate form submit
document.getElementById('form-delegate').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('delegate-task-id').value;
    const newAssigneeId = document.getElementById('delegate-assignee-input').value;
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].assigneeId = newAssigneeId;
        
        // If assigned to a member, update the task's department to align with that member's department
        if (newAssigneeId) {
            const assignedMember = members.find(m => m.id === newAssigneeId);
            if (assignedMember) {
                tasks[taskIndex].deptId = assignedMember.deptId;
            }
        }
        
        saveState();
        closeModal('modal-delegate');
        
        // Refresh active view
        if (isUserManagement(currentUser)) {
            renderSupervisorDashboard();
        } else {
            renderPersonalView();
        }
        
        showToast("ມອບໝາຍວຽກງານໃໝ່ສໍາເລັດ", 'success');
        if (newAssigneeId) {
            playNotificationSound();
        }
    }
});


// --------------------------------------------------------------------------
// 3. TEAM MEMBER MANAGEMENT MODAL (CRUD)
// --------------------------------------------------------------------------

// Add trigger for Team Modal in Login screen
document.getElementById('btn-manage-team-login').addEventListener('click', () => {
    openTeamManagementModal();
});

function openTeamManagementModal() {
    switchModalTab('members');

    // Lock department selection field for department admins
    const deptSelect = document.getElementById('member-dept-input');
    if (isUserDeptAdmin(currentUser)) {
        deptSelect.value = currentUser.deptId.toString();
        deptSelect.disabled = true;
    } else {
        deptSelect.disabled = false;
    }

    openModal('modal-team');
}

function renderTeamManagementList() {
    const listContainer = document.getElementById('member-scroll-list-grouped');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    document.getElementById('members-count').innerText = members.length;

    // Get all active departments
    const deptKeys = Object.keys(DEPARTMENTS).sort((a, b) => {
        const nameA = DEPARTMENTS[a] || '';
        const nameB = DEPARTMENTS[b] || '';
        const isBranchA = nameA.includes('ຄະນະ');
        const isBranchB = nameB.includes('ຄະນະ');
        const isOfficeA = nameA.includes('ຫ້ອງການ');
        const isOfficeB = nameB.includes('ຫ້ອງການ');

        if (isBranchA && !isBranchB) return -1;
        if (!isBranchA && isBranchB) return 1;
        if (isOfficeA && !isOfficeB) return -1;
        if (!isOfficeA && isOfficeB) return 1;
        return parseInt(a) - parseInt(b);
    });
    deptKeys.forEach(deptKey => {
        const deptId = parseInt(deptKey);
        
        // If department admin, only show members of their own department
        if (isUserDeptAdmin(currentUser) && currentUser.deptId !== deptId) {
            return;
        }

        const deptName = DEPARTMENTS[deptId];
        const deptMembers = members.filter(m => m.deptId === deptId);

        const section = document.createElement('div');
        section.className = 'dept-list-section';
        
        // Pick icon/color based on department name
        let iconClass = 'fa-building';
        let colorClass = '#0ea5e9';
        if (deptName.includes('ໄຟຟ້າ')) { iconClass = 'fa-bolt'; colorClass = '#eab308'; }
        else if (deptName.includes('ຄວາມປອດໄພ')) { iconClass = 'fa-shield-halved'; colorClass = '#10b981'; }

        section.innerHTML = `
            <h4 style="color: ${colorClass}; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.85rem;"><i class="fa-solid ${iconClass}"></i> ${deptName}</h4>
            <div class="member-cards-list" id="mgmt-members-list-${deptId}" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;"></div>
        `;

        const cardsList = section.querySelector(`.member-cards-list`);
        if (deptMembers.length === 0) {
            cardsList.innerHTML = '<p class="empty-text" style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">ບໍ່ມີສະມາຊິກ</p>';
        } else {
            deptMembers.forEach(member => {
                const card = createMemberRow(member);
                cardsList.appendChild(card);
            });
        }
        listContainer.appendChild(section);
    });
}

function createMemberRow(member) {
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const avatarContent = member.profilePic 
        ? `<img src="${member.profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        : initials;
    const avatarStyle = member.profilePic ? 'background-color: transparent;' : `background-color: ${member.avatarColor};`;
    const row = document.createElement('div');
    row.className = 'member-item-row';
    row.innerHTML = `
        <div class="member-item-left">
            <div class="avatar-sm" style="${avatarStyle}">${avatarContent}</div>
            <div class="member-item-details">
                <span class="name">${member.name}</span>
                <span class="role">${member.role}</span>
            </div>
        </div>
        <div class="member-item-actions">
            <button class="icon-btn edit-action" title="ແກ້ໄຂ" onclick="editMember('${member.id}')">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn delete-action" title="ລຶບ" onclick="deleteMemberConfirm('${member.id}')">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;
    return row;
}

// Handle Member Form Submit
document.getElementById('form-member').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('member-id').value;
    const empId = document.getElementById('member-emp-id-input').value.trim();
    const name = document.getElementById('member-name-input').value.trim();
    const role = document.getElementById('member-role-input').value.trim();
    const deptId = parseInt(document.getElementById('member-dept-input').value);
    const password = document.getElementById('member-password-input').value.trim() || '1234';
    
    // Get checked radio color
    const checkedColorInput = document.querySelector('input[name="avatar-color"]:checked');
    const avatarColor = checkedColorInput ? checkedColorInput.value : "#6366f1";

    // Validate unique employee ID
    const empIdLower = empId.toLowerCase();
    const isDuplicate = members.some(m => m.id !== id && m.empId && m.empId.toLowerCase() === empIdLower) || (empIdLower === 'admin' || empIdLower === 'emp-001');
    if (isDuplicate) {
        showToast("ລະຫັດພະນັກງານນີ້ມີໃນລະບົບແລ້ວ!", "error");
        return;
    }

    if (id) {
        // Edit mode
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], empId, name, role, deptId, avatarColor, password, profilePic: currentMemberPhoto };
            showToast("ແກ້ໄຂຂໍ້ມູນສະມາຊິກສໍາເລັດ", 'success');
        }
    } else {
        // Add mode
        const newMember = {
            id: 'm-' + Date.now(),
            empId, name, role, deptId, avatarColor, password, profilePic: currentMemberPhoto
        };
        members.push(newMember);
        showToast("ເພີ່ມສະມາຊິກທີມງານໃໝ່ສໍາເລັດ", 'success');
    }

    saveState();
    resetMemberForm();
    renderTeamManagementList();
    renderTeamProgress();
});

// Switch between Members, Departments, and Backup tab inside modal-team
window.switchModalTab = function(tabName) {
    const btnMembers = document.getElementById('tab-btn-members');
    const btnDepts = document.getElementById('tab-btn-depts');
    const btnBackup = document.getElementById('tab-btn-backup');
    const panelMembers = document.getElementById('modal-tab-content-members');
    const panelDepts = document.getElementById('modal-tab-content-depts');
    const panelBackup = document.getElementById('modal-tab-content-backup');

    if (!btnMembers || !btnDepts) return;

    // Reset all tabs style
    const tabs = [
        { btn: btnMembers, panel: panelMembers },
        { btn: btnDepts, panel: panelDepts },
        { btn: btnBackup, panel: panelBackup }
    ];

    tabs.forEach(t => {
        if (t.btn && t.panel) {
            t.btn.classList.remove('active');
            t.btn.style.color = 'var(--text-muted)';
            t.btn.style.borderBottomColor = 'transparent';
            t.btn.style.fontWeight = '500';
            t.panel.classList.add('hidden');
            t.panel.classList.remove('active');
        }
    });

    // Set selected tab style
    let activeTab = null;
    if (tabName === 'backup') activeTab = { btn: btnBackup, panel: panelBackup };
    else if (tabName === 'depts') activeTab = { btn: btnDepts, panel: panelDepts };
    else activeTab = { btn: btnMembers, panel: panelMembers };

    if (activeTab && activeTab.btn && activeTab.panel) {
        activeTab.btn.classList.add('active');
        activeTab.btn.style.color = 'var(--color-indigo)';
        activeTab.btn.style.borderBottomColor = 'var(--color-indigo)';
        activeTab.btn.style.fontWeight = '600';
        activeTab.panel.classList.remove('hidden');
        activeTab.panel.classList.add('active');
    }

    if (tabName === 'members') {
        renderTeamManagementList();
    } else if (tabName === 'depts') {
        renderDeptManagementList();
        resetDeptForm();
    } else if (tabName === 'backup') {
        // Reset import state
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) fileInput.value = '';
        const fileNameSpan = document.getElementById('import-file-name');
        if (fileNameSpan) fileNameSpan.innerText = 'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌';
        const confirmBtn = document.getElementById('btn-confirm-import');
        if (confirmBtn) confirmBtn.classList.add('hidden');
    }
};

function renderDeptManagementList() {
    const listContainer = document.getElementById('depts-scroll-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const deptKeys = Object.keys(DEPARTMENTS);
    document.getElementById('depts-count').innerText = deptKeys.length;

    deptKeys.forEach(deptKey => {
        const deptId = parseInt(deptKey);
        const deptName = DEPARTMENTS[deptId];
        
        const row = document.createElement('div');
        row.className = 'member-item-row';
        row.style.padding = '8px 12px';
        
        // Count how many members are in this department
        const memberCount = members.filter(m => m.deptId === deptId).length;
        
        // Show edit/delete options if logged-in user is a supervisor (User Management)
        const isSupervisor = isUserManagement(currentUser);
        let actionMarkup = '';
        if (isSupervisor) {
            const canManage = !isUserDeptAdmin(currentUser) || currentUser.deptId === deptId;
            if (canManage) {
                actionMarkup = `
                    <div class="member-item-actions">
                        <button type="button" class="icon-btn edit-action" title="ແກ້ໄຂ" onclick="editDept('${deptId}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="icon-btn delete-action" title="ລຶບ" onclick="deleteDeptConfirm('${deptId}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
            }
        }

        row.innerHTML = `
            <div class="member-item-left">
                <div class="avatar-sm" style="background: rgba(15,23,42,0.05); color: var(--text-primary);"><i class="fa-solid fa-building"></i></div>
                <div class="member-item-details">
                    <span class="name">${deptName}</span>
                    <span class="role" style="font-size: 0.72rem; color: var(--text-muted);">${memberCount} ພະນັກງານ</span>
                </div>
            </div>
            ${actionMarkup}
        `;
        listContainer.appendChild(row);
    });
}

window.editDept = function(deptId) {
    const deptName = DEPARTMENTS[deptId];
    if (!deptName) return;

    if (isUserDeptAdmin(currentUser) && currentUser.deptId !== parseInt(deptId)) {
        showToast("ທ່ານບໍ່ມີສິດແກ້ໄຂຫ້ອງການ/ໜ່ວຍງານອື່ນ!", "error");
        return;
    }

    document.getElementById('dept-id').value = deptId;
    document.getElementById('dept-name-input').value = deptName;
    document.getElementById('dept-form-title').innerText = 'ແກ້ໄຂໜ່ວຍງານ';
    document.getElementById('btn-save-dept').innerText = 'ແກ້ໄຂຂໍ້ມູນ';
    document.getElementById('btn-reset-dept-form').classList.remove('hidden');
};

window.deleteDeptConfirm = function(deptId) {
    const deptName = DEPARTMENTS[deptId];
    if (!deptName) return;

    if (isUserDeptAdmin(currentUser) && currentUser.deptId !== parseInt(deptId)) {
        showToast("ທ່ານບໍ່ມີສິດລຶບຫ້ອງການ/ໜ່ວຍງານອື່ນ!", "error");
        return;
    }

    // Check if there are members in this department
    const memberCount = members.filter(m => m.deptId === parseInt(deptId)).length;
    if (memberCount > 0) {
        showToast("ບໍ່ສາມາດລຶບໜ່ວຍງານນີ້ໄດ້ ເນື່ອງຈາກຍັງມີພະນັກງານສັງກັດຢູ່!", "error");
        return;
    }

    if (confirm(`ທ່ານຕ້ອງການລຶບຫ້ອງການ/ໜ່ວຍງານ "${deptName}" ແທ້ ຫຼື ບໍ່?`)) {
        delete DEPARTMENTS[deptId];
        saveState();
        renderDeptManagementList();
        renderTeamProgress();
        updateAllDeptDropdowns();
        showToast("ລຶບຫ້ອງການ/ໜ່ວຍງານສໍາເລັດ", 'success');
    }
};

window.resetDeptForm = function() {
    document.getElementById('dept-id').value = '';
    document.getElementById('dept-name-input').value = '';
    document.getElementById('dept-form-title').innerText = 'ເພີ່ມໜ່ວຍງານໃໝ່';
    document.getElementById('btn-save-dept').innerText = 'ບັນທຶກໜ່ວຍງານ';
    document.getElementById('btn-reset-dept-form').classList.add('hidden');
};

// Handle Department Form Submit
document.getElementById('form-dept').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('dept-id').value;
    const name = document.getElementById('dept-name-input').value.trim();
    
    if (id) {
        // Edit mode
        if (isUserDeptAdmin(currentUser) && currentUser.deptId !== parseInt(id)) {
            showToast("ທ່ານບໍ່ມີສິດແກ້ໄຂຫ້ອງການ/ໜ່ວຍງານອື່ນ!", "error");
            return;
        }
        DEPARTMENTS[id] = name;
        showToast("ແກ້ໄຂຂໍ້ມູນຫ້ອງການ/ໜ່ວຍງານສໍາເລັດ", 'success');
    } else {
        // Add mode
        if (isUserDeptAdmin(currentUser)) {
            showToast("ຫົວໜ້າໜ່ວຍງານບໍ່ສາມາດເພີ່ມໜ່ວຍງານໃໝ່ໄດ້!", "error");
            return;
        }
        // Generate new integer ID
        const newId = Math.max(...Object.keys(DEPARTMENTS).map(Number), 0) + 1;
        DEPARTMENTS[newId] = name;
        showToast("ເພີ່ມຫ້ອງການ/ໜ່ວຍງານໃໝ່ສໍາເລັດ", 'success');
    }

    saveState();
    resetDeptForm();
    renderDeptManagementList();
    renderTeamProgress();
    updateAllDeptDropdowns();
});

window.editMember = function(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Check department admin boundary
    if (isUserDeptAdmin(currentUser) && member.deptId !== currentUser.deptId) {
        showToast("ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນສະມາຊິກໜ່ວຍງານອື່ນ!", "error");
        return;
    }

    document.getElementById('member-id').value = member.id;
    document.getElementById('member-emp-id-input').value = member.empId || '';
    document.getElementById('member-name-input').value = member.name;
    document.getElementById('member-role-input').value = member.role;
    document.getElementById('member-dept-input').value = member.deptId.toString();
    
    const pwdInput = document.getElementById('member-password-input');
    pwdInput.value = member.password || '1234';
    pwdInput.type = 'password';
    const eyeIcon = pwdInput.nextElementSibling ? pwdInput.nextElementSibling.querySelector('i') : null;
    if (eyeIcon) {
        eyeIcon.className = 'fa-solid fa-eye';
    }

    // Set profile picture preview
    currentMemberPhoto = member.profilePic || null;
    updateMemberPhotoPreview(currentMemberPhoto, member.name);

    // Select color radio
    const colorRadio = document.querySelector(`input[name="avatar-color"][value="${member.avatarColor}"]`);
    if (colorRadio) colorRadio.checked = true;

    document.getElementById('member-form-title').innerText = 'ແກ້ໄຂສະມາຊິກ';
    document.getElementById('btn-save-member').innerText = 'ແກ້ໄຂຂໍ້ມູນ';
    document.getElementById('btn-reset-member-form').classList.remove('hidden');
};

window.deleteMemberConfirm = function(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Check department admin boundary
    if (isUserDeptAdmin(currentUser) && member.deptId !== currentUser.deptId) {
        showToast("ທ່ານບໍ່ມີສິດລຶບສະມາຊິກໜ່ວຍງານອື່ນ!", "error");
        return;
    }

    if (confirm(`ທ່ານຕ້ອງການລຶບສະມາຊິກ "${member.name}" ອອກຈາກທີມແທ້ ຫຼື ບໍ່?\n(ໝາຍເຫດ: ວຽກທັງໝົດທີ່ມອບໃຫ້ສະມາຊິກຄົນນີ້ ຈະກາຍເປັນ 'Unassigned')`)) {
        
        // Remove member
        members = members.filter(m => m.id !== memberId);
        
        // Update their tasks to unassigned
        tasks.forEach(t => {
            if (t.assigneeId === memberId) {
                t.assigneeId = "";
            }
        });

        saveState();
        renderTeamManagementList();
        showToast("ລຶບສະມາຊິກອອກຈາກທີມສໍາເລັດ", 'success');
    }
};

document.getElementById('btn-reset-member-form').addEventListener('click', resetMemberForm);

function resetMemberForm() {
    document.getElementById('form-member').reset();
    document.getElementById('member-id').value = '';
    
    const pwdInput = document.getElementById('member-password-input');
    pwdInput.value = '1234';
    pwdInput.type = 'password';
    const eyeIcon = pwdInput.nextElementSibling ? pwdInput.nextElementSibling.querySelector('i') : null;
    if (eyeIcon) {
        eyeIcon.className = 'fa-solid fa-eye';
    }

    currentMemberPhoto = null;
    updateMemberPhotoPreview(null, "New");

    document.getElementById('member-form-title').innerText = 'ເພີ່ມສະມາຊິກໃໝ່';
    document.getElementById('btn-save-member').innerText = 'ບັນທຶກສະມາຊິກ';
    document.getElementById('btn-reset-member-form').classList.add('hidden');
    
    // Select default color
    const defaultColor = document.querySelector('input[name="avatar-color"][value="#6366f1"]');
    if (defaultColor) defaultColor.checked = true;
}


// ==========================================================================
// SETUP GLOBAL EVENT LISTENERS
// ==========================================================================

function setupGlobalEventListeners() {
    // 2. Logout/Switch view button
    document.getElementById('btn-logout').addEventListener('click', () => {
        logout();
    });

    // 3. Clear/Reset Supervisor metric active card filter when filter options change
    const filterSelectors = ['filter-dept', 'filter-assignee', 'filter-status', 'filter-priority'];
    filterSelectors.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            // If user manually changes filters, clear metric card selected highlight
            activeStatFilter = 'all';
            document.querySelectorAll('.metric-card').forEach(c => c.style.borderColor = '');
        });
    });



    // 5. Profile Settings modal button
    document.getElementById('btn-profile-settings').addEventListener('click', () => {
        const isSupervisor = (currentUser === 'supervisor');
        const nameInput = document.getElementById('profile-name-input');
        const roleInput = document.getElementById('profile-role-input');
        const pwdInput = document.getElementById('profile-password-input');
        const roleGroup = document.getElementById('profile-role-group');
        const colorGroup = document.getElementById('profile-color-group');
        
        pwdInput.type = 'password';
        const eyeIcon = pwdInput.nextElementSibling ? pwdInput.nextElementSibling.querySelector('i') : null;
        if (eyeIcon) {
            eyeIcon.className = 'fa-solid fa-eye';
        }

        if (isSupervisor) {
            nameInput.value = localStorage.getItem('edl_supervisor_name') || 'ຜູ້ບໍລິຫານລະບົບ';
            pwdInput.value = localStorage.getItem('edl_supervisor_password') || '1234';
            roleGroup.style.display = 'none';
            colorGroup.style.display = 'none';
            roleInput.required = false;
            nameInput.disabled = false;
            
            currentProfilePhoto = localStorage.getItem('edl_supervisor_photo') || null;
            updateProfilePhotoPreview(currentProfilePhoto, 'Supervisor');
        } else {
            nameInput.value = currentUser.name;
            roleInput.value = currentUser.role;
            pwdInput.value = currentUser.password || '1234';
            roleGroup.style.display = 'flex';
            colorGroup.style.display = 'flex';
            roleInput.required = true;
            nameInput.disabled = false;
            
            currentProfilePhoto = currentUser.profilePic || null;
            updateProfilePhotoPreview(currentProfilePhoto, currentUser.name);

            const colorRadio = document.querySelector(`input[name="profile-avatar-color"][value="${currentUser.avatarColor}"]`);
            if (colorRadio) colorRadio.checked = true;
        }
        openModal('modal-profile');
    });

    // 6. Profile form submission
    document.getElementById('form-profile').addEventListener('submit', (e) => {
        e.preventDefault();
        const isSupervisor = (currentUser === 'supervisor');
        const name = document.getElementById('profile-name-input').value.trim();
        const password = document.getElementById('profile-password-input').value.trim();
        
        if (!name || !password) {
            showToast("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ", "error");
            return;
        }
        
        if (isSupervisor) {
            localStorage.setItem('edl_supervisor_name', name);
            localStorage.setItem('edl_supervisor_password', password);
            if (currentProfilePhoto) {
                localStorage.setItem('edl_supervisor_photo', currentProfilePhoto);
            } else {
                localStorage.removeItem('edl_supervisor_photo');
            }
            
            document.getElementById('user-name').innerText = name;
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
            
            const userAvatar = document.getElementById('user-avatar');
            userAvatar.innerHTML = currentProfilePhoto 
                ? `<img src="${currentProfilePhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : initials;
            userAvatar.style.backgroundColor = currentProfilePhoto ? 'transparent' : 'var(--color-indigo)';
            
            showToast("ບັນທຶກການຕັ້ງຄ່າສ່ວນຕົວສໍາເລັດ", "success");
        } else {
            const role = document.getElementById('profile-role-input').value.trim();
            const checkedColorInput = document.querySelector('input[name="profile-avatar-color"]:checked');
            const avatarColor = checkedColorInput ? checkedColorInput.value : "#6366f1";
            
            if (!role) {
                showToast("ກະລຸນາປ້ອນຕໍາແໜ່ງ", "error");
                return;
            }
            
            const index = members.findIndex(m => m.id === currentUser.id);
            if (index !== -1) {
                members[index] = { ...members[index], name, role, avatarColor, password, profilePic: currentProfilePhoto };
                currentUser = members[index];
                
                saveState();
                
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                document.getElementById('user-name').innerText = name;
                document.getElementById('user-dept-name').innerText = role;
                
                const userAvatar = document.getElementById('user-avatar');
                userAvatar.innerHTML = currentProfilePhoto 
                    ? `<img src="${currentProfilePhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                    : initials;
                userAvatar.style.backgroundColor = currentProfilePhoto ? 'transparent' : avatarColor;
                
                showToast("ບັນທຶກການຕັ້ງຄ່າສ່ວນຕົວສໍາເລັດ", "success");
                
                if (currentPersonalTab === 'kanban') {
                    renderPersonalView();
                } else {
                    renderSupervisorDashboard();
                }
            }
        }
        closeModal('modal-profile');
    });

    // 7. Open User Guide Modal
    const loginGuideBtn = document.getElementById('btn-login-guide');
    if (loginGuideBtn) {
        loginGuideBtn.addEventListener('click', () => {
            switchGuideTab('overview');
            openModal('modal-guide');
        });
    }

    const userGuideBtn = document.getElementById('btn-user-guide');
    if (userGuideBtn) {
        userGuideBtn.addEventListener('click', () => {
            switchGuideTab('overview');
            openModal('modal-guide');
        });
    }
}

// Start the Application
window.addEventListener('DOMContentLoaded', initApp);

// ==========================================================================
// PASSWORD EYE TOGGLE & PROFILE PICTURE MANAGEMENT
// ==========================================================================

window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

window.updateMemberPhotoPreview = function(dataUrl, name) {
    const preview = document.getElementById('member-avatar-preview');
    const removeBtn = document.getElementById('btn-remove-member-photo');
    if (!preview) return;

    if (dataUrl) {
        preview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'New';
        preview.innerHTML = initials;
        if (removeBtn) removeBtn.style.display = 'none';
    }
};

window.updateProfilePhotoPreview = function(dataUrl, name) {
    const preview = document.getElementById('profile-avatar-preview');
    const removeBtn = document.getElementById('btn-remove-profile-photo');
    if (!preview) return;

    if (dataUrl) {
        preview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'SV';
        preview.innerHTML = initials;
        if (removeBtn) removeBtn.style.display = 'none';
    }
};

// Wire up photo triggers and file reader change listeners
document.getElementById('btn-trigger-member-photo').addEventListener('click', () => {
    document.getElementById('member-photo-input').click();
});

document.getElementById('member-photo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentMemberPhoto = evt.target.result;
            const name = document.getElementById('member-name-input').value || 'New';
            updateMemberPhotoPreview(currentMemberPhoto, name);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('btn-remove-member-photo').addEventListener('click', () => {
    currentMemberPhoto = null;
    document.getElementById('member-photo-input').value = '';
    const name = document.getElementById('member-name-input').value || 'New';
    updateMemberPhotoPreview(null, name);
});

document.getElementById('btn-trigger-profile-photo').addEventListener('click', () => {
    document.getElementById('profile-photo-input').click();
});

document.getElementById('profile-photo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentProfilePhoto = evt.target.result;
            const name = document.getElementById('profile-name-input').value || 'User';
            updateProfilePhotoPreview(currentProfilePhoto, name);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('btn-remove-profile-photo').addEventListener('click', () => {
    currentProfilePhoto = null;
    document.getElementById('profile-photo-input').value = '';
    const name = document.getElementById('profile-name-input').value || 'User';
    updateProfilePhotoPreview(null, name);
});

window.handleDirectLoginSubmit = function(e) {
    if (e) e.preventDefault();
    const empInput = document.getElementById('login-emp-input');
    const pwdInput = document.getElementById('login-pwd-input');
    
    const empId = empInput.value.trim().toLowerCase();
    const enteredPassword = pwdInput.value;
    
    if (!empId || !enteredPassword) {
        showToast("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ", "error");
        return;
    }
    
    // Check Supervisor login
    if (empId === 'admin' || empId === 'emp-001') {
        const correctPassword = localStorage.getItem('edl_supervisor_password') || '1234';
        if (enteredPassword === correctPassword || enteredPassword === '1234' || enteredPassword === 'admin') {
            loginAs('supervisor');
            return;
        }
    }
    
    // Check member login
    const foundMember = members.find(m => m.empId && m.empId.trim().toLowerCase() === empId);
    if (foundMember) {
        const correctPassword = foundMember.password || '1234';
        if (enteredPassword === correctPassword) {
            loginAs(foundMember);
            return;
        }
    }
    
    showToast("ລະຫັດພະນັກງານ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!", "error");
    pwdInput.select();
};

window.switchGuideTab = function(tabName) {
    // Hide all guide tab contents
    const contents = document.querySelectorAll('.guide-tab-content');
    contents.forEach(el => el.classList.add('hidden'));

    // Deactivate all guide tab buttons
    const buttons = document.querySelectorAll('#modal-guide .modal-tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = 'var(--text-muted)';
        btn.style.borderBottomColor = 'transparent';
        btn.style.fontWeight = '500';
    });

    // Show selected content
    const selectedContent = document.getElementById(`guide-tab-content-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }

    // Activate selected button
    const selectedButton = document.getElementById(`tab-btn-guide-${tabName}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.style.color = 'var(--color-indigo)';
        selectedButton.style.borderBottomColor = 'var(--color-indigo)';
        selectedButton.style.fontWeight = '600';
    }
};

// ==========================================================================
// BACKUP & RESTORE DATA CONTROLLER
// ==========================================================================

// Export all system state as a downloadable JSON file
window.exportSystemData = function() {
    const dataStr = JSON.stringify({
        departments: DEPARTMENTS,
        members: members,
        tasks: tasks
    }, null, 2);
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Get formatted date string for filename
    const dateStr = new Date().toISOString().slice(0, 10);
    const exportFileDefaultName = `edl_taskboard_backup_${dateStr}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast("ສົ່ງອອກຂໍ້ມູນລະບົບສຳເລັດແລ້ວ!", "success");
};

// Handle file input selection for import
window.handleImportFileChange = function(input) {
    const fileNameSpan = document.getElementById('import-file-name');
    const confirmBtn = document.getElementById('btn-confirm-import');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        fileNameSpan.innerText = file.name;
        confirmBtn.classList.remove('hidden');
    } else {
        fileNameSpan.innerText = 'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌';
        confirmBtn.classList.add('hidden');
    }
};

// Read the uploaded JSON file and import it to LocalStorage
window.importSystemData = function() {
    const fileInput = document.getElementById('import-file-input');
    if (!fileInput.files || !fileInput.files[0]) {
        showToast("ກະລຸນາເລືອກໄຟລ໌ຂໍ້ມູນກ່ອນ!", "error");
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate basic structure
            if (!importedData.departments || !importedData.members || !importedData.tasks) {
                showToast("ຮູບແບບໄຟລ໌ບໍ່ຖືກຕ້ອງ! ກະລຸນາກວດສອບວ່າເປັນໄຟລ໌ສຳຮອງຂອງ EDL Taskboard.", "error");
                return;
            }
            
            // Set variables
            DEPARTMENTS = importedData.departments;
            members = importedData.members;
            tasks = importedData.tasks;
            
            // Save state to LocalStorage
            await saveState();
            
            showToast("ນຳເຂົ້າຂໍ້ມູນລະບົບສຳເລັດແລ້ວ! ລະບົບກຳລັງໂຫຼດໜ້າໃໝ່...", "success");
            
            // Reload page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (err) {
            console.error("Import error:", err);
            showToast("ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌ JSON!", "error");
        }
    };
    reader.readAsText(file);
};

// Reset all data in LocalStorage to default code values
window.resetSystemToDefaults = function() {
    if (confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຣີເຊັດຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນ? ຂໍ້ມູນວຽກງານ ແລະ ພະນັກງານທີ່ທ່ານເພີ່ມໃໝ່ຈະຖືກລຶບອອກ.")) {
        localStorage.removeItem('edl_members');
        localStorage.removeItem('edl_tasks');
        localStorage.removeItem('edl_departments');
        localStorage.removeItem('edl_current_user_session');
        
        showToast("ຣີເຊັດຂໍ້ມູນເປັນຄ່າເລີ່ມຕົ້ນສຳເລັດແລ້ວ! ກຳລັງໂຫຼດໜ້າໃໝ່...", "success");
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
};

// Reset password of a specific employee if they forgot it (without losing other data)
window.handleForgotPasswordResetSubmit = function(e) {
    if (e) e.preventDefault();
    
    const empId = document.getElementById('reset-emp-id-input').value.trim();
    const masterPin = document.getElementById('reset-master-pin-input').value.trim();
    
    if (masterPin !== 'EDL9999') {
        showToast("ລະຫັດອະນຸມັດພິເສດ (Master Pin) ບໍ່ຖືກຕ້ອງ!", "error");
        return;
    }
    
    // Find member by empId (case insensitive)
    const savedMembers = localStorage.getItem('edl_members');
    let membersList = [];
    
    if (savedMembers) {
        membersList = JSON.parse(savedMembers);
    } else {
        // Fallback to in-memory members
        membersList = [...members];
    }
    
    let found = false;
    let memberName = '';
    
    const updatedMembers = membersList.map(m => {
        if (m.empId && m.empId.toLowerCase() === empId.toLowerCase()) {
            m.password = '1234';
            memberName = m.name;
            found = true;
        }
        return m;
    });
    
    if (found) {
        localStorage.setItem('edl_members', JSON.stringify(updatedMembers));
        members = updatedMembers; // Sync in-memory state
        
        showToast(`ຣີເຊັດລະຫັດຜ່ານຂອງ "${memberName}" ເປັນ "1234" ສຳເລັດແລ້ວ!`, "success");
        closeModal('modal-forgot-password');
        document.getElementById('form-forgot-password').reset();
    } else {
        showToast(`ບໍ່ພົບລະຫັດພະນັກງານ "${empId}" ໃນລະບົບ!`, "error");
    }
};


