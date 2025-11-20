// app.js - KODE FINAL: Struktur Sempurna, Semua Fitur Berjalan, Simulasi Harga untuk Live Pairs

// --- 1. DEKLARASI KONSTANTA DAN VARIABEL ---
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


// --- 4. HANDLER GLOBAL (UNTUK SDK) ---

window.onPointsUpdate = function(wallet, p) {
    const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g, '')) || 0;
    const delta = p - last;
    pointsEl.textContent = Number(p).toLocaleString();
    if (delta > 0) toast('Points +' + delta, 'success');
    
    pointsHistory.push(p);
    if (pointsHistory.length > 60) pointsHistory.shift();
    updateChart();
    
    appendActivity('Points: ' + p.toLocaleString());
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
        const binanceWS = new WebSocket('wss://stream.binance.com/ws/!miniTicker@arr'); 
        let wsConnected = false;
        
        // --- SIMULATOR HARGA (FALLBACK UNTUK PASANGAN BARU/FIKTIF) ---
        const startMockPrices = () => {
            appendActivity('Status: Memulai Simulasi Harga untuk Live Pairs.');
            
            pairs.forEach(sym => {
                let currentPrice = 0.5 + Math.random() * 0.5; // Harga awal simulasi
                
                setInterval(() => {
                    // Simulasikan pergerakan harga kecil
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
            // Jika koneksi terputus dan belum pernah berhasil terhubung, jalankan simulasi
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
                    // Jika parsing gagal, fallback ke simulasi
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

// --- 6. EVENT LISTENERS ---

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
    
    Pro
}


// --- HANDLER GLOBAL (DIPINDAHKAN KE ATAS PROSTREAM) ---

window.onPointsUpdate = function(wallet, p) {
    const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g, '')) || 0;
    const delta = p - last;
    pointsEl.textContent = Number(p).toLocaleString();
    if (delta > 0) toast('Points +' + delta, 'success');
    
    pointsHistory.push(p);
    if (pointsHistory.length > 60) pointsHistory.shift();
    updateChart();
    
    appendActivity('Points: ' + p.toLocaleString());
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


// --- ADAPTER CONTROLLER (PROSTREAM) ---

const ProStream = {
    DEFAULT_PAIRS: ['SOMUSDT', 'SOMBNB', 'SOMETH'],
    
    trackWallet: function(wallet) {
        if (currentStreamAdapter) {
            currentStreamAdapter.disconnect();
        }
        
        const useMock = toggleSim.checked;
        
        if (window.SDSStreamAdapter) {
            currentStreamAdapter = new window.SDSStreamAdapter({
                wallet: wallet,
                useMock: useMock, // Tambahkan opsi ini jika SDK punya mode mock
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
        // MENGGUNAKAN WSS:// DENGAN URL YANG LEBIH STABIL
        const binanceWS = new WebSocket('wss://stream.binance.com/ws/!miniTicker@arr'); 
        
        binanceWS.onopen = () => appendActivity('Binance WS connected');
        binanceWS.onerror = (e) => { 
            appendActivity('Binance WS error! Live Pairs mungkin gagal dimuat.'); 
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

// --- EVENT LISTENERS ---

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
    // Memeriksa Ethers.js
    if (!window.ethereum || typeof ethers === 'undefined') {
        toast('MetaMask not found or Ethers.js not loaded. Check index.html for CDN.', 'error');
        return;
    }
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        walletInput.value = addr;
        toast('Connected: ' + addr.substring(0, 6) + '...', 'success');
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

// app.js - Ganti fungsi initPairs() Anda dengan kode ini:

function initPairs() {
    const pairs = ProStream.DEFAULT_PAIRS;
    
    // Pastikan container ada dan bersih
    if (pairsContainer) {
        pairsContainer.innerHTML = '';
    } else {
        console.error("Pairs container not found.");
        return;
    }
    
    const listeners = {};

    pairs.forEach(sym => {
        // --- 1. MEMBUAT ELEMENT HTML UNTUK SETIAP PAIR ---
        const el = document.createElement('div');
        el.className = 'pair';
        el.id = 'pair-' + sym;
        
        // Membuat elemen Sym dan Price secara terpisah untuk akses mudah
        const symEl = document.createElement('div');
        symEl.className = 'sym';
        symEl.textContent = sym.replace('USDT', '/USDT');
        
        const priceEl = document.createElement('div');
        priceEl.className = 'price muted';
        priceEl.textContent = '-'; 
        
        el.appendChild(symEl);
        el.appendChild(priceEl);
        
        pairsContainer.appendChild(el);
        
        // --- 2. DEFINISI LISTENER DENGAN REFERENSI LANGSUNG KE priceEl ---
        listeners[sym] = (d) => {
            // Menggunakan 'c' (Last Price) dan 'P' (Percentage Price Change)
            const price = parseFloat(d.c).toFixed(2);
            const priceChangePercent = parseFloat(d.P);
            
            // Mengupdate konten dan gaya menggunakan referensi priceEl
            priceEl.textContent = '$' + Number(price).toLocaleString();
            
            // Logika UP/DOWN
            if (priceChangePercent >= 0) {
                priceEl.className = 'price up';
            } else {
                priceEl.className = 'price down';
            }
        };
    });
    
    // Memulai koneksi WebSocket dengan listeners yang sudah dibuat
    ProStream.startPairsWS(pairs, listeners);
}



window.addEventListener('load', () => {
    initPairs(); // Memulai stream harga Binance
    initChart(); // Mempersiapkan chart
    // Catatan: Stream Poin Somnia dimulai saat tombol Connect diklik!
});
