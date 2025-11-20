// pacman.js - Logika Game Pac-Man (Pergerakan, Poin, dan Kontrol Sentuh)

const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const statusMessage = document.getElementById('status-message');
const width = 20; 
let squares = [];
let score = 0;
let pacmanCurrentIndex = 301; 
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
    // Pastikan lebar grid disesuaikan dengan viewport
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
    squares[pacmanCurrentIndex].classList.add('pac-man');
}

function collectDot() {
    if (squares[pacmanCurrentIndex].classList.contains('dot')) {
        
        squares[pacmanCurrentIndex].classList.remove('dot');
        
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
