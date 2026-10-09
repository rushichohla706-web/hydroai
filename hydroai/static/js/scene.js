    const isMobile = innerWidth < 820;
    const canvas = document.getElementById('scene');
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04070f, 0.018);
    const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
    camera.position.set(0, 1.4, 11);
    scene.add(new THREE.AmbientLight(0x404060, 0.8));
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.8); sunLight.position.set(10,8,12); scene.add(sunLight);
    const backLight = new THREE.DirectionalLight(0x4466aa, 0.6); backLight.position.set(-8,-2,-10); scene.add(backLight);
    const fillLight = new THREE.PointLight(0x225588, 0.5, 30); fillLight.position.set(0,-6,0); scene.add(fillLight);
    const world = new THREE.Group(); scene.add(world);
    const globe = new THREE.Group(); world.add(globe);
    const GLOBE_R = 2.4;
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const cloudMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
    const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
    const normalMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({map:earthMap,specularMap:specularMap,specular:new THREE.Color(0x333333),shininess:10,normalMap:normalMap,normalScale:new THREE.Vector2(0.8,0.8),emissive:new THREE.Color(0x000022)});
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R,64,64), earthMaterial));
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R*1.008,64,64), new THREE.MeshPhongMaterial({map:cloudMap,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
    globe.add(cloudMesh);
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R*1.12,64,64), new THREE.MeshPhongMaterial({color:0x88bbff,transparent:true,opacity:0.08,side:THREE.BackSide,depthWrite:false})));
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R*1.005,64,64), new THREE.MeshPhongMaterial({color:0x66aaff,transparent:true,opacity:0.12,side:THREE.FrontSide,blending:THREE.AdditiveBlending,depthWrite:false})));
    function ll2v(lat, lon, r) {
      const phi = (90 - lat) * Math.PI / 180, theta = lon * Math.PI / 180;
      return new THREE.Vector3(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
    }
    const zones = [];
    function addZone(lat, lon, color) {
      const pos = ll2v(lat, lon, GLOBE_R * 1.012);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.12,0.22,48), new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.7,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
      ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2));
      const fill = new THREE.Mesh(new THREE.CircleGeometry(0.12,40), new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.15,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      fill.position.z = 0.002; ring.add(fill); globe.add(ring);
      zones.push({mesh:ring, fill, lat, lon, phase:Math.random()*6.28});
    }
    addZone(28.61,77.20,0xf59e0b); addZone(13.08,80.27,0x22c55e); addZone(-22.90,-43.20,0xef4444);
    const aiCore = new THREE.Group(); aiCore.position.set(3.4,2.1,0); world.add(aiCore);
    aiCore.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42,0), new THREE.MeshBasicMaterial({color:0x22d3ee,wireframe:true,transparent:true,opacity:0.8})));
    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2,20,20), new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending}));
    aiCore.add(coreGlow);
    aiCore.add(new THREE.PointLight(0x22d3ee,1.6,8));
    let dataPts, dataCurveT;
    (function(){
      const n = isMobile ? 40 : 90, pos = new Float32Array(n*3), t = new Float32Array(n);
      for (let i=0;i<n;i++) t[i]=Math.random();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3));
      dataPts = new THREE.Points(g, new THREE.PointsMaterial({color:0x67e8f9,size:0.05,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));
      dataCurveT = t; scene.add(dataPts);
    })();
    let rainPts, rainVel;
    (function(){
      const n = isMobile ? 900 : 2200, pos = new Float32Array(n*3);
      rainVel = new Float32Array(n);
      for (let i=0;i<n;i++){pos[i*3]=(Math.random()-0.5)*34;pos[i*3+1]=Math.random()*22-4;pos[i*3+2]=(Math.random()-0.5)*34;rainVel[i]=0.14+Math.random()*0.16;}
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3));
      rainPts = new THREE.Points(g, new THREE.PointsMaterial({color:0x9fc8e8,size:0.055,transparent:true,opacity:0.55}));
      scene.add(rainPts);
    })();
    function cloudTexture(){
      const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
      const grd=x.createRadialGradient(128,128,20,128,128,128);
      grd.addColorStop(0,'rgba(70,85,110,.85)');grd.addColorStop(0.6,'rgba(40,50,70,.45)');grd.addColorStop(1,'rgba(20,25,40,0)');
      x.fillStyle=grd;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
    }
    const clouds=[];
    (function(){
      const tex=cloudTexture(), n=isMobile?7:12;
      for(let i=0;i<n;i++){
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0.5,depthWrite:false}));
        const sc=6+Math.random()*8; s.scale.set(sc,sc*0.55,1);
        s.position.set((Math.random()-0.5)*36,7+Math.random()*5,(Math.random()-0.5)*24-4);
        s.userData.v=0.004+Math.random()*0.008; scene.add(s); clouds.push(s);
      }
    })();
    (function(){
      const n=1200,pos=new Float32Array(n*3);
      for(let i=0;i<n;i++){const r=60+Math.random()*80,th=Math.random()*6.283,ph=Math.acos(2*Math.random()-1);pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.cos(ph);pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);}
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
      scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:0.15,transparent:true,opacity:0.8,sizeAttenuation:true})));
    })();
    const floodPlane = new THREE.Mesh(new THREE.CircleGeometry(9,64), new THREE.MeshBasicMaterial({color:0x0e7490,transparent:true,opacity:0.14,blending:THREE.AdditiveBlending,depthWrite:false}));
    floodPlane.rotation.x=-Math.PI/2; floodPlane.position.y=-3.4; scene.add(floodPlane);
    let userMarker=null;
    function placeMarker(lat, lon){
      if(userMarker){globe.remove(userMarker);userMarker=null;}
      const g=new THREE.Group(), pos=ll2v(lat,lon,GLOBE_R*1.02);
      const pin=new THREE.Mesh(new THREE.SphereGeometry(0.06,14,14),new THREE.MeshBasicMaterial({color:0xffffff})); pin.position.copy(pos); g.add(pin);
      const ring=new THREE.Mesh(new THREE.RingGeometry(0.08,0.1,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
      ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2)); ring.userData.t=0; g.add(ring); g.userData.ring=ring;
      globe.add(g); userMarker=g;
    }
    let dragging=false,px=0,py=0,vx=0.0016,mouseX=0,mouseY=0;
    addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;});
    addEventListener('pointerup',()=>dragging=false);
    addEventListener('pointermove',e=>{
      mouseX=(e.clientX/innerWidth-0.5)*2; mouseY=(e.clientY/innerHeight-0.5)*2;
      if(dragging){vx=(e.clientX-px)*0.00035;globe.rotation.y+=(e.clientX-px)*0.005;globe.rotation.x+=(e.clientY-py)*0.002;globe.rotation.x=Math.max(-0.6,Math.min(0.6,globe.rotation.x));px=e.clientX;py=e.clientY;}
    });
    const views=[
      {p:new THREE.Vector3(0,1.4,11),t:new THREE.Vector3(0,0,0),l:'🛰 Satellite View'},
      {p:new THREE.Vector3(5.6,2.6,7.2),t:new THREE.Vector3(0,0.6,0),l:'📡 Doppler Radar View'},
      {p:new THREE.Vector3(0,9.5,4.4),t:new THREE.Vector3(0,0,0),l:'🌧 Rainfall Prediction View'},
      {p:new THREE.Vector3(1.6,0.7,5.6),t:new THREE.Vector3(0,-0.4,0),l:'🌊 Flooded-City View'}
    ];
    let scrollT=0;
    function onScroll(){const max=document.documentElement.scrollHeight-innerHeight;scrollT=max>0?window.scrollY/max:0;}
    addEventListener('scroll',onScroll,{passive:true}); onScroll();
    const _p=new THREE.Vector3(),_t=new THREE.Vector3();
    function sampleCam(t,outP,outT){
      const f=t*(views.length-1), i=Math.min(views.length-2,Math.floor(f)), k=f-i, s=k*k*(3-2*k);
      outP.copy(views[i].p).lerp(views[i+1].p,s); outT.copy(views[i].t).lerp(views[i+1].t,s);
      return views[Math.round(f)].l;
    }
    const clock=new THREE.Clock(), flash=document.getElementById('flash');
    let nextBolt=3; const label=document.getElementById('viewLabel'); let curLabel='';
    function animate(){
      requestAnimationFrame(animate);
      const dt=Math.min(clock.getDelta(),0.05), el=clock.elapsedTime;
      if(!dragging) globe.rotation.y+=vx+0.0016;
      vx*=0.95; globe.rotation.x*=0.98; cloudMesh.rotation.y+=0.0008;
      zones.forEach(z=>{const s=1+Math.sin(el*2+z.phase)*0.14;z.mesh.scale.setScalar(s);z.mesh.material.opacity=0.45+Math.sin(el*2+z.phase)*0.25;z.fill.material.opacity=0.10+Math.sin(el*2+z.phase)*0.08;});
      {
        const pos=dataPts.geometry.attributes.position.array, wp=new THREE.Vector3();
        for(let i=0;i<dataCurveT.length;i++){
          dataCurveT[i]+=dt*0.25; if(dataCurveT[i]>1) dataCurveT[i]=0;
          zones[i%zones.length].mesh.getWorldPosition(wp);
          const k=dataCurveT[i], e=k*k*(3-2*k);
          pos[i*3]=wp.x+(aiCore.position.x-wp.x)*e;
          pos[i*3+1]=wp.y+(aiCore.position.y-wp.y)*e+Math.sin(k*9+i)*0.25;
          pos[i*3+2]=wp.z+(aiCore.position.z-wp.z)*e;
        }
        dataPts.geometry.attributes.position.needsUpdate=true;
      }
      {
        const pos=rainPts.geometry.attributes.position.array;
        for(let i=0;i<rainVel.length;i++){
          pos[i*3+1]-=rainVel[i]*22*dt; pos[i*3]-=rainVel[i]*7*dt; pos[i*3+2]+=rainVel[i]*2.5*dt;
          if(pos[i*3+1]<-4){pos[i*3+1]=18;pos[i*3]=(Math.random()-0.5)*34;pos[i*3+2]=(Math.random()-0.5)*34;}
        }
        rainPts.geometry.attributes.position.needsUpdate=true;
      }
      clouds.forEach(c=>{c.position.x+=c.userData.v;if(c.position.x>22)c.position.x=-22;});
      nextBolt-=dt;
      if(nextBolt<=0){
        nextBolt=3+Math.random()*6;
        flash.style.transition='none';flash.style.opacity=0.5;
        setTimeout(()=>{flash.style.transition='opacity .5s';flash.style.opacity=0;},70);
        setTimeout(()=>{flash.style.transition='none';flash.style.opacity=0.3;},160);
        setTimeout(()=>{flash.style.transition='opacity .8s';flash.style.opacity=0;},230);
      }
      aiCore.rotation.y+=dt*0.8; aiCore.rotation.x+=dt*0.3; coreGlow.scale.setScalar(1+Math.sin(el*3)*0.2);
      floodPlane.material.opacity=0.10+Math.sin(el*0.9)*0.05; floodPlane.rotation.z+=dt*0.02;
      if(userMarker){const r=userMarker.userData.ring;r.userData.t+=dt*0.6;if(r.userData.t>1)r.userData.t=0;r.scale.setScalar(0.3+r.userData.t*2);r.material.opacity=0.9*(1-r.userData.t);}
      const lab=sampleCam(scrollT,_p,_t);
      if(lab!==curLabel){curLabel=lab;label.textContent=lab;}
      camera.position.lerp(_p,0.06);
      camera.position.x+=mouseX*0.25*0.06*10*dt*8;
      camera.position.y-=mouseY*0.18*0.06*10*dt*8;
      camera.lookAt(_t);
      renderer.render(scene,camera);
    }
    animate();
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    const tk=document.getElementById('ticker'); tk.innerHTML+=tk.innerHTML;
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(!e.isIntersecting)return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.count').forEach(c=>{
        if(c.dataset.done)return; c.dataset.done=1;
        const to=parseFloat(c.dataset.to),dec=+c.dataset.dec,t0=performance.now();
        (function step(t){const k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,3);c.textContent=(to*e).toFixed(dec);if(k<1)requestAnimationFrame(step);})(t0);
      });
      io.unobserve(e.target);
    }),{threshold:0.15});
    document.querySelectorAll('.card,.dcard,.stage').forEach(el=>io.observe(el));
    const term=document.getElementById('riskTerm');
    function termLog(cls,txt){const s=document.createElement('span');s.className=cls;s.textContent=txt;term.appendChild(s);term.appendChild(document.createTextNode('\n'));while(term.children.length>26)term.removeChild(term.firstChild);}
    const VERDICTS={
      red:{icon:'🔴',cls:'red',title:'RED ALERT — HIGH FLOOD RISK',adv:['Avoid all low-lying areas, underpasses and riverbanks immediately.','Move valuables & documents to upper floors; keep emergency kit ready.','Do NOT drive through flooded roads — 30 cm of water can sweep a car.','Follow official evacuation instructions; keep your phone charged.']},
      amber:{icon:'🟠',cls:'amber',title:'ORANGE ALERT — MEDIUM RISK',adv:['Stay alert: waterlogging likely in drainage-bottleneck pockets.','Avoid parking in basements or low-lying streets.','Keep rain gear handy; monitor official updates.']},
      green:{icon:'🟢',cls:'green',title:'GREEN / WATCH — LOW RISK',adv:['Conditions currently safe — no flooding expected in the next hours.','Still avoid open drains and stay tuned for updates.','Good window to clear rooftop/balcony drains before heavy rain.']}
    };
    async function checkLocation(){
      const q=document.getElementById('locInput').value.trim(), err=document.getElementById('wxErr'), res=document.getElementById('wxResult'), btn=document.getElementById('goBtn');
      err.style.display='none';
      if(!q){err.textContent='Please enter a location first.';err.style.display='block';return;}
      btn.disabled=true;btn.textContent='Fetching…';term.innerHTML='';
      termLog('t-mut',`[HYDROAI] geocoding "${q}" …`);
      try{
        const resp=await fetch(`/api/risk?q=${encodeURIComponent(q)}`);
        const data=await resp.json();
        if(!resp.ok) throw new Error(data.error||'Request failed');
        const g=data.location, c=data.current, mmHr=data.mm_hr, probs=data.probs, maxP=data.max_p, v=data.verdict;
        termLog('t-cyan',`[GEO] ${g.name}, ${g.country} · ${g.latitude.toFixed(2)}, ${g.longitude.toFixed(2)}`);
        const V=VERDICTS[v];
        document.getElementById('wxTemp').textContent=Math.round(c.temperature_2m)+'°C';
        document.getElementById('wxCity').textContent=`${g.name}${g.admin1?', '+g.admin1:''}, ${g.country}`;
        document.getElementById('wxMeta').textContent=`Rain now: ${mmHr.toFixed(1)} mm/hr · Humidity: ${c.relative_humidity_2m}% · Max rain probability (24h): ${maxP}%`;
        const vd=document.getElementById('wxVerdict'); vd.className='risk-verdict '+V.cls; vd.innerHTML=`<span style="font-size:1.3rem">${V.icon}</span> ${V.title}`;
        document.getElementById('wxAdvice').innerHTML=V.adv.map(a=>`<li>${a}</li>`).join('');
        res.style.display='block'; drawChart(probs); placeMarker(g.latitude,g.longitude);
        termLog('t-mut',`[WX] temp ${c.temperature_2m}°C · rain ${mmHr.toFixed(1)} mm/hr · maxP ${maxP}%`);
        termLog(v==='red'?'t-red':v==='amber'?'t-amber':'t-cyan',`[PROTOTYPE RISK ENGINE] verdict → ${V.title}`);
        termLog('t-cyan',`[GLOBE] marker placed @ ${g.name}`);
      }catch(e){
        err.textContent='⚠ '+(e.message||'Could not fetch live weather. Check your internet connection.'); err.style.display='block';
        termLog('t-red','[ERROR] '+(e.message||'network failure'));
      }
      btn.disabled=false;btn.textContent='Check Risk';
    }
    document.getElementById('locInput').addEventListener('keydown',e=>{if(e.key==='Enter')checkLocation();});
    function drawChart(probs){
      const cv=document.getElementById('wxchart'),x=cv.getContext('2d');
      x.clearRect(0,0,cv.width,cv.height);
      const W=cv.width,H=cv.height,P=6;
      x.strokeStyle='rgba(125,211,252,.15)';x.lineWidth=1;
      for(let i=25;i<=75;i+=25){x.beginPath();x.moveTo(0,H-(i/100)*(H-2*P));x.lineTo(W,H-(i/100)*(H-2*P));x.stroke();}
      if(!probs||!probs.length){x.fillStyle='#5b7290';x.font='12px monospace';x.fillText('no hourly data',10,H/2);return;}
      const n=probs.length,step=(W-2*P)/(n-1),grad=x.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'rgba(34,211,238,.35)');grad.addColorStop(1,'rgba(34,211,238,0)');
      x.beginPath();x.moveTo(P,H-P);probs.forEach((p,i)=>x.lineTo(P+i*step,H-P-(p/100)*(H-2*P)));x.lineTo(W-P,H-P);x.closePath();x.fillStyle=grad;x.fill();
      x.beginPath();probs.forEach((p,i)=>{const px=P+i*step,py=H-P-(p/100)*(H-2*P);i?x.lineTo(px,py):x.moveTo(px,py);});
      x.strokeStyle='#22d3ee';x.lineWidth=2;x.stroke();
      x.fillStyle='#8fa3bf';x.font='10px monospace';for(let i=0;i<n;i+=4)x.fillText(i+':00',P+i*step-6,H-1);
    }
  