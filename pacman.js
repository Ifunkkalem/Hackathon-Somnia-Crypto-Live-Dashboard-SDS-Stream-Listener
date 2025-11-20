// pacman.js - Logika Game Pac-Man (Pergerakan dan Pengumpulan Poin)

const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const statusMessage = document.getElementById('status-message');
const width = 20; // 20 kotak lebar
let squares = [];
let score = 0;
let pacmanCurrentIndex = 301; 
let gameInterval;
let isGameRunning = false;

// 0 - Jalan/Kosong, 1 - Dinding, 2 - Titik (Dot/Point)
const layout = [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1,
    1,2,1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1,2,1,
    1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1,
    1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,
    1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
    1,1,1,2,1,1,1,1,1,2,2,1,1,1,1,1,2,1,1,1,
    1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
    1,2,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,2,1,1,
    1,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,1,
    1,1,1,1,1,1,1,2,0,0,0,0,2,1,1,1,1,1,1,1,
    1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
    1,2,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,2,1,1,
    1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1,
    1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,
    1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
];


// --- FUNGSI UTAMA ---

function createGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    for (let i = 0; i < layout.length; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.id = `sq-${i}`; 
        
        if (layout[i] === 1) {
            square.classList.add('wall');
        } else if (layout[i] === 2) {
            square.classList.add('dot');
        }
        
        gridContainer.appendChild(square);
        squares.push(square);
    }
    squares[pacmanCurrentIndex].classList.add('pac-man');
}

function collectDot() {
    // 1. Cek apakah di posisi Pac-Man ada Dot (Titik)
    if (squares[pacmanCurrentIndex].classList.contains('dot')) {
        
        // 2. Hapus Dot (Poin Stream dikumpulkan)
        squares[pacmanCurrentIndex].classList.remove('dot');
        
        // 3. Tambahkan Skor
        score++;
        scoreDisplay.textContent = score;
        
        // 4. Integrasi Somnia (Simulasi Kirim Poin ke Dashboard Utama)
        // Kita berasumsi Dashboard utama terhubung.
        // Kirim 1 poin setiap kali Dot dikumpulkan.
        if (window.onPointsUpdate) {
             // window.onPointsUpdate dipanggil dari file app.js di dashboard utama
             // Kita akan menggunakan 'postMessage' untuk berkomunikasi antar-iframe/window
             window.parent.postMessage({ type: 'SOMNIA_POINT_EVENT', points: 1 }, '*');
        }
    }
}


function movePacman(e) {
    if (!isGameRunning) return;
    
    // Hapus kelas pac-man dari posisi lama
    squares[pacmanCurrentIndex].classList.remove('pac-man');
    let nextIndex = pacmanCurrentIndex;

    // Tentukan posisi baru berdasarkan tombol yang ditekan
    switch (e.key) {
        case 'ArrowLeft':
            nextIndex -= 1;
            break;
        case 'ArrowUp':
            nextIndex -= width;
            break;
        case 'ArrowRight':
            nextIndex += 1;
            break;
        case 'ArrowDown':
            nextIndex += width;
            break;
        default:
            // Jika tombol lain, jangan lakukan apa-apa
            squares[pacmanCurrentIndex].classList.add('pac-man');
            return;
    }
    
    // Cek Dinding (Wall) - layout[nextIndex] === 1
    // Juga cek apakah Pac-Man keluar batas grid (tidak perlu jika peta dikelilingi dinding)
    if (!squares[nextIndex].classList.contains('wall') && nextIndex >= 0 && nextIndex < layout.length) {
        pacmanCurrentIndex = nextIndex;
        collectDot(); // Kumpulkan Poin di posisi baru
    }

    // Tambahkan kelas pac-man di posisi baru
    squares[pacmanCurrentIndex].classList.add('pac-man');
}

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    statusMessage.textContent = 'Game berjalan. Kumpulkan Poin Stream!';
    // Anda bisa menambahkan logika Ghost di sini (akan kita bahas selanjutnya)
    // document.addEventListener('keyup', movePacman); // Sudah ditambahkan di bawah
}


// --- INICIALISASI & EVENT LISTENERS ---

createGrid();
document.addEventListener('keyup', movePacman); // Mendengarkan tombol panah

document.getElementById('start-button').addEventListener('click', startGame);


// Panggil fungsi untuk membuat grid saat file dimuat
createGrid();
