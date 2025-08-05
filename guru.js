const API_URL = "https://script.google.com/macros/s/AKfycbxoq3muGvWCdvUmP2RJuzEM3Cu46p-tDDlTGOWjGE-UyR45RDg6F4Zv__7vwPJ2QB-o2g/exec";

const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');
const datePicker = document.getElementById('date-picker');
const reportDateSpan = document.getElementById('report-date');
const reportBody = document.getElementById('report-body');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelBtn = document.getElementById('modal-cancel-btn');

adminLoginForm.addEventListener('submit', handleAdminLogin);
reportBody.addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('edit-btn')) {
        const rowData = JSON.parse(event.target.dataset.row);
        openEditModal(rowData);
    }
});
editForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleUpdatePresensi();
});
cancelBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

function handleAdminLogin() {
    const guruId = document.getElementById('admin-id').value;
    const passwordInput = document.getElementById('admin-password').value;
    adminLoginMessage.textContent = "Memvalidasi...";
    adminLoginMessage.style.color = 'gray';
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
            console.error('Fetch error:', error);
            reportBody.innerHTML = `<tr><td colspan="5">Terjadi kesalahan saat menghubungi server.</td></tr>`;
        });
}

function openEditModal(data) {
    document.getElementById('modal-student-name').textContent = data.nama;
    document.getElementById('modal-rekap-id').value = data.idRekap;
    document.getElementById('modal-checkin-time').value = data.checkInTime === '-' ? '' : data.checkInTime;
    document.getElementById('modal-checkout-time').value = data.checkOutTime === '-' ? '' : data.checkOutTime;
    document.getElementById('modal-status').value = data.status;
    editModal.classList.remove('hidden');
}

function handleUpdatePresensi() {
    const payload = {
        action: 'updatePresensi',
        idRekap: document.getElementById('modal-rekap-id').value,
        checkInTime: document.getElementById('modal-checkin-time').value || '-',
        checkOutTime: document.getElementById('modal-checkout-time').value || '-',
        status: document.getElementById('modal-status').value
    };
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Data berhasil diperbarui!');
            editModal.classList.add('hidden');
            fetchReportByDate(datePicker.value);
        } else {
            alert('Gagal memperbarui data: ' + result.message);
        }
    }).catch(error => {
        console.error('Update error:', error);
        alert('Terjadi kesalahan koneksi saat memperbarui data.');
    });
}
