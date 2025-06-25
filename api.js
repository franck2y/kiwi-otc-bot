const API_KEY = '6XLTMJEEILYL1VE3';
const chartEl = document.getElementById('chart').getContext('2d');
const signalEl = document.getElementById('signalBox');
const logEl = document.getElementById('logBox');
const pairEl = document.getElementById('pair');

let chart;
let patterns = [
  { seq: ['UP','UP'], signal: 'UP 📈' },
  { seq: ['DOWN','DOWN'], signal: 'DOWN 📉' },
];

async function fetchFX(pair) {
  const from = pair.slice(0,3);
  const to = pair.slice(3);
  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=1min&apikey=${API_KEY}&outputsize=compact`;
  const res = await fetch(url);
  const data = await res.json();
  const t = data['Time Series FX (1min)'] || {};
  return Object.entries(t).slice(0, 25).reverse().map(([time, vals]) => ({
    time,
    close: parseFloat(vals['4. close'])
  }));
}

function miniIA(data) {
  if (data.length < 3) return 'WAIT';
  const deltas = data.slice(-3).map(d => d.close).map((c,i,a) => i>0? (c - a[i-1] >= 0 ? 'UP' : 'DOWN') : null).slice(1);
  for (let pat of patterns) {
    if (JSON.stringify(pat.seq) === JSON.stringify(deltas)) return pat.signal;
  }
  return deltas[1] === 'UP' ? 'UP 📈' : 'DOWN 📉';
}

async function updateBot() {
  const pair = pairEl.value;
  const fx = await fetchFX(pair);
  if (fx.length === 0) { return; }

  const times = fx.map(o => o.time.split(' ')[1]);
  const closes = fx.map(o => o.close);

  if (!chart) {
    chart = new Chart(chartEl, {
      type: 'line',
      data: { labels: times, datasets: [{ label: pair, data: closes, borderColor: '#22c55e', tension: 0.3 }] },
      options: { scales: { y: { beginAtZero: false } }}
    });
  } else {
    chart.data.labels = times;
    chart.data.datasets[0].data = closes;
    chart.update();
  }

  const sig = miniIA(fx);
  const now = new Date().toLocaleTimeString();
  signalEl.textContent = `${sig} – ${now}`;

  const li = document.createElement('li');
  li.textContent = `${now} | ${pair} → ${sig}`;
  li.className = sig.includes('UP') ? 'text-green-400 text-sm' : 'text-red-400 text-sm';
  logEl.prepend(li);
  if (logEl.childNodes.length > 10) logEl.removeChild(logEl.lastChild);
}

pairEl.addEventListener('change', updateBot);
updateBot();
setInterval(updateBot, 60000);
