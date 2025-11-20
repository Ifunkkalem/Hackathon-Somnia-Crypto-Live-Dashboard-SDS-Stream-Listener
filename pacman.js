// pacman.js - Logika Dasar Game Pac-Man

const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const width = 20; // 20 kotak lebar
let squares = [];
let score = 0;
let pacmanCurrentIndex = 0; // Posisi awal Pac-Man
let gameInterval; // Untuk mengontrol pergerakan game

// 0 - Jalan/Kosong, 1 - Dinding, 2 - Titik (Dot/Point)
// 3 - Power Pellet (Akan ditambahkan nanti)
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

function createGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    for (let i = 0; i < layout.length; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        // Tambahkan ID untuk akses mudah
        square.id = `sq-${i}`; 
        
        // Tambahkan class berdasarkan layout
        if (layout[i] === 1) {
            square.classList.add('wall');
        } else if (layout[i] === 2) {
            square.classList.add('dot');
        }
        
        gridContainer.appendChild(square);
        squares.push(square);
    }
    
    // Posisi awal Pac-Man (contoh: 301)
    pacmanCurrentIndex = 301; 
    squares[pacmanCurrentIndex].classList.add('pac-man');
}

document.getElementById('start-button').addEventListener('click', () => {
    // Fungsi untuk memulai game (akan ditambahkan logika game di sini)
    document.getElementById('status-message').textContent = 'Game Dimulai! Tekan panah.';
    // Panggil fungsi pergerakan, dll.
});

// Panggil fungsi untuk membuat grid saat file dimuat
createGrid();
