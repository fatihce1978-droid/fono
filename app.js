const STORAGE_KEY = 'classroom-school-records-v1';
const initialData = { students: [], teachers: [] };
let data = loadData();
let currentView = 'dashboard';
let searchTerm = '';
let editing = null;

function loadData() {
  try { return { ...initialData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...initialData }; }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?'; }
function setView(view) {
  currentView = view;
  searchTerm = '';
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.getElementById('breadcrumbCurrent').textContent = view[0].toUpperCase() + view.slice(1);
  render();
  document.getElementById('sidebar').classList.remove('sidebar-open');
}
function render() {
  document.getElementById('studentNavCount').textContent = data.students.length;
  document.getElementById('teacherNavCount').textContent = data.teachers.length;
  const page = document.getElementById('page');
  if (currentView === 'dashboard') page.innerHTML = dashboardHTML();
  else page.innerHTML = recordsHTML(currentView);
}
function dashboardHTML() {
  const studentCount = data.students.length;
  const teacherCount = data.teachers.length;
  const classes = new Set(data.students.map(student => student.className).filter(Boolean)).size;
  const recent = [...data.students.map(record => ({ ...record, type: 'Student', kind: 'students' })), ...data.teachers.map(record => ({ ...record, type: 'Teacher', kind: 'teachers' }))].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  return `<div class="welcome-row"><div><p class="eyebrow">SCHOOL OVERVIEW</p><h1>Good morning, Admin <span class="wave">✦</span></h1><p class="subtitle">Here’s what’s happening at your school today.</p></div><button class="button button-primary" data-action="add-student"><span>＋</span> Add student</button></div>
    <div class="stat-grid"><article class="stat-card"><div class="stat-top"><span>Total students</span><span class="stat-icon blue">♙</span></div><strong>${studentCount}</strong><small><span class="muted">Registered students</span></small><div class="stat-line blue-line"></div></article><article class="stat-card"><div class="stat-top"><span>Teaching staff</span><span class="stat-icon violet">♧</span></div><strong>${teacherCount}</strong><small><span class="muted">Active teachers</span></small><div class="stat-line violet-line"></div></article><article class="stat-card"><div class="stat-top"><span>Classes</span><span class="stat-icon green">▦</span></div><strong>${classes}</strong><small><span class="muted">Classes represented</span></small><div class="stat-line green-line"></div></article><article class="stat-card"><div class="stat-top"><span>School records</span><span class="stat-icon amber">✎</span></div><strong>${studentCount + teacherCount}</strong><small><span class="muted">Students and teachers</span></small><div class="stat-line amber-line"></div></article></div>
    <div class="dashboard-grid"><section class="panel recent-panel"><div class="panel-heading"><div><h2>Recently added</h2><p>Your latest school records</p></div><button class="text-button" data-action="view-students">View students <span>→</span></button></div>${recent.length ? `<div class="table-wrap"><table><thead><tr><th>NAME</th><th>RECORD TYPE</th><th>DETAIL</th><th>ADDED</th></tr></thead><tbody>${recent.map(record => `<tr><td><span class="person-cell"><span class="avatar ${record.kind === 'students' ? 'avatar-blue' : 'avatar-green'}">${escapeHTML(initials(record.name))}</span><strong>${escapeHTML(record.name)}</strong></span></td><td><span class="type-pill ${record.kind === 'students' ? 'pill-blue' : 'pill-green'}">${record.type}</span></td><td>${escapeHTML(record.className || record.subject || '—')}</td><td>${new Date(record.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>` : emptyState('No records yet', 'Add students and teachers to see your school activity here.', '＋ Add your first student', 'add-student')}</section>
    <aside class="panel quick-panel"><div class="panel-heading"><div><h2>Quick actions</h2><p>Shortcuts for your workspace</p></div></div><button class="quick-action" data-action="add-student"><span class="quick-icon blue">♙</span><span><strong>Add a student</strong><small>Create a student record</small></span><b>→</b></button><button class="quick-action" data-action="add-teacher"><span class="quick-icon violet">♧</span><span><strong>Add a teacher</strong><small>Add a staff member</small></span><b>→</b></button><button class="quick-action" data-action="view-students"><span class="quick-icon amber">☷</span><span><strong>Manage records</strong><small>Browse your directory</small></span><b>→</b></button><div class="tip-card"><span>✦</span><div><strong>Keep things organized</strong><p>Use a consistent class name when adding students to group them in your overview.</p></div></div></aside></div>`;
}
function emptyState(title, message, actionText, action) { return `<div class="empty-state"><span class="empty-icon">▤</span><h3>${title}</h3><p>${message}</p><button class="button button-secondary" data-action="${action}">${actionText}</button></div>`; }
function recordsHTML(kind) {
  const isStudents = kind === 'students';
  const title = isStudents ? 'Students' : 'Teachers';
  const records = data[kind].filter(record => `${record.name} ${record.email} ${record.className || ''} ${record.subject || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const detailTitle = isStudents ? 'CLASS' : 'SUBJECT';
  const detailKey = isStudents ? 'className' : 'subject';
  return `<div class="welcome-row list-welcome"><div><p class="eyebrow">SCHOOL DIRECTORY</p><h1>${title}</h1><p class="subtitle">${isStudents ? 'Manage student profiles and class information.' : 'Manage teacher profiles and teaching subjects.'}</p></div><button class="button button-primary" data-action="add-${isStudents ? 'student' : 'teacher'}"><span>＋</span> Add ${isStudents ? 'student' : 'teacher'}</button></div>
    <section class="panel directory-panel"><div class="directory-toolbar"><div class="record-total"><strong>${data[kind].length}</strong> ${isStudents ? 'students' : 'teachers'} <span>·</span> directory</div><label class="search-box"><span>⌕</span><input id="recordSearch" type="search" placeholder="Search ${title.toLowerCase()}..." value="${escapeHTML(searchTerm)}" aria-label="Search ${title.toLowerCase()}"></label></div>${records.length ? `<div class="table-wrap"><table><thead><tr><th>NAME</th><th>EMAIL</th><th>${detailTitle}</th><th>PHONE</th><th class="actions-heading">ACTIONS</th></tr></thead><tbody>${records.map(record => `<tr><td><span class="person-cell"><span class="avatar ${isStudents ? 'avatar-blue' : 'avatar-green'}">${escapeHTML(initials(record.name))}</span><strong>${escapeHTML(record.name)}</strong></span></td><td>${escapeHTML(record.email)}</td><td><span class="type-pill ${isStudents ? 'pill-blue' : 'pill-green'}">${escapeHTML(record[detailKey] || 'Not set')}</span></td><td>${escapeHTML(record.phone || '—')}</td><td class="actions-cell"><button class="row-action" data-action="edit" data-id="${record.id}" data-kind="${kind}">Edit</button><button class="row-action delete-action" data-action="delete" data-id="${record.id}" data-kind="${kind}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : emptyState(searchTerm ? 'No matching records' : `No ${title.toLowerCase()} yet`, searchTerm ? 'Try another name, email, or class.' : `Get started by adding your first ${isStudents ? 'student' : 'teacher'}.`, searchTerm ? 'Clear search' : `＋ Add ${isStudents ? 'student' : 'teacher'}`, searchTerm ? 'clear-search' : `add-${isStudents ? 'student' : 'teacher'}`)}</section>`;
}
const fields = {
  students: [{ name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Alex Morgan' }, { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'alex@school.edu' }, { name: 'className', label: 'Class / grade', required: false, placeholder: 'e.g. Grade 8A' }, { name: 'phone', label: 'Phone number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' }],
  teachers: [{ name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Jordan Lee' }, { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'jordan@school.edu' }, { name: 'subject', label: 'Subject', required: false, placeholder: 'e.g. Mathematics' }, { name: 'phone', label: 'Phone number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' }]
};
function openModal(kind, record = null) {
  editing = record ? { kind, id: record.id } : null;
  const typeName = kind === 'students' ? 'student' : 'teacher';
  document.getElementById('modalEyebrow').textContent = `${typeName.toUpperCase()} RECORD`;
  document.getElementById('modalTitle').textContent = `${record ? 'Edit' : 'Add'} ${typeName}`;
  document.getElementById('saveRecord').textContent = record ? 'Save changes' : 'Save record';
  document.getElementById('formFields').innerHTML = fields[kind].map(field => `<label class="field"><span>${field.label}${field.required ? ' <i>*</i>' : ''}</span><input name="${field.name}" type="${field.type || 'text'}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''} value="${escapeHTML(record?.[field.name] || '')}"></label>`).join('');
  document.getElementById('modalBackdrop').hidden = false;
  document.body.classList.add('modal-open');
  document.querySelector('#formFields input')?.focus();
}
function closeModal() { document.getElementById('modalBackdrop').hidden = true; document.body.classList.remove('modal-open'); editing = null; }
let toastTimer;
function toast(message) { const element = document.getElementById('toast'); element.textContent = message; element.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('show'), 2600); }
document.addEventListener('click', event => {
  const nav = event.target.closest('.nav-item');
  if (nav) return setView(nav.dataset.view);
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'add-student') openModal('students');
  if (action === 'add-teacher') openModal('teachers');
  if (action === 'view-students') setView('students');
  if (action === 'clear-search') { searchTerm = ''; render(); }
  if (action === 'edit') { const record = data[button.dataset.kind].find(item => item.id === button.dataset.id); if (record) openModal(button.dataset.kind, record); }
  if (action === 'delete') { const kind = button.dataset.kind; const record = data[kind].find(item => item.id === button.dataset.id); if (record && confirm(`Delete ${record.name} from the ${kind} directory? This cannot be undone.`)) { data[kind] = data[kind].filter(item => item.id !== record.id); saveData(); render(); toast('Record deleted.'); } }
});
document.getElementById('recordForm').addEventListener('submit', event => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
  const kind = editing?.kind || (currentView === 'teachers' ? 'teachers' : 'students');
  if (editing) { const index = data[kind].findIndex(item => item.id === editing.id); if (index >= 0) data[kind][index] = { ...data[kind][index], ...formData }; }
  else data[kind].unshift({ ...formData, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), createdAt: Date.now() });
  saveData(); closeModal(); render(); toast(editing ? 'Record updated successfully.' : 'Record added successfully.');
});
document.getElementById('page').addEventListener('input', event => { if (event.target.id === 'recordSearch') { const position = event.target.selectionStart; searchTerm = event.target.value; render(); const input = document.getElementById('recordSearch'); input.focus(); input.setSelectionRange(position, position); } });
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', event => { if (event.target.id === 'modalBackdrop') closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !document.getElementById('modalBackdrop').hidden) closeModal(); });
document.getElementById('mobileMenu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('sidebar-open'));
document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
render();
