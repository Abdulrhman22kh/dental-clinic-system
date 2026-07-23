let clinicState = loadState();

function ensureElements() {
    return {
        patientNameInput: document.getElementById('patientName'),
        contactReferenceInput: document.getElementById('contactReference'),
        treatmentTypeSelect: document.getElementById('treatmentType'),
        appointmentDateInput: document.getElementById('appointmentDate'),
        consultationCostInput: document.getElementById('consultationCost'),
        statusSelect: document.getElementById('statusSelect'),
        doctorNotesInput: document.getElementById('doctorNotes'),
        addAppointmentBtn: document.getElementById('addAppointmentBtn'),
        appointmentTableBody: document.getElementById('appointmentTableBody'),
        historyTableBody: document.getElementById('historyTableBody'),
        searchInput: document.getElementById('searchInput'),
        historySearchInput: document.getElementById('historySearchInput'),
        statusFilter: document.getElementById('statusFilter'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        activeAppointmentsCountEl: document.getElementById('activeAppointmentsCount'),
        waitingCountEl: document.getElementById('waitingCount'),
        expectedRevenueEl: document.getElementById('expectedRevenue'),
        realizedRevenueEl: document.getElementById('realizedRevenue'),
        activeQueueCountEl: document.getElementById('activeQueueCount'),
        todaySummaryEl: document.getElementById('todaySummary'),
        todayAgendaListEl: document.getElementById('todayAgendaList'),
        patientModal: document.getElementById('patientModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalBody: document.getElementById('modalBody'),
        closeModalBtn: document.getElementById('closeModalBtn')
    };
}

const elements = ensureElements();
const patientNameInput = elements.patientNameInput;
const contactReferenceInput = elements.contactReferenceInput;
const treatmentTypeSelect = elements.treatmentTypeSelect;
const appointmentDateInput = elements.appointmentDateInput;
const consultationCostInput = elements.consultationCostInput;
const statusSelect = elements.statusSelect;
const doctorNotesInput = elements.doctorNotesInput;
const addAppointmentBtn = elements.addAppointmentBtn;
const appointmentTableBody = elements.appointmentTableBody;
const historyTableBody = elements.historyTableBody;
const searchInput = elements.searchInput;
const historySearchInput = elements.historySearchInput;
const statusFilter = elements.statusFilter;
const printReportBtn = document.getElementById('printReportBtn');
const resetDataBtn = document.getElementById('resetDataBtn');
const themeToggleBtn = elements.themeToggleBtn;
const activeAppointmentsCountEl = elements.activeAppointmentsCountEl;
const waitingCountEl = elements.waitingCountEl;
const expectedRevenueEl = elements.expectedRevenueEl;
const realizedRevenueEl = elements.realizedRevenueEl;
const activeQueueCountEl = elements.activeQueueCountEl;
const todaySummaryEl = elements.todaySummaryEl;
const todayAgendaListEl = elements.todayAgendaListEl;
const patientModal = elements.patientModal;
const modalTitle = elements.modalTitle;
const modalBody = elements.modalBody;
const closeModalBtn = elements.closeModalBtn;

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadState() {
    const saved = localStorage.getItem('dental_clinic_state');
    if (!saved) {
        return { appointments: [], history: [], profiles: [] };
    }
    const parsed = JSON.parse(saved);
    return {
        appointments: parsed.appointments || [],
        history: parsed.history || [],
        profiles: parsed.profiles || []
    };
}

function saveState() {
    localStorage.setItem('dental_clinic_state', JSON.stringify(clinicState));
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

function getProfile(patientId) {
    return clinicState.profiles.find(profile => profile.id === patientId);
}

function getActiveAppointments() {
    return clinicState.appointments.filter(appointment => !['ملغي'].includes(appointment.status));
}

function getPatientTimeline(patientId) {
    const active = clinicState.appointments.filter(appointment => appointment.patientId === patientId);
    const archived = clinicState.history.filter(entry => entry.patientId === patientId);
    return [...active, ...archived].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function render() {
    renderQueue();
    renderHistory();
    renderStats();
    renderTodayAgenda();
}

function renderQueue() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const visible = getActiveAppointments().filter(appointment => {
        const haystack = `${appointment.patientName} ${appointment.treatment} ${appointment.status}`.toLowerCase();
        const matchesQuery = haystack.includes(query);
        const matchesStatus = selectedStatus === 'الكل' || appointment.status === selectedStatus;
        return matchesQuery && matchesStatus;
    });

    appointmentTableBody.innerHTML = '';

    if (!visible.length) {
        appointmentTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 15px;">لا توجد مواعيد نشطة حالياً</td></tr>';
        return;
    }

    visible.forEach(appointment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><button class="patient-link" data-patient-id="${appointment.patientId}">${appointment.patientName}</button></td>
            <td>${appointment.treatment}</td>
            <td>${appointment.date}</td>
            <td>${appointment.cost} ₪</td>
            <td>
                <select class="status-select" data-id="${appointment.id}">
                    <option value="قيد الانتظار" ${appointment.status === 'قيد الانتظار' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="قيد الكشف" ${appointment.status === 'قيد الكشف' ? 'selected' : ''}>قيد الكشف</option>
                    <option value="مكتمل ومدفوع" ${appointment.status === 'مكتمل ومدفوع' ? 'selected' : ''}>مكتمل ومدفوع</option>
                    <option value="ملغي" ${appointment.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                </select>
            </td>
            <td>
                <button class="ghost-btn" data-action="view" data-patient-id="${appointment.patientId}" title="عرض الملف"><i class="fa-solid fa-eye"></i></button>
                <button class="ghost-btn" data-action="delete" data-id="${appointment.id}" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        appointmentTableBody.appendChild(tr);
    });
}

function renderHistory() {
    const query = historySearchInput.value.trim().toLowerCase();
    const visible = clinicState.history.filter(entry => {
        const haystack = `${entry.patientName} ${entry.treatment}`.toLowerCase();
        return haystack.includes(query);
    });

    historyTableBody.innerHTML = '';

    if (!visible.length) {
        historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 15px;">لا يوجد أرشيف بعد</td></tr>';
        return;
    }

    visible.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><button class="patient-link" data-patient-id="${entry.patientId}">${entry.patientName}</button></td>
            <td>${entry.treatment}</td>
            <td>${entry.date}</td>
            <td>${entry.cost} ₪</td>
            <td>${entry.archivedAt ? new Date(entry.archivedAt).toLocaleDateString('ar-EG') : ''}</td>
        `;
        historyTableBody.appendChild(tr);
    });
}

function renderStats() {
    const activeQueue = getActiveAppointments();
    const waiting = activeQueue.filter(item => item.status === 'قيد الانتظار').length;
    const expectedRevenue = activeQueue.reduce((sum, item) => sum + Number(item.cost || 0), 0);
    const realizedRevenue = clinicState.history.reduce((sum, item) => sum + Number(item.cost || 0), 0);

    activeAppointmentsCountEl.textContent = activeQueue.length;
    waitingCountEl.textContent = waiting;
    expectedRevenueEl.textContent = `${expectedRevenue} ₪`;
    realizedRevenueEl.textContent = `${realizedRevenue} ₪`;
    activeQueueCountEl.textContent = activeQueue.length;
}

function getTodayAppointments() {
    const today = new Date().toISOString().slice(0, 10);
    return getActiveAppointments().filter(item => item.date === today);
}

function renderTodayAgenda() {
    const todayAppointments = getTodayAppointments();
    todaySummaryEl.textContent = `${todayAppointments.length} مريض`;
    todayAgendaListEl.innerHTML = '';

    if (!todayAppointments.length) {
        todayAgendaListEl.innerHTML = '<div class="agenda-item"><div><strong>لا توجد مواعيد اليوم</strong><span>يمكنك إضافة موعد جديد أو مراجعة الجدول أدناه</span></div><span class="agenda-pill">فارغ</span></div>';
        return;
    }

    todayAppointments.forEach(item => {
        const el = document.createElement('div');
        el.className = 'agenda-item';
        el.innerHTML = `
            <div>
                <strong>${item.patientName}</strong>
                <span>${item.treatment} • ${item.status}</span>
            </div>
            <span class="agenda-pill">${item.cost} ₪</span>
        `;
        todayAgendaListEl.appendChild(el);
    });
}

function addAppointment() {
    const name = patientNameInput.value.trim();
    const contactRef = contactReferenceInput.value.trim();
    const treatment = treatmentTypeSelect.value;
    const date = appointmentDateInput.value;
    const cost = Number(consultationCostInput.value) || 0;
    const status = statusSelect.value;
    const notes = doctorNotesInput.value.trim();

    if (!name || !treatment || !date) {
        alert('الرجاء تعبئة الاسم ونوع العلاج والتاريخ');
        return;
    }

    let profile = clinicState.profiles.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (!profile) {
        profile = {
            id: createId(),
            name,
            contactRef,
            createdAt: new Date().toISOString(),
            visits: 0,
            totalPaid: 0,
            lastVisit: date
        };
        clinicState.profiles.push(profile);
    } else if (contactRef) {
        profile.contactRef = contactRef;
    }

    const appointment = {
        id: createId(),
        patientId: profile.id,
        patientName: name,
        contactRef,
        treatment,
        date,
        cost,
        status,
        notes,
        createdAt: new Date().toISOString()
    };

    if (status === 'مكتمل ومدفوع') {
        archiveAppointment(appointment);
    } else {
        clinicState.appointments.push(appointment);
        saveState();
        render();
    }

    patientNameInput.value = '';
    contactReferenceInput.value = '';
    treatmentTypeSelect.selectedIndex = 0;
    appointmentDateInput.value = '';
    consultationCostInput.value = '';
    statusSelect.value = 'قيد الانتظار';
    doctorNotesInput.value = '';
}

function archiveAppointment(appointment) {
    const archivedEntry = {
        ...appointment,
        archivedAt: new Date().toISOString(),
        status: 'مكتمل ومدفوع'
    };
    clinicState.history.push(archivedEntry);

    const profile = getProfile(appointment.patientId);
    if (profile) {
        profile.visits = (profile.visits || 0) + 1;
        profile.totalPaid = (profile.totalPaid || 0) + Number(appointment.cost || 0);
        profile.lastVisit = appointment.date;
    }

    saveState();
    render();
}

function updateAppointmentStatus(id, newStatus) {
    const current = clinicState.appointments.find(item => item.id === id);
    if (!current) return;

    current.status = newStatus;
    current.updatedAt = new Date().toISOString();

    if (newStatus === 'مكتمل ومدفوع') {
        archiveAppointment(current);
        clinicState.appointments = clinicState.appointments.filter(item => item.id !== id);
        saveState();
        render();
        return;
    }

    if (newStatus === 'ملغي') {
        current.notes = current.notes || '';
    }

    saveState();
    render();
}

function deleteAppointment(id) {
    clinicState.appointments = clinicState.appointments.filter(item => item.id !== id);
    saveState();
    render();
}

function openPatientModal(patientId) {
    const profile = getProfile(patientId);
    const timeline = getPatientTimeline(patientId);

    if (!profile) return;

    modalTitle.textContent = `ملف ${profile.name}`;
    const totalPaid = clinicState.history.filter(entry => entry.patientId === patientId).reduce((sum, entry) => sum + Number(entry.cost || 0), 0);
    const noteCount = timeline.filter(item => item.notes).length;

    modalBody.innerHTML = `
        <div class="modal-summary">
            <div class="summary-box">
                <span>اسم المريض</span>
                <strong>${profile.name}</strong>
            </div>
            <div class="summary-box">
                <span>مرجع الاتصال</span>
                <strong>${profile.contactRef || 'غير متوفر'}</strong>
            </div>
            <div class="summary-box">
                <span>إجمالي الزيارات</span>
                <strong>${profile.visits || timeline.length}</strong>
            </div>
            <div class="summary-box">
                <span>إجمالي المدفوع</span>
                <strong>${totalPaid} ₪</strong>
            </div>
        </div>
        <div class="timeline">
            ${timeline.length ? timeline.map(item => `
                <div class="timeline-card">
                    <div class="timeline-head">
                        <div>
                            <strong>${item.treatment}</strong>
                            <div><span>${item.date} • ${item.status || 'مكتمل ومدفوع'}</span></div>
                        </div>
                        <div><strong>${item.cost} ₪</strong></div>
                    </div>
                    <textarea class="notes-editor" data-entry-id="${item.id}" data-source="${item.archivedAt ? 'history' : 'appointment'}">${item.notes || ''}</textarea>
                    <button class="btn-secondary save-notes-btn" data-entry-id="${item.id}" data-source="${item.archivedAt ? 'history' : 'appointment'}">حفظ الملاحظات</button>
                </div>
            `).join('') : '<p style="color: var(--text-muted);">لا توجد جلسات مسجلة بعد</p>'}
        </div>
    `;

    patientModal.classList.remove('hidden');
}

function saveNotes(entryId, source) {
    const target = source === 'history'
        ? clinicState.history.find(item => item.id === entryId)
        : clinicState.appointments.find(item => item.id === entryId);

    if (!target) return;

    const editor = modalBody.querySelector(`.notes-editor[data-entry-id="${entryId}"]`);
    if (editor) {
        target.notes = editor.value.trim();
        saveState();
        render();
    }
}

function closeModal() {
    patientModal.classList.add('hidden');
}

function printReport() {
    const activeRows = clinicState.appointments.map(item => `
        <tr>
            <td>${item.patientName}</td>
            <td>${item.treatment}</td>
            <td>${item.date}</td>
            <td>${item.cost} ₪</td>
            <td>${item.status}</td>
        </tr>
    `).join('');

    const historyRows = clinicState.history.map(item => `
        <tr>
            <td>${item.patientName}</td>
            <td>${item.treatment}</td>
            <td>${item.date}</td>
            <td>${item.cost} ₪</td>
            <td>${item.archivedAt ? new Date(item.archivedAt).toLocaleDateString('ar-EG') : ''}</td>
        </tr>
    `).join('');

    const reportWindow = window.open('', '_blank', 'width=900,height=700');
    if (!reportWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
        return;
    }

    reportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير عيادة الأسنان</title>
            <style>
                body { font-family: 'Tajawal', Arial, sans-serif; padding: 24px; color: #11213a; }
                h1 { margin-bottom: 8px; }
                .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
                .box { border: 1px solid #dbeafe; border-radius: 12px; padding: 12px; background: #f8fbff; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #dbeafe; padding: 8px; text-align: right; }
                th { background: #eef6ff; }
                .section { margin-top: 24px; }
            </style>
        </head>
        <body>
            <h1>تقرير عيادة الأسنان</h1>
            <p>تم إنشاء هذا التقرير بناءً على البيانات الحالية في النظام.</p>
            <div class="summary">
                <div class="box"><strong>${clinicState.appointments.length}</strong><br>مواعيد نشطة</div>
                <div class="box"><strong>${clinicState.history.length}</strong><br>أرشيف</div>
                <div class="box"><strong>${clinicState.profiles.length}</strong><br>ملفات مرضى</div>
            </div>
            <div class="section">
                <h3>الصف الحالي</h3>
                <table>
                    <thead><tr><th>المريض</th><th>العلاج</th><th>التاريخ</th><th>التكلفة</th><th>الحالة</th></tr></thead>
                    <tbody>${activeRows || '<tr><td colspan="5">لا توجد مواعيد نشطة</td></tr>'}</tbody>
                </table>
            </div>
            <div class="section">
                <h3>الأرشيف الطبي</h3>
                <table>
                    <thead><tr><th>المريض</th><th>العلاج</th><th>التاريخ</th><th>التكلفة</th><th>تاريخ الأرشفة</th></tr></thead>
                    <tbody>${historyRows || '<tr><td colspan="5">لا يوجد أرشيف</td></tr>'}</tbody>
                </table>
            </div>
        </body>
        </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 250);
}

function resetAllData() {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات؟ هذه العملية لا يمكن التراجع عنها.')) {
        return;
    }

    clinicState = { appointments: [], history: [], profiles: [] };
    saveState();
    render();
    alert('تم حذف جميع البيانات بنجاح');
}

addAppointmentBtn.addEventListener('click', addAppointment);
searchInput.addEventListener('input', renderQueue);
statusFilter.addEventListener('change', renderQueue);
historySearchInput.addEventListener('input', renderHistory);
printReportBtn.addEventListener('click', printReport);
resetDataBtn.addEventListener('click', resetAllData);

document.addEventListener('click', (event) => {
    const patientButton = event.target.closest('.patient-link');
    if (patientButton) {
        openPatientModal(patientButton.dataset.patientId);
        return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === 'view') {
            openPatientModal(actionButton.dataset.patientId);
        } else if (action === 'delete') {
            deleteAppointment(actionButton.dataset.id);
        }
    }

    const saveButton = event.target.closest('.save-notes-btn');
    if (saveButton) {
        saveNotes(saveButton.dataset.entryId, saveButton.dataset.source);
    }
});

document.addEventListener('change', (event) => {
    if (event.target.classList.contains('status-select')) {
        updateAppointmentStatus(event.target.dataset.id, event.target.value);
    }
});

closeModalBtn.addEventListener('click', closeModal);
patientModal.addEventListener('click', (event) => {
    if (event.target.dataset.close === 'true') {
        closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});

window.addAppointment = addAppointment;

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        applyTheme('light');
        localStorage.setItem('theme', 'light');
    } else {
        applyTheme('dark');
        localStorage.setItem('theme', 'dark');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('theme') || 'light');
    render();
});