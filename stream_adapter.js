class SDSStreamAdapter {
    constructor({ wallet, onPoints, onEvent, onError }) {
        this.wallet = wallet;
        this.onPoints = onPoints;
        this.onEvent = onEvent;
        this.onError = onError;
        this.connected = false;
        this.interval = null; // simulasi stream untuk GitHub Pages
        this.currentPoints = 0; // <-- BARU: Simpan status poin di class
    }

    connect() {
        try {
            this.connected = true;

            // 1. Kirim poin awal sebelum memulai interval agar dashboard langsung terisi
            if (this.onPoints) {
                // onPointsUpdate di app.js menerima (wallet, points)
                this.onPoints(this.wallet, this.currentPoints); 
            }

            // GitHub Pages TIDAK bisa menerima WebSocket external
            // Maka kita gunakan simulasi stream berbasis timer
            this._startMockStream();

            if (this.onEvent) {
                this.onEvent("Stream connected (Mock Mode)");
            }
        } catch (e) {
            if (this.onError) this.onError(e);
        }
    }

    disconnect() {
        this.connected = false;
        if (this.interval) clearInterval(this.interval);
        if (this.onEvent) this.onEvent("Stream disconnected");
    }

    _startMockStream() {
        this.interval = setInterval(() => {
            if (!this.connected) return;

            // simulasi poin
            const addedPoints = Math.floor(Math.random() * 8) + 1;
            this.currentPoints += addedPoints; // <-- Update properti class

            if (this.onPoints) {
                this.onPoints(this.wallet, this.currentPoints); 
            }

            if (this.onEvent) {
                this.onEvent(
                    `Activity detected: +${addedPoints} points`
                );
            }
            
            // Tambahkan simulasi misi sesekali (10% peluang per tick)
            if (Math.random() < 0.1) {
                if (window.onMissionUpdate) {
                    window.onMissionUpdate(this.wallet, { name: `Random Mission #${Math.floor(Math.random() * 100)}` });
                }
            }
            
        }, 1500);
    }
}

window.SDSStreamAdapter = SDSStreamAdapter;
