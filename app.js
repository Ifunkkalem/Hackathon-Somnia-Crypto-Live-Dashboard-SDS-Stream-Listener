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

// --- DEFINISI ADAPTER DAN CONTROLLER STREAM ---
let currentStreamAdapter = null;

const ProStream = {
    DEFAULT_PAIRS: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],

    trackWallet: function(wallet, useMock) {
        if (currentStreamAdapter) {
            currentStreamAdapter.disconnect();
        }

        if (window.SDSStreamAdapter) {
            currentStreamAdapter = new window.SDSStreamAdapter({
                wallet: wallet,
                onPoints: window.onPointsUpdate,
                onEvent: window.onStreamStatus,
                onError: (e) => window.onStreamStatus(`Error: ${e.message}`, false) 
            });
            currentStreamAdapter.connect();
        } else {
            window.onStreamStatus("Error: Adapter not found!", false);
        }
    },

    startPairsWS: function(pairs, listeners) {
        // PERBAIKAN: Menggunakan URL WebSocket yang lebih stabil (tanpa port 9443)
        const binanceWS = new WebSocket('wss://stream.binance.com/ws/!miniTicker@arr');

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
// ---------------------------------------------

function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    setTimeout(() => toastEl.style.display = 'none', 2200);
}

function setStatus(text, on = true) {
    streamStatusEl.textContent = text;
    streamStatusEl.className = on ? 'value' : 'value off';
}

function appendActivity(msg) {
    const d = document.createElement('div');
    d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    activityEl.prepend(d);
}

window.onPointsUpdate = function(wallet, p) {
    const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g, '')) || 0;
    const delta = p - last;
    pointsEl.textContent = Number(p).toLocaleString();
    if (delta > 0) toast('Points +' + delta);
    pointsHistory.push(p);
    if (pointsHistory.length > 60) pointsHistory.shift();
    updateChart();
    appendActivity('Points: ' + p.toLocaleString()); 
}

window.onMissionUpdate = function(wallet, mission) {
    const li = document.createElement('li');
    li.textContent = mission.name + ' — Completed';
    missionsList.prepend(li);
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

btnConnect.addEventListener('click', () => {
    const w = walletInput.value.trim();
    if (!w) { alert('Enter wallet'); return; }
    
    // Reset UI sebelum koneksi
    pointsEl.textContent = '0';
    missionsList.innerHTML = '';
    activityEl.innerHTML = '';
    pointsHistory = [];
    
    const useMock = toggleSim.checked; 
    setStatus('Connecting...', false);
    
    ProStream.trackWallet(w, useMock); 
});

btnMeta.addEventListener('click', async () => {
    // Pastikan Ethers.js sudah dimuat
    if (!window.ethereum || typeof ethers === 'undefined') { 
        alert('MetaMask not found or Ethers.js not loaded. Check index.html for CDN.'); 
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
        toast('MetaMask connection failed.', 'error');
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

function initPairs() {
    const pairs = ProStream.DEFAULT_PAIRS;
    pairs.forEach(sym => {
        const el = document.createElement('div');
        el.className = 'pair';
        el.id = 'pair-' + sym;
        el.innerHTML = `<div class="sym">${sym.replace('USDT', '/USDT')}</div><div class="price muted">-</div>`;
        pairsContainer.appendChild(el);
    });
    
    const listeners = {};
    pairs.forEach(sym => {
        listeners[sym] = (d) => {
            // Menggunakan 'c' (Last Price) dan 'P' (Percentage Price Change) dari miniTicker
            const price = parseFloat(d.c).toFixed(2); 
            const el = document.querySelector('#pair-' + sym + ' .price'); 
            
            // Logika untuk menentukan warna (UP/DOWN)
            const priceChangePercent = parseFloat(d.P); 
            
            if (el) {
                el.textContent = '$' + Number(price).toLocaleString();
                el.className = 'price ' + (priceChangePercent >= 0 ? 'up' : 'down');
            } else {
                 console.warn("Element tidak ditemukan untuk pair:", sym);
            }
        };
    });
    ProStream.startPairsWS(pairs, listeners);
}

function initChart() {
    // Pastikan Chart.js sudah dimuat
    if (typeof Chart === 'undefined') {
        console.error("Chart.js is not loaded. Check index.html for CDN link.");
        return;
    }
    const ctx = document.getElementById('pointsChart').getContext('2d');
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
            animation: {
                duration: 200
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    ticks: {
                        color: '#9fa3b8'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateChart() {
    if (!chart) return;
    chart.data.labels = pointsHistory.map((_, i) => i + 1);
    chart.data.datasets[0].data = pointsHistory;
    chart.update();
}

window.addEventListener('load', () => {
    initPairs();
    initChart();
});
                 console.warn("Element tidak ditemukan untuk pair:", sym);
            }
        };
    });
    ProStream.startPairsWS(pairs, listeners);
}

// ... (initChart, updateChart, window.addEventListener('load', ...)
