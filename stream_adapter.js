// PRO+ stream_adapter.js
// - Mock simulator (default)
// - Binance public websockets for live pair prices
// - Placeholder untuk Somnia Data Streams SDK

(function(global) {
  const DEFAULT_PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","TONUSDT","LINKUSDT"];
  let simInterval = null;
  let currentWallet = '';
  let wsMap = {};

  function startMock(wallet) {
    stopMock();
    currentWallet = wallet;
    let points = 0;
    const missions = [
      {id:1,name:"Join Somnia Discord",progress:0,target:1},
      {id:2,name:"Mint Demo NFT",progress:0,target:1},
      {id:3,name:"Share Tweet",progress:0,target:1}
    ];
    simInterval = setInterval(() => {
      if (Math.random() < 0.7) {
        const delta = Math.floor(Math.random()*120) + 5;
        points += delta;
        if (typeof global.onPointsUpdate === 'function') global.onPointsUpdate(wallet, points);
        log('Points +'+delta);
      } else {
        const idx = Math.floor(Math.random() * missions.length);
        missions[idx].progress = missions[idx].target;
        if (typeof global.onMissionUpdate === 'function') global.onMissionUpdate(wallet, missions[idx]);
        log('Mission completed: '+missions[idx].name);
      }
    }, 1000);
    if (typeof global.onStreamStatus === 'function') global.onStreamStatus('connected (mock)');
  }

  function stopMock() {
    if (simInterval) clearInterval(simInterval);
    if (typeof global.onStreamStatus === 'function') global.onStreamStatus('disconnected');
  }

  function startPairsWS(pairs, listeners) {
    stopPairsWS();
    pairs.forEach(sym => {
      try {
        const stream = sym.toLowerCase() + '@trade';
        const url = 'wss://stream.binance.com:9443/ws/' + stream;
        const ws = new WebSocket(url);
        ws.onopen = () => log('WS open ' + sym);
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (listeners && typeof listeners[sym] === 'function') listeners[sym](d);
        };
        ws.onclose = () => log('WS close ' + sym);
        ws.onerror = () => log('WS err ' + sym);
        wsMap[sym] = ws;
      } catch(e) {
        log('WS init failed ' + sym);
      }
    });
  }

  function stopPairsWS() {
    Object.values(wsMap).forEach(w => {
      try { w.close(); } catch {}
    });
    wsMap = {};
  }

  function trackWallet(wallet, useMock = true) {
    currentWallet = wallet;
    if (!wallet) return;
    if (useMock) {
      startMock(wallet);
      return;
    }
    // Somnia SDK Integration placeholder:
    // const client = new Somnia({ apiKey: 'YOUR_API_KEY' });
    // client.subscribeToWallet(wallet, (evt) => {
    //   onPointsUpdate(evt.wallet, evt.points || 0);
    //   if (evt.mission) onMissionUpdate(evt.wallet, evt.mission);
    // });
    log('Somnia SDK not integrated');
  }

  function log(m) {
    if (typeof global.onStreamLog === 'function') global.onStreamLog(m);
  }

  global.ProStream = {
    trackWallet,
    stopTracking: () => { stopMock(); stopPairsWS(); },
    startPairsWS,
    DEFAULT_PAIRS
  };
})(window);
