class SDSStreamAdapter {
    constructor({ wallet, onPoints, onEvent, onError }) {
        this.wallet = wallet;
        this.onPoints = onPoints;
        this.onEvent = onEvent;
        this.onError = onError;
        this.connected = false;
        this.interval = null;
        this.currentPoints = 0; 
    }

    connect() {
        try {
            this.connected = true;

            // Kirim poin awal sebelum memulai interval
            if (this.onPoints) {
                this.onPoints(this.wallet, this.currentPoints); 
            }

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

            // Simulasi penambahan poin acak
            const addedPoints = Math.floor(Math.random() * 8) + 1;
            this.currentPoints += addedPoints; 

            if (this.onPoints) {
                this.onPoints(this.wallet, this.currentPoints); 
            }

            if (this.onEvent) {
                this.onEvent(
                    `Activity detected: +${addedPoints} points`
                );
            }
            
            // Simulasi misi selesai dengan peluang kecil
            if (Math.random() < 0.1) {
                if (window.onMissionUpdate) {
                    window.onMissionUpdate(this.wallet, { name: `Random Mission #${Math.floor(Math.random() * 100)}` });
                }
            }
            
        }, 1500);
    }
}

window.SDSStreamAdapter = SDSStreamAdapter;
