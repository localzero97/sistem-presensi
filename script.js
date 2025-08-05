// GANTI URL DI BAWAH INI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbzmGFX8EDyjKd1vkkUD9Le3TR8MCWyvq5mVyDW4aQxWxwTeBm7ME34K0l5y16UmIP9Zhg/exec"; 

// Fungsi ini akan berjalan ketika halaman web selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    fetchStudentList();
});

// Fungsi untuk mengambil data siswa dari API kita
function fetchStudentList() {
    // Menambahkan parameter 'action' sesuai dengan desain API kita
    const url_dengan_aksi = API_URL + "?action=getSiswaList";

    fetch(url_dengan_aksi)
        .then(response => response.json()) // Mengubah respons menjadi format JSON
        .then(data => {
            // Setelah data berhasil didapat
            console.log(data); // Menampilkan data di console untuk debugging
            const studentListElement = document.getElementById('student-list');
            studentListElement.innerHTML = ''; // Mengosongkan tulisan "Memuat data..."

            // Mengambil array siswa dari properti 'data'
            const students = data.data;

            // Melakukan perulangan untuk setiap siswa di dalam data
            students.forEach(student => {
                const listItem = document.createElement('li'); // Membuat elemen <li> baru
                listItem.textContent = `${student.no_absen}. ${student.nama}`; // Mengisi teks, cth: "1. Budi Santoso"
                studentListElement.appendChild(listItem); // Menambahkan <li> ke dalam <ul>
            });
        })
        .catch(error => {
            // Jika terjadi error saat mengambil data
            console.error('Error fetching data:', error);
            const studentListElement = document.getElementById('student-list');
            studentListElement.innerHTML = '<li>Gagal memuat data. Cek koneksi dan URL API.</li>';
        });
}
