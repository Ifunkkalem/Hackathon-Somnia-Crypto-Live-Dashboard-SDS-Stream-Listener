class SDSStreamAdapter {
    constructor({ wallet, onPoints, onEvent, onError }) {
        this.wallet = wallet;
        this.onPoints = onPoints;
        this.onEvent = onEvent;
        this.onError = onError;
        this.connected = false;
        this.interval = null; // simulasi stream untuk GitHub Pages
    }

    connect() {
        try {
            this.connected = true;

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
        let points = 0;

        this.interval = setInterval(() => {
            if (!this.connected) return;

            // simulasi poin
            points += Math.floor(Math.random() * 8) + 1;

            if (this.onPoints) {
                this.onPoints({
                    wallet: this.wallet,
                    points: points,
                    timestamp: Date.now()
                });
            }

            if (this.onEvent) {
                this.onEvent(
                    `Activity detected: +${points} points`
                );
            }
        }, 1500);
    }
}

window.SDSStreamAdapter = SDSStreamAdapter;
