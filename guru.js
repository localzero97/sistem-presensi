// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbzHFdkSrvmwjEpX1yLuNp9Qqetc50uY8SRxn18zabKQN2mgfpPok5Hoj3SW57TyCMt-5A/exec";

// Menangkap elemen-elemen dari HTML
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');

// Menambahkan event listener ke form login admin
adminLoginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah form me-refresh halaman
    handleAdminLogin();
});

function handleAdminLogin() {
    const guruId = document.getElementById('admin-id').value;
    const passwordInput = document.getElementById('admin-password').value;
    
    adminLoginMessage.textContent = "Memvalidasi...";
    adminLoginMessage.style.color = 'gray';

    // Membuat URL untuk bertanya ke API
    const url = `${API_URL}?action=loginGuru&guruId=${guruId}&password=${passwordInput}`;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // Jika login berhasil, sembunyikan form dan tampilkan dasbor
                adminLoginContainer.classList.add('hidden');
                dashboardContent.classList.remove('hidden');
                
                // Sapa guru yang berhasil login
                document.getElementById('guru-name').textContent = result.data.nama;
                
                // Setelah itu, baru ambil data laporan
                fetchTodaysReport();
            } else {
                // Jika gagal, tampilkan pesan error
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

function fetchTodaysReport() {
    // 1. Dapatkan tanggal hari ini dalam format YYYY-MM-DD
    const today = new Date();
    // Menggunakan trik sederhana untuk mendapatkan YYYY-MM-DD yang sesuai dengan zona waktu lokal
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset*60*1000));
    const formattedDate = todayLocal.toISOString().slice(0, 10);
    
    // Tampilkan tanggal di header
    document.getElementById('report-date').textContent = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const url = `${API_URL}?action=getLaporanHarian&tanggal=${formattedDate}`;
    const reportBody = document.getElementById('report-body');
    
    reportBody.innerHTML = '<tr><td colspan="4">Memuat data laporan...</td></tr>';

    // 2. Panggil API untuk mendapatkan data laporan
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                reportBody.innerHTML = ''; // Kosongkan tabel
                const reportData = result.data;

                if (reportData.length === 0) {
                    reportBody.innerHTML = '<tr><td colspan="4">Belum ada data presensi untuk hari ini.</td></tr>';
                    return;
                }

                // 3. Tampilkan setiap baris data ke dalam tabel
                reportData.forEach(item => {
                    const row = document.createElement('tr');
                    // Memberi warna pada status untuk kemudahan membaca
                    let statusClass = '';
                    if (item.status === 'Terlambat') {
                        statusClass = 'status-terlambat';
                    } else if (item.status === 'Hadir Tepat Waktu') {
                        statusClass = 'status-hadir';
                    }
                    
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
