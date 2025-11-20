// pacman.js - FINAL VERSION DENGAN PAC-MAN, GHOST, DAN AI CERDAS

const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const statusMessage = document.getElementById('status-message');
const width = 20;
let squares = [];
let score = 0;
let pacmanCurrentIndex = 301;
let ghostCurrentIndex = 191;
let isGameRunning = false;
let ghostInterval = null;

// 0 - Jalan, 1 - Dinding, 2 - Titik
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

// --- FUNGSI UTAMA ---

function createGrid() {
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
  squares[ghostCurrentIndex].classList.add('ghost');
}

function collectDot() {
  if (squares[pacmanCurrentIndex].classList.contains('dot')) {
    squares[pacmanCurrentIndex].classList.remove('dot');
    score++;
    scoreDisplay.textContent = score;
    window.parent.postMessage({ type: 'SOMNIA_POINT_EVENT', points: 1 }, '*');
  }
}

function checkGameOver() {
  if (pacmanCurrentIndex === ghostCurrentIndex) {
    isGameRunning = false;
    clearInterval(ghostInterval);
    squares[pacmanCurrentIndex].classList.remove('pac-man');
    squares[pacmanCurrentIndex].classList.add('ghost');
    statusMessage.textContent = 'GAME OVER! Poin Akhir: ' + score;

    document.removeEventListener('keyup', movePacman);
    document.querySelectorAll('.controls-mobile button').forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });
  }
}

function movePacman(e) {
  if (!isGameRunning) return;

  squares[pacmanCurrentIndex].classList.remove('pac-man');
  let nextIndex = pacmanCurrentIndex;

  switch (e.key) {
    case 'ArrowLeft': nextIndex -= 1; break;
    case 'ArrowUp': nextIndex -= width; break;
    case 'ArrowRight': nextIndex += 1; break;
    case 'ArrowDown': nextIndex += width; break;
    default:
      squares[pacmanCurrentIndex].classList.add('pac-man');
      return;
  }

  if (
    nextIndex >= 0 &&
    nextIndex < layout.length &&
    !squares[nextIndex].classList.contains('wall')
  ) {
    pacmanCurrentIndex = nextIndex;
    collectDot();
  }

  squares[pacmanCurrentIndex].classList.add('pac-man');
  checkGameOver();
}

// --- AI GHOST CERDAS ---

function moveGhost() {
  if (!isGameRunning) return;

  const directions = [-1, 1, -width, width];
  let bestMove = ghostCurrentIndex;
  let shortestDistance = Infinity;

  directions.forEach(dir => {
    const target = ghostCurrentIndex + dir;
    if (
      target >= 0 &&
      target < layout.length &&
      !squares[target].classList.contains('wall')
    ) {
      const dx = (target % width) - (pacmanCurrentIndex % width);
      const dy = Math.floor(target / width) - Math.floor(pacmanCurrentIndex / width);
      const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance

      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestMove = target;
      }
    }
  });

  squares[ghostCurrentIndex].classList.remove('ghost');
  ghostCurrentIndex = bestMove;
  squares[ghostCurrentIndex].classList.add('ghost');

  checkGameOver();
}

// --- START GAME ---

function startGame() {
  if (isGameRunning) return;

  isGameRunning = true;
  score = 0;
  scoreDisplay.textContent = score;
  statusMessage.textContent = 'Game berjalan. Kumpulkan Poin Stream!';

  document.addEventListener('keyup', movePacman);
  ghostInterval = setInterval(moveGhost, 400); // Ghost lebih cepat
}

// --- RESIZE IFRAME ---

function sendHeightToParent() {
  setTimeout(() => {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'PACMAN_RESIZE', height }, '*');
  }, 100);
}

// --- INISIALISASI ---

window.onload = function () {
  createGrid();

  document.addEventListener('keyup', movePacman);
  document.getElementById('start-button').addEventListener('click', startGame);

  document.querySelectorAll('.controls-mobile button').forEach(button => {
    button.addEventListener('click', () => {
      if (!isGameRunning) startGame();
      const key = button.getAttribute('data-key');
      movePacman({ key });
    });
  });

  sendHeightToParent();
  window.addEventListener('resize', sendHeightToParent);
};
