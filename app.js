// app.js - REVISI AKHIR: Memperbaiki urutan/scope agar stream adapter berjalan

// --- 1. DEKLARASI KONSTANTA DAN VARIABEL (TOP SECTION) ---
const btnConnect = document.getElementById('btn-connect');
const btnMeta = document.getElementById('btn-metamask');
const walletInput = document.getElementById('wallet-input');
const pointsEl = document.getElementById('points');
const missionsList = document.getElementById('missions');
const activityEl = document.getElementById('activity');
const streamStatusEl = document.getElementById('stream-status');
const toggleSim = document.getElementById('toggle-sim');
const btnClear = document.getElementById('btn-clear');
const btnExport = document.getElementById('btn-export');
const pairsContainer = document.getElementById('pairs');
const toastEl = document.getElementById('toast');

let chart = null;
let pointsHistory = [];
let currentStreamAdapter = null; // Variabel global untuk adapter

// --- 2. FUNGSI UTILITAS UI (HARUS DI ATAS HANDLER) ---

function toast(msg) {
    if (toastEl) {
        toastEl.textContent = msg;
        toastEl.style.display = 'block';
        setTimeout(() => toastEl.style.display = 'none', 2200);
    }
}

function setStatus(text, on = true) {
    if (streamStatusEl) {
        streamStatusEl.textContent = text;
        streamStatusEl.className = on ? 'value' : 'value off';
    }
}

function appendActivity(msg) {
    if (activityEl) {
        const d = document.createElement('div');
        d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
        activityEl.prepend(d);
    }
}

// --- 3. FUNGSI CHART (HARUS DI ATAS HANDLER UPDATE) ---

function initChart() {
    if (typeof Chart === 'undefined') {
        console.error("Chart.js is not loaded.");
        return;
    }
    const ctx = document.getElementById('pointsChart').getContext('2d');
    if (!ctx) return; 
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{ 
                label: 'Points', 
                data: [], 
                borderColor: '#7bffb0', 
                backgroundColor: 'rgba(123,255,176,0.08)', 
                tension: 0.15 
            }]
        },
        options: {
            animation: { duration: 200 },
            scales: { x: { display: false }, y: { ticks: { color: '#9fa3b8' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateChart() {
    if (!chart) return;
    chart.data.labels = pointsHistory.map((_, i) => i + 1);
    chart.data.datasets[0].data = pointsHistory;
    chart.update();
}

// --- 4. HANDLER GLOBAL WINDOW.ON... (DIPINDAHKAN KE ATAS PROSTREAM) ---

window.onPointsUpdate = function(wallet, p) {
    const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g, '')) || 0;
    const delta = p - last;
    pointsEl.textContent = Number(p).toLocaleString();
    if (delta > 0) toast('Points +' + delta);
    
    pointsHistory.push(p);
    if (pointsHistory.length > 60) pointsHistory.shift();
    updateChart(); // Sekarang updateChart sudah terdefinisi
    
    appendActivity('Points: ' + p.toLocaleString());
}

window.onMissionUpdate = function(wallet, mission) {
    const li = document.createElement('li');
    li.textContent = mission.name + ' — Completed';
    if (missionsList) missionsList.prepend(li);
    appendActivity('Mission: ' + mission.name);
    toast('Mission complete');
}

window.onStreamStatus = function(txt, on = true) {
    setStatus(txt, on);
    appendActivity('Status: ' + txt);
}

window.onStreamLog = function(txt) {
    appendActivity('Log: ' + txt);
}


// --- 5. ADAPTER CONTROLLER (PROSTREAM) ---

const ProStream = {
    DEFAULT_PAIRS: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    
    // FUNGSI INI AKAN BERJALAN DENGAN SEMUA HANDLER SUDAH TERSEDIA
    trackWallet: function(wallet) {
        if (currentStreamAdapter) {
            currentStreamAdapter.disconnect();
        }
        
        // Pastikan SDSStreamAdapter sudah dimuat dari stream_adapter.js
        if (window.SDSStreamAdapter) {
            currentStreamAdapter = new window.SDSStreamAdapter({
                wallet: wallet,
                onPoints: window.onPointsUpdate,
                onEvent: window.onStreamStatus,
                onError: (e) => window.onStreamStatus(`Error: ${e.message}`, false)
            });
            currentStreamAdapter.connect();
        } else {
            window.onStreamStatus("Error: Adapter not found! Check stream_adapter.js load order.", false);
        }
    },
    
    startPairsWS: function(pairs, listeners) {
        // PERHATIAN: Memastikan WSS:// digunakan!
        const binanceWS = new WebSocket('wss://stream.binance.com/ws/!miniTicker@arr'); 
        
        // ... (Logika WebSocket lainnya, ini sudah benar) ...
        binanceWS.onopen = () => appendActivity('Binance WS connected');
        binanceWS.onerror = (e) => { 
            appendActivity('Binance WS error! Cek konsol browser.'); 
            console.error("WebSocket Error:", e);
        }
        binanceWS.onclose = () => appendActivity('Binance WS disconnected.');
        
        binanceWS.onmessage = (event) => { 
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data)) {
                    data.forEach(ticker => {
                        const symbol = ticker.s;
                        if (listeners[symbol]) {
                            listeners[symbol](ticker);
                        }
                    });
                }
            } catch (e) {
                console.error("Binance data parse error:", e);
            }
        };
    }
};

