// app.js - KODE FINAL: Struktur Sempurna, Semua Fitur Berjalan, Simulasi Harga untuk Live Pairs

// --- 1. DEKLARASI KONSTANTA DAN VARIABEL ---
const btnConnect = document.getElementById('btn-connect');
const btnMeta = document.getElementById('btn-metamask');
console.log('ethereum:', window.ethereum);
console.log('ethers:', typeof ethers);
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
let currentStreamAdapter = null;

// --- 2. FUNGSI UTILITAS UI ---

function toast(msg, type = 'info') {
    if (toastEl) {
        toastEl.textContent = msg;
        toastEl.className = 'toast ' + type;
        toastEl.style.display = 'block';
        setTimeout(() => toastEl.style.display = 'none', 2500);
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
        d.textContent = '[' + new Date().toLocaleTimeString('id-ID') + '] ' + msg;
        activityEl.prepend(d);
        if (activityEl.children.length > 20) {
            activityEl.removeChild(activityEl.lastChild);
        }
    }
}

// --- 3. FUNGSI CHART ---

function initChart() {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('pointsChart').getContext('2d');
    if (!ctx) return; 
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{ 
                label: 'Points', 
                data: [], 
                borderColor: 'var(--color-neon-primary, #59ffc9)', 
                backgroundColor: 'rgba(89, 255, 201, 0.08)', 
                tension: 0.2 
            }]
        },
        options: {
            animation: { duration: 200 },
            scales: { 
                x: { display: false }, 
                y: { ticks: { color: 'var(--color-text-muted, #80A0A0)' } } 
            },
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


// --- 4. HANDLER GLOBAL (UNTUK SDK & MINIGAME) ---

window.onPointsUpdate = function(source, p) {
    const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g, '')) || 0;
    const newTotal = last + p; // Tambahkan poin, jangan replace
    
    pointsEl.textContent = Number(newTotal).toLocaleString();
    if (p > 0) toast('Points +' + p, 'success');
    
    // Perbarui riwayat dengan total poin baru (bukan delta)
    pointsHistory.push(newTotal); 
    if (pointsHistory.length > 60) pointsHistory.shift();
    updateChart();
    
    appendActivity(`Points: +${p} dari ${source}. Total: ${newTotal.toLocaleString()}`);
}

window.onMissionUpdate = function(wallet, mission) {
    const li = document.createElement('li');
    li.textContent = mission.name + ' — Completed';
    if (missionsList) missionsList.prepend(li);
    appendActivity('Mission: ' + mission.name);
    toast('Mission complete', 'success');
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
    // Daftar koin yang diminta user
    DEFAULT_PAIRS: ['SOMUSDT', 'SOMBNB', 'SOMETH'],
    
    trackWallet: function(wallet) {
        if (currentStreamAdapter) {
            currentStreamAdapter.disconnect();
        }
        
        const useMock = toggleSim.checked;
        
        if (window.SDSStreamAdapter) {
            currentStreamAdapter = new window.SDSStreamAdapter({
                wallet: wallet,
                useMock: useMock,
                // Menggunakan sumber 'SDS Stream'
                onPoints: (w, p) => window.onPointsUpdate('SDS Stream', p),
                onEvent: window.onStreamStatus,
                onError: (e) => window.onStreamStatus(`Error: ${e.message}`, false)
            });
            currentStreamAdapter.connect();
        } else {
            window.onStreamStatus("Error: Adapter not found!", false);
        }
    },
    
    startPairsWS: function(pairs, listeners) {
        const binanceWS = new WebSocket('wss://stream.binance.com/ws/!miniTicker@arr'); 
        let wsConnected = false;
        
        // --- SIMULATOR HARGA (FALLBACK) ---
        const startMockPrices = () => {
            appendActivity('Status: Memulai Simulasi Harga untuk Live Pairs.');
            
            pairs.forEach(sym => {
                let currentPrice = 0.5 + Math.random() * 0.5; 
                
                setInterval(() => {
                    const delta = (Math.random() - 0.5) * 0.01; 
                    currentPrice = currentPrice + delta;
                    
                    if (listeners[sym]) {
                        listeners[sym]({
                            s: sym,
                            c: currentPrice.toFixed(4), 
                            P: delta >= 0 ? 0.5 : -0.5
                        });
                    }
                }, 2000); 
            });
        };
        // -----------------------------------------------------------------

        binanceWS.onopen = () => {
            wsConnected = true;
            appendActivity('Binance WS connected');
        };
        
        binanceWS.onerror = (e) => { 
            appendActivity('Binance WS error! Memulai Simulasi Harga...'); 
            console.error("WebSocket Error:", e);
            startMockPrices();
        }
        
        binanceWS.onclose = () => {
            appendActivity('Binance WS disconnected.');
            if (!wsConnected) {
                 startMockPrices();
            }
        }
        
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
                if (!wsConnected) {
                    startMockPrices();
                }
            }
        };
        
        // Fallback Timeout: Jika WebSocket gagal membuka dalam 3 detik, paksa simulasi.
        setTimeout(() => {
            if (!wsConnected) {
                startMockPrices();
            }
        }, 3000); 
    },
};

