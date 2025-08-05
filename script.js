// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbwXT_KbmO0MX-GsYU2xeXII4dfhWPqbMbUDQYsNDJrD4pkKEi1CBV4oVOElER2kPP4Wqg/exec";

// Menangkap elemen-elemen dari HTML
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardWelcome = document.getElementById('dashboard-welcome');

// Menambahkan event listener ke form login
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah form mengirim data dan me-refresh halaman
    handleLogin();
});

function handleLogin() {
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Mencoba login...';
    loginMessage.style.color = 'gray';

    // Memanggil API dengan aksi baru untuk mendapatkan data lengkap siswa
    fetch(API_URL + "?action=getFullSiswaData")
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // Mencari siswa berdasarkan ID dan Password yang dimasukkan
                const loggedInStudent = result.data.find(student => 
                    student.id.toString() === studentId && 
                    student.password.toString() === password
                );

                if (loggedInStudent) {
                    // Jika siswa ditemukan, tampilkan dasbor
                    showDashboard(loggedInStudent);
                } else {
                    // Jika tidak ditemukan, tampilkan error
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

function showDashboard(student) {
    // Sembunyikan form login
    loginContainer.classList.add('hidden');
    // Tampilkan dasbor
    dashboardContainer.classList.remove('hidden');

    // Sapa siswa yang berhasil login
    dashboardWelcome.textContent = `Selamat Datang, ${student.nama}!`;
    
    // Nanti kita akan tambahkan fungsi untuk tombol check-in di sini
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.color = 'red';
}
