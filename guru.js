// GANTI URL DI BAWAH INI JIKA PERLU (URL INI ADALAH URL ANDA)
const API_URL = "https://script.google.com/macros/s/AKfycbzrh6PEaGQp21ff0k3KpOqnH1VvsLFLF2boN3OI15sVzTlx8f5W8HJy6CCITN_UMtSVlQ/exec";

// Menangkap elemen-elemen dari HTML
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');
const datePicker = document.getElementById('date-picker');
const reportDateSpan = document.getElementById('report-date');
const reportBody = document.getElementById('report-body');

// Menambahkan event listener ke form login admin
adminLoginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleAdminLogin();
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
        })
        .catch(error => {
            console.error('Admin login error:', error);
            adminLoginMessage.textContent = "Terjadi kesalahan koneksi.";
            adminLoginMessage.style.color = 'red';
        });
}

function initializeDashboard() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset*60*1000));
    const formattedDateForInput = todayLocal.toISOString().slice(0, 10);
    
    datePicker.value = formattedDateForInput;
    datePicker.addEventListener('change', () => fetchReportByDate(datePicker.value));
    fetchReportByDate(formattedDateForInput);
}

// === FUNGSI YANG DIPERBAIKI ===
function fetchReportByDate(tanggal) {
    // 'tanggal' adalah string "YYYY-MM-DD" dari date picker
    const dateString = tanggal.replace(/-/g, '/'); // Mengubah format untuk penanganan zona waktu yang lebih konsisten
    const dateObj = new Date(dateString);

    // Tampilkan tanggal yang dipilih dengan format lokal
    reportDateSpan.textContent = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Kirim permintaan API dengan tanggal format YYYY-MM-DD
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
        })
        .catch(error => {
            console.error('Fetch error:', error);
            reportBody.innerHTML = `<tr><td colspan="4">Terjadi kesalahan saat menghubungi server.</td></tr>`;
        });
}
