// stream_adapter.js (upgraded)
// Mock simulator by default. Also supports Binance websockets for live pair prices.
// Replace mock with Somnia Data Streams SDK as needed.

(function(global){
  const MOCK = true;
  let sim = null;
  let currentWallet='';
  let wsPairs = {};
  let listeners = {};

  function startMock(wallet){
    let points = 0;
    const missions = [
      {id:1,name:"Join Somnia Discord",progress:0,target:1},
      {id:2,name:"Mint Demo NFT",progress:0,target:1},
      {id:3,name:"Share Tweet",progress:0,target:1}
    ];
    sim = setInterval(()=>{
      if(Math.random()<0.65){
        const delta = Math.floor(Math.random()*60)+5;
        points += delta;
        if(typeof global.onPointsUpdate === 'function') global.onPointsUpdate(wallet, points);
        log('Points +'+delta);
      } else {
        const idx = Math.floor(Math.random()*missions.length);
        missions[idx].progress = missions[idx].target;
        if(typeof global.onMissionUpdate === 'function') global.onMissionUpdate(wallet, missions[idx]);
        log('Mission complete: '+missions[idx].name);
      }
    },1400);
    if(typeof global.onStreamStatus === 'function') global.onStreamStatus('connected (mock)');
  }

  function stopMock(){
    if(sim) clearInterval(sim);
    if(typeof global.onStreamStatus === 'function') global.onStreamStatus('disconnected');
  }

  function log(t){ if(typeof global.onStreamLog==='function') global.onStreamLog(t); }

  function startPairWS(pairs){
    stopPairWS();
    pairs.forEach(sym=>{
      const stream = sym.toLowerCase()+'@trade';
      const url = 'wss://stream.binance.com:9443/ws/'+stream;
      try{
        const ws = new WebSocket(url);
        ws.onmessage = function(e){
          const d = JSON.parse(e.data);
          if(typeof listeners[sym] === 'function') listeners[sym](d);
        };
        ws.onopen = ()=> log('WS open '+sym);
        ws.onerror = ()=> log('WS err '+sym);
        ws.onclose = ()=> log('WS close '+sym);
        wsPairs[sym]=ws;
      }catch(err){ log('WS init fail '+sym); }
    });
  }

  function stopPairWS(){ Object.values(wsPairs).forEach(w=>{ try{w.close()}catch(e){} }); wsPairs={}; }

  function trackPairs(pairs, listenerMap){
    listeners = listenerMap || {};
    startPairWS(pairs || []);
  }

  function trackWallet(wallet, useMock=true){
    currentWallet = wallet;
    if(!wallet) return;
    if(MOCK || useMock){
      stopMock();
      startMock(wallet);
      return;
    }
    log('Somnia SDK placeholder - implement subscription here.');
    if(typeof global.onStreamStatus === 'function') global.onStreamStatus('sdk placeholder');
  }

  function stopTracking(){ stopMock(); stopPairWS(); }

  global.StreamAdapter = { trackWallet, stopTracking, trackPairs, isMock: ()=> MOCK };
})(window);