// --- 6. FUNGSI INISIALISASI LIVE PAIRS ---

function initPairs() {
    const pairs = ProStream.DEFAULT_PAIRS;
    
    if (pairsContainer) {
        pairsContainer.innerHTML = '';
    } else {
        return;
    }
    
    const listeners = {};

    pairs.forEach(sym => {
        const el = document.createElement('div');
        el.className = 'pair';
        el.id = 'pair-' + sym;
        
        const symEl = document.createElement('div');
        symEl.className = 'sym';
        symEl.textContent = sym.replace('USDT', '/USDT').replace('BNB', '/BNB').replace('ETH', '/ETH');
        
        const priceEl = document.createElement('div');
        priceEl.className = 'price muted';
        priceEl.textContent = '-'; 
        
        el.appendChild(symEl);
        el.appendChild(priceEl);
        pairsContainer.appendChild(el);
        
        listeners[sym] = (d) => {
            const price = parseFloat(d.c).toFixed(4); 
            const priceChangePercent = parseFloat(d.P);
            
            priceEl.textContent = '$' + Number(price).toLocaleString();
            
            if (priceChangePercent >= 0) {
                priceEl.className = 'price up';
            } else {
                priceEl.className = 'price down';
            }
        };
    });
    
    ProStream.startPairsWS(pairs, listeners);
}


// --- 7. EVENT LISTENERS UTAMA ---

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
    
    ProStream.trackWallet(w); 
});

btnMeta.addEventListener('click', async () => {
    if (!window.ethereum || typeof ethers === 'undefined') {
        toast('MetaMask not found or Ethers.js not loaded.', 'error');
        return;
    }
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        // ✅ Isi input dengan address wallet
        walletInput.value = addr;

        // ✅ Reset UI seperti tombol "Track Wallet"
        pointsEl.textContent = '0';
        missionsList.innerHTML = '';
        activityEl.innerHTML = '';
        pointsHistory = [];

        setStatus('Connecting...', false);

        // ✅ Auto Track Wallet
        ProStream.trackWallet(addr);
		// ✅ Update tombol
        btnMeta.textContent = 'Connected';
        btnMeta.disabled = true;
		
        toast('Connected: ' + addr.substring(0, 6) + '...', 'success');
    } catch (e) {
        toast('MetaMask connection failed.', 'error');
        console.error("MetaMask Error:", e);
    }
});

btnClear.addEventListener('click', () => {
    activityEl.innerHTML = '<div>[00:00:00] Status: Activity cleared.</div>';
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


// --- 8. LISTENER UNTUK INTEGRASI MINIGAME (PAC-MAN) ---

window.addEventListener('message', (event) => {
    // Cek apakah pesan berasal dari game Pac-Man
    if (event.data && event.data.type === 'SOMNIA_POINT_EVENT') {
        const pointsGained = event.data.points;
        // Panggil handler poin utama, menggunakan sumber 'Pacman Game'
        window.onPointsUpdate('Pacman Game', pointsGained);
    }
});
// -- khusus untuk game pacman agar size flexibel ---
window.addEventListener('message', (event) => {
    if (event.data?.type === 'PACMAN_RESIZE') {
        const iframe = document.getElementById('pacman-game');
        if (iframe) {
            iframe.style.height = `${event.data.height}px`;
        }
    }
});

// --- 9. INISIALISASI AWAL (Memastikan berjalan TANPA menunggu 'load') ---

initPairs(); 
initChart();
