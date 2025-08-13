// Ganti dengan URL API Anda jika berubah
const API_URL = "https://script.google.com/macros/s/AKfycbwZS-QC-iejVb4KMK1-TDQposhkZPjAduV8Gy1LvBnNPkMGZab4h5eixi0Pu22OhuJYpw/exec";

let currentUser = null;

// Menangkap semua elemen dari HTML
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const studentIdInput = document.getElementById('student-id');
const passwordInput = document.getElementById('password');
const togglePasswordSiswa = document.getElementById('toggle-password-siswa');
const loginMessage = document.getElementById('login-message');
const dashboardWelcome = document.getElementById('dashboard-welcome');
const checkInBtn = document.getElementById('check-in-btn');
const checkOutBtn = document.getElementById('check-out-btn');
const presenceMessage = document.getElementById('presence-message');

// --- Event Listener Utama ---
document.addEventListener('DOMContentLoaded', () => {
    loginForm.addEventListener('submit', handleLogin);

    togglePasswordSiswa.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    checkInBtn.addEventListener('click', () => handlePresence('checkin'));
    checkOutBtn.addEventListener('click', () => handlePresence('checkout'));

    loadSavedCredentials();
});

// --- Fungsi-fungsi ---

function loadSavedCredentials() {
    const savedId = localStorage.getItem('savedStudentId');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedId && savedPassword) {
        studentIdInput.value = savedId;
        passwordInput.value = savedPassword;
    }
}

function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('presensiDeviceId');
    if (!deviceId) {
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('presensiDeviceId', deviceId);
    }
    return deviceId;
}

function handleLogin(event) {
    event.preventDefault();
    loginMessage.textContent = 'Mencoba login...';
    loginMessage.style.color = 'gray';

    const payload = {
        action: 'loginSiswa',
        studentId: studentIdInput.value,
        password: passwordInput.value,
        deviceId: getOrCreateDeviceId()
    };

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            localStorage.setItem('savedStudentId', studentIdInput.value);
            localStorage.setItem('savedPassword', passwordInput.value);
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

function handlePresence(action) {
    checkInBtn.disabled = true;
    checkOutBtn.disabled = true;

    if (action === 'checkin') {
        presenceMessage.textContent = 'Mendapatkan lokasi Anda...';
        presenceMessage.style.color = 'gray';
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const payload = {
                    action: 'checkin',
                    studentId: currentUser.id,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                sendPresenceData(payload);
            },
            error => {
                let errorMessage = "Gagal mendapatkan lokasi: ";
                if(error.code === 1) errorMessage += "Anda menolak izin lokasi.";
                else if(error.code === 2) errorMessage += "Informasi lokasi tidak tersedia.";
                else if(error.code === 3) errorMessage += "Waktu permintaan lokasi habis.";
                else errorMessage += "Terjadi kesalahan tidak dikenal.";
                
                presenceMessage.textContent = errorMessage;
                presenceMessage.style.color = 'red';
                checkInitialPresenceStatus();
            }
        );
    } else if (action === 'checkout') {
        presenceMessage.textContent = `Mencatat ${action}...`;
        presenceMessage.style.color = 'gray';
        const payload = {
            action: 'checkout',
            studentId: currentUser.id
        };
        sendPresenceData(payload);
    }
}

function sendPresenceData(payload) {
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        presenceMessage.textContent = result.rankInfo || result.message;
        presenceMessage.style.color = (result.status === 'success') ? 'green' : 'red';
        checkInitialPresenceStatus();
    }).catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInitialPresenceStatus();
    });
}

function checkInitialPresenceStatus() {
    // Memberi jeda agar pesan semangat bisa terbaca sebelum status diperbarui
    setTimeout(() => {
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
    }, 4000); // Pesan akan tampil selama 4 detik
}

function updateButtonState(presenceData) {
    document.getElementById('current-time').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', weekday: 'long', day: 'numeric', month: 'long' });
    
    if (!presenceMessage.textContent.includes("berhasil") && !presenceMessage.textContent.includes("tercepat")) {
        presenceMessage.textContent = '';
    }

    if (presenceData) {
        if (presenceData.checkOutTime) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
            presenceMessage.textContent = `Presensi hari ini selesai. Check-in pukul ${presenceData.checkInTime}, Check-out pukul ${presenceData.checkOutTime}.`;
        } else {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
            if (presenceData.notificationMessage) {
                presenceMessage.textContent = presenceData.notificationMessage;
                presenceMessage.style.color = 'green';
            } else if (!presenceMessage.textContent.includes("berhasil") && !presenceMessage.textContent.includes("tercepat")) {
                 presenceMessage.textContent = `Anda sudah check-in pada pukul ${presenceData.checkInTime}. Silakan check-out jika sudah waktunya.`;
            }
        }
    } else {
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        presenceMessage.textContent = 'Anda belum melakukan check-in hari ini.';
    }
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}
