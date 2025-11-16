// app.js (upgraded) - main glue for DreamStream Neon Terminal demo
const btn = document.getElementById('btn-connect');
const walletInput = document.getElementById('wallet-input');
const pointsEl = document.getElementById('points');
const deltaEl = document.getElementById('points-change');
const missionsEl = document.getElementById('missions');
const activityEl = document.getElementById('activity');
const statusEl = document.getElementById('stream-status');
const toggleSim = document.getElementById('toggle-sim');
const pairsContainer = document.getElementById('pairs');
let chart=null;
let pointsHistory=[];
let currentWallet='';

function setStatus(t,on=true){ statusEl.textContent=t; statusEl.className = on? 'st on':'st off'; }
function logAct(t){ const d=document.createElement('div'); d.textContent='['+new Date().toLocaleTimeString()+'] '+t; activityEl.prepend(d); }

window.onPointsUpdate = function(wallet, points){
  if(wallet!==currentWallet) return;
  const last = parseInt(pointsEl.textContent.replace(/[^0-9]/g,''))||0;
  const delta = points - last;
  pointsEl.textContent = Number(points).toLocaleString();
  deltaEl.textContent = (delta>0? '+'+delta: delta);
  deltaEl.className = 'delta '+(delta>=0?'up':'down');
  pointsHistory.push(points);
  if(pointsHistory.length>30) pointsHistory.shift();
  updateChart();
  logAct('Points: '+points);
}

window.onMissionUpdate = function(wallet, m){
  if(wallet!==currentWallet) return;
  const li=document.createElement('li');
  li.textContent = m.name + ' — Completed';
  missionsEl.prepend(li);
  logAct('Mission: '+m.name);
}

window.onStreamStatus = function(t){ setStatus(t,true); logAct('Status: '+t); }
window.onStreamLog = function(t){ logAct('Log: '+t); }

btn.addEventListener('click', ()=>{
  const w = walletInput.value.trim();
  if(!w){ alert('Enter wallet address'); return; }
  currentWallet = w;
  pointsEl.textContent = '0'; deltaEl.textContent=''; missionsEl.innerHTML=''; activityEl.innerHTML='';
  pointsHistory=[];
  const useMock = toggleSim.checked;
  setStatus('Connecting...', false);
  if(window.StreamAdapter) window.StreamAdapter.trackWallet(w, useMock);
  else setStatus('Adapter not ready', false);
});

function initPairsUI(){
  const pairs = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","TONUSDT","LINKUSDT"];
  pairsContainer.innerHTML='';
  pairs.forEach(p=>{
    const el=document.createElement('div'); el.className='pair'; el.id='pair-'+p;
    el.innerHTML = '<div class="sym">'+p.replace('USDT','/USDT')+'</div><div class="price muted">-</div>';
    pairsContainer.appendChild(el);
  });
  const listeners = {};
  pairs.forEach(sym=>{
    listeners[sym] = function(d){
      const price = parseFloat(d.p).toFixed(2);
      const el = document.querySelector('#pair-'+sym+' .price');
      const last = parseFloat(el.textContent.replace(/[^0-9.]/g,''))||0;
      el.textContent = '$'+Number(price).toLocaleString();
      el.className = 'price '+(price>=last?'up':'down');
    };
  });
  if(window.StreamAdapter) window.StreamAdapter.trackPairs(pairs, listeners);
}

function initChart(){
  const ctx = document.getElementById('pointsChart').getContext('2d');
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[{ label:'Points', data:[], borderColor:'#7bffb0', backgroundColor:'rgba(123,255,176,0.08)', tension:0.25 }] },
    options:{ scales:{ x:{ display:false }, y:{ ticks:{ color:'#9aa3b2' } } }, plugins:{ legend:{ display:false } } }
  });
}

function updateChart(){
  if(!chart) return;
  chart.data.labels = pointsHistory.map((_,i)=>i+1);
  chart.data.datasets[0].data = pointsHistory;
  chart.update();
}

window.addEventListener('load', ()=>{ initPairsUI(); initChart(); if(window.StreamAdapter && window.StreamAdapter.isMock()) setStatus('Mock ready', true); else setStatus('Adapter not loaded', false); });