// --- 6. EVENT LISTENERS (LOGIKA TOMBOL) ---

btnConnect.addEventListener('click', () => {
    const w = walletInput.value.trim();
    if (!w) {
        alert('Enter wallet');
        return;
    }
    
    // Reset UI sebelum koneksi
    pointsEl.textContent = '0';
    missionsList.innerHTML = '';
    activityEl.innerHTML = '';
    pointsHistory = [];
    
    setStatus('Connecting...', false);
    
    // Panggil trackWallet untuk memulai stream poin Somnia
    ProStream.trackWallet(w); 
});

btnMeta.addEventListener('click', async () => {
    // Logika Metamask (Sudah Benar)
    if (!window.ethereum || typeof ethers === 'undefined') {
        toast('MetaMask not found or Ethers.js not loaded.');
        return;
    }
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        walletInput.value = addr;
        toast('Connected: ' + addr.substring(0, 6) + '...');
    } catch (e) {
        toast('MetaMask connection failed.', false);
        console.error("MetaMask Error:", e);
    }
});

btnClear.addEventListener('click', () => {
    activityEl.innerHTML = '';
    toast('Activity cleared');
});

btnExport.addEventListener('click', () => {
    const blob = new Blob([activityEl.innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_log.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// --- 7. FUNGSI INISIALISASI (saat DOM dimuat) ---

function initPairs() {
    const pairs = ProStream.DEFAULT_PAIRS;
    pairs.forEach(sym => {
        const el = document.createElement('div');
        el.className = 'pair';
        el.id = 'pair-' + sym;
        el.innerHTML = `<div class="sym">${sym.replace('USDT', '/USDT')}</div><div class="price muted">-</div>`;
        if (pairsContainer) pairsContainer.appendChild(el);
    });
    
    const listeners = {};
    pairs.forEach(sym => {
        listeners[sym] = (d) => {
            const price = parseFloat(d.c).toFixed(2);
            const el = document.querySelector('#pair-' + sym + ' .price');
            const priceChangePercent = parseFloat(d.P);
            if (el) {
                el.textContent = '$' + Number(price).toLocaleString();
                el.className = 'price ' + (priceChangePercent >= 0 ? 'up' : 'down');
            }
        };
    });
    
    ProStream.startPairsWS(pairs, listeners);
}


window.addEventListener('load', () => {
    initPairs(); // Memulai stream harga Binance
    initChart(); // Mempersiapkan chart
    // Catatan: Stream Poin Somnia dimulai saat tombol Connect diklik!
});
