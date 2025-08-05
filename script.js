// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbyT6X5bUEmxBBdz5957bA01gLnY3nII_fzYCgNGGSXTUs9hmtSq1irNId7DVuvsFx2YnQ/exec";

// Variabel global untuk menyimpan data pengguna yang login
let currentUser = null;

// Menangkap elemen-elemen dari HTML
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardWelcome = document.getElementById('dashboard-welcome');
const checkInBtn = document.getElementById('check-in-btn');
const checkOutBtn = document.getElementById('check-out-btn');
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
                    currentUser = loggedInStudent;
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
    
    // Menambahkan fungsi pada kedua tombol
    checkInBtn.addEventListener('click', () => handlePresence('checkin'));
    checkOutBtn.addEventListener('click', () => handlePresence('checkout'));
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}

// FUNGSI UTAMA UNTUK MENGIRIM DATA KEHADIRAN (CHECK-IN & CHECK-OUT)
function handlePresence(action) {
    // Nonaktifkan kedua tombol untuk mencegah klik ganda
    checkInBtn.disabled = true;
    checkOutBtn.disabled = true;
    presenceMessage.textContent = `Mencatat ${action}...`;
    presenceMessage.style.color = 'gray';

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const payload = {
        action: action, // 'checkin' atau 'checkout'
        studentId: currentUser.id,
        checkInTime: action === 'checkin' ? currentTime : null,
        checkOutTime: action === 'checkout' ? currentTime : null
    };

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        presenceMessage.textContent = result.message;
        if (result.status === 'success') {
            presenceMessage.style.color = 'green';
            // Perbarui tampilan tombol berdasarkan aksi yang berhasil
            if (action === 'checkin') {
                checkInBtn.disabled = true;
                checkOutBtn.disabled = false; // Aktifkan tombol check-out
            } else if (action === 'checkout') {
                checkInBtn.disabled = true;
                checkOutBtn.disabled = true; // Nonaktifkan keduanya jika sudah selesai
            }
        } else {
            presenceMessage.style.color = 'red';
            // Jika gagal karena aturan waktu, tombol check-in tetap non-aktif
            // tapi tombol check-out bisa jadi aktif jika sudah waktunya
            // Untuk sementara kita buat sederhana:
            checkInBtn.disabled = false; 
            checkOutBtn.disabled = true;
        }
    })
    .catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInBtn.disabled = false;
    });
}
