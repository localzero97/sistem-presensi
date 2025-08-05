// URL API Anda sudah dimasukkan di sini
const API_URL = "https://script.google.com/macros/s/AKfycbxR55HFsDei68Ze7LEFcSTgnV6qUI3TXHXCOgZPaEXrhCbo62o-1CV6GNNG-rr35v5noA/exec";

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
    event.preventDefault(); // Mencegah halaman me-refresh
    handleLogin();
});

function handleLogin() {
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Mencoba login...';
    loginMessage.style.color = 'gray';

    // Mengambil data lengkap siswa untuk verifikasi login
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

    // Saat dasbor ditampilkan, langsung cek status kehadiran hari ini
    checkInitialPresenceStatus();
}

// Fungsi untuk mengecek status awal saat login
function checkInitialPresenceStatus() {
    presenceMessage.textContent = 'Mengecek status kehadiran...';
    presenceMessage.style.color = 'gray';

    // Bertanya ke API mengenai status siswa yang login hari ini
    fetch(`${API_URL}?action=getTodaysStatus&id=${currentUser.id}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                updateButtonState(result.data); // Update tombol berdasarkan data
            } else {
                presenceMessage.textContent = 'Gagal mengecek status kehadiran.';
                presenceMessage.style.color = 'red';
            }
        });
}

// Fungsi untuk mengatur keadaan tombol berdasarkan data presensi
function updateButtonState(presenceData) {
    // Reset pesan status awal
    presenceMessage.textContent = '';

    if (presenceData) { // Jika ada data presensi hari ini
        if (presenceData.checkOutTime) { // Jika sudah check-out
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
            presenceMessage.textContent = `Presensi hari ini selesai. Check-in pukul ${presenceData.checkInTime}, Check-out pukul ${presenceData.checkOutTime}.`;
        } else { // Jika sudah check-in tapi belum check-out
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
            presenceMessage.textContent = `Anda sudah check-in pada pukul ${presenceData.checkInTime}. Silakan check-out jika sudah waktunya.`;
        }
    } else { // Jika belum ada data sama sekali (belum check-in)
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        presenceMessage.textContent = 'Anda belum melakukan check-in hari ini.';
    }
}

// Fungsi utama untuk mengirim data kehadiran (Check-in & Check-out)
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
        // Apapun hasilnya (sukses/gagal), kita cek ulang status terakhir untuk update UI
        checkInitialPresenceStatus(); 
        // Tampilkan pesan dari server
        presenceMessage.textContent = result.message;
        presenceMessage.style.color = (result.status === 'success') ? 'green' : 'red';
    })
    .catch(error => {
        console.error('Presence error:', error);
        presenceMessage.textContent = "Error: Tidak bisa menghubungi server.";
        presenceMessage.style.color = 'red';
        // Jika gagal, cek ulang status untuk mengembalikan tombol ke keadaan semula
        checkInitialPresenceStatus();
    });
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}

// Menambahkan event listener pada tombol SETELAH semua fungsi dideklarasikan
document.addEventListener('DOMContentLoaded', () => {
    checkInBtn.addEventListener('click', () => handlePresence('checkin'));
    checkOutBtn.addEventListener('click', () => handlePresence('checkout'));
});
