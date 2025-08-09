// URL API Anda sudah dimasukkan di sini
const API_URL = "https://script.google.com/macros/s/AKfycbwYM6LBwVGAMH2Oy15VY5ponsRnj6GKAUS_n2QFq6e-H92NoZTjaZHD02l0K_GSw2-Czw/exec";

// Variabel global untuk menyimpan data pengguna yang login
let currentUser = null;

// FUNGSI UTAMA UNTUK MENGIRIM DATA KEHADIRAN (CHECK-IN & CHECK-OUT)
function sendPresenceData(payload) {
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        // --- PERUBAHAN DI SINI ---
        if (result.status === 'success') {
            // Jika ada info urutan, tampilkan pesan semangat. Jika tidak, tampilkan pesan biasa.
            presenceMessage.textContent = result.rankInfo || result.message;
            presenceMessage.style.color = 'green';
        } else {
            presenceMessage.textContent = result.message;
            presenceMessage.style.color = 'red';
        }
        checkInitialPresenceStatus(); // Refresh status tombol
    }).catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInitialPresenceStatus();
    });
}

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
// Pastikan variabel di sini (loginForm) sama persis dengan yang dideklarasikan di atas
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah halaman me-refresh
    handleLogin();
});

document.addEventListener('DOMContentLoaded', () => {
    // ... (Event listener untuk loginForm tidak berubah)
    
    // LOGIKA BARU UNTUK TOMBOL TAMPILKAN PASSWORD SISWA
    const togglePasswordSiswa = document.getElementById('toggle-password-siswa');
    const passwordSiswa = document.getElementById('password');

    togglePasswordSiswa.addEventListener('click', function () {
        const type = passwordSiswa.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordSiswa.setAttribute('type', type);
        
        // Ganti class ikon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// --- FUNGSI BARU UNTUK MEMUAT DATA LOGIN YANG TERSIMPAN ---
function loadSavedCredentials() {
    const savedId = localStorage.getItem('savedStudentId');
    const savedPassword = localStorage.getItem('savedPassword');

    if (savedId && savedPassword) {
        document.getElementById('student-id').value = savedId;
        document.getElementById('password').value = savedPassword;
        console.log("Data login berhasil dimuat dari penyimpanan.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loginForm.addEventListener('submit', handleLogin);

    togglePasswordSiswa.addEventListener('click', function () {
        const type = passwordSiswa.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordSiswa.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
// --- PANGGIL FUNGSI BARU SAAT APLIKASI DIBUKA ---
    loadSavedCredentials();
});

// FUNGSI BARU UNTUK MEMBUAT ATAU MENGAMBIL ID PERANGKAT
function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('presensiDeviceId');
    if (!deviceId) {
        // Jika tidak ada, buat ID baru yang acak
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('presensiDeviceId', deviceId);
    }
    return deviceId;
}

function handleLogin(event) {
    event.preventDefault();
    const studentIdInput = document.getElementById('student-id');
    const passwordInput = document.getElementById('password');
    const deviceId = getOrCreateDeviceId();

    loginMessage.textContent = 'Mencoba login...';

    const payload = {
        action: 'loginSiswa',
        studentId: studentIdInput.value,
        password: passwordInput.value,
        deviceId: deviceId
    };

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            // --- BAGIAN BARU: SIMPAN DATA SETELAH LOGIN SUKSES ---
            localStorage.setItem('savedStudentId', studentIdInput.value);
            localStorage.setItem('savedPassword', passwordInput.value);
            console.log("Login sukses, data disimpan ke penyimpanan.");
            
            currentUser = result.data;
            showDashboard();
        } else {
            showLoginError(result.message);
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
    checkInitialPresenceStatus();
}

function checkInitialPresenceStatus() {
    presenceMessage.textContent = 'Mengecek status kehadiran...';
    presenceMessage.style.color = 'gray';

    fetch(`${API_URL}?action=getTodaysStatus&id=${currentUser.id}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                updateButtonState(result.data);
            } else {
                presenceMessage.textContent = 'Gagal mengecek status kehadiran.';
                presenceMessage.style.color = 'red';
            }
        });
}

function updateButtonState(presenceData) {
    presenceMessage.textContent = '';
    if (presenceData) {
        if (presenceData.checkOutTime) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
            presenceMessage.textContent = `Presensi hari ini selesai. Check-in pukul ${presenceData.checkInTime}, Check-out pukul ${presenceData.checkOutTime}.`;
        } else {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
            presenceMessage.textContent = `Anda sudah check-in pada pukul ${presenceData.checkInTime}. Silakan check-out jika sudah waktunya.`;
        }
    } else {
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        presenceMessage.textContent = 'Anda belum melakukan check-in hari ini.';
    }
}

function handlePresence(action) {
    checkInBtn.disabled = true;
    checkOutBtn.disabled = true;
    presenceMessage.textContent = `Mencatat ${action}...`;
    presenceMessage.style.color = 'gray';

    if (action === 'checkin') {
        // --- PROSES BARU UNTUK CHECK-IN DENGAN LOKASI ---
        presenceMessage.textContent = 'Mendapatkan lokasi Anda...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => { // Jika berhasil mendapatkan lokasi
                const payload = {
                    action: 'checkin',
                    studentId: currentUser.id,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                sendPresenceData(payload);
            },
            (error) => { // Jika gagal mendapatkan lokasi
                let errorMessage = "Gagal mendapatkan lokasi: ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Anda menolak izin lokasi.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Waktu permintaan lokasi habis.";
                        break;
                    default:
                        errorMessage += "Terjadi kesalahan tidak dikenal.";
                        break;
                }
                presenceMessage.textContent = errorMessage;
                presenceMessage.style.color = 'red';
                checkInitialPresenceStatus(); // Kembalikan tombol ke state semula
            }
        );
    } else if (action === 'checkout') {
        // --- PROSES LAMA UNTUK CHECK-OUT (TANPA LOKASI) ---
        const payload = {
            action: 'checkout',
            studentId: currentUser.id
        };
        sendPresenceData(payload);
    }
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}

// FUNGSI BARU UNTUK MENGIRIM DATA SETELAH SEMUA SIAP
function sendPresenceData(payload) {
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        presenceMessage.textContent = result.message;
        presenceMessage.style.color = (result.status === 'success') ? 'green' : 'red';
        checkInitialPresenceStatus();
    }).catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInitialPresenceStatus();
    });
}

// Menambahkan event listener pada tombol di dasbor
checkInBtn.addEventListener('click', () => handlePresence('checkin'));
checkOutBtn.addEventListener('click', () => handlePresence('checkout'));
