// URL API Anda sudah dimasukkan di sini
const API_URL = "https://script.google.com/macros/s/AKfycbxoq3muGvWCdvUmP2RJuzEM3Cu46p-tDDlTGOWjGE-UyR45RDg6F4Zv__7vwPJ2QB-o2g/exec";

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
// Pastikan variabel di sini (loginForm) sama persis dengan yang dideklarasikan di atas
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah halaman me-refresh
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
                showLoginError("Gagal mengambil data siswa dari server.");
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

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const payload = {
        action: action,
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
        presenceMessage.style.color = (result.status === 'success') ? 'green' : 'red';
        checkInitialPresenceStatus();
    })
    .catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        checkInitialPresenceStatus();
    });
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}

// Menambahkan event listener pada tombol di dasbor
checkInBtn.addEventListener('click', () => handlePresence('checkin'));
checkOutBtn.addEventListener('click', () => handlePresence('checkout'));
