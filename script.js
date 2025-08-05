// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbycUVe1Hm580I8665Jwj9NKKnM3LBspKGwvP6Vjt5UvZ7QS8UiUQrwCKsIdJAsn3VEjlw/exec";

// Variabel global untuk menyimpan data pengguna yang login
let currentUser = null;

// Menangkap elemen-elemen dari HTML
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardWelcome = document.getElementById('dashboard-welcome');
const checkInBtn = document.getElementById('check-in-btn');
const presenceMessage = document.getElementById('presence-message');

// Menambahkan event listener ke form login
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleLogin();
});

function handleLogin() {
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Mencoba login...';
    loginMessage.style.color = 'gray';

    fetch(API_URL + "?action=getFullSiswaData")
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const loggedInStudent = result.data.find(student => 
                    student.id.toString() === studentId && 
                    student.password.toString() === password
                );

                if (loggedInStudent) {
                    currentUser = loggedInStudent; // Simpan data siswa yang login
                    showDashboard();
                } else {
                    showLoginError("ID Siswa atau Password salah.");
                }
            } else {
                showLoginError("Gagal mengambil data siswa.");
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showLoginError("Terjadi kesalahan. Cek koneksi internet.");
        });
}

function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    dashboardWelcome.textContent = `Selamat Datang, ${currentUser.nama}!`;
    
    // Menambahkan fungsi pada tombol check-in SETELAH login berhasil
    checkInBtn.addEventListener('click', handleCheckIn);
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}

// FUNGSI BARU UNTUK MENANGANI PROSES CHECK-IN
function handleCheckIn() {
    checkInBtn.disabled = true; // Nonaktifkan tombol untuk mencegah klik ganda
    presenceMessage.textContent = 'Mencatat kehadiran...';
    presenceMessage.style.color = 'gray';

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const payload = {
        studentId: currentUser.id,
        checkInTime: currentTime
    };

    // Mengirim data ke backend menggunakan metode POST
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            presenceMessage.textContent = result.message;
            presenceMessage.style.color = 'green';
        } else {
            presenceMessage.textContent = result.message;
            presenceMessage.style.color = 'red';
            checkInBtn.disabled = false; // Aktifkan lagi jika gagal
        }
    })
    .catch(error => {
        console.error('Check-in error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInBtn.disabled = false; // Aktifkan lagi jika gagal
    });
}
