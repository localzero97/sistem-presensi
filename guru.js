// GANTI URL DI BAWAH INI JIKA PERLU (URL INI ADALAH URL ANDA)
const API_URL = "https://script.google.com/macros/s/AKfycbyxR5O26G39-q6aLriYnlpN4vzM6qrKmC5j_pgAN_iEghzv1RN81pLwJe3zu2wqor_FvQ/exec";

// Menangkap elemen-elemen dari HTML
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginMessage = document.getElementById('admin-login-message');
const dashboardContent = document.getElementById('dashboard-content');
const datePicker = document.getElementById('date-picker');
const reportDateSpan = document.getElementById('report-date');
const reportBody = document.getElementById('report-body');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelBtn = document.getElementById('modal-cancel-btn');

// --- Event Listeners ---
adminLoginForm.addEventListener('submit', handleAdminLogin);

// MENGGUNAKAN EVENT DELEGATION UNTUK TOMBOL EDIT
reportBody.addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('edit-btn')) {
        const rowData = JSON.parse(event.target.dataset.row);
        openEditModal(rowData);
    }
});

editForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleUpdatePresensi();
});

cancelBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
});


// --- Fungsi-fungsi ---
function handleAdminLogin() { /* ... Tidak berubah ... */ }
function initializeDashboard() { /* ... Tidak berubah ... */ }

function fetchReportByDate(tanggal) {
    // ... (Logika fetch tidak berubah, HANYA bagian pembuatan baris tabel yang diubah)
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                reportBody.innerHTML = '';
                const reportData = result.data;
                // ... (Logika jika data kosong tidak berubah) ...

                reportData.forEach(item => {
                    const row = document.createElement('tr');
                    // ... (logika statusClass tidak berubah) ...
                    
                    // PERUBAHAN: Simpan seluruh data item ke dalam tombol edit
                    const rowData = JSON.stringify(item);

                    row.innerHTML = `
                        <td>${item.nama}</td>
                        <td>${item.checkInTime}</td>
                        <td>${item.checkOutTime}</td>
                        <td class="${statusClass}">${item.status}</td>
                        <td>
                            <button class="edit-btn" data-row='${rowData}'>Edit</button>
                        </td>
                    `;
                    reportBody.appendChild(row);
                });
            } else { /* ... penanganan error fetch tidak berubah ... */ }
        })
        .catch(error => { /* ... penanganan error catch tidak berubah ... */ });
}

// --- FUNGSI BARU UNTUK FITUR EDIT ---
function openEditModal(data) {
    // Isi form di dalam modal dengan data dari baris yang diklik
    document.getElementById('modal-student-name').textContent = data.nama;
    document.getElementById('modal-rekap-id').value = data.idRekap;
    document.getElementById('modal-checkin-time').value = data.checkInTime === '-' ? '' : data.checkInTime;
    document.getElementById('modal-checkout-time').value = data.checkOutTime === '-' ? '' : data.checkOutTime;
    document.getElementById('modal-status').value = data.status;

    // Tampilkan modal
    editModal.classList.remove('hidden');
}

function handleUpdatePresensi() {
    const idRekap = document.getElementById('modal-rekap-id').value;
    const checkInTime = document.getElementById('modal-checkin-time').value;
    const checkOutTime = document.getElementById('modal-checkout-time').value;
    const status = document.getElementById('modal-status').value;

    const payload = {
        action: 'updatePresensi',
        idRekap: idRekap,
        checkInTime: checkInTime || '-', // kirim '-' jika kosong
        checkOutTime: checkOutTime || '-',
        status: status
    };

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Data berhasil diperbarui!');
            editModal.classList.add('hidden');
            fetchReportByDate(datePicker.value); // Refresh tabel
        } else {
            alert('Gagal memperbarui data: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        alert('Terjadi kesalahan koneksi saat memperbarui data.');
    });
}
