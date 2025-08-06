const API_URL = "https://script.google.com/macros/s/AKfycbzrwwMQrZry-Ce9jPgo_ykhBTWlretZ6yxoDarb_bk9mbCkBQG0e66WF1ky9yzYVD_xag/exec";

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    const showReportBtn = document.getElementById('show-report-btn');
    const showStudentsBtn = document.getElementById('show-students-btn');
    const reportBody = document.getElementById('report-body');
    const studentsBody = document.getElementById('students-body');
    const editForm = document.getElementById('edit-form');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const editStudentForm = document.getElementById('edit-student-form');
    const cancelStudentBtn = document.getElementById('modal-student-cancel-btn');

    showReportBtn.addEventListener('click', () => switchView('report'));
    showStudentsBtn.addEventListener('click', () => switchView('students'));
    reportBody.addEventListener('click', handleReportTableClick);
    studentsBody.addEventListener('click', handleStudentsTableClick);
    editForm.addEventListener('submit', handleUpdatePresensi);
    cancelBtn.addEventListener('click', () => document.getElementById('edit-modal').classList.add('hidden'));
    editStudentForm.addEventListener('submit', handleUpdateSiswa);
    cancelStudentBtn.addEventListener('click', () => document.getElementById('edit-student-modal').classList.add('hidden'));
});

