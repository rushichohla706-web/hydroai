(function(){
const $=id=>document.getElementById(id),CITIES={Ahmedabad:[23.03,72.58],Rajkot:[22.30,70.80],Mumbai:[19.08,72.88],Delhi:[28.61,77.21],Chennai:[13.08,80.27],Kolkata:[22.57,88.36],Guwahati:[26.14,91.74]};
const S={lat:23.03,lon:72.58,name:'Ahmedabad',now:0,prob:[],pr:[],temp:0,hum:0,t:null},H={wx:null,geo:null};
const f=k=>(S.fv&&S.fv[k]!=null)?S.fv[k]:.5; /* terrain/drainage/elevation factors now come from Python (engine.py) */
const html=`
<section id="command" class="cc"><span class="kicker">Live Disaster Command Dashboard</span><h2>AI Disaster Management Control Room</h2>
<div class="chips" id="chips"></div>
<div class="search-row"><input type="text" id="cSearch" placeholder="Search any city (Open-Meteo Geocoding)…"><button class="btn primary" id="cGo">Search</button><button class="btn ghost" id="demoBtn">▶ Demo Mode</button></div>
<div class="wx-err" id="cErr"></div>
<div class="kpis"><div class="kpi glass"><small>Rainfall intensity (now)</small><b id="kRain">0</b> mm/hr</div><div class="kpi glass"><small>Max rain probability (24h)</small><b id="kProb">0</b>%</div><div class="kpi glass"><small>Temperature</small><b id="kTemp">0</b>°C</div><div class="kpi glass"><small>Humidity</small><b id="kHum">0</b>%</div>
<div class="kpi glass"><small>Flood-risk level</small><span class="lvl green" id="kLvl">--</span></div><div class="kpi glass"><small>Warning status</small><b id="kWarn" style="font-size:1rem">Standby</b></div><div class="kpi glass"><small>Last update</small><b id="kTime" style="font-size:1rem">--</b></div><div class="kpi glass"><small>Selected location</small><b id="kLoc" style="font-size:1rem">--</b></div></div>
<div class="grid2"><div class="glass col"><h3>📈 24h Rainfall Forecast <span class="tag real">API</span><span class="tag sim">ML NOWCAST = SIMULATED</span></h3><canvas id="fc" width="600" height="260" style="width:100%;margin-top:12px"></canvas><div id="fcInfo" style="font-size:.8rem;color:var(--mut)"></div></div>
<div class="glass col"><h3>🧮 Prototype Risk Engine <span class="tag sim">NO TRAINED MODEL</span></h3><div class="flow" style="margin-top:8px"><span class="n">Rain</span><span class="n">Prob.</span><span class="n">Terrain</span><span class="n">Drainage</span><span class="n">Elevation</span><span class="a">→</span><span class="n act">Risk Engine</span><span class="a">→</span><span id="rsLvl" class="lvl green">GREEN</span></div>
<div style="display:flex;align-items:center;gap:16px;margin:16px 0"><div class="score" id="rsScore">0</div><div style="color:var(--mut);font-size:.8rem">Flood Risk Score /100<br>&lt;35 GREEN · 35–64 ORANGE · ≥65 RED</div></div><div id="rsF"></div></div></div></section>

<section id="gis" class="cc"><span class="kicker">Interactive GIS · Leaflet + OpenStreetMap</span><h2>Flood Map &amp; Evacuation Route Demo</h2>
<div class="chips" id="layers"></div><div id="cmap"></div>
<p id="evac" style="margin-top:12px;font-size:.85rem;color:#c3d2e8"></p></section>

<section id="sim" class="cc"><span class="kicker">Flood Depth Simulation · Prototype Simulation</span><h2>Adjust Rainfall. Watch the Water Rise.</h2>
<div class="grid2"><div class="glass col"><label style="font-size:.85rem">Rainfall intensity: <b id="sV">0</b> mm/hr</label><input type="range" id="sR" min="0" max="120" value="0"><div id="sL" class="lvl green" style="display:inline-block;margin-top:14px"></div></div>
<div class="glass col"><div class="tank"><div class="b"></div><div class="b"></div><div class="w" id="sW" style="height:0"></div></div><div style="text-align:center;margin-top:8px">Estimated depth <b id="sD" style="font-size:1.4rem;color:var(--cyan)">0</b> cm</div></div></div></section>

<section id="ews" class="cc"><span class="kicker">Early Warning System</span><h2>Alert Generation <span class="tag sim">DEMO</span></h2>
<div class="glass col" style="margin-top:24px"><div id="wBox"></div><button class="btn red" id="wBtn" style="margin-top:14px">Generate Warning</button></div></section>

<section id="flowsec" class="cc"><span class="kicker">Proposed ML Architecture <span class="tag fut">PROPOSED</span></span><h2>How the Nowcasting Pipeline Works</h2><div class="flow" id="pipe"></div></section>

<section id="src" class="cc"><span class="kicker">Transparency</span><h2>Data Sources &amp; System Health</h2>
<div class="grid3"><div class="glass col"><h3>REAL DATA <span class="tag real">LIVE</span></h3><ul><li>Open-Meteo Weather API</li><li>Open-Meteo Geocoding API</li><li>OpenStreetMap data via CARTO basemap tiles</li><li>Three.js / Leaflet (render libs)</li></ul></div>
<div class="glass col"><h3>DEMO / SIMULATED <span class="tag sim">SIM</span></h3><ul><li>Risk factors (terrain, drainage, elevation)</li><li>ML nowcast curve</li><li>Flood zones &amp; depth</li><li>Evacuation routes &amp; shelter</li><li>Warning text (nothing sent)</li></ul></div>
<div class="glass col"><h3>PROPOSED FUTURE <span class="tag fut">NOT CONNECTED</span></h3><ul><li>INSAT satellite data</li><li>Doppler Weather Radar data</li><li>AWS station data</li><li>DEM / elevation data</li></ul></div></div>
<div class="glass col" style="margin-top:20px"><h3>🩺 System Health</h3><div class="hd" id="hd"></div><div id="hmsg" style="margin-top:10px;font-size:.8rem;color:#fcd9a0"></div></div>
<div class="grid2"><div class="glass col"><h3>Current Prototype</h3><ul><li>Open-Meteo live weather &amp; geocoding</li><li>3D visualization</li><li>Prototype risk engine</li><li>Flood simulation</li><li>Interactive map</li></ul></div>
<div class="glass col"><h3>Future Production System</h3><ul><li>IMD radar feeds · INSAT satellite · AWS network</li><li>DEM/elevation datasets</li><li>Trained ConvLSTM + XGBoost/Random Forest</li><li>Hydrological model</li><li>Municipal alert APIs · SMS gateway</li></ul></div></div></section>

<section id="impact" class="cc" style="text-align:center"><span class="kicker">Final Impact</span><h2>From Weather Data to Life-Saving Action</h2>
<div class="flow" style="justify-content:center" id="imp"></div></section>`;
const anchor=document.querySelector(".cta-final");const w=document.createElement('div');w.innerHTML=html;while(w.firstChild)anchor.parentNode.insertBefore(w.firstChild,anchor);
const nl=document.querySelector('.nav-links');if(nl)nl.insertAdjacentHTML('beforeend','<a target="_self" href="#command">Command</a><a target="_self" href="#gis">Map</a><a target="_self" href="#src">Sources</a>');
const count=(el,to,d=0)=>{const a=+el.dataset.v||0;el.dataset.v=to;const t0=performance.now();(function s(t){const k=Math.min(1,(t-t0)/900);el.textContent=(a+(to-a)*k).toFixed(d);k<1&&requestAnimationFrame(s)})(t0)};
const LV=s=>s>=65?['red','RED']:s>=35?['amber','ORANGE']:['green','GREEN'];
$('chips').innerHTML=Object.keys(CITIES).map(c=>`<button class="chip" data-c="${c}">${c}</button>`).join('');
$('chips').onclick=e=>{const c=e.target.dataset.c;if(c)run(...CITIES[c],c)};
function health(){const R=[['Weather API',H.wx],['Geocoding API',H.geo],['3D Engine',typeof THREE!=='undefined'],['Risk Engine',true],['Map Engine',typeof L!=='undefined']];
$('hd').innerHTML=R.map(([n,v])=>`<span class="${v===false?'off':''}">${n}: ${v===null?'STANDBY':v?'ONLINE':'OFFLINE'}</span>`).join('')+`<span>Updated: ${S.t||'--'}</span>`;
$('hmsg').textContent=H.wx===false?'⚠ Weather API unreachable — showing last known/simulated values. Check your connection and retry.':H.geo===false?'⚠ Geocoding unreachable — use the quick-select cities.':''}
async function run(lat,lon,name){S.lat=lat;S.lon=lon;S.name=name;$('cErr').style.display='none';document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c.dataset.c===name));
$('kLoc').textContent='Loading…';
try{const j=await fetch(`/api/weather?lat=${lat}&lon=${lon}`).then(r=>{if(!r.ok)throw 0;return r.json()});
const c=j.current;S.now=c.rain!=null?c.rain:(c.precipitation||0);S.temp=c.temperature_2m;S.hum=c.relative_humidity_2m;S.prob=j.hourly.precipitation_probability.slice(0,24);S.pr=j.hourly.precipitation.slice(0,24);S.risk=j.risk;S.fv=j.risk.fv;H.wx=true;
S.t=new Date().toLocaleTimeString()}catch(e){H.wx=false;S.now=S.now||0;$('cErr').textContent='⚠ Live weather unavailable. Displaying last known values; simulations still work.';$('cErr').style.display='block'}
S.name=name;render();health();if(typeof placeMarker==='function')placeMarker(lat,lon);mapUpdate()}
function calc(){const R=S.risk||{score:0,factors:[],max_prob:0,peak:0};return{F:R.factors,s:R.score,mx:R.max_prob,pk:R.peak}}
function render(){const r=calc(),[c,n]=LV(r.s);S.r=r;count($('kRain'),S.now,1);count($('kProb'),r.mx);count($('kTemp'),S.temp);count($('kHum'),S.hum);
$('kLvl').className='lvl '+c;$('kLvl').textContent=n;$('kWarn').textContent=r.s>=65?'RED ALERT (demo)':r.s>=35?'ORANGE WATCH (demo)':'No active warning';$('kTime').textContent=S.t||'offline';$('kLoc').textContent=S.name;
count($('rsScore'),r.s);$('rsLvl').className='lvl '+c;$('rsLvl').textContent=n;
$('rsF').innerHTML=r.F.map(x=>`<div class="fbar"><span>${x[0]}</span><div><i style="width:${x[1]/x[2]*100}%"></i></div><span>+${x[1].toFixed(0)}</span></div>`).join('');
$('sR').value=Math.min(120,Math.max(S.now,r.pk));sim();chart();warn(false)}
function chart(){const cv=$('fc'),x=cv.getContext('2d'),W=600,H2=260,P=28;x.clearRect(0,0,W,H2);const top=Math.max(80,S.r.pk*1.15),Y=v=>H2-P-v/top*(H2-2*P),n=S.pr.length||24,st=(W-2*P)/(n-1);
x.font='10px monospace';[[35,'#f59e0b'],[75,'#ef4444']].forEach(([v,c])=>{x.strokeStyle=c;x.setLineDash([6,4]);x.beginPath();x.moveTo(P,Y(v));x.lineTo(W-P,Y(v));x.stroke();x.fillStyle=c;x.fillText(v+' mm/hr',W-P-58,Y(v)-4)});x.setLineDash([]);
S.prob.forEach((p,i)=>{x.fillStyle='rgba(34,211,238,.22)';const h=p/100*(H2-2*P);x.fillRect(P+i*st-5,H2-P-h,10,h)});
const line=(a,c,d)=>{x.beginPath();x.setLineDash(d);a.forEach((v,i)=>i?x.lineTo(P+i*st,Y(v)):x.moveTo(P,Y(v)));x.strokeStyle=c;x.lineWidth=2;x.stroke();x.setLineDash([])};
line(S.pr,'#22d3ee',[]);line(S.pr.map((v,i)=>v*(1+.15*Math.sin(i/2))+(i>2?.4:0)),'#a78bfa',[3,3]);
x.fillStyle='#8fa3bf';for(let i=0;i<n;i+=4)x.fillText('+'+i+'h',P+i*st-8,H2-8);x.fillText('mm/hr',2,12);
$('fcInfo').innerHTML=`<span style="color:#22d3ee">━ Precip (API)</span> · <span style="color:#67e8f9">▮ Probability (API)</span> · <span style="color:#a78bfa">┅ Simulated ML nowcast</span><br>Current ${S.now.toFixed(1)} mm/hr · Peak (API, 24h) ${S.r.pk.toFixed(1)} mm/hr`}
function sim(){const r=+$('sR').value,d=Math.max(0,r-8)*.85*(.6+(1-f(2))*.8);$('sV').textContent=r;count($('sD'),d,0);$('sW').style.height=Math.min(100,d/80*100)+'%';
const L2=d<15?['green','LOW']:d<30?['amber','MODERATE']:d<60?['red','HIGH']:['red','CRITICAL'];$('sL').className='lvl '+L2[0];$('sL').textContent=L2[1]+' · PROTOTYPE SIMULATION';$('sW').style.filter=d>=60?'hue-rotate(150deg)':'none'}
$('sR').oninput=sim;
function warn(show){const r=S.r,[c,n]=LV(r.s),i=S.pr.findIndex((v,k)=>v>=35||S.prob[k]>60);
const rec=c==='red'?'Avoid low-lying roads and follow official emergency instructions.':c==='amber'?'Stay alert; avoid underpasses and basements.':'No action needed; continue monitoring.';
$('wBox').innerHTML=`<span class="lvl ${c}">${n} ALERT</span><p style="margin-top:10px"><b>${c==='red'?'Heavy rainfall and possible urban inundation detected.':c==='amber'?'Elevated rainfall and waterlogging possible.':'Conditions currently normal.'}</b></p><ul><li>Affected area: ${S.name} (demo ward zones)</li><li>Expected rainfall: up to ${r.pk.toFixed(1)} mm/hr</li><li>Expected flood risk: ${n} (score ${r.s}/100)</li><li>Estimated warning window: ${i<0?'no threshold breach in 24h':'in ~'+i+' h'}</li><li>Recommended action: ${rec}</li></ul>${show?'<div class="tag sim" style="margin:0">DEMO WARNING GENERATED — NOT SENT TO ANYONE</div>':''}`}
$('wBtn').onclick=()=>{warn(true);$('wBtn').textContent='Warning generated (demo)'};
$('pipe').innerHTML=['Satellite Data','Radar Data','AWS Observations','Data Fusion','ConvLSTM Nowcast','XGBoost / RF','Inundation Prediction','Risk Classification','Alert Generation'].map(t=>`<span class="n">${t}</span>`).join('<span class="a">→</span>');
let pi=0;setInterval(()=>{const N=document.querySelectorAll('#pipe .n');N.forEach((n,k)=>n.classList.toggle('act',k===pi));pi=(pi+1)%N.length},900);
$('imp').innerHTML=['DETECT','PREDICT','MAP','WARN','RESPOND'].map(t=>`<span class="n act" style="font-weight:800">${t}</span>`).join('<span class="a">→</span>');
/* MAP */
let map,G={},lay={Rainfall:1,'Flood Risk':1,Radar:0,'Evacuation Routes':1};
if(typeof L!=='undefined'){map=L.map('cmap').setView([S.lat,S.lon],11);(function(){var cd=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap contributors © CARTO',subdomains:'abcd',maxZoom:19}).addTo(map),sw=false;cd.on('tileerror',function(){if(sw)return;sw=true;map.removeLayer(cd);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map)})})();setTimeout(function(){map.invalidateSize()},300);addEventListener('load',function(){map.invalidateSize()});if('IntersectionObserver' in window)new IntersectionObserver(function(e){e[0].isIntersecting&&map.invalidateSize()}).observe(document.getElementById('cmap'));
map.on('click',e=>run(e.latlng.lat,e.latlng.lng,'Map point '+e.latlng.lat.toFixed(2)+', '+e.latlng.lng.toFixed(2)));
Object.keys(lay).forEach(k=>G[k]=L.layerGroup())}
$('layers').innerHTML=Object.keys(lay).map(k=>`<button class="chip ${lay[k]?'on':''}" data-l="${k}">${k}</button>`).join('');
$('layers').onclick=e=>{const k=e.target.dataset.l;if(!k||!map)return;lay[k]=!lay[k];e.target.classList.toggle('on',lay[k]);lay[k]?G[k].addTo(map):map.removeLayer(G[k])};
const km=(a,b)=>{const R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,h=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
function mapUpdate(){if(!map)return;const p=[S.lat,S.lon];map.setView(p,11);Object.values(G).forEach(g=>g.clearLayers());
L.marker(p).addTo(G['Flood Risk']).bindPopup('Selected: '+S.name);L.marker(p).addTo(G['Rainfall']);
L.circle(p,1500+S.now*300,{color:'#3b82f6',fillOpacity:.25}).addTo(G.Rainfall).bindPopup('Rainfall now '+S.now.toFixed(1)+' mm/hr (API) — radius scaled, illustrative');
[['#ef4444',2000,'RED (simulated)'],['#f59e0b',4000,'ORANGE (simulated)'],['#22c55e',6500,'GREEN (simulated)']].reverse().forEach(z=>L.circle(p,z[1],{color:z[0],fillColor:z[0],fillOpacity:.18,className:z[0]==='#ef4444'?'zpulse':''}).addTo(G['Flood Risk']).bindPopup(z[2]));
L.circle(p,9000,{color:'#22d3ee',dashArray:'4',fillOpacity:.08,className:'radar'}).addTo(G.Radar).bindPopup('Radar layer — animated placeholder, no DWR feed');
const sh=[S.lat+.03,S.lon+.035],s1=[S.lat+.012,S.lon+.004],s2=[S.lat+.02,S.lon+.03],b1=[S.lat-.01,S.lon+.02],E=G['Evacuation Routes'];
L.polyline([p,s1,s2,sh],{color:'#22c55e',weight:5}).addTo(E).bindPopup('Safe route (simulated)');L.polyline([p,b1,sh],{color:'#ef4444',weight:5,dashArray:'8'}).addTo(E).bindPopup('Flooded/blocked (simulated)');
L.marker(b1).addTo(E).bindPopup('⛔ Blocked');L.marker(sh).addTo(E).bindPopup('🏥 Emergency shelter (simulated)');
const d=km(p,s1)+km(s1,s2)+km(s2,sh),sp=S.now>35?15:25;$('evac').innerHTML=`🟢 Safe route: <b>${d.toFixed(1)} km</b> · ~<b>${Math.round(d/sp*60)} min</b> at ${sp} km/h · 🔴 blocked route avoided · 🏥 shelter marker <span class="tag sim">SIMULATED</span>`;
Object.keys(lay).forEach(k=>lay[k]&&G[k].addTo(map));setTimeout(()=>map.invalidateSize(),200)}
/* SEARCH */
async function search(){const q=$('cSearch').value.trim();if(!q)return;try{const g=await fetch('/api/geocode?name='+encodeURIComponent(q)+'&count=1').then(r=>r.json());H.geo=true;if(!g.results)throw 1;run(g.results[0].latitude,g.results[0].longitude,g.results[0].name)}
catch(e){if(H.geo!==true||!e)H.geo=false;$('cErr').textContent='⚠ Location not found or geocoding offline. Try a quick-select city.';$('cErr').style.display='block';health()}}
$('cGo').onclick=search;$('cSearch').onkeydown=e=>e.key==='Enter'&&search();
/* DEMO MODE */
let dt=null;const steps=[['section','The problem: cloudbursts outpace forecasts and warning lead time is short.',()=>{}],['command','Live weather for Mumbai (Open-Meteo) on the command dashboard.',()=>run(...CITIES.Mumbai,'Mumbai')],['command','Prototype Risk Engine: rainfall + probability + terrain, drainage, elevation → score.',()=>{}],['gis','GIS map: risk zones, safe vs blocked route, shelter (simulated).',()=>{}],['sim','Flood simulation: drag the slider — depth and class update.',()=>{$('sR').value=90;sim()}],['flowsec','Proposed AI pipeline: satellite + radar + AWS → ConvLSTM → XGBoost → alert.',()=>{}],['ews','Alert generation (demo, nothing is sent).',()=>$('wBtn').click()],['impact','Solution: Detect → Predict → Map → Warn → Respond.',()=>{}]];
function stop(){clearTimeout(dt);document.body.classList.remove('demo');$('demoBtn').textContent='▶ Demo Mode'}
$('demoBtn').onclick=()=>{if(document.body.classList.contains('demo'))return stop();document.body.classList.add('demo');$('demoBtn').textContent='■ Exit Demo (Esc)';let i=0;(function nx(){if(i>=steps.length)return stop();const s=steps[i++];$('capt').textContent=`Step ${i}/${steps.length} — ${s[1]}`;(s[0]==='section'?document.querySelector('section'):$(s[0])).scrollIntoView({behavior:'smooth'});s[2]();dt=setTimeout(nx,24000)})()};
addEventListener('keydown',e=>e.key==='Escape'&&stop());
run(...CITIES.Ahmedabad,'Ahmedabad');fetch('/api/geocode?name=Delhi&count=1').then(r=>{H.geo=r.ok;health()}).catch(()=>{H.geo=false;health()});health();
})();
