const API_URL = "https://script.google.com/macros/s/AKfycbwZS-QC-iejVb4KMK1-TDQposhkZPjAduV8Gy1LvBnNPkMGZab4h5eixi0Pu22OhuJYpw/exec";

// Menangkap semua elemen dari HTML
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');
const datePicker = document.getElementById('date-picker');
const reportDateSpan = document.getElementById('report-date');
const reportBody = document.getElementById('report-body');
const filterInput = document.getElementById('filter-input');
const togglePasswordGuru = document.getElementById('toggle-password-guru');
const passwordGuru = document.getElementById('admin-password');
const reportTableHeader = document.getElementById('report-table-header');

// Variabel global untuk menyimpan status sorting
let sortColumn = null;
let sortDirection = 'asc';

// --- Event Listeners Utama ---
document.addEventListener('DOMContentLoaded', () => {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    filterInput.addEventListener('keyup', filterTable);
    togglePasswordGuru.addEventListener('click', function () {
        const type = passwordGuru.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordGuru.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
    reportTableHeader.addEventListener('click', handleSortTable);
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
                        <td data-value="${item.nama}">${item.nama}</td>
                        <td data-value="${item.checkInTime}">${item.checkInTime}</td>
                        <td data-value="${item.checkOutTime}">${item.checkOutTime}</td>
                        <td class="${statusClass}" data-value="${item.status}">${item.status}</td>
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

function handleSortTable(event) {
    const targetHeader = event.target.closest('.sortable');
    if (!targetHeader) return;
    const column = targetHeader.dataset.sort;
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    document.querySelectorAll('#report-table-header .sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
    });
    targetHeader.classList.add(sortDirection);
    sortDataInTable();
}

function sortDataInTable() {
    const rows = Array.from(reportBody.querySelectorAll('tr'));
    const columnIndex = getColumnIndex(sortColumn);
    const sortedRows = rows.sort((a, b) => {
        const aCell = a.querySelector(`td:nth-child(${columnIndex})`);
        const bCell = b.querySelector(`td:nth-child(${columnIndex})`);
        const aValue = aCell.dataset.value;
        const bValue = bCell.dataset.value;
        if (aValue === '-' && bValue !== '-') return 1;
        if (bValue === '-' && aValue !== '-') return -1;
        if (aValue === '-' && bValue === '-') return 0;
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    reportBody.innerHTML = '';
    sortedRows.forEach(row => reportBody.appendChild(row));
}

function getColumnIndex(columnName) {
    if (columnName === 'nama') return 1;
    if (columnName === 'checkin') return 2;
    if (columnName === 'status') return 4;
    return 1; // Default
}