function switchView(viewName) {
    const reportView = document.getElementById('report-view');
    const studentsView = document.getElementById('students-view');
    const showReportBtn = document.getElementById('show-report-btn');
    const showStudentsBtn = document.getElementById('show-students-btn');
    if (viewName === 'report') {
        reportView.classList.remove('hidden');
        studentsView.classList.add('hidden');
        showReportBtn.classList.add('active');
        showStudentsBtn.classList.remove('active');
    } else if (viewName === 'students') {
        studentsView.classList.remove('hidden');
        reportView.classList.add('hidden');
        showStudentsBtn.classList.add('active');
        showReportBtn.classList.remove('active');
        fetchStudentData();
    }
}
function handleAdminLogin(event) {
    event.preventDefault();
    const adminLoginContainer = document.getElementById('admin-login-container');
    const dashboardContent = document.getElementById('dashboard-content');
    const adminLoginMessage = document.getElementById('admin-login-message');
    const guruId = document.getElementById('admin-id').value;
    const passwordInput = document.getElementById('admin-password').value;
    adminLoginMessage.textContent = "Memvalidasi...";
    const url = `${API_URL}?action=loginGuru&guruId=${guruId}&password=${passwordInput}`;
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                adminLoginContainer.classList.add('hidden');
                dashboardContent.classList.remove('hidden');
                document.getElementById('guru-name').textContent = result.data.nama;
                initializeDashboard();
            } else {
                adminLoginMessage.textContent = result.message;
            }
        }).catch(error => {
            adminLoginMessage.textContent = "Terjadi kesalahan koneksi.";
        });
}
function initializeDashboard() {
    const datePicker = document.getElementById('date-picker');
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset * 60 * 1000));
    const formattedDateForInput = todayLocal.toISOString().slice(0, 10);
    datePicker.value = formattedDateForInput;
    datePicker.addEventListener('change', () => fetchReportByDate(datePicker.value));
    fetchReportByDate(formattedDateForInput);
}
function fetchReportByDate(tanggal) {
    const reportBody = document.getElementById('report-body');
    const reportDateSpan = document.getElementById('report-date');
    const dateObj = new Date(tanggal.replace(/-/g, '/'));
    reportDateSpan.textContent = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const url = `${API_URL}?action=getLaporanHarian&tanggal=${tanggal}`;
    reportBody.innerHTML = '<tr><td colspan="5">Memuat data laporan...</td></tr>';
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                reportBody.innerHTML = '';
                const reportData = result.data;
                if (reportData.length === 0) {
                    reportBody.innerHTML = '<tr><td colspan="5">Tidak ada data presensi pada tanggal ini.</td></tr>';
                    return;
                }
                reportData.forEach(item => {
                    const row = document.createElement('tr');
                    let statusClass = '';
                    if (item.status === 'Terlambat') { statusClass = 'status-terlambat'; } 
                    else if (item.status === 'Hadir Tepat Waktu') { statusClass = 'status-hadir'; }
                    const rowData = JSON.stringify(item).replace(/'/g, "&apos;");
                    row.innerHTML = `
                        <td>${item.nama}</td>
                        <td>${item.checkInTime}</td>
                        <td>${item.checkOutTime}</td>
                        <td class="${statusClass}">${item.status}</td>
                        <td><button class="edit-btn" data-row='${rowData}'>Edit</button></td>
                    `;
                    reportBody.appendChild(row);
                });
            } else {
                reportBody.innerHTML = `<tr><td colspan="5">Gagal memuat laporan: ${result.message}</td></tr>`;
            }
        }).catch(error => {
            reportBody.innerHTML = `<tr><td colspan="5">Terjadi kesalahan saat menghubungi server.</td></tr>`;
        });
}
function handleUpdatePresensi(event) {
    event.preventDefault();
    const payload = {
        action: 'updatePresensi',
        idRekap: document.getElementById('modal-rekap-id').value,
        checkInTime: document.getElementById('modal-checkin-time').value || '-',
        checkOutTime: document.getElementById('modal-checkout-time').value || '-',
        status: document.getElementById('modal-status').value
    };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Data berhasil diperbarui!');
            document.getElementById('edit-modal').classList.add('hidden');
            fetchReportByDate(document.getElementById('date-picker').value);
        } else {
            alert('Gagal memperbarui data: ' + result.message);
        }
    }).catch(error => alert('Terjadi kesalahan koneksi.'));
}
function handleUpdateSiswa(event) {
    event.preventDefault();
    const payload = {
        action: 'updateSiswa',
        id: document.getElementById('modal-student-id-edit').value,
        nama: document.getElementById('modal-student-name-edit').value,
        no_absen: document.getElementById('modal-student-noabsen-edit').value,
        password: document.getElementById('modal-student-password-edit').value
    };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Data siswa berhasil diperbarui!');
            document.getElementById('edit-student-modal').classList.add('hidden');
            fetchStudentData();
        } else {
            alert('Gagal memperbarui: ' + result.message);
        }
    });
}
function handleReportTableClick(event) {
    if (event.target && event.target.classList.contains('edit-btn')) {
        const rowData = JSON.parse(event.target.dataset.row.replace(/&apos;/g, "'"));
        openEditModal(rowData);
    }
}
function handleStudentsTableClick(event) {
    if (event.target && event.target.classList.contains('edit-student-btn')) {
        const rowData = JSON.parse(event.target.dataset.row.replace(/&apos;/g, "'"));
        openEditStudentModal(rowData);
    }
}
function openEditModal(data) {
    document.getElementById('modal-student-name').textContent = data.nama;
    document.getElementById('modal-rekap-id').value = data.idRekap;
    document.getElementById('modal-checkin-time').value = data.checkInTime === '-' ? '' : data.checkInTime;
    document.getElementById('modal-checkout-time').value = data.checkOutTime === '-' ? '' : data.checkOutTime;
    document.getElementById('modal-status').value = data.status;
    document.getElementById('edit-modal').classList.remove('hidden');
}
function openEditStudentModal(data) {
    document.getElementById('modal-student-id-edit').value = data.id;
    document.getElementById('modal-student-name-edit').value = data.nama;
    document.getElementById('modal-student-noabsen-edit').value = data.no_absen;
    document.getElementById('modal-student-password-edit').value = data.password;
    document.getElementById('edit-student-modal').classList.remove('hidden');
}
function fetchStudentData() {
    const studentsBody = document.getElementById('students-body');
    studentsBody.innerHTML = '<tr><td colspan="4">Memuat data siswa...</td></tr>';
    const url = `${API_URL}?action=getAllSiswa`;
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                studentsBody.innerHTML = '';
                result.data.forEach(siswa => {
                    const row = document.createElement('tr');
                    const rowData = JSON.stringify(siswa).replace(/'/g, "&apos;");
                    row.innerHTML = `
                        <td>${siswa.id}</td>
                        <td>${siswa.nama}</td>
                        <td>${siswa.password}</td>
                        <td><button class="edit-btn edit-student-btn" data-row='${rowData}'>Edit</button></td>
                    `;
                    studentsBody.appendChild(row);
                });
            } else {
                studentsBody.innerHTML = `<tr><td colspan="4">Gagal memuat data: ${result.message}</td></tr>`;
            }
        });
}
