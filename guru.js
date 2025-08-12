// GANTI DENGAN URL API BARU ANDA SETELAH DEPLOY CODE.GS TERAKHIR
const API_URL = "https://script.google.com/macros/s/AKfycbwZsDJenqqweFtEp3B_2n-r85hFD6PBOegyAPlAj6fudJZro1bGmCxUfW6d1S8j6xbA4g/exec";
// Menangkap semua elemen dari HTML
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');
const datePicker = document.getElementById('date-picker');
const reportDateSpan = document.getElementById('report-date');
const reportBody = document.getElementById('report-body');
const showReportBtn = document.getElementById('show-report-btn');
const showStudentsBtn = document.getElementById('show-students-btn');
const reportView = document.getElementById('report-view');
const studentsView = document.getElementById('students-view');
const studentsBody = document.getElementById('students-body');
const editStudentModal = document.getElementById('edit-student-modal');
const editStudentForm = document.getElementById('edit-student-form');
const cancelStudentBtn = document.getElementById('modal-student-cancel-btn');
const filterInput = document.getElementById('filter-input');
const togglePasswordGuru = document.getElementById('toggle-password-guru');
const passwordGuru = document.getElementById('admin-password');

// --- Event Listeners Utama ---
document.addEventListener('DOMContentLoaded', () => {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    showReportBtn.addEventListener('click', () => switchView('report'));
    showStudentsBtn.addEventListener('click', () => switchView('students'));
    studentsBody.addEventListener('click', handleStudentsTableClick);
    editStudentForm.addEventListener('submit', handleUpdateSiswa);
    cancelStudentBtn.addEventListener('click', () => editStudentModal.classList.add('hidden'));
    filterInput.addEventListener('keyup', filterTable);
    togglePasswordGuru.addEventListener('click', function () {
        const type = passwordGuru.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordGuru.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// --- Fungsi-fungsi ---

function handleAdminLogin(event) {
    event.preventDefault();
    adminLoginMessage.textContent = "Memvalidasi...";
    adminLoginMessage.style.color = 'gray';
    const guruId = document.getElementById('admin-id').value;
    const passwordInput = document.getElementById('admin-password').value;
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
                adminLoginMessage.style.color = 'red';
            }
        }).catch(error => {
            console.error('Admin login error:', error);
            adminLoginMessage.textContent = "Terjadi kesalahan koneksi.";
            adminLoginMessage.style.color = 'red';
        });
}

function initializeDashboard() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset * 60 * 1000));
    const formattedDateForInput = todayLocal.toISOString().slice(0, 10);
    datePicker.value = formattedDateForInput;
    datePicker.addEventListener('change', () => fetchReportByDate(datePicker.value));
    fetchReportByDate(formattedDateForInput);
}

function switchView(viewName) {
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

function fetchReportByDate(tanggal) {
    const dateObj = new Date(tanggal.replace(/-/g, '/'));
    reportDateSpan.textContent = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const url = `${API_URL}?action=getLaporanHarian&tanggal=${tanggal}`;
    reportBody.innerHTML = '<tr><td colspan="4">Memuat data laporan...</td></tr>';
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                reportBody.innerHTML = '';
                const reportData = result.data;
                if (reportData.length === 0) {
                    reportBody.innerHTML = '<tr><td colspan="4">Tidak ada data presensi pada tanggal ini.</td></tr>';
                    return;
                }
                reportData.forEach(item => {
                    const row = document.createElement('tr');
                    let statusClass = '';
                    if (item.status === 'Terlambat') { statusClass = 'status-terlambat'; } 
                    else if (item.status === 'Hadir Tepat Waktu') { statusClass = 'status-hadir'; }
                    else if (item.status === 'Absen') { statusClass = 'status-absen'; }
                    row.innerHTML = `
                        <td>${item.nama}</td>
                        <td>${item.checkInTime}</td>
                        <td>${item.checkOutTime}</td>
                        <td class="${statusClass}">${item.status}</td>
                    `;
                    reportBody.appendChild(row);
                });
            } else {
                reportBody.innerHTML = `<tr><td colspan="4">Gagal memuat laporan: ${result.message}</td></tr>`;
            }
        }).catch(error => {
            console.error('Fetch error:', error);
            reportBody.innerHTML = `<tr><td colspan="4">Terjadi kesalahan saat menghubungi server.</td></tr>`;
        });
}

function filterTable() {
    const filterText = filterInput.value.toUpperCase();
    const rows = reportBody.getElementsByTagName('tr');
    for (const row of rows) {
        const nameCell = row.getElementsByTagName('td')[0];
        if (nameCell) {
            const nameText = nameCell.textContent || nameCell.innerText;
            if (nameText.toUpperCase().indexOf(filterText) > -1) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    }
}

function fetchStudentData() {
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

function handleStudentsTableClick(event) {
    if (event.target && event.target.classList.contains('edit-student-btn')) {
        const rowData = JSON.parse(event.target.dataset.row.replace(/&apos;/g, "'"));
        openEditStudentModal(rowData);
    }
}

function openEditStudentModal(data) {
    document.getElementById('modal-student-id-edit').value = data.id;
    document.getElementById('modal-student-name-edit').value = data.nama;
    document.getElementById('modal-student-noabsen-edit').value = data.no_absen;
    document.getElementById('modal-student-password-edit').value = data.password;
    editStudentModal.classList.remove('hidden');
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
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Data siswa berhasil diperbarui!');
            editStudentModal.classList.add('hidden');
            fetchStudentData();
        } else {
            alert('Gagal memperbarui: ' + result.message);
        }
    });
}
