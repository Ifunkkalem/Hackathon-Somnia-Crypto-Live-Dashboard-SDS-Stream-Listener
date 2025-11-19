// app.js

// ... (ProStream.trackWallet dan lainnya)

    startPairsWS: function(pairs, listeners) {
        // Protokol WSS:// sudah benar
        const binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

        binanceWS.onopen = () => appendActivity('Binance WS connected');
        binanceWS.onerror = (e) => appendActivity('Binance WS error!');
        binanceWS.onclose = () => appendActivity('Binance WS disconnected.');
        
        binanceWS.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Pastikan yang diterima adalah Array
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

// ... (Fungsi-fungsi lain)

function initPairs() {
    const pairs = ProStream.DEFAULT_PAIRS;
    pairs.forEach(sym => {
        const el = document.createElement('div');
        el.className = 'pair';
        // Pastikan ID elemen sesuai: 'pair-BTCUSDT'
        el.id = 'pair-' + sym; 
        el.innerHTML = `<div class="sym">${sym.replace('USDT', '/USDT')}</div><div class="price muted">-</div>`;
        pairsContainer.appendChild(el);
    });
    
    const listeners = {};
    pairs.forEach(sym => {
        listeners[sym] = (d) => {
            // FIX: Menggunakan 'c' (Last Price) dan 'P' (Percentage Price Change)
            // 'c' = Last Price, 'P' = Percentage Price Change, 'p' = Absolute Price Change.
            const price = parseFloat(d.c).toFixed(2); 
            // Ambil elemen yang sudah dibuat di atas dengan ID yang benar
            const el = document.querySelector('#pair-' + sym + ' .price'); 
            
            // Logika untuk menentukan warna (UP/DOWN)
            const priceChangePercent = parseFloat(d.P); 
            
            if (el) {
                el.textContent = '$' + Number(price).toLocaleString();
                // Terapkan class berdasarkan persentase perubahan harga
                el.className = 'price ' + (priceChangePercent >= 0 ? 'up' : 'down');
            } else {
                 console.warn("Element tidak ditemukan untuk pair:", sym);
            }
        };
    });
    ProStream.startPairsWS(pairs, listeners);
}

// ... (initChart, updateChart, window.addEventListener('load', ...)
