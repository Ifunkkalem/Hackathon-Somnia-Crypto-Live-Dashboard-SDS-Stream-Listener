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
  if (delta > 0) toast('Points +'+delta);
  pointsHistory.push(p);
  if (pointsHistory.length > 60) pointsHistory.shift();
  updateChart();
  appendActivity('Points: ' + p);
}

window.onMissionUpdate = function(wallet, mission) {
  const li = document.createElement('li');
  li.textContent = mission.name + ' — Completed';
  missionsList.prepend(li);
  appendActivity('Mission: ' + mission.name);
  toast('Mission complete');
}

window.onStreamStatus = function(txt) {
  setStatus(txt, true);
  appendActivity('Status: ' + txt);
}

window.onStreamLog = function(txt) {
  appendActivity('Log: ' + txt);
}

btnConnect.addEventListener('click', () => {
  const w = walletInput.value.trim();
  if (!w) { alert('Enter wallet'); return; }
  pointsEl.textContent = '0';
  missionsList.innerHTML = '';
  activityEl.innerHTML = '';
  pointsHistory = [];
  const useMock = toggleSim.checked;
  setStatus('Connecting...', false);
  ProStream.trackWallet(w, useMock);
});

btnMeta.addEventListener('click', async () => {
  if (!window.ethereum) { alert('MetaMask not found'); return; }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  const addr = await signer.getAddress();
  walletInput.value = addr;
  toast('Connected: ' + addr);
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
    el.innerHTML = `<div class="sym">${sym.replace('USDT','/USDT')}</div><div class="price muted">-</div>`;
    pairsContainer.appendChild(el);
  });
  const listeners = {};
  pairs.forEach(sym => {
    listeners[sym] = (d) => {
      const price = parseFloat(d.p).toFixed(2);
      const el = document.querySelector('#pair-'+sym+' .price');
      const last = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
      el.textContent = '$' + Number(price).toLocaleString();
      el.className = 'price ' + (price >= last ? 'up' : 'down');
    };
  });
  ProStream.startPairsWS(pairs, listeners);
}

function initChart() {
  const ctx = document.getElementById('pointsChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [ { label: 'Points', data: [], borderColor: '#7bffb0', backgroundColor: 'rgba(123,255,176,0.08)', tension: 0.15 } ] },
    options: { animation: { duration: 200 }, scales: { x: { display: false }, y: { ticks: { color: '#9fa3b8' } } }, plugins: { legend: { display: false } } }
  });
}

function updateChart() {
  if (!chart) return;
  chart.data.labels = pointsHistory.map((_,i)=>i+1);
  chart.data.datasets[0].data = pointsHistory;
  chart.update();
}

window.addEventListener('load', () => {
  initPairs();
  initChart();
});
""")

readme = textwrap.dedent("""\
# DreamStream PRO+ Full Upgrade

## Fitur PRO+:
- Mock Somnia stream simulator  
- Binance websocket untuk live pair price  
- MetaMask / Wallet connect (via `ethers.js`)  
- Chart.js untuk visualisasi riwayat point  
- Export log aktivitas  
- Notifikasi toast saat poin naik & misi selesai  
- UI Neo-Terminal ungu modern  

## Cara deploy:
1. Buat repo GitHub  
2. Upload file & struktur folder:  
   - `index.html`  
   - `assets/css/style.css`  
   - `js/stream_adapter.js`  
   - `js/app.js`  
   - `README.md`  
3. Aktifkan GitHub Pages (branch `main`, folder `/`)  
4. Buka link Pages

## Integrasi Somnia Data Streams:
Ganti bagian mock di `js/stream_adapter.js` dengan inisialisasi SDK Somnia.  
Panggil global callback:  
- `window.onPointsUpdate(wallet, points)`  
- `window.onMissionUpdate(wallet, mission)`  
- `window.onStreamStatus(statusText)`  
- `window.onStreamLog(logText)`

Dibuat oleh **Hilldanime Labs**.
""")

# write
with open(os.path.join(base, "index.html"), "w", encoding="utf-8") as f: f.write(index_html)
with open(os.path.join(base, "assets/css/style.css"), "w", encoding="utf-8") as f: f.write(style_css)
with open(os.path.join(base, "js/stream_adapter.js"), "w", encoding="utf-8") as f: f.write(stream_adapter_js)
with open(os.path.join(base, "js/app.js"), "w", encoding="utf-8") as f: f.write(app_js)
with open(os.path.join(base, "README.md"), "w", encoding="utf-8") as f: f.write(readme)

zip_path = "/mnt/data/DreamStream_PRO_PLUS_FULL.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, fnames in os.walk(base):
        for fname in fnames:
            fp = os.path.join(root, fname)
            arcname = os.path.relpath(fp, base)
            zf.write(fp, arcname)

zip_path0
