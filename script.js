// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbxR55HFsDei68Ze7LEFcSTgnV6qUI3TXHXCOgZPaEXrhCbo62o-1CV6GNNG-rr35v5noA/exec";

let currentUser = null;

// ... (Tangkap elemen-elemen HTML, kode sama seperti sebelumnya) ...

loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleLogin();
});

function handleLogin() {
    // ... (Fungsi login tidak berubah) ...
}

function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    dashboardWelcome.textContent = `Selamat Datang, ${currentUser.nama}!`;
    
    // PANGGIL FUNGSI BARU UNTUK CEK STATUS
    checkInitialPresenceStatus(); 
}

// --- FUNGSI BARU UNTUK MENGECEK STATUS AWAL SAAT LOGIN ---
function checkInitialPresenceStatus() {
    presenceMessage.textContent = 'Mengecek status kehadiran...';
    presenceMessage.style.color = 'gray';

    fetch(`${API_URL}?action=getTodaysStatus&id=${currentUser.id}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                updateButtonState(result.data); // Update tombol berdasarkan data
                presenceMessage.textContent = ''; // Kosongkan pesan status
            } else {
                presenceMessage.textContent = 'Gagal mengecek status.';
                presenceMessage.style.color = 'red';
            }
        });
}

// --- FUNGSI BARU UNTUK MENGATUR TOMBOL ---
function updateButtonState(presenceData) {
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


function handlePresence(action) {
    // ... (Fungsi handlePresence hampir sama, hanya bagian suksesnya yang diubah) ...
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        presenceMessage.textContent = result.message;
        if (result.status === 'success') {
            presenceMessage.style.color = 'green';
            // Panggil fungsi pengecekan status lagi untuk mendapatkan data terbaru dan update tombol
            checkInitialPresenceStatus(); 
        } else {
            presenceMessage.style.color = 'red';
            // Jika gagal, kembalikan status tombol ke keadaan sebelum aksi
            checkInitialPresenceStatus();
        }
    })
    // ... (Bagian .catch tetap sama) ...
}


// Pastikan semua fungsi lain (handleLogin, showLoginError, dll.) masih ada.
// Salin tempel seluruh kode dari file Anda yang terakhir, lalu modifikasi/tambahkan fungsi-fungsi di atas.
