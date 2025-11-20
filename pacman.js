// pacman.js - KODE FINAL DENGAN PAC-MAN DAN GHOST

const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const statusMessage = document.getElementById('status-message');
const width = 20; 
let squares = [];
let score = 0;
let pacmanCurrentIndex = 301; // Posisi awal Pac-Man
let ghostCurrentIndex = 191; // Posisi awal Ghost (misal di dekat tengah)
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
    // Tentukan ukuran square berdasarkan tampilan (sesuai dengan pacman.css)
    const squareSize = window.innerWidth <= 600 ? 15 : 20; 
    gridContainer.style.gridTemplateColumns = `repeat(${width}, ${squareSize}px)`;

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
    
    // Inisialisasi Pac-Man dan Ghost di posisi awal
    squares[pacmanCurrentIndex].classList.add('pac-man');
    squares[ghostCurrentIndex].classList.add('ghost');
}

function checkGameOver() {
    // Kondisi Kalah: Pac-Man berada di posisi yang sama dengan Ghost
    if (pacmanCurrentIndex === ghostCurrentIndex) {
        isGameRunning = false;
        squares[pacmanCurrentIndex].classList.remove('pac-man');
        squares[pacmanCurrentIndex].classList.add('ghost'); // Ghost terlihat "memakan" Pac-Man
        statusMessage.textContent = 'GAME OVER! Poin Akhir: ' + score;
        
        // Hapus listeners agar game berhenti
        document.removeEventListener('keyup', movePacman);
        document.querySelectorAll('.controls-mobile button').forEach(button => {
            button.replaceWith(button.cloneNode(true)); // Hapus event listener lama
        });
        
        // Hentikan Game di sini (jika ada interval untuk ghost, clear intervalnya)
    }
}


function collectDot() {
    if (squares[pacmanCurrentIndex].classList.contains('dot')) {
        
        squares[pacmanCurrentIndex].classList.remove('dot');
        
        score++;
        scoreDisplay.textContent = score;
        
        // Kirim Poin ke Dashboard Utama
        window.parent.postMessage({ type: 'SOMNIA_POINT_EVENT', points: 1 }, '*');
    }
}


function movePacman(e) {
    if (!isGameRunning) return;
    
    squares[pacmanCurrentIndex].classList.remove('pac-man');
    let nextIndex = pacmanCurrentIndex;

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
            squares[pacmanCurrentIndex].classList.add('pac-man');
            return;
    }
    
    // Cek Dinding
    if (nextIndex >= 0 && nextIndex < layout.length && !squares[nextIndex].classList.contains('wall')) {
        pacmanCurrentIndex = nextIndex;
        collectDot(); 
    }

    squares[pacmanCurrentIndex].classList.add('pac-man');
    
    checkGameOver(); // Cek setelah bergerak
}

function startGame() {
    if (isGameRunning) return;
    
    // Reset kondisi game
    isGameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    statusMessage.textContent = 'Game berjalan. Kumpulkan Poin Stream!';
    
    // (Opsional) Tambahkan event listener lagi jika game di-reset/dimulai ulang
    document.addEventListener('keyup', movePacman);
    
    // (Opsional) Logika Ghost bergerak bisa ditambahkan di sini (misal setInterval)
}


// --- INICIALISASI & EVENT LISTENERS ---

// Gunakan window.onload untuk memastikan semua elemen DOM selesai dimuat, 
// ini sangat membantu di dalam iframe.
window.onload = function() {
    createGrid();
    document.addEventListener('keyup', movePacman); // Kontrol Keyboard (Desktop)

    document.getElementById('start-button').addEventListener('click', startGame);

    // --- LISTENER UNTUK KONTROL SENTUH (MOBILE) ---
    document.querySelectorAll('.controls-mobile button').forEach(button => {
        button.addEventListener('click', () => {
            if (!isGameRunning) {
                startGame();
            }
            
            const key = button.getAttribute('data-key');
            const touchEvent = { key: key };
            
            movePacman(touchEvent);
        });
    });
};
        score++;
        scoreDisplay.textContent = score;
        
        // Integrasi Somnia (Kirim Poin ke Dashboard Utama)
        // Menggunakan window.parent karena game ada di dalam iframe
        window.parent.postMessage({ type: 'SOMNIA_POINT_EVENT', points: 1 }, '*');
    }
}


function movePacman(e) {
    if (!isGameRunning) return;
    
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
            squares[pacmanCurrentIndex].classList.add('pac-man');
            return;
    }
    
    // Cek Dinding
    if (nextIndex >= 0 && nextIndex < layout.length && !squares[nextIndex].classList.contains('wall')) {
        pacmanCurrentIndex = nextIndex;
        collectDot(); // Kumpulkan Poin
    }

    squares[pacmanCurrentIndex].classList.add('pac-man');
}

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    statusMessage.textContent = 'Game berjalan. Kumpulkan Poin Stream!';
}


// --- INICIALISASI & EVENT LISTENERS ---

createGrid();
document.addEventListener('keyup', movePacman); // Kontrol Keyboard (Desktop)

document.getElementById('start-button').addEventListener('click', startGame);

// --- LISTENER UNTUK KONTROL SENTUH (MOBILE) ---
document.querySelectorAll('.controls-mobile button').forEach(button => {
    button.addEventListener('click', () => {
        if (!isGameRunning) {
            startGame();
        }
        
        const key = button.getAttribute('data-key');
        const touchEvent = { key: key };
        
        movePacman(touchEvent);
    });
});
