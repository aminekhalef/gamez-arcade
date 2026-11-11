const c=document.getElementById('g'),x=c.getContext('2d'),W=800,H=400,G=330;
c.width=W;c.height=H;
let st='menu',best=0,p,ob,co,pu,fx,gap,sp,dist=0,coins,t=0,inv,nx,shake=0,overT=0,shield=0,turbo=0,lvl=0,alert=0,nextAl=2000,msg='',msgT=0,diff=1;
try{best=+localStorage.getItem('harba:stages')||0}catch(e){}
let actionQueued=false;
let paused=false;
let stageWallet=0;
let jumpBuffer=0;
let coyoteTicks=0;

function releaseControls(){
  p.sl=false;
  HK=U=0;
  actionQueued=false;
  jumpBuffer=0;
}
addEventListener('keydown',event=>{
  const key=event.code;
  if(event.target.closest?.('button,summary')&&['Space','Enter'].includes(key)) return;
  if(['Space','ArrowUp','KeyW'].includes(key)){
    event.preventDefault();
    U=1;
    if(!event.repeat) jump();
  }
  if(['ArrowDown','KeyS'].includes(key)){event.preventDefault();p.sl=true}
  if(['KeyE','KeyH'].includes(key)&&!event.repeat) actionQueued=true;
  if(['Escape','KeyP'].includes(key)&&!event.repeat) togglePause();
});
addEventListener('keyup',event=>{
  if(['ArrowDown','KeyS'].includes(event.code)) p.sl=false;
  if(['Space','ArrowUp','KeyW'].includes(event.code)) U=0;
});
c.addEventListener('pointerdown',event=>{
  event.preventDefault();
  c.focus({preventScroll:true});
  c.setPointerCapture(event.pointerId);
  if(st!=='play'||paused) return;
  const bounds=c.getBoundingClientRect();
  if(event.clientY-bounds.top>bounds.height*.65) p.sl=true;
  else jump();
});
c.addEventListener('pointerup',()=>{p.sl=false});
c.addEventListener('pointercancel',releaseControls);
addEventListener('blur',()=>{
  releaseControls();
  if(st==='play'&&!onlineMode) setPaused(true);
});

let ac;
function snd(f,d=.1){if(!soundEnabled||!ac||ac.state!=='running')return;try{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}
function burst(bx,by,col,n){for(let i=0;i<n;i++)fx.push({x:bx,y:by,vx:(Math.random()-.5)*5,vy:(Math.random()-.8)*4,l:25,c:col})}
function float(s){fx.push({x:170,y:p.y-90,vx:0,vy:-.8,l:70,s:s})}
const L=(sc,w,fn)=>{const off=dist*sc,b=Math.floor(off/w);
  for(let k=-1;k<Math.ceil(W/w)+1;k++){const i=b+k;fn(i,i*w-off)}};
const mod=(a,n)=>((a%n)+n)%n;
function palm(x0){
  x.strokeStyle='#7a5530';x.lineWidth=8;x.beginPath();x.moveTo(x0,G);x.quadraticCurveTo(x0+15,G-80,x0+5,G-150);x.stroke();
  x.strokeStyle='#2f8f4e';x.lineWidth=5;
  for(let a=0;a<7;a++){const ang=Math.PI*(1.05+a*.15),ex=x0+5+Math.cos(ang)*55,ey=G-150+Math.sin(ang)*20+22;
    x.beginPath();x.moveTo(x0+5,G-150);x.quadraticCurveTo(x0+5+Math.cos(ang)*30,G-185,ex,ey);x.stroke()}
}
const mix=(a,b,k)=>a+(b-a)*k;
let lastD=0;
const clouds=[0,1,2,3,4,5].map(i=>({x:i*170,y:30+mod(i*47,80),s:.6+mod(i*31,10)/10}));
function rr(a,b,w,h,r){x.beginPath();x.roundRect?x.roundRect(a,b,w,h,r):x.rect(a,b,w,h)}
function palm2(x0){
  const sw=Math.sin(t*.03+x0)*3,cx=x0+6+sw,cy=G-155;
  x.lineCap='round';x.strokeStyle='#6b4a2b';x.lineWidth=10;x.beginPath();x.moveTo(x0,G);x.quadraticCurveTo(x0+18,G-80,cx,cy);x.stroke();
  x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=2;for(let a=1;a<9;a++){const yy=G-a*17;x.beginPath();x.moveTo(x0+a*1.3-3,yy);x.lineTo(x0+a*1.3+7,yy-3);x.stroke()}
  for(let a=0;a<9;a++){const ang=Math.PI*(1+a*.125)+Math.sin(t*.04+a)*.04,ex=cx+Math.cos(ang)*62,ey=cy+Math.sin(ang)*26+26;
    x.strokeStyle=a%2?'#2d8a4e':'#3fae63';x.lineWidth=5;x.beginPath();x.moveTo(cx,cy);x.quadraticCurveTo(cx+Math.cos(ang)*34,cy-26,ex,ey);x.stroke();
    x.strokeStyle='#1d6a38';x.lineWidth=1.5;x.stroke()}
  x.fillStyle='#8b5a2b';x.beginPath();x.arc(cx-3,cy+5,4,0,7);x.arc(cx+4,cy+7,4,0,7);x.fill();
}
function hero(cx,cy,o){
  const air=cy<(o.gy||G)-2&&!o.sl,ph=o.sl?.8:o.phase??(t*.35+(o.off||0));
  const leg=(off,back)=>{const a=air?(off?-.9:.7):Math.sin(ph+off)*.95,bend=air?(off?1:.3):Math.max(0,Math.cos(ph+off))*.9,hx=cx,hy=cy-26,kx=hx+Math.sin(a)*13,ky=hy+Math.cos(a)*13,ax=kx+Math.sin(a-bend)*13,ay=ky+Math.cos(a-bend)*13;
    x.strokeStyle=back?o.pants2:o.pants;x.lineWidth=7;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(hx,hy);x.lineTo(kx,ky);x.lineTo(ax,ay);x.stroke();
    x.fillStyle=o.shoe;x.beginPath();x.ellipse(ax+3,ay+1,6,3.5,0,0,7);x.fill()};
  const arm=(off,back)=>{const a=-Math.sin(ph+off)*.9,sx=cx,sy=cy-44,ex=sx+Math.sin(a)*10,ey=sy+Math.cos(a)*10,hx=ex+Math.sin(a-1)*9,hy=ey+Math.cos(a-1)*9;
    x.strokeStyle=back?o.shirt2:o.shirt;x.lineWidth=5;x.beginPath();x.moveTo(sx,sy);x.lineTo(ex,ey);x.lineTo(hx,hy);x.stroke();x.fillStyle=o.skin;x.beginPath();x.arc(hx,hy,3,0,7);x.fill()};
  leg(Math.PI,1);arm(0,1);
  const tg=x.createLinearGradient(cx-11,0,cx+11,0);tg.addColorStop(0,o.shirt);tg.addColorStop(1,o.shirt2);x.fillStyle=tg;rr(cx-11,cy-50,22,28,6);x.fill();
  o.deco(cx,cy);leg(0,0);arm(Math.PI,0);
  x.fillStyle=o.skin;x.beginPath();x.arc(cx+1,cy-58,9,0,7);x.fill();
  x.fillStyle='#fff';x.fillRect(cx+4,cy-61,4,3);x.fillStyle='#111';x.fillRect(cx+6,cy-61,2,3);
  if(o.face&&FACE.naturalWidth){const fh=44,fw=fh*FR.r;x.drawImage(FACE,cx+1-fw*FR.fx,cy-58-fh*FR.fy,fw,fh)}else o.head(cx+1,cy-58);
}
const P={shirt:'#f1e8d4',shirt2:'#cfc2a4',pants:'#1f5fa8',pants2:'#16457f',shoe:'#e0b030',skin:'#e0a878',
  deco:(cx,cy)=>{x.fillStyle='#c8102e';x.fillRect(cx-9,cy-51,18,5);x.fillStyle='#1f5fa8';x.fillRect(cx-11,cy-38,22,3)},
  head:(hx,hy)=>{x.fillStyle='#c8102e';rr(hx-8,hy-16,16,11,3);x.fill();x.fillStyle='#8f0b20';x.fillRect(hx-8,hy-8,16,3);
    x.strokeStyle='#111';x.lineWidth=1.5;x.beginPath();x.moveTo(hx+7,hy-12);x.quadraticCurveTo(hx+14,hy-8+Math.sin(t*.4)*3,hx+11,hy-1);x.stroke();
    x.strokeStyle='#2a1a10';x.lineWidth=2;x.beginPath();x.moveTo(hx+3,hy+3);x.lineTo(hx+9,hy+3);x.stroke()}};
const C={shirt:'#2c4a9a',shirt2:'#1b2f5c',pants:'#12203d',pants2:'#0b1630',shoe:'#000',skin:'#c98d5e',off:1.3,
  deco:(cx,cy)=>{x.fillStyle='#111';x.fillRect(cx-11,cy-27,22,3);x.fillStyle='#f4c542';x.beginPath();x.arc(cx+5,cy-42,2.5,0,7);x.fill()},
  head:(hx,hy)=>{x.fillStyle='#12203d';rr(hx-9,hy-15,18,8,3);x.fill();x.fillStyle='#000';x.fillRect(hx-3,hy-8,14,3);x.fillStyle='#f4c542';x.fillRect(hx-1,hy-13,4,3);
    x.fillStyle='#111';x.fillRect(hx+1,hy-3,9,3.5);x.fillStyle='#1a1a1a';x.fillRect(hx+2,hy+3,7,2)}};
function corniche(i,bx){
  x.fillStyle='#82b7c5';
  x.fillRect(bx,225,230,55);
  for(let row=0;row<3;row++){
    x.fillStyle=row%2?'#bce2de':'#5b9dae';
    x.fillRect(bx+mod(i*51+row*77,150),234+row*13,70,2);
  }
  x.fillStyle='#286b70';
  x.fillRect(bx,275,230,5);
  x.fillRect(bx,300,230,4);
  for(let post=0;post<5;post++) x.fillRect(bx+post*46,275,5,43);
  x.fillStyle='#d6ddd0';
  x.fillRect(bx,316,230,14);
}

function promenadePalm(bx){
  palm2(bx);
  x.fillStyle='#a07751';rr(bx-19,G-12,38,12,4);x.fill();
}

function cityGate(i,bx){
  const top=125+mod(i*29,36);
  x.fillStyle='#d0a675';x.fillRect(bx,top,230,G-top);
  x.fillStyle='#f0d1a5';x.fillRect(bx,top-7,230,11);
  x.fillStyle='#a87c53';
  for(let row=top+22;row<G;row+=22) x.fillRect(bx,row,230,1);
  x.fillStyle='#e7c497';x.fillRect(bx+38,top-14,154,G-top+14);
  x.fillStyle='#9b6843';x.beginPath();x.moveTo(bx+63,G);
  x.lineTo(bx+63,top+77);x.arc(bx+115,top+77,52,Math.PI,0);x.lineTo(bx+167,G);x.fill();
  x.fillStyle='#4f4241';x.beginPath();x.moveTo(bx+72,G);
  x.lineTo(bx+72,top+77);x.arc(bx+115,top+77,43,Math.PI,0);x.lineTo(bx+158,G);x.fill();
  x.fillStyle='#977b5c';x.fillRect(bx+18,top+44,13,31);x.fillRect(bx+199,top+44,13,31);
}

function plazaPlanter(bx){
  x.fillStyle='#47754f';x.beginPath();x.arc(bx,G-39,21,0,Math.PI*2);x.fill();
  x.fillStyle='#739759';x.beginPath();x.arc(bx-8,G-47,12,0,Math.PI*2);x.fill();
  x.fillStyle='#a55a3d';rr(bx-15,G-24,30,24,4);x.fill();
  x.fillStyle='#d18560';x.fillRect(bx-18,G-25,36,5);
}

function draw(){
  const stage=LV[lvl],{k,night,street}=stage,lit=k<.55,sunX=620,sunY=night?80:mix(185,100,k);
  x.save();
  if(shake>0)x.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
  let g=x.createLinearGradient(0,0,0,230);
  g.addColorStop(0,'hsl('+(215+(1-k)*55)+',65%,'+(28+k*32)+'%)');
  g.addColorStop(1,'hsl('+(38-(1-k)*18)+',90%,'+(62+k*22)+'%)');
  if(night){g=x.createLinearGradient(0,0,0,230);g.addColorStop(0,'#070b25');g.addColorStop(1,'#2b3270')}
  x.fillStyle=g;x.fillRect(-10,-10,W+20,H+20);
  if(k<.5){x.fillStyle='rgba(255,255,255,'+(.5-k)*1.6+')';for(let a=0;a<30;a++)x.fillRect(mod(a*97,W),mod(a*53,150),1.5,1.5)}
  const sg=x.createRadialGradient(sunX,sunY,5,sunX,sunY,150);sg.addColorStop(0,'rgba(255,240,190,.95)');sg.addColorStop(.25,'rgba(255,200,110,.5)');sg.addColorStop(1,'rgba(255,170,90,0)');
  x.globalAlpha=night?.3:1;x.fillStyle=sg;x.fillRect(sunX-160,sunY-160,320,320);x.globalAlpha=1;if(night){x.fillStyle='#f6f2d8';x.beginPath();x.arc(sunX,sunY,26,0,7);x.fill();x.fillStyle='rgba(180,175,140,.5)';x.beginPath();x.arc(sunX-8,sunY-6,5,0,7);x.arc(sunX+9,sunY+7,4,0,7);x.fill()}else{x.fillStyle='#fff3c4';x.beginPath();x.arc(sunX,sunY,30,0,7);x.fill()}
  for(const c of clouds){const cx=mod(c.x-dist*.04,W+240)-120;x.fillStyle='rgba(255,255,255,'+(night?.07:.22+.35*k)+')';
    for(const d of[[0,0,22],[24,-6,18],[-24,4,16],[46,4,14]]){x.beginPath();x.arc(cx+d[0]*c.s,c.y+d[1],d[2]*c.s,0,7);x.fill()}}
  for(let a=0;a<3;a++){const bx=mod(t*(.8+a*.2)+a*300,W+100)-50,by=60+a*25+Math.sin(t*.05+a)*6,w=Math.sin(t*.2+a)*5;
    x.strokeStyle='#223';x.lineWidth=1.5;x.beginPath();x.moveTo(bx-8,by-w);x.quadraticCurveTo(bx-3,by-4,bx,by);x.quadraticCurveTo(bx+3,by-4,bx+8,by-w);x.stroke()}
  const sea=x.createLinearGradient(0,185,0,235);sea.addColorStop(0,'hsl(200,60%,'+(48+k*10)+'%)');sea.addColorStop(1,'hsl(208,65%,'+(26+k*10)+'%)');
  x.fillStyle=sea;x.fillRect(0,185,W,50);
  x.fillStyle='rgba(255,240,200,.45)';for(let a=0;a<12;a++)x.fillRect(sunX-34+a*2+Math.sin(t*.05+a)*18-a*1.5,187+a*4,60-a*3.5,1.8);
  if(stage.buildings!==corniche) L(.12,140,night?skyline:(i,bx)=>{x.fillStyle='hsla(205,35%,'+(60+k*18)+'%,.85)';x.fillRect(bx,165+mod(i*37,22),110,80);x.beginPath();x.arc(bx+55,165+mod(i*37,22),18,Math.PI,0);x.fill()});
  L(.45,230,stage.buildings||((i,bx)=>{
    const r=mod(i,7),top=110+r*9;
    const wg=x.createLinearGradient(bx,0,bx+200,0);wg.addColorStop(0,'#fffdf6');wg.addColorStop(1,'#e4dccb');x.fillStyle=wg;x.fillRect(bx,top,200,G-top);
    x.fillStyle='#cfc6b2';x.fillRect(bx+200,top+8,10,G-top-8);
    x.fillStyle='#f2ecdc';x.fillRect(bx-4,top-6,208,8);x.fillStyle='rgba(0,0,0,.12)';x.fillRect(bx-4,top+2,208,3);
    if(r%3===0){const dg=x.createRadialGradient(bx+90,top-20,4,bx+100,top-6,36);dg.addColorStop(0,'#5fa3e0');dg.addColorStop(1,'#1a4f8f');x.fillStyle=dg;x.beginPath();x.arc(bx+100,top-6,34,Math.PI,0);x.fill();x.fillStyle='#d9a93a';x.fillRect(bx+99,top-52,2,16);x.beginPath();x.arc(bx+100,top-54,3,0,7);x.fill()}
    const dg2=x.createLinearGradient(bx+28,0,bx+72,0);dg2.addColorStop(0,'#2a73c4');dg2.addColorStop(1,'#16508f');x.fillStyle=dg2;
    x.beginPath();x.moveTo(bx+28,G);x.lineTo(bx+28,G-62);x.arc(bx+50,G-62,22,Math.PI,0);x.lineTo(bx+72,G);x.fill();
    x.fillStyle='#e9c46a';for(let a=0;a<5;a++)for(let b=0;b<4;b++){x.beginPath();x.arc(bx+36+b*10,G-14-a*11,1.6,0,7);x.fill()}
    x.strokeStyle='#e7dfc9';x.lineWidth=4;x.beginPath();x.moveTo(bx+24,G);x.lineTo(bx+24,G-62);x.arc(bx+50,G-62,26,Math.PI,0);x.lineTo(bx+76,G);x.stroke();
    for(let w=0;w<2;w++){const wx=bx+106+w*38,wy=top+28;
      x.fillStyle=lit?'#ffcf5a':'#26344f';x.fillRect(wx,wy,22,36);
      x.strokeStyle='#8b5a2b';x.lineWidth=1;for(let a=1;a<4;a++){x.beginPath();x.moveTo(wx,wy+a*9);x.lineTo(wx+22,wy+a*9);x.stroke()}x.beginPath();x.moveTo(wx+11,wy);x.lineTo(wx+11,wy+36);x.stroke();
      x.fillStyle='#1f5fa8';x.fillRect(wx-7,wy,6,36);x.fillRect(wx+23,wy,6,36)}
    if(r%2===1){x.strokeStyle='#222';x.lineWidth=2;x.strokeRect(bx+100,top+78,72,12);for(let a=0;a<8;a++){x.beginPath();x.moveTo(bx+104+a*9,top+78);x.lineTo(bx+104+a*9,top+90);x.stroke()}}
    if(r%3===1){x.strokeStyle='#333';x.lineWidth=1.5;x.beginPath();x.moveTo(bx+85,top+60);x.lineTo(bx+85,top+72);x.stroke();x.fillStyle=lit?'#ffd36b':'#b58a3a';x.fillRect(bx+81,top+72,8,12);
      if(lit){const lg=x.createRadialGradient(bx+85,top+78,1,bx+85,top+78,26);lg.addColorStop(0,'rgba(255,210,100,.6)');lg.addColorStop(1,'rgba(255,210,100,0)');x.fillStyle=lg;x.fillRect(bx+55,top+50,60,60)}}
    if(r%2===0){for(let a=0;a<14;a++){x.fillStyle=a%3?'#d6336c':'#a61e4d';x.beginPath();x.arc(bx+150+mod(a*13,50),G-130+mod(a*29,60),7+mod(a,3)*2,0,7);x.fill()}
      x.fillStyle='#3b8f4a';for(let a=0;a<6;a++){x.beginPath();x.arc(bx+152+a*8,G-120+mod(a*17,40),4,0,7);x.fill()}}
  }));
  L(.8,620,(i,bx)=>(stage.foreground||palm2)(bx+200,i));
  x.fillStyle='rgba(40,25,100,'+(1-k)*.28+')';x.fillRect(0,0,W,G);
  const gg=x.createLinearGradient(0,G,0,H);gg.addColorStop(0,street[0]);gg.addColorStop(1,street[1]);x.fillStyle=gg;x.fillRect(0,G,W,H-G);
  L(1,46,(i,bx)=>{for(let r=0;r<3;r++){x.fillStyle=street[2+mod(i+r,2)];rr(bx+(r%2)*23,G+14+r*18,40,14,5);x.fill()}});
  L(1,40,(i,bx)=>{x.fillStyle=street[4+mod(i,2)];x.fillRect(bx,G,40,8)});
  x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,G+8,W,3);
  if(night){x.fillStyle='rgba(8,12,45,.4)';x.fillRect(0,G,W,H-G)}
  for(const o of ob){x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(o.x+o.w/2,G+4,o.w/2+4,4,0,0,7);if(o.k!=='wash')x.fill()}
  for(const q of co){const sc=Math.abs(Math.cos(t*.1+q.x*.01)),cg=x.createRadialGradient(q.x,q.y,1,q.x,q.y,18);cg.addColorStop(0,'rgba(255,225,120,.6)');cg.addColorStop(1,'rgba(255,225,120,0)');
    x.fillStyle=cg;x.fillRect(q.x-18,q.y-18,36,36);x.fillStyle='#f4c542';x.beginPath();x.ellipse(q.x,q.y,9*sc+1,9,0,0,7);x.fill();x.strokeStyle='#b8860b';x.lineWidth=2;x.stroke();
    x.fillStyle='#fff6c8';x.beginPath();x.ellipse(q.x,q.y,4*sc+.5,4,0,0,7);x.fill()}
  for(const o of ob){
    if(o.k==='cart'||o.k==='stall'||o.k==='walker'){propDraw(o)}else if(o.k==='crate'||o.k==='wall'){const cg=x.createLinearGradient(0,o.y,0,o.y+o.h);cg.addColorStop(0,'#c98d4a');cg.addColorStop(1,'#8f5a26');x.fillStyle=cg;rr(o.x,o.y,o.w,o.h,3);x.fill();
      x.strokeStyle='#5e3a14';x.lineWidth=2;for(let a=1;a<3;a++){x.beginPath();x.moveTo(o.x,o.y+a*14);x.lineTo(o.x+o.w,o.y+a*14);x.stroke()}x.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2);
      x.fillStyle='#e9d9b0';x.fillRect(o.x+8,o.y+10,26,14);x.fillStyle='#c8102e';x.font='700 7px system-ui';x.textAlign='center';x.fillText('HARISSA',o.x+21,o.y+20);
      x.fillStyle='#3a2410';[[3,3],[o.w-5,3],[3,o.h-5],[o.w-5,o.h-5]].forEach(a=>x.fillRect(o.x+a[0],o.y+a[1],2,2));
    }else if(o.k==='bench'){
      x.fillStyle='#315a5b';x.fillRect(o.x+6,o.y+12,6,o.h-12);x.fillRect(o.x+o.w-12,o.y+12,6,o.h-12);
      x.fillStyle='#a86f47';rr(o.x,o.y,o.w,17,4);x.fill();rr(o.x,o.y+22,o.w,6,3);x.fill();
    }else if(o.k==='bollard'){
      x.fillStyle='#8c6e57';rr(o.x+4,o.y+3,o.w-8,o.h-3,5);x.fill();
      x.fillStyle='#c3a183';rr(o.x,o.y,o.w,11,5);x.fill();x.fillRect(o.x+4,o.y+18,o.w-8,4);
    }else if(o.k==='vespa'){
      for(const wx of[12,52]){x.fillStyle='#161616';x.beginPath();x.arc(o.x+wx,G-9,9,0,7);x.fill();x.fillStyle='#bbb';x.beginPath();x.arc(o.x+wx,G-9,4,0,7);x.fill()}
      const vg=x.createLinearGradient(0,o.y,0,o.y+30);vg.addColorStop(0,'#5fd0c4');vg.addColorStop(1,'#2a8f86');x.fillStyle=vg;rr(o.x+12,o.y+12,38,18,7);x.fill();rr(o.x+44,o.y+2,8,26,3);x.fill();
      x.fillStyle='#2b2b2b';rr(o.x+14,o.y+6,22,7,3);x.fill();x.fillRect(o.x+40,o.y-2,16,3);x.fillStyle='#fff3b0';x.beginPath();x.arc(o.x+53,o.y+8,3,0,7);x.fill();
    }else if(o.k==='cat'){
      x.fillStyle='#e58a2e';x.beginPath();x.ellipse(o.x+12,o.y+13,12,7,0,0,7);x.arc(o.x+24,o.y+8,6,0,7);x.fill();
      x.beginPath();x.moveTo(o.x+19,o.y+4);x.lineTo(o.x+21,o.y-3);x.lineTo(o.x+24,o.y+3);x.moveTo(o.x+25,o.y+3);x.lineTo(o.x+28,o.y-3);x.lineTo(o.x+29,o.y+4);x.fill();
      x.strokeStyle='#b8601a';x.lineWidth=2;for(let a=0;a<3;a++){x.beginPath();x.moveTo(o.x+5+a*6,o.y+7);x.lineTo(o.x+6+a*6,o.y+13);x.stroke()}
      x.strokeStyle='#e58a2e';x.lineWidth=3;x.beginPath();x.moveTo(o.x+1,o.y+12);x.quadraticCurveTo(o.x-8,o.y,o.x-2+Math.sin(t*.2)*3,o.y-6);x.stroke();
      x.fillStyle='#7be07b';x.fillRect(o.x+25,o.y+6,3,3);
    }else{
      x.strokeStyle='#555';x.lineWidth=2;x.beginPath();x.moveTo(o.x,o.y-4);x.quadraticCurveTo(o.x+o.w/2,o.y+6,o.x+o.w,o.y-4);x.stroke();
      ['#fff','#c8102e','#1f5fa8','#f4c542','#fff'].forEach((col,i)=>{const xx=o.x+4+i*17,hh=34+mod(i*13,14),sw=Math.sin(t*.06+i)*3;
        x.fillStyle=col;x.beginPath();x.moveTo(xx,o.y);x.lineTo(xx+14,o.y);x.lineTo(xx+14+sw,o.y+hh);x.lineTo(xx+sw,o.y+hh);x.fill();
        x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=1;x.stroke();x.fillStyle='#8b5a2b';x.fillRect(xx+5,o.y-3,4,6)});
    }
  }
  const px=policeX();
  x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(px,G+4,18,5,0,0,7);x.fill();
  x.save();
  x.translate(px,G);
  if(stumble) x.rotate(.27*stumble/46);
  x.translate(-px,-G);
  hero(px,G,{...C,phase:officerStride});
  x.restore();
  const sl=p.sl&&p.y>=p.gy-1;
  x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(174,G+4,Math.max(8,20-(G-p.y)/10),5,0,0,7);x.fill();
  if(st==='play'&&p.y>=G&&t%4===0&&lastD!==t){lastD=t;fx.push({x:155,y:G+2,vx:-sp*.5,vy:-.4,l:20,c:'rgba(205,175,125,.7)',r:3})}
  if(!(inv>0&&!turbo&&t%6<3)){if(sl){x.save();x.translate(212,p.gy-8);x.rotate(-1.35);hero(0,0,{...P,sl:1,face:1});x.restore()}else hero(174,p.y,{...P,gy:p.gy,face:1})}
  if(shield){x.strokeStyle='rgba(244,197,66,.9)';x.lineWidth=3;x.beginPath();x.arc(174,p.y-30,40,0,7);x.stroke();x.fillStyle='rgba(244,197,66,.12)';x.fill()}
  if(turbo){x.fillStyle='rgba(224,32,58,.12)';x.fillRect(0,0,W,H);x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2;for(let a=0;a<8;a++){const ly=40+a*40,lx=mod(-t*30+a*131,W+200)-100;x.beginPath();x.moveTo(lx,ly);x.lineTo(lx+80,ly);x.stroke()}}
  for(const f of fx){if(f.s){x.globalAlpha=Math.min(1,f.l/30);x.fillStyle='#12315a';x.font='800 20px system-ui,sans-serif';x.textAlign='center';x.fillText(f.s,f.x,f.y);x.globalAlpha=1}
    else{x.globalAlpha=Math.max(0,f.l/25);x.fillStyle=f.c;x.beginPath();x.arc(f.x,f.y,f.r||2.5,0,7);x.fill();x.globalAlpha=1}}
  x.restore();
  const vg2=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);vg2.addColorStop(0,'rgba(0,0,0,0)');vg2.addColorStop(1,'rgba(0,0,30,.35)');x.fillStyle=vg2;x.fillRect(0,0,W,H);
}
let last=performance.now(),acc=0;
function loop(n){acc+=Math.min(n-last,100);last=n;while(acc>=16.67){step();acc-=16.67}draw();requestAnimationFrame(loop)}
const LV=[
  {n:'Sidi Bou Said',goal:200,k:1,spd:5.5,sprintInterval:1,ambience:0,
    street:['#e3c99d','#a8844f','#caa972','#d8ba87','#1f5fa8','#f4f1e8']},
  {n:'The Souk',goal:400,k:.5,spd:6.2,sprintInterval:.93,ambience:1,buildings:soukB,foreground:pillar,
    street:['#cf9a62','#7a4a28','#b88050','#c99160','#8b3a2b','#e7c27d']},
  {n:'Tunis by Night',goal:600,k:.1,spd:6.9,sprintInterval:.85,ambience:2,night:true,buildings:nightB,foreground:lamp,
    street:['#5d6285','#262b45','#4a4f72','#555b80','#3a4580','#8fa0d8']},
  {n:'La Marsa Corniche',goal:450,k:.8,spd:7.3,sprintInterval:.82,ambience:0,buildings:corniche,foreground:promenadePalm,
    obstacle:{k:'bench',w:62,h:38},street:['#dbcda8','#a99b7b','#b5aa89','#d2c5a1','#287b79','#eaf1df']},
  {n:'Bab Bhar',goal:550,k:.65,spd:7.7,sprintInterval:.78,ambience:2,buildings:cityGate,foreground:plazaPlanter,
    obstacle:{k:'bollard',w:30,h:53},street:['#dfbd8c','#92714c','#b18c61','#c9a77d','#985334','#ead6b8']},
];
const FACE=new Image();FACE.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKoAAADmCAYAAABF7B6VAAAgAElEQVR42my9aayu2XUmtPZ+h284052r6t5yuQan7MRjHDtxnLidoSEdmkYoAXr4gYQQIqiFxI8maqkREvCDH/xtof4BCHVaQBC0GiTUQu5OQwOZSNyxHbftVMquue58z/RN77A3a3jWfr/jUNbxvfec73zD+669hmc961kh/vyvE0WiEALx/1Mm+VP+y/oV+If6I/mn/CVnyvqHPdIfvf+fPEy+n/h30tgTyVfVUFXVFLI9tz6VvF5O+veo387lteX55Z/yWiM/JlKOs9yfHKXV6zfo/Gc/stz9VO5W9z748MHfPr+4/B9W61Xebjtq53Nazmc0jiPFKtJqvaG6qWm72VLf9RRjpNmspcjPe9g0dL5eU2wiLWYN7XaDvjo/JvC/Iz9+eVDXJz/xiZfjX/+3/nU64Mfz1Zj1m82L42pTj08vKe52NKx2lHdDaPvhef6s93bbLsQcxybl74/D8CG/9wdViM/Vx0cvhKODV7uUqrzpqA6RRn5f/PPnh7OLezRrv74bx/85rTbvhb7vxpgHef/H1w7C4Ut3m/q528v6YHHUHB/fqq+fHIWj5fvNzZtnqaovqYrdwB+ar2Ue5d5UFa6k3IxIka/hmJLexsj/5otj94ofm9KoNywG/A4/lu8c35dY7rn8O41239QYsjxt1K809PYY/rs8d8bP7XlIn0e+krx+Gmjodvp6TTvjh/HP+Pvf/No/pG9843eouX1Cn3j94/SJT/85Npk5VW3DDw1UiyEEGIQaXrAXcVNVo6HgH1kftG+c9qaC3ngzTnu8/oa8+RDKk7lx+xP4B7HH4ZgEeY40HZic6/mwvrfc3P/59vy9v0jrpz+5rujOh0eHs2EYdpvt9uTps1O92HM20s1mw3dqoL4faLHkD8oXTwxULtKMDVgeJ+9VbtqmZ8NuW9r2fdjQ0FQpnRxV8flXDhafey6HF1++fvKZF+v2R07OxubZ3/n79IQPQhrY/vrh1oz41Nn9pBU/54Kfh42rravYdsMQRjGBcdjwG1hRXZ12Q3+9rqoDfuk5vwE1iVldU8fvrZm1fK/GGOv6l+u2+ct8UL5zudu9w8/w7vlum9eXq1n1weOPU0X3Yh3vLmbttVhVyzhrHjUHBw9zU78ze+7WG/Hw4N3Z4cFb8cb1YX7jOlUnJ8+qo4Mn/B4u2Xg7Ns4hVLVebvNDSR2UXGk52KFyxzHd4YB7nJMbaSg/kO+P/Y6vSWfGSA2ZIUT9o9zCH3J+VcOOgg+SOA13RjfvPU9fmH2VXv3U52hzecZXt+Hv66nT91mHYkyB3KkFc5+Th+VnCu5F8SFCOWlBX0gMNMKdygdI5THy4e33Q/mMMPw4PYf8Vi2nOo808DPx71ftuL7XXLz7y/PL9/9qunj042y+h/PZPF47OWJPuaaL8/Nqu9vdnrN5LJYHw+Vqqx9+ebBUD1qx11ivL/XCtewN2Unpz8WIezamOGsPbzT0yuuHB699NFZf+MR8+ZPPN81HjsZ8b5bDLKdUp90YhvUFrfht7oaRGr7A/Lt0yc/Zj2KgM+r4ederNfV8yDlm0MCHoLNr2PDnOuZr/ELDdi2RgdgY2Jj1AK2HS4061WpFCzZa/t5iO/SfZoP+VDeOqWfr3Q2DeMjAH7GetU1ompp9CTvQmo2hrm6H/OjHqoqv2nffHGKmro1xlWLI7IdytZifNidHj2ZHB2+G29ffXb74wpvtrZtvHd69+4iN+QN+IxcpqWXmyNdK7ge/M42idgcncxXPSXmKdnrHMgxGox8/TQX78BCsodesaGRPKgYX4V0D7Eo99bCjZ6cP6OjkBtXtgk7uHFFu2Q+MfB0/eMwRa0t1hGGFENyRXgnz+76V9h6jbyWUKHDl90MxRfxuoPLvckLxo0jm0SOMXb43T9uTu+nZL/YffOvfuzx9+FNjVR2Ow8hR84CuX7tGFxfn9OjxIw7hM37/9JXFYv5f9WP6cMcGOJ/N9H1L5Ntut/qcDRvHbrfVC6TBauiPX23bz39ucfCv/PjB0b98O8RbbT8ehIHq1Pf6ubYDX0D+TJI+nLPXk0/U84VucGAr8fpsZbvthr0RP5ZfkP0t/95IG/bos1BTwzd3y2nPIXuHfuxIfU6q1HvtsqRDFvbkWqzZM4mX7/igcpoQdmmsBsqVXHP24hwuI79WRzN+HYkONd9I8TgVf/HjAnuohr/Pzrk+kOdbsOFxevF8c776BPvQn523zXhWf6vjg3oRmvqsfeUj37j22sv/dPH87bcPX3rx+/Hk+H0OSZcpyLngq4aULNgdwp1MiLoREZP/HWs+MFEjsRq7PEqMUtOGSr+v6Z/ek0a/78+WORIlvlbb1QWnX43a15Ydy/LmLbWnyL9z+d136MNvvsG/9gu/bn5TPpg8eQncFoKnvPP/Lxt1F2xGHfaNGMYuOUnmN6r5jOSodDWtqNSL8ocM/KHHrrk2nr92a/Puv3v+4Zt/7XK9ul3NFmG32dG1k2P1Qh2HmdPTU80zBzaq46PD023X/a3L9fa/4UO3nXOuKQYkb+CSvdwgoV68wTi2z81mL392sfzylxZHf+HFEL/aDuMt/si1JHa7Xa+GpBdWjJKNKWv+ltVgS6LDz7XqOGXQvI/UcDb8GwMbkxhgrdfQDl/PRrfgMMc+UD2s5I7zaIbGyYj+W5560APAn43fq1wn+fuKvbRcSfHCevDlvXjaJYe5bdSE5D3vxkF/oN6Zjb/nH7BXJjYDutbwwW0rPTSLqlL7aeTysBfm+9u1s3ZXzZqHx/fufmv5+it/tHj95W9e+/jrvz/U9QO2iTEi2qaQyz3+4bQu7P+f5Kj8foLYjtz/CKNOdj3dA+8bSs856+r0CSV2CN2QaXF8QsvDI9q995Ae/k+/TU/efsBP9Qt/Q0+lJtdi7fJm8CaG4lHN6H44c/HswwJ3LgVU+TDq3gdLtvm5Kz41WiTtndFon4KOaHN0/eLdv3LYPfq1xx++/clN188Oj481pLYcFueLOYfxjYaQFYfKpq5owTkpO5/c9+O7Y8r/SV1Xf3/ougv2TElOah76epnzDU7ofuwzy6Ov/tTs4C/dCfR6S7RkA4zikcRLynEc2CtmNjZ5bw3fbDG8wH92/VBOFj+jGiUnmRrCtmxMJy2/L35PcpDFAOUCiLGKZ1xIniUGz592w/+u1YOawcrrVuIdxchHC4lJvZH8nQ00WTFZw2FwONfXb3GPYozw8pyO8PWx4pMPPl8XLqpoxp5uiFYsBfZ4YqhyqCS/quT1+WdtNKM+5sMd+YLM6mqcHy4uZvfu/sH1z376f7322U/+k3Dz+lu5bTbsRdOU7uWSDohX1fcs9iPXqNtQvzmjbrcyz19zPsrvRa5BzWlSzddLPKs6Rvmf1BPdVq8b1xzULg9pd7mmyzfeo9nTFZ394Q/o9OEz8aj/IRLfaB4VhpqREvxwXR/2S3v1hAjm+YdOFgyS1L33+sZiVXvQpynNZi+TNs+9cPnWvz/vHv3bjx5+8Bwn6Pzwxm4eX/TrXBh8eP8+554H9OTJY8lXtAhasvFKpT/ycZ/Nmgf84N/iQuZ3u+36yU1OSz8bZx/9VLP42RcXy0+2Y7oZhqGV55RwvhkMAdCclS/Qlr+0vhSnIBctmcdr+X1v2RAXfMHlQoqHGLWClhBdmdHwc8rvinGKQYqHXIqRcvqwk2OAx+hB5v+T79UU94pPOwTyb3vdVKKYPMrz/xouQZ5D/OlIdv0HSm465tFjUOO2nDkWFEYeW7Ghzvjp1xzB5mzUnPPq73IRx29TDldFh23D7iVs5teuff/o1Y/+3s3Pfeq32Gj/n3x0+AE/SU+OHIgXF28uB5SfpVufcXpypkZb8fVSZ6GIQkXLoxtaxYdYwwLMbqQYs4hb64Ft5wccigb6xt/+H+n4bOBrnmi92/HPf/HXzTjZiNRr7uecgC1+OMqHKxmnG7B7YvMM9jxZP4R6VCkW+ETnfddPUgLvljcvfvAf3EhP/+b9D985GruNepPnn7tL7733Lr38ysv05ptv0s3bt+npkyfUcd4phdExe9uOQ4Zco5rDm4a8zSpxdd3fYCf76T7HL9XL5rid8T1oguSeMwm7bPhyozv+xTmnD71U8pp9cS7LP+/k4kqYxWdpURN0nKMMfAH5uLExDnqQJfTPSSEE9UySZqhB83OtR8tr5TGHfOjk3zU/fz+aWXEeqgYrj5G/i3HK6274OVq+sRFOYMvmKJlfJZeSf6/HV4u7IMYracSCc2Lxru7NJX0Y2GAbhO6RDTMKOlPZc8lnqnAwU1RkSd+nFjxNJUiEXmf2xOwG8kW8c/OP7/3iV/7ezS9+7n+rb964H6qqz2ovfLA4sgw9e1L2os1swUZ/YJW/h32Yphiu1kQlqpqxCwaiTgzpAr9V+u5/9w9p84ff57R5QWMtNegrP20GF4GZGdBpXnbCIaxCx8Xxyk7ySvuTtE40bHQyXP9TQoBjaSWX1YJkrJ7fffivzdfv/63V+ZNbp08e8sVp6fjkOp2endLNWzfp4cNHVHOBtN2sacOVPhe/bGBzNs6Gzi8u6eDgUPHZzWZlTojD/Z1+aH+yWjZHUmLwnZGcVfJHMRK5mS0bUychWTweG5DY5E5y2WxeR362lUOKQyUpkHhc9UpRckIOrVofy4EM6rkuUEC0OeolrFIAzCbPPdCajWmXR9TU4n2TGnufLHSKccnfxeDFU3bi0+T94Eu9OK6tGS2pwQ7kBWnWPFKMQIwcwB9Xh2KUBi+pR+ZDJTesH3EwxkG9s8BA8hm7UT4vv2fOw6XqZqcR+PPOh8v1S+ff/t5XV1//5lfy06d3ljdOHvPFlzRr7PutXqfZ8oSN9FC9o6WK0RwXwm107Bbf1+JWvW9TcFb31qffepOqdUeB05KnH9xnQ331Z+2XYixeTkNEgFfNbph0NR9Fzhry5F2njDWUosxw1qTPX4UJC+DUkg7z5vrtzTv/8bg7//zTxw/Cgk/PfHFAPXs/KZwk31oJIC5VOP8pMNc1TrSj5pBJn/2Q0wGp6PUw8Js92u7oC+xvXmDvsGRPK3mYXPCgeV/iarzSm6PhNJHmc/J2t4LVZfu8kj+OCB81e6qdFgLwXvx4hf35sWI4YrTrPOrnmksqoIbZs7cc9TkGslBeJbsyFa5QhUPrr6dhm29ay88rxU6F0C7f35C9/1bR16x5q1wfTQvI0jTHtOUmd8HSA78XkgfLe+714GRNbeSdppQLvi1vvCbLs6NcL4oadeQxipfy73JKM9ut1i91b7//Mx/+9v/785sP799d3L72YX14eFbPD8YgHrmARtFsRFJKLRqjni4t0GGganNuoIgo+l8/0jtf+10an620YXP/wSP+vK/+jOUb2T5WxJPvY55xr7qbeleTx3STDOV/1jgwY86a+1QhIq/JaqQNjfF2d//PVxfv/tp6dXkoQP3h0bEWYzsO79evndDjJ081hxLDFdBeOkwSjkY++ZqoN42GnjX/rqAAab2il9iAX4st3WSvOZPwh3BiuTfp9+R6iIG6V5P/NNyiuNJrpb9nj9uKt0OnRhIFMdLIh+ii7/W5k1fzEjZR5CQpNPj3xfOWyh3XakWSy1r+2klkCRaixXOKgxjgKT00yztcBHv+lipLrfS+RDWuBveol3AuRat8H7mq5qnRvFoCDh6zVecSXUbvMqk/sXRDDqNAbi1b+44/Y9BC0vLpNV/7XUo135Pn0ocPv3j59W9/Ja3X145evPcwz2en7EWyQZVxLzXMpcETAE7qdfIDJo5BkIK9hz/+5hvUv/+M1mcrenJ6xob62s/qB7NoHssJiEDQzHD9i/SiemLuP9O/x2AXNsKw97ofkkiKF5TnlsssIXOeu7sHT7/3n80b+vSHH94P169fU4io5lxWO0cSltiLHh0e0OXZud6UJVeEoxRBQBCk2r1cXbLR8EnmC3jABvsSv+u79YwOUejoqU1J31udLQyL9/TPYW/RDl+nXtmMU28qvi+G3Uqyz78rhrLNYzm4NUKNFjjBquBcmZcQLyoQ0YCfa56GKNUiBchayVfm4bUwsgg2UNpra2f1oDt454TcTA0aHSIN6zB2q9KSGrCiGNnyUmmASPohBZakFhV5yzNp5DH43bytv1d5C5ImSP4teG4txrvr9Npsur4edt0LF2/84MuPvv2dLyxvXX+yvHP7Xf6lPuz3LtEQQHu6ROng+ap8SWSTx6BGyuxV129xKric0WrYiaH+uWJwfvWnggk9eG+kZk9Zw5U+f4bHUNAeVSqABAtvwDLFmGd86zjkVvPu2a8cbD/4dx4/fjwX41suFrTlCyC56K2bN+nZs1PtMAkUtebcdLk8UCOWf4v3zOqh+WJxqG/mMy5jV3SDL+hH+KafsFEd8J+14q5m2CNwvIwKPEs+KN6YT/I81hZ+EYYECqrUexrXIVe4gRKWg3WVGnRd6iqUpsUYLb8SFKFPaS8cW696J8C+HlR7PsciJU2I6plJ0wnx3jN5FLytdvqS5Z0D7kOlRasdjhHGpTkwUImY7T6NAfl3tB58I64C93cpxZ0WXpXmyGQdYTHfgkJUGhWCpk/ymaUYlc+75cJSo9UgRpyaeLF66eE3vv3l0O1uHL343Lt8k55p2wBeVCNKiAXwF1soDSC0Z9WpSB7LRffy+VtapJ198JDGNRtq/drP6MVIe1D/fmMqh30gaXKUExKQr7RWCxqATpOFfvOoteZBElL6V2727/9Hw/rpxx8+fBiOjw41f2zbhhbsYjvOOeVmV2yY2l3iny0WS/5er6duxpVlg5ZoRthrthu6zh/4Ob7ox9oVmjxWhbCvoHow45RiqSbrN6sHR0jKUx9Zv5fIIB7JbWt4OjEGqc7Foxv0VBlYTxGIAamnGylNqVMwI5TU44APhhhVi3RhHhtrOcOA6z0jTXAxEX+vHIC35qMajXjOLVrSATChEl7050ENMWVDGjQ9KfWF5bqag8qB2muVR0BdmshI/k6GQDhZSNADKTLFS8s14ecNVT9cO3/jzS+evvGDzx6/+MKfNNdO3udCLruRWufK650IBABRV2uS1poE/BsDF3Or9x7T5u1ntP3gwnJUO0mhhBrH8Pac7EQoKR6UrrRVk6fuYeqXTq0yy91aNZrh4Hjz/t8IFx/86tmzJ410rg4PDvU07Th0S2769NkzLiiPqJM3e3mpz3nrFnvZp0/pcHlgFSU/+YrD/my55BO3omPOYe/yN6/xBVhSVY6deIqWk3y7mOzROOQtqlq/n3AgxVNIKFbgqHi1rIVNAblhvMofYEPvopBRejXS03FHMza2HT93Xw5z1rxSr0CYsNAK17JU8OoBrZEQJiJO6YaNe9e4GI48XyAF//1widErSoACK5F53ZgyDqE5DmkEGIpgbCfxihXZc3nx1pLl16X1DZRHmxSEHBxZqHjamCwVCYrf5vr04aOXHn3rn//o9Rdf+N7yuec+lOSP4nRgLTNMtMdWUniqvJ7UBA+e0YN//G26/0ffp7Eb5DXkze716T2Xgqd0FMyr/Ax2lL95r/QLPJpzyfkivio1BoNq6mH1mWX35Fdz6hdihAdsaPrGhc3EhiqdoIxcd3W50sp/wWmBgO1JGT6VFlcZoVpvDv9bnr9FD14MxsKkGY302+WxGzYsuQly82bqJS0F6MiKCunPt3zBerKcVoucbJ9Vki7xohKC5eZKd+qQjVOgoCX/nrCyFvCEpN5oIuespAkQSLFO+U9yzUG9mFTSoxrKHMUWwcAq/vy1QmBmQArxJIKxWB88IM/V5GO07/dwGeJlB1yjJluqIoYi16BHjq6YqXa3DAOXg5UVGrNqXwywQYoxhqzpiDzfLidAcKTRTgovScFWm53mlpwiVZuHj7/09b/z3/6Xj7/+R3+R36tQaIpxWXEPhEjrm6pEZ7nHT7/+J/TG3/3HdPm9+3p/1nyHChtrYsNM9bxXihkfxKGQEK7mp2aQee8sJ/2fh1P5VNqBoqGZrz74pTzsXuw5vAuhQzyKtCvlDTVtS5fASu37g37/6HBJl5cXmqNKf1/oeuJthc+4YW+qYVJDoB2og9CUxoLCSJKPplG/xEhrB6I1dAU65JAj+aVU9Ovca+EkeasY+iYoLKMGLgYhRqY5LV/QDRoiDsRPB9pywR545zG/H4GcL0hYV6lwASJ4lnadUylgjcVkLqJLVvxoAUSGpXZpsOdHctGjYFPOQA4T1IMcbhssd62R/jgfQT2uQHqxLXi5wFhekcuvy7VrUGDr4QOyMQApqICT1pwMV/zmEv9AjDWPueoen37qW7/xm3/z7I0//Ql+8pjT1HHzJDPp4R9L+pj5nj/4zvdp8/1HFORFWv5elYo3Lhlo2qu8pp8A2sgGLLvHTk7xIisKcvBef8BFB16opAZO3vP2zmFa/fzQb5tuK0XRTI2xAvXu8PCQzrnCP+AiSnmlwgE4ONBcUHBU8b5SkYshC49TO13a+iR+bioXv0dYHxOKFP6SHLOF/xmABgj/UozOD+hSDBQ1rxQk80oRUzqqWv238EcdhK/0OeWmWzD05xHAX55uxUYphtWg6yShWoxymSv9fY9FamDBumCjGnjUlCOnyfANMjMapHhtSTeGMLVhQ566PX1A0RUIoThpWkP6Hrz6zoYYKM8zcr7e6z3aqoe3PHiG8J+cr5wtr6wz3p8cTjQrIjjEygpD501SAq7kQ/f+gy9887/+jf9i+85bPxm9NteDlArAr+11gdDk4HMt8/pf+godfuouH0iuVULHv6UeNe+XQOU/ZTWFiSxrRQaHXu3YIA/b+/OKK5eGgYSuykJgox88Ve3m4b/Al/hzu906DFwIaXtM8Mxuxwbba4tNcFNx/xLe5XkWSobeauGkkE/dGENc3rk8Xl5PYBOCAaUMcgfaiMhJ16NxUQMqesnJJJeV8KbMd8kbk+GqAbjqIC0/eJU1m9GltArFy2m+a5W4EFI6SmhlmgH02RACORzet0/oFklubIz1WKrSFsZZISZJoaXeLJvhKpVP+/uV4dDwyAUb1W5VAP2QtCjKiBg1PHfQA5xLmuYVvnxP2GMKufHnOeB0Rryjt3n9eWYFGYGXtRKJK/6sXa2YjEgjB7fnnFLgq14hp1Ct3nrvy3/8d3/zP++fPf1EBnHHvWuMTqDOZXqk5gh6cIerDbaFmqNsMxMC/KtfsdoR4YAwfhD3aH01eI8hW47mjw3AAiJGSSyPCKjEwfKWG8Nfh7S9d3z59n869tvXN6uLoIbIb7IRMoTkiV2nzymGKV5WAX7BVKXI4p8pxMUeVED+qO1GFHf8/SUb+Qn/9ZoUAvz6x6FV4/EPfhSsjyz5ZyGA45AJCiA5rRimeOgzLoy8CJMXEFxho1VvZVS3YNBN9CZBNo+WEPojctsKYVQOhPbr+XuS14r3lHfe8+sKt8BDXofcsgtWcQu5RY1U6ZeG1w6ORaJQjfAP/m8nt4jBiyGNICpLC9UaAQYhZpp+wclHI5oFIxodOeIwoUPpYd74zgGwmb2eG/7gz5sQeZOljE1Vx+3TZy/Eebu79vrHfpdDWac2VlU4OAkpZKm06Ok/e4PGhxt+vzUtmsVErfGCP4R9arN5n7iX9MrNFJa7eMwYwfwWcF1OBh5LjgPkhNyL89NxdS/m/kdS6sNutzP+p7CglPpHyobasafsdp1hnL0ZqhimsPmXBwvNZasqwLPWFm7YSKVwWODiRU32B/VSEpoPQ11IMFIsyOcRYxkV7rEuzZJDu4Q4IY7M2ci1YpYpg9EgGzEIIbTI7+trsXdpUMhJuMzAliXsDgqeV2qEO51WyIa9Il61ZAWLpgwpl75/gBHVyGvnUthlC92Fh0D2nrds5GNEQZut0BkolXRLjH0n/F7BScNUb+TskGGY0hU0HOTztnooLI0ThyTRJ2dLEeT5qjhh6/YZLGpk5JzybymsSqqo+Vc2Dzvk2btf+z//zbNv//NfElav8z6mYj1eaQXnOb/DQ64fnj+ma5+8q9HZCiWc7IAP4uz7jOo5AJJyHmFhnQYrqBzYjUiujaKmt49vTh/mafsR9kgn2+1aQ8cIHFIMUkY5lJlPxsoXryqhWx6j7Hmh1EUrisQYO7y8pA0Nv9YBvIzkmDVZCNV8jsOYBFwB1GcCUWXzssITvRg69ZqShyolTr70Ag9WCUszIY4aCmc5gnkPdpn0vUO2tiqwU79uFVqQMXj3yGAnLSwxqCg3V7zsFv+WQ5U8LCPk+wDkgEKxR6PA0AnzRJeB83ocgQrvWe+X5p41sNOAblYAFIYoqR561MPXZSNyKzIgz5Os+JKDq8gH0IcOHlPDNjxxhZQno0ax1zNuwJKvrdwzOexCX8xnl3fe+M1/8GtffOmlP6BrJ2/lfUJ+8CazFWs3Pv8jdO3jH6Gj529TfcxJWvPaVyzUx1hyTGdRhb2ZqKmGMjJG6fSUM5HxBp3xb12czLnhIu2q2frhn+ca/ZfOTp/V0mkSwF4vMHtnMU4B+5XtLWGfjVchqd7II4P+m41X8j7OW0Zt6cmJ5RyVU4Tn+JlOtNpnr4dwK0Y7opjRokchFtJKGbWf5l0VioYMr7ME5CSxQX5Xbr7cSMVE4dV6EFhaAPcBBWTCtRDPpPgtP3ujHt5y6ErTADsQ8lkbEDccyK/3SStII5xvMXh/n2JBCBrlwRrcRdF+35oDU7eq8m5T2K9GptGfAU5FHiuH2fBRIBcg2dSa7iRgDFSgu4gUsAFXZESrVyFAdCq9vazFklz2zeb56vDw3aOPvfrPgo517BlrziUeL29dp9mdGxSWcwqSAo5KGc0F74xobuc8tVMjXHlyps0VwrQzcCZjliKsUliAQ98oIx7D8bg5+0q/vmhJ89ykIV+MVC+EjE1wWBcj1QqfUwOh7oknFWqfcE01UefHidFK5S/Fl9z8BbxZhVxHbx7yugowi1wk7QrpjbBWo1xKwQX7NMBj2A0VzB8jum8AACAASURBVFWMbJU6hYHEe8jNlO/J723Z49YwboWJgrPCDKZq4KES8k4pwrR/JkZPdgBG9Jc1nywhnTSk78rkhBmn444RbC3xxB26XNp/V95ENCoimZcfHd32jmOwz7bznwALH/C+rFUalAapHNtYma+JRhEcgN1WYGCNyPPHvTZxVvaYYdQWuRKiBNrLwtllx9N1/eK9/+t3/sru/oOX8l7rM+9xlJ0DoAw6b7lqfhHDlS4B4Y0HQEsVqviAHCmVCj8W4w57A34pWedFbqyMgrNv+3TqVl8cRw6YgDQkJ1XG0ziqwQpUJZ5VjDF4tQlMUdIC+aDiVeXDUplESNrtmgWjxknrtCqso2itQ62ik8IeYliSRx1yTioXQoyxAugveaCEVPUiQeaLWv23wEmH2j619p80BbS4ica2qpy4IkYqOSWwVQQV/dky2PySzliJx0c+F9B5CuCTttmcghhlD89mBY9dDXl+MUqFjpCKiaPpyb0iKbw2ywETAKlglpbHV4Zy+/SGHKYAlpimNnbYBLsdfLTFUwZQ/cQJ6Pd0Jgst59GMShltjjZEa26MjsUPSb/GIYXu4ZPPvfdP/u+/lrt+Pg2MTpw8N9rsA6RRCd+xECK0oA8SujiPi3Ky5IZwToWvmsZS4SuTKobSsSKQLyZKIPrFlJvFePkXQurvCrf0cr0pJ0aBfgmVHPYFotJ8VADow0NFAST0OwNKkABvtYlHVRSAf38pRYEWShEhKSIXHMukrIwqe5EiIWzDXnNNgxqfkKR3yO3EEz5JO4Og2HPKu1uHAcyqsVx08UxnbORb0OTkT2mpSsGh1DvwPbfZ8jPJ+ZRgLSQYfvaFQFGAeGQkJMGot2QtSnFBTfZqPGuaYUZtHtT79aOSTuwroyqXQqoHH9W6WoSUxLpIARDaWAzd8nYxbMU1iyediC+j81vLoJ/hpjU4xvLzEbNePr4pkWlIzisIFp2UJcWedbNZPv7dr//l4f6DjxUhkzDlqd58SGlCFGIuc/XmReVU1giZQuxYRtIwrtQ6eJE6WppwJUcFASVGZ/yLt0vsvaiaD6vnav5TSCXircRDBhRDjmGK8envCgRV25itPPMMRVaD70UdZ0lG7OY04FA8FvK1IdhhaZDLiRFJhS7GvkExpAQTLqaWVGuok4gyaPFQqVeRClhAe8ElJXQvCagEihb5alLQtqTgsLV6qlqG4+iY81uBnYTmZ0N+VkSJB1uhLSuvuxYvjyC2zBEqMaSvFd0QgmGxDq4TctZac8JQkJiMHLkpXcJg7xVIkfEXjN86ALwXNpR8xpgNw3USeARc5uhBRopnPN4KGC1SEczmJ4RomWPT9EMOWbT0a+K4kn5PD5eyr/g3Ly5ffvgH3/xpUcAJe1P5Nq2aMNB6lSRDjtdXyBezGmmiG9Wano8XdDN0wnjiF5ZBruHK9KlX/3U0lo3S5LxrZfzT4+3541c368vi21sO+TriIUN1W5N3cRzVVTsIKcJsPtfiKuhjDCGQDyP8SentL7Oxh2bBGE4BhJIIEsQAjE6TevFiMraSeyOpREtrpKiSWXTtXmHmK6oB7iECkma4LA1ZDq7TodoAMAOXjpjCY3Kxg3WpEmaTtKLGYWjIDFD7/iFjEsCMSnJM+T2CJ+sDeKH4d0YubBEr20AikrEafDHPGjXVQBrQUyo0kAT0YISnHQMBJrOBxdI23Rt7Fx5vjFPKIZ8xYQi0dskehbVBpUw2gybXSPm9KZW0UmuMcVg8/vZ3fpl2u5OEGiiXWeY9sZNgEGhdoTOhXqMyr9rydbpXrej68B6l7TnfgEjXwyE9SLfpvLqmJJZxPwHOVF7IWVcymiPQ+fG4fmG7evaiXPvtrtfCyFty0tsXAx0xKqI95NHm4w2Pmwi2DXvBrh+16LIx3FphqYV2vdABQxEgN++IakBnBvNI6GnF42k3y/rkLYjGNqJiCj2EATnxwDLqXQfrs69RRM0QngY0ECSsO+KhuHLOqN4tR3TYSXNlPuxOKOnhJcVghZCyw+Hw7tZUoFv4XwSLx0lfyycVnNuKaVVK0GiiMlFLMFL5fgVRgFRonTpQVeiMGsbJUwLzphnFdSOdKRkLJwvvDVrV5lgg1QMizaSkkovndUJKBc/IhXPcfPDwM7uHj15s7t17Zkosrp5zlYGX3KMGsJVGhVQGerU9o5fqh5wDnrPHW9G4PaN2+w7dGN6ma+GS0wFhh49TW+CHBwGTVbN1TnV1/sEvzJpwT4F8zKN37CHbtiYB/mfoRIlxSoGlPNPBwBgxTkcWxKgV5E/GBBe2+TFC4Rwcz6X8qV5R+tY22iD55KB5d40Rj6yfs4IhSKHVBSOkdGC/79AmbvhfwlvdkM3t15rQ2KESg5K+tnrClJFC2NyWXJNz9tqXZCyjNk9TZCtODSQ8jgDaCdMMQQnU1op1aaSIgcvZHouqAqTVY8Z/QLGRQF4fEEcN57X82W+PEmAQWQg3HwxRDHNiliqYd69oKrp0wlVYTtHI2MY/sLTAGiiEzhwpByAjFdBCDYOS4nyc2ayc64vLO2fff+tH+QeFvud8VR3ITNZKVs7wiL6w9o75rR2ELYf7D+m5E6IXbl2jO9cP6drBnGbsCQ/7B1Rv3qPtMM0KlTx1T1xKOxOizJE3z9fDxa+MOc4FXlLDVMmdpHNPUm3P2ADdi9YQUtDcio1guVyoBxVPKUQUqfgrwE+Rf/9IPCpyNTEQIWoETDuKeAQpNlhbrgdscSougkJNAZxM7SY5JBTNY4gHlJt2EFu6EVrzwHgebx/qyDNENLzPv0WvvgXQr52kQIXpb/xX8yCeAsj3Z1B9GguxGSMmeqCG4slrGNAA6qRcxxpwYQzmnW0AkZSCmCGZlNEZm4eqOC0C8VrzVeE34BoZ2dqnZqnko87wWlTAwR0+Qn1TxX29AkMwFKsWpKeaOLPa5Uppcf7ehx8LmF3KzqYavYFERa0m2jz+qPll5Ivx0uyC4u6R6gzMKvZaXE1dP27oaMGhdsYXZPUhjVyh75JzUve7/g5fqdhZuJ7PP1v1q49zHhq6nfX2nUStXoHDvqQCNpZr4Vy8q+Q73uf3vEhRAAH6gbW2bMBzEH5beB/JPwmtXc/DvI+tOaPATeA+SnIvzPoKsjxO3sjQJ9hqqlArT6DTqdJEl/ynhMAuj1Mb0cMzJHdGFD2Kr0oOLUTuPHFXDwERZQzeiSffhKzVv/XpY2l3TlMHpr4yYmDSh/96V6cJUFXJdmBnTtFUYx6tuUEWUVzDwFn9tYNrISDdsVolZiOsaNsVM2c96IPyM/GSjR5yS5W0p68Tvj04GBgUzIZUEGBAbepIzjrarMzmyekxv0DlVD9vOlXQBYiY54s+MjIC8H9u3tGNJedwmws6fXyf07QNHc0DnSxlApRPI1/aWdpatYlTb88fJ10JMR6xn4sPf3kYuuvCiNp1g85FaddpPitKKlZ8ZQX4Mwos+Zq1MxsJRmqSyuguqTTOoUx+Ap6p0TKNGGCrAFo77bCJFmI3adCbW0M3ahFsjEIeL4Y5Yh5JQrygBSPGpiO8kxiuwC6WAkC/NduoirdXAyZP53xPdG5LOK1kqY00GCQc9pi/H9CKFupeCy8bwaYKeyM/dvCtKPKp07A3NiPfE2hM4bEMCSAyCl+AeIXAbVQiZ1Imlhhfh+lavXaIAMlnuYLzA9CWJZtGsEOUSqPFlWD0MVonTDnmrG7LlIR31vzd8zWI60ePX899Nwt7YV+lgpyUrzVKZfCUj5JshkxvP2YDPTujsyeP6enjp3RxJjIta50S3Gx7lV6UjC6AneR6kj6o5he3HrZHw/rZjw5DqmQGXz0e55+WH1neIfip8E7lKYRrGuM0lahSMwnTAuJ9+h7Sh6YRdYiRiQWAbAlnB3WjXsw9dqNohImPyduTcCW0vjnAaDHOGh5ML2AiGFMqPfh5MNZ+DxhoRLjXtELy4VgpyC5XcaaAPHK4YDd8owZjsN4Wgh0Ca5kHjOrltaOGQqoHijAgX00whhHVvgunCcylJJYQyiCe9dsxpkIGNfXgGjTIR0dQ2zsMFLZkBtaDoeXkF8nTLW1AFzKEKzmkHogy5eGBNRTSS435qBHDgI2r5CASgVIZ1o+e3s3b7phCnKZuXUkFOXrWQ5KnidOeL/K7K36BfsU3NdPlpheRW2Uv7caaVr28uSUNcVa6U6qcF6/ITehPjmn9I8Pm4hPid2VyVIxSjG+1FiFXG9oTbFRyV+1kSTVeGz9VDFo4qOJ5A+AJQQwCX7haVDX4Ih4gAhyz0QmzyTpn5vXEUMSDLPniSMEjHtUS82T9dkAt8kAlDmt71NqhAsi3ypKykWKr6i1tcK9bB6PpieHKiHUPrmjw+QaEwy3yPbmpSuND98ar+kqRAOXEafE3pwqeyjpM4iEb3PwUnGdgHTRVUgFpZeZSjpnKzH+PTLzFVIJ47QT4TJ8frd4Br+dTD85lrTwnDROX1r2eqQ9WBeSvYFByrSQPhVgFJmaN+6BaAvCUPj8m977q+lu56w5j4TXbAY8xFjgrGXss74tCc6V6QKc7rlo3O9r0I//Z0bPzS7pcbVRZeBvmtItLSFS6WC+VEG0Jdq5nl+99ZRj6W64iXblCnpxgnXnK2oaLqPC0UkV+WjkHVXJToftBBVCwTmkWVFxUSYUv/M6Gpjw5IM8akCYMnpagCJABvIQwZRKPZnxa4WuYlues9WaL4cgN3qEQWmXLvRqEukMyilyN9qISmiN4pkqbI8wuxTL/32K4fwYPl0H+ieCuijELvU+eZxPG4kljIatYLilIRkDK04IE7qlEh/yz8roBjCY1GhSOAemIhvs9HYABHS+v3qVdW/vAfJoaAYU5BRtIpd0KqSYUXA78Z+TLOhFQGqaWzuWOneHFZZEg8pl/ZaipcnhnJHpjDdmX/H1dndBZ/TynAYCsFGprTeAr13TZ3BGuPjofE3F6r1PLIW24Npzd/2o/plYqffGec4ydkM+oQ8NUviej1AJNGWs+qVHnZN2nQbU/8UryQQXGQjgZUEm3qEu7MaEYCHqK5eI2CIU6387PNQZTzFPwHi3Q7CIJ6hHhDZB7EkKm4KxLjDWPOBAdTv8CYbZDCmFjHhO5uUHIVUAfzYMIUQadx1cYLRePKQdXQ7IOARrNsnJ0RkkoJhrcEwGrTVpoVWTkbBcdruA9XSTD1f+s62RG3JEd6AROaEdGpSzXjEaNFhFdthGjSqFojgWI4hnA74bbYownltFuKt01b227/m7lDH9PolUkORUBlFbJ8ntKp9rvrmb0dPEanc5fo9AsudpvNNyuckP3m4/Sxfx59ab5igylcQUc7zhMlx8Zt6sfE7KzY56H/PcEGl9GV6cChCTe82A5V/jKlkRUBapq60YhKsKsj1a1+kV0xBdwGepSHSpzKls4l3BhU6qmDic3WmegsrF8qkIebkBiQTwogL3d7EgTbU66MxXyuLnitdZCHbQaNwKM5MszTAM0YSLrLXUYL0EfwNq9zvldYko0FC6qXcqZzmNZVS/5bQ3Qf1CjtDRhBNKSURh1LlGpnTLT/IoUymcKMDhfOpHRY+9hODMUjmOwThhpGjGWQcQGI9ojCtXa9a3QBRSHpk4t2STwiANToYMVoS/gmLreJx84EFuBmmLpeeIve5sHplx1W5/Qo4PX2eXepFl/pt2czfyAtssXKXMemX3uZo89Hot0+xCPNg9+gm/KHXlRnYXySlFac7UVJw3GnhPoezml0pIVMkqr4g5Bw/0w5oLN8Q85OREvSgryq0FUFq59CG43dmV8IiHxj6g8jfoXTV5SwX1rnXaKCCTN92TMRYoNZ/EHiFB0wTSjFjCCEa0TuyFjYev3KvZrEwhbqPA16J51eeJ0qlwOJI6qMisfygxWAh6rvIOAZkVwdZXE10HJlPqe3GHoqAs4AMtQISVISEXs2Iwgy48+7kIBI9xW6MhBq7WJkUuRNMKfG7Uy6j3Rzx09p7XhPyVIh1yMT+HFZJ+sbjBDllzL32RJOy6oq70NKhGCfTaiAvx5X78SAjR2wuKCnlV3KczvaShK4FC65wl7utOxzPxLEZAP592zn+OMbiFapgGUML1gPSCqbquGKoNbuRuV0a8XfLujGbt5GUlZIBUQGcrN7lLzNk2+szKyVMtTSDPKMU1mNFHJEZUafwMShdxgyUV37Mnnuj4IUuK+BEHyYGCQGXkcZ0VqsESuIxo1Z7VpVl9BZDCWs7L6MOVnMpozwBt7o2Hw10Dxqm3NMFXZzgkgaJ8OextLEvr2CYWTGPuR8ghyIUhrJx+t1ZQnbYa4p7pYlfn8iGIwlNVJglbUihEPNoAYjGzjohxy7eTwyhvV30U65ihCpcIWuSjEVJhyGpFW1Fj1EzOV9qq3xAIkKguDak9E2uunskSqSEmU8Wm5wPxGhZghM0WSnymv0kMN+vAA150meEybj27PHn2hk1HZ3W7aO6Uj0Z0Zh4RyyfO2Ru2bC66KFEC2fcifkrMqPKFk6QFjuUKhE2gq2sBhrMoAXwDjqE+mpTRoa9TelOaPsggijXoTHMtciyAFpBy1Sg6xhHdXTNlh6jQAw4woRGbAPOWqXSg5OpUsfYeqP5UxXTswCWFcXqvHNKkLZXQgUSdwVF0fKuZJ/yuiiSGHdaNDiamA/Op5yFIyJ06PiDLaRIDSddjniCIiumiFdOICYCG5LjsMOGqCJg0ZmdgNCY+OzhaAzusIHoKFf8J1yG54e+hBBtbuTZJQV0VETaMIclQXMzH2VA7eXb4iz5NzKF0BWJq9aKwK9V/fmJFYtbs1i7m6NT79OX6hj4iaszOhBG5SBTg5pe1MW6ayE8pap4MZ72hvVFqrnrv4WIpja/K4apSQZtWuezxb5hXJ1TgGsKU0H+WTvtEBQKiFQJ9X8lbpMk1eMExeQlWYrfUnw4EJ7Ucxxlk2itwOedqQDW9s8zROcaTKKRDelZmuYHzYBU354hzCEz4ZoEqDNC2UCKXwCKXNOeyxpzwX72nfq9rPFTPNE6Y6ZuO0OjfUtVYzZpsIRu0z9gNSKM0rs/EbtpSuyI+Kd60he+n+r4y8IMIRDpoRqXGw9zpumkpIl3Exm2qEYSw6BcXJGWd6Ws2TyihALPpOVCaBJmqZcwRTnjTTodjXXqwuPzukvBBKnvyGFEgSimUJFmFLXD+MMEY74dpCHVORq9THyykDRzV42iF8ThRSUmk3rseaDfj2MRovcjImS00IzGbqe9Wur6EkPap8uNwc51sGF6vADqSexlK9t5h5StBZyhAJC5CrHJFDCodAtP5rAOLqgXWgL5Ubnfb0EtwgXee4oWkGSadJQQhPewrXo5N18Ls+wp3hRZUoAukd56V6MaXKKngv3kSoA4gvEDt2FtcY9ub74Y0dTRi8KKYppIdC4rac3JCXqFHUpJ7QoeJI2TaGq0RpqcoGm4sLeutr/5QuPryv6I6rT9ug6F6OGvCDCqF0VDGtiPMayiKKq+t7pmUKtFsd0urxy2x0YehNLkywU9lospLtJo3BO8qgUjHerOooYhPiPeWNC24qxJVYmf7SjtMDzT35Z2IQC0EV4Om1AyOkE3ShWoz8VnFSJ2yBHmi+q80BW7Slc+wQRzPvx1/V5BVF4qdHfip4YlV0t6wD1SQTVxvQy/ZxnsqxU0y1dtBsksc5BOVkjR28kh+EOQ5fH6aJYC3KkLMJcuAAfUUB0JXlnBinB53P2qYLqoqnqtBJaxAeMr7nXyPmzaJLqnv+nCaanU8Xq9xlhKZBjIU/UGiNvosL7DDrLkYgGsbFMLVC/hzzNjfLNu+++106//3foye/9dv0g3/wjyhdrgyVyBa1Y8Zgio/6BnKNU6vStZMCcTDhHfbJCCS+zYP2+v31uDuuu4s7qggNEFjY+sqC0hTAxkhkwlQU2oqcD3vfEQwqFcRtG5Xw0ZyxG6aQoyHMlpK5r9dZn1iVcY4ePkJJJtFyJ5f99mUOHShqlfJJLU1o4SXa4IK5hmWOCKh+o3ymxzpDNhrcQzpGNKZGUAYL/zJbrrYD5KKQN6JVQ7Go4g0hF7KLHIToKuHy+bKNyXRg8DvhpoU3XZPREyOmSd37dZQLO34INk5TpCslokQq3jliSUWRwUkTS6vG/jHlTQhJh7DthcrKh5KLO21bJy7GAYOVWZEjiZIBxGm1IZG3n7Ufnl6env3gve/RO9/7Hp1WnBqKptj5mUFVmj72Ak9NmqdG5ZqY2Hlv5aTnFAnLC8jVnP0MykUa16/yG3p+BJDvXICLi5WmE+IpL7WdarswldUvRsKGud7sNF/Zdn0xCj0kIrQ7m9t6R8ro6gCXQ8/cIRjpb/tFJazhUUxT8Dk+viIX6TM90PS02fMio5OVW+r5moezHdkoizyz5JsjwHYRVKvRXKiyHRL5OmGDVf4mmqoVcEZCVeyMCNVr5WcT8soGvfctoKZhb0ujL61NyEdnKJs6iE5Uhb8WipCaHwIL+zZ1K89/KRJH2EaSgBnLc8j3fay8w4z/iJazS74TRoYE/64plIJNM2/gwsE1/yPCfJ4W5El6Z2M0seisjiGerp4+3nzw/XeouXGPfuxXfpoOb1yjw9u3yYHBlDp5X5ZzxiLvMk2VZpzefTXqK+vPwJ6XsWg2h/pkfPylbrc5kcAkRmgj0VZYCKA/6ggCv1n+MKvdRjmmItgqxZbKSib0onVEpNZR64AVQJZ7BiOhsHEpf7SCUkfORVXPjWwAhU0YU3rEkhVgop8/09ZrpVxVKRy2on9FhinKVGZGhyfCA8qVWNjwib4XxT6zHYgZVJtTESuTAb5evZkLePgIsxR2Ikgmxi557I5yEfgdfIOhF0/uLLKt3nFcuMYhcyw2AXhv1diHQobWgTs/JKr1miHGBlTBB/rgEn0T4Qhv6KtKdQdAmDi7A4TWJB3cwZPnfWwY6aN1GI1joZMbKJgrYLLK2dA2Oh/CG0uie8f0sc9+ko5uPccR9YhTQX6sgOWytUY8qk+Eks2jga0yLd8NZZNJnKTTKZZhPt8+3dJwYzmcffXpetvIm3AmlMJXg1X2qizXYnufLueStGBJHTpS8mwzEaKQRQdcCUpeq96kMg5nvRt09MQ0nVAA0UQQCXi9AROjEbxG6SKtsu0nlavvoLuQUSK6K7PQqvFIr110P21Q0PIqY0wNmqsqY14LmxGbRVLZejQqKhAn6lxBps3jdFAmEfNvIVpWe65KAS3bVHSoZn6FEfXGQvkDJCSNhVyBxJ2KkqDLCMUcr+DdOvGbpykF2huTadFS3ZEvxIMEZTamfo0lFiOI2z5t4FwG3dYVQaBP9moRsp6974/yHQGi0yBEeRmFbyJdnD3mQxDoe7//j6i5foc+9VO/xMa5pkW8Tuen9+nJo7cA+IdYVp3T3rLpoplKf3b2umyc1r9WtBhXHxtXT39UdtXPjhsNjUfHh/Tk8RPNScXD9oOFDW2l9pafiuK0E1PUuFqDLDRvlTwJzQItpFQ01yTKfV5fxlOEalkDVsqAhazDkwtLXC625HKqI0AW1jYKqemWJVXlq6KNk9QYZ8l5IifPcNMV/8wJoVU8UU1neVc8V0KHJypjyZRU+jCaxhUblYxfe+5bpHogRtFDTkgxTOUFWP5r0pUjPFvGMF7WQ0UgfFQOq+3pAVTozHmU0ffryuDZ0J0EDmvvbPw92fSMAqlBq3WHg00Qo5Mct8u2b8BrgP3/0t5iEtfaH8NEapFifZhXtGXP8GT1jEJb00fvvarpz9e+9vfYsyY6X53yn7UZ6hUV4L2N0TnT1bXQe1uisYuxbJ9odk9f67brE8tnyDbkYemWV/MyLj2bHeg0qQmkzbQQWm2s8+Sk6QUXX7JJWTDWg3YBCEJCtuWojp8GzC0JkVqWeclNXHI4b0bXpJ8ueJXsVvVlr0CmY44tZZWkq1c7E0kFKvrCbNoifEsKsLb6Vg1ilTtrj6oCS9YD6mPnQhmkMA207RCae7RkexRWseTNNnW6xVBh5dLoWEm5xR7WAbfDN/VV2iGzNquzoeQz7ILLsaPI2jOkDmuVxMM2wadSgY5IHg55zAriGT60p4cq2WEXR+nbCOOe9pTa5GhQZDSQ23Y0VNW0CSUE7Hit6ea9T9Jr4Rbdvv0CzZo5rS+e0LOzD2jTP9OK/3g+R466t9fc1U7yfhkXJlGAvGfZHj74XDbt9vRzXTfMVcxCMFHZTz8aLU/bnwrkm75nj23I8zkU/LAux+dtdNxiHKZNVurBsupLzV2yR2WBWtuOhwpVgHeVjpGbzRfpGleQkhOuMeLcoEnp2v0DBHblZvRpKLnYAC/lw3ed3hiwmZBStBBOc4MaYOwV1O8aNCDMpC03bHIsoLy2UKMVKhlciVjyUGsoWC6NiAAy9AiPOQYshwCe6TNQ7k2dTVU8LkD+PpvwRg1aoDZbvBbxfVVkOOxM29Lmj4IrQpPN7bsT84ZBhUJ8dP2o6GuIDIGZC7dDMFpZCZ+ncaTl0QEd1C3dqQ+037969j49fPw+28gZHS04vWuOqK2PRM0vXIEVpuXBHtrznhedJgVzyOWEzsN4iy4ffqkfhkpm9gUjFS8nG/Vm7dzywV2nS3dlViZhZbiuv0GlTzEW9niCTpGO3/LPZQnFgh9/BAxuCFg3joZBHZySiOWx46CKfRLa5aLIBj8ZIdF5exhgBNdTnyNC0NYVl9EZcy8kIbZXEkhd1AvFO9a6EcRyXVfNU7wSTKlICWveo+ahW0qYKKWi4JdArq6B6UprVN7bYY5l+C5hV5RCSSFfyTl7RwUoXAmBUuxlTId6501RAizAKPBYnrRSXX9Lh/QEc83Gr7DiznLvvNeoKOqGZQI1FBLJmHM5iFbSGIF60AhYTUOgfJ3ff/dNSju++rv36emDt/meR/rkRz+t0ezZ5TmtekNc9nYT4y2EaTUPAY+MYdphGgop0P49689fCbuLVwVnbRsD1EV34oDj8gAAIABJREFUX8N3sjapdEjrylRLBl3DYx2oEMIVHmqtaUJn0IlS92R/p4SopDNSwphq4El68DAT/q7eKiGMY2RbZW7GvuCJCcK7Qodbjcbs6mCUMWHeie/uDEVXpwyoASD7tH1OWqvayRLjzFYIae4JsN4LINHxXyH3PAjG8lqjYMrabjUFvQ1ZJJiT60NBgAKjJFsf/cFwnWsHzLORVEbAVfI7mt+GVCQvbQq0rAUpEpMVxo/rPGG++llCBcYT8NpQaxrjiEKESLAybVwy3zWunMIHhloLjoTxTivCTJ9N0GrhRaltFpwp9PTeG1+n9flTTht2nKt+kqrZHbrzwqv0q//qX8cQJQoDn08pyv2eS6R0ZW7fSCDYfJJT1awffIlPyg0F0EfLP3edLcO1DSZB4QjRsVqtNmX/xzQOC0JHZbzSvreulUhMCiFFQ4d6Nm8HmhXUEL71BZcS1jJgF2H76OLdNDUmXDFkB08rRizElAqDcxl0PcqGfxYIiIyreQEq34C1YQmVZWGPwdusaYSmgIFbNVqQWxrLZx/g1XqQYLyS7lBYpuCezZCHAYN2XmUPe954GaZqv8V4ctSJgcFaqaWJmLADwIon96S+w6pHzdODXpjIO2CmTjj4EmAQsDNaugMixYgBQM9DG1/xmY1D0KGd7dsH2SOnZnH4zq2bt/v7D9+mp6s1vfrya/Tyx3+aloc36Hu/9Rv0/e98hz/HoeWoZbE5KsE9sulU+Rfd1DAVU1ptDgfN9ukXOPQ2M67O1qdrOjhYmISkQE1yunvrNgUs1BJQXTyvPJPNQgVs08sTz0CqWmkK9DsN7QfIT21vaNTEXOApFeLi+HrJL7LEGm8NMcmkfGbR4Bvp+WfvPxd625QGhELW5d+NSSceemicbhUdkPZjVfL1ALphKrRHTPJCrdo3ga5wE2uXEUfl3QCc35WVjpjx1xtvAP8QrKiz3897BBQqz+8b+/SaII+2MeUBu1KntfY92q7+OKfi9Xm8omRSVKnDNMfUeOs3RHBoY1n4VgG6jDDCifqZC42PINQh1ExJ+yrTueXLnB/94L3vDW+8/6fULg50BOrickNPn/4Jvf2D73K++pA2u/9FP0dhSBXfE/aNc39L3/63LHmuxu3Lw9n9z7f8bsR7aqgXULwz+Z6a49R6N6qWVT9i3brcKC6ERHzi4uklTpxdUJnZl2HCGvLi3bC1iVCkIP4+IzxVitNWPllpvoTctwLa2RjlDlarCIa0EYMRgF05JGJbnKcfks+K7pTp6FsqQWC9l4ONlGXUMJ73xixy6RbtMIo9tQ1ywUNdKHeUfBsyk1oA5Yk87d5XISLtCJa1c4WlP3WPqJBMqjwJtM1zLAK+vml6Dcirw7uypRhCeWysuRJDUaqS99Sivdp4RykY6XoS4zAUIxRietB0qmg+6PWvDZpUx2Iy+nIf1mfP8gdv/7GaRR1ltf0jeuO7v8N/vk91K6mgHas6h4r226j7Yqq057bznyGjqPuPx93jz9KwvRcb9mpCPGHj63eGmYpnzf1WQ/l8Llr8JuGTVhsttgSK2vVdgVOkk6UXWKZM+e+dtjy9Y0NqrHPxrFAV1JHfie5tFwN5kqzPEc3UC74BsrEj4PENWFiFmYSZq002lGEzdlo8Se55kKuyzzXA4BpgzvtbPDwv8/GWBlGp0eUSCarOU0VaoRjdaJcMc0VhIqwk91gYoyaop9Rg449FfXrCRB2VcMW/gN8XyMrHUMpeBkwNaNMCDPyA8ZgcbM26k2UqaC9IpR+wTjPmVBpBtizYxnBqpCmqA1ZVULQ2rNuTvRFK5trrV+ofP07so57xPV/QYn5MB4d36ODkhD73xVfpjR+8QR+898d2dvYLpKtrzvPeSEAqUpAZhUCVutn13f2fYgc+F7ZU349Kglb9Ukiai7uX0yLfl7bYgNxVKjvt5Q+phAYZKZHlERIa5tCokuRBR0+CzSnFbDCLLufCsoqAFesVAHElT0t4x6JZAqFXDTBYqPSJUsU7U7+3IMNawgZdQdABxiPspUWoS3U/wDv2EFlzRlcCrzQhZLYQWgsuigFe6Txb50w1UGkacCubvSmUPHTABOoAEolLqrv5bWmYWExhWlTn+KjLDLlOykDWtBBXPCJqjtgoSIAJR2yzzhhFN+QAo+YYsVaEBEOLLlukf0+p8BTEHgLGqh2ZcTL4+uKSwmBj1pWKKNf07PxDvqZBNSXmsaMv/eS/RL6fpZA7/sx/gSbt92zqGK7NuQzDzd3pg5+oZvNqpRuAa+WlypMJcVqYU5f8/YPFnI3WUnoTSGs0Ry3S2uhASft00xnBek6EPDNrTrcMxu+s0W8Wm3J45YK9YIcFtvKYdR61xz+gaBDVk7pEiKR7p1ydWWf4JS0ApU/n3wu/c9pHasaQrO0avGBCFazGPxRZnR3wxI6cVG4VtRQiNTxei2lV05Tyicxpb7e/tnvC6Ot7QPELRe8+lEVqk6SyHSLPe+PeynVtDgRoH4SMUZtQZIkacFK94VNDhAIT4Rq1fJdBKCoppqQ4lkLc5Es7LKSL2CAtwiHVntizpCuLG9dpdnKgIg2KzsSWPvPpr9KNk9v06OlDevfBn9Di8IRiScvDJG0+aaaGK6mA4Zxg5YgxdWc/utpsXznn5LcCf1S6TgIxSWiva+Pm1FUs8y++olCMeLPbGo8T7PooYyg92FMohirQ+w4gs9OA4JAxUq2q1apxapv5UE0WqUj3oKPqSZkinVadgp1K/pwHSEDye49GfdOpUlxy463a3H+F/nwP0Ns8o3mHBSgZu7Jk07ykLmmAUYwoJg2iGrRzRJh2dYn0Gty5DrW6h/OwN7aScI/SXtMwAfSP2HZCOKQZyny9/hsrJ/NgvNU8MeaiL2TLvtXPflc1XyP0VaEEqB4Z3IV+Lw0xVhS882gE7ID5tX0fmPeWQsvVPzq6Rq+/+nlacz3y4Nl7dP3aXfrIvY/RdnvOjmujg4RRL2vYF+XdH4OeFvlm8FRzoaiNzWI4/Qq70RsHs0o9pSibmERPKEKsDj11mqfOjdMI+Uj5nod9IVeLqO+IfKgHM7xWoTFSsF9lYQB+V9k8rm4fEUNNGBfGDe4hmKsM+MqG2SJme6TNSsnGnxVDHK1Yib7ASz1EtH1aYL8TZtyDLgqzhbUmWBF1l+gWO6UiVPwq3yySQpm1ir5sDiMpM+Scte4OsFzZWVINZCYbjExH3z4S9gvbACJcKBI+YkYHqMONqZ9KOuEYqI88V3urlvb07oo5mQ6qjZZ45BiBelR7rd/oy5qROqjQRLBJA91rC6TCBzAr2Idc18XymD71iS/T88+/TLPlARfeF8qa27CRPj17i+7cvEvP3f4oRdpf6uJvNucfstSrK8919DUPh4t08eOcg9b9bqPFk4edpqlMWCJa4Do+OVZDrqKpiVQY2KOyODcWMQox1AX/ezNaClGr4dgOKQ9tkhv12JzcotPSYRmuFgEYRKsjDIw/uLcj5f10Q1+6KCpDg4kBMQ5RKNHVPcgZHd7SpoCEUUieV8EFIjKdpZ0NFAoUJTqsIU/ri4EUtNjF6tzRFsbrYVdnpvgzrDAo6GvMQw7Yk0pFyKxHphl8AlbxV8s5s2u3FoG3UAqykCcWvhtrCpO6Xw3jazz1SJO8pq9RV28dHUOdRqlj2eZo1933tApOPORJkbCYEhYTx3ZG9XxJy8Nj+sSPfI6dw4wePXmf/vSdb+m1u3HzJS7Al3w/E7Y/l1lqusrcD9OAmVOrJI1vh8u7l8+evj5r27DtDBuTG3t4sNSR5816a/koh3gR8ZWZmXphYhJCoE5jV8izkgZUSqTuLc9Ee7PKdkOPhJ1VNWUvfQ2csEGuJsYmAmn1aPBThZmcHUJcwKpvhUTIpdsTpj5DWXY7QoVEBR90S0oE+A2CMTxQwlSre1ArrOygrlOHEK6zn3bj5WAWdr3xNwcHzTGZ6UC2CkcEgE8QIkt74+wJVbUvS46lnja6oLGbIlYMWVgegZqU8WuRDEq2+8pX++jLRdPbmoUKrc8KqoXTsjb9GdRGRhO7MlkjeNGIsZaSDuBnLQrJgBWVJVLr1sYjDsxzeuH5j9HnP9PTt//49+ja7Xv0lS//VXruzktsHzO5jw7wZtprFwHINdbllT6/XiiqDlYPvzxL3V3Z/55UlqcuHrGGyIOMPUeQEXR8dmutUSFKr7Yr68CIQbRLlf1RGAQiDQrWwxBOMLU5xwIyIVX71j1J0DXEJSxa4PexU9GKXo3b9skXeot6NvGOfZk+tQtXK96Yyl7RCjCWrBAfySZIlfWkUN1YOi8Kx3ilrjvvayVOSyowBz1uwPiLDeSlPUU7KobrzZQBxtZgOHGAOrb34OMeID/QlNv6oJ/TDWcUC794E4y6aNsXLRJoYSqvk4207UhBDWa/iWWM+nuem7eAlzIKrxpj6wW/dW3TbJ/JICrsSc0+xQpeRiQF/1VVXAYfuV4REn1iZ3Xj2pxeffUzdHztBSycsIbH1RDvukLyZsUIUQgVEpVie/3Nfrf+N8YhHNQgwqqahajzdQZNLJZsfJs1HRwu6fJyrZW+7wWWrdA5pb1VFfa6Qlg4kk1+QqrN1h4VI7gB2R550+pRo2wkafXxTkEbsCihw2mW4mYjAmvAXE1Y1/iT0sqcYXxEbpIsn9B+OJk0j2CfBOXopjDKbV2Rq5eYV8+aoxpDym6EbeyzELeD96Y8jTT7FsTgu1tRZYzofc+BDHe0h7Ds1QZFBx+IQ0DTwmeXRuTCuzyNN9tqntHkyvc6ZQFVv28CdAw0un6UCFKAwue5elkdFCabcVw4oihOlMuyilL/YG9uiKF0rkQ15/LsXfqd3/vv6drsGl1wIfXcCz9O7ZIr/idv0hEbai3dRs+HS16Kqn5/BLoKe+IUKLya7bOPL/P6023mIDVYC7Rp6iuzMfJ9ZT6xF5XQb+TpHsQUY0fphcE+VN3eJ/ipYKl58jwHwSZLZSp19F6/a8JrbmeKfsJs0goz2eiKzgDVpjU1w0U74+9dsLc9qU1IWLxvgwVpMywcHgBBJcxmRbD9O5A9vKu1jzVnzMNvweyXfHELXagN2pMjcslSFZdhP7CjsNIyQDdKUIkYDDYb99ZN1tAu8OV1GcIV2VWjwZuNPlNPGbzVUJoSdtgSkFdsjfZuVR4xqmKwYdzb7Ocqgq5IqKw42XGQJ52p/aUj3oKv9lKVTHka/06GTff9U3rrwR/SB8/epcXRbfakd+n02ZOyryAYVTD8UB7qM/7s7mXDXaGoJOenhmbc3k3rp4fsp7UtmVHJaw7DBit9fgH7pb/fY4uJcE/Pz7E5RDmpZoizprUN0Tr2jOVs2us2z3gMtr3P9Kh4Spa8Z4CmFE0Kc7h56tFE7keKsmzSNbLeXPBTUYLuoBAoelMdwrGG8WQGKq81SwbnpDCJHbWuqowJgUJngxLzjPakwuFdZSJBhX5DhpiDeUvHgHtdfuZjxwmePZX2rOqVBmPDR2hO6TIyiE94hyhhYVqL8RGfhZJrIsODna5ij0hZJlkmyt6GBYKAzziH0IgKbCgPFpO6OJ4VyCiV72cN0wp40/8IhXztI0FFPh8phmK3u16pn6v+Ib304hfo5nOvGA9g6CezttwXwgdxPw4DU1Wic7wCWQhhqR0uPn1++mTezgyO0uUAOH0C5LvukUFTwbpVvZ3GDBA/7RFxdSYKBJIdZpCWuJBHIFuoeh7Zmm0B8731Kdhqxn55vdm6aHdvwRaY9gJJ6XYSXbpmOVRGo0MVl0cjWi/JeK6uTuKTlC106r0vn8Fg0tYBpCxrcCE6srGXBrLkTpbW0BkMqvEBPV9148t/u2wNUgXqcyjVvXtQZ0aRAvlVkYpxBpakLR04AT5hqqmOpE8ImooKwHAT3gfqIqx9DypQXGEsxogm1vZswTLznLOC5qovY9MlEb6lxZGAGEozwAtI5xFfe+Gj9JG7P0Evv/BjtORaxemk9158lWueTYlbddGKznmfR7U3bhIKmz/LHs4wLprd6ac2KVcJisOiuCehXeKFEKR7IADqOflk6LizFFZh6oIFdChU019WTMqWk7rWCxQwcSrdqet8gQ8g+OvEarlYWpVzUbbuO8U8O6fGBbvJA+SGMkL4VqchK0BeJmRm0o6CwVqlLwwrHUcGZ8A+Gx+WqkEBQ0VoQfNVSCS6zI5DXhXcjkv0LFHoDGRQWI8QapKTkFFyUYk9YbEBpVILQYkeQ3nqzQKUTwpJBYolIJ5YYVgVWKjHzH7MkBUK1d5SOyqTyJ4FpmDS8QGbZUzG0wpdzUGFGA+d2RCm7SiDz7lNBLsCo+niYuGoyiqmCL3bZkavfuwX2Ch/ii7PHyvmrbn6/JpGTe102jbIUOAHZybta6YG2h9NkfWK/bw7e3y9VvnIZFue2cAuLy6MJZSn3EnxTTHQaItwTcjX2qjeDEhl80ampWxFEVwTFe6RgOmi+hctlGXMADlZQ4op7TWPGTpTppsk+eEl32YZ2NuhyHL9VCEq+7iLz0A12J0kLeC6KCQTrZKZygrTAfJvVarm1xM9q0ElH0e0gg0hiDAkKnnlpABduUofCpeAm1eRSxKFosxXA/SfYaNzCjbiHV0GE2uAGtQOHkqHSQdPPWtfFP+ieX9IHilikKauV9iTyM9OEorgL4ypYMO+fVoQm7q0ibBYLk+W7jBeDJPCirRIa6BDeu8lnTjmuyzKjFxMXbv1Cl+0Gg6S37Gq2vScr973oUKfiZpmo4KT1ny/OcJPNW5f7NZnHxUj7TGTL9LlchJkRrts8hhTaWnJWLSy/Ee7kXKBfNzDc9u2soqyw3rDpG3TaTSY9rSUClMHiyusvZfVu3pnR5YxzHQRRCg6SAoTBav6TQgs0uPcYVlusLUyKNIGKEP7DnkNu3htaQpMUJ3R5XTVD2F1pgtgFME2C79b4KruGVcyIyQmE+17Wyy50GUQYarzVdAMc1a9e3AZh8H6nxECHB0WVRDmnjrkeBGv32OTdI8umpOjfRZ/EkszsviA/QUpTDQ+17yKIHb7HtwB8FvZO1UIKFNrPu51KpO3b/fWdpJ+zjBtF8c+1G9+6/+Q390ro67kdpN8TZ62HYZxe/FKE+lmhTxEOkzypRqomMFX/X2fn4FIr4leYWlXXRVSboR20WFdq3fKqKrFU9wMNQbJkqIBbTQIKYMHoFtO0FpUSZvaQp0JHnBqIB4aIU2H/+pWU4AB3kteWcnWCueM2OqXS8tSe9W4yLogDCK6DYjRTvTwPM6VmXtoihYOaPZNJMmofcG0ROdelMCziSEVHlcIRWqy96UQwQqrTtn4SG9gVMvYatEjY91ShUtLtSWbwwpIPSKgLNsGWJUePsHTjyWGescMs/0oqmaxLvlpAEacMBtVxapU9WaQowFIYVr+W/wdsGuV7airkd9HnpYQ27BmxnSGEOc/ePiGUAvTD7Gm0KkqnnSSZVE8q1sdBhk/qetpWZYSYqcuk7h3MUQhjEQfvBts8jTK0N1mV2R3Eip2qUTXg+2MJ+x9Pwi2v/OEDUyA/ayL00Yd3Gu1eDL6na88VwFf5GuhqgrTScdP+LtCQNFeszQPZDlaPVMqYJVLvCuLwBxu0W3R8llCKgvgPB/1BWikOv6hzBgdcnoxINyrWgvW8bTo7QspJGFBm8rohGnExDmtsZBNEnQFLE+NwGJ9hU6EkvWOI4N5yqQoQ4/XdK3UVJrfVrg5E65GI8PHtXdg6OvKJDLiiU8tDLAFRw9cPG3A9Vdpycp4sI59jiBixxCKRzXISw/elg3p+0XqxpXBvXDH3w+WJw7PhTJKeMXD7iXbgDpq2l68zt60FT3U3XZbFgXISynJRE4xaHyCleqwHxZKaEiobLGu4C1apWdrldY6U2P8UfGb1/n/T0R3FHCJC5QtZVGawmENZAkDHTRYq55tTLuBkotzUH3TdY3OlnhmMeLzYafS3iMOhrO4nAhSY15eN6CA8GGtSeMeeFMi7c0w6cYRHUmePIl5N8N7neY24vMY0bsueKa2KFE4Gg/16rIGhQJlHWU2SqKPK7sOn66PLOuBQtGk8mVqAYXUuDf35M6oxWiKLxZufL5rb+EZ9vlYru7jK9isTcBei34O0CSF/WCgyuug7GvSBy54T20Az3e/xknsBGNDd++8SvFKXN/zovs6qS5FHYXV2l3csv1mkVbrDVf7M9VAVf1SwS03G9MpldA0jAD0LTXQ7tNgA14DOlMZHtnJtgHk2xOyQqGGFLhCSX5aReFSihlAIbrYQHBMke9OA5SPLZc6H3daKCnhhBPz1mkgwP2CD87t4ZEyCm1rkbDLVHZPRTM0896Wk9lCYNKcdUSXx6GxBV6ngfa/ztBXAXW8dco2mjdmXQ20g/eT99I4rS9SCdUZ3aCwR6j2WaYB3AP/TDX5phgLsT4q05VRa8tVd3lSASxQIVqsWWXW6wIpDdAFcy2yGKfO04CFvjFM28BpT/8hg+Q+YPAz7KWUY55mmq0eMs5wgD0+ePAmfes7/zvGwR1LC6G01XyQaW/tL3uy8aBNm1f5McF2Qk3LsEyUV5bwmmHqTqlgXapYW/VYV2ESytKdqHZqWsg/OhG41j1OtjVa1d9UMMvyF/XMeA4X9xKxg5VMu6LVKbmU7C+Vk18BcRBFlWpPG15yU4XRyOeorE9v0wvACkMqeVlEkaQj3IkKjBUxwq1YMplKjAT4HrjwpYqiNQrHiBfZ5B3kgCxE29ZrQwI2euBS0auqEI4d6ZhalL4HIGOtDpXxEsVH0YZ1Wh/EbArBJCLPDoGKlpbJWFbAly3HFx6HMt3KntdJ9jIYvatsPcmj3RsbgZ+gRGnkKGqBAjpgG4pCh3KtmmZi7e3RSlXcgu/LW+9+gy437xs8ZQNZNpV5ZSdl2F/SI3BIv6z61TWt0EUBr7ez2ulIdNJFEmKg2x6CZ7MZev5bg1RqawYMMJCMil4MSPryPrk40+W2hiKo7rywq2pbMiYUPkURfL98Nt6jj3iId17LVhQM4/lGEIFUrkmrFAspRK5HPrM0A8SAjqJNzC6kUyajM5IHk4PZtiRXlFiW/BwrX6eDFGPN3l28o3h+wRZFC1/+fY4lv+IlL9kInw07Dbs7rcylxVbr3FCHZRW+UnHEfNegxBbL052Kp5wFjJLolkKEeKU+0oh0wdKBje9HxRi461P5ziuD+arSmt0BtHcWVwUBiQoe1CcaTP8ql8MzYk0Q7S0fqWMs+vuE6LbPWShbAIcBWGjam9pDw56v5Xr1hD7ziZ+D9IfPsATzrXk/od2z9bY7f2URxxfXa+yDUra8LTe7eeOYDXJDnaigZNMZUnKEkqHHUvWp2rRgq8AS2yqWUeMGculSmBzGCoUC8ppkgrYyLbAeOmw4wbgKhCwEhJb2aMK0oxUB2EPKxnQqjCo+wb4qUkQoJNdV1pYeb37caAooHZj/PbRT5b9LDtHDaBWydMw2aWsFWrDtKBlCEXNIMUoVfpq6shxNhXpRyCnRWpZdgAjeBJC7yTpsCzahFR+4SrkOEs4B7clAYjKlP0s9krZmlT4JWt6o3bjR9rgCGI3gEox5Wpwmhi1TDiZPNIAUvaeVUGSbjBzkM1legA2YI/P9sWWLH1WFjyufRUjmunZSMHKRYQIeG6GqvW+6ZfwJkj0//ul/kU6O78h7mvb7lHnofUqVDfSog60vH70WUn8i0MN6u9EKf71aq6cU6cjdrteetBFaRE14XvT+R1Wqtl6/d7TUS7sgwZ7s+lEwcYmMzocWBSDxSgfLx5EFahqBLIhvnydTOKkNF1OgXtU5RJcVC8qE8ufCYiINdMyV/7N+R4/ZCDvgvGdCrNYNLMngLfZc58NGcc812UzUkd5sq3q3eQA/00LwKWQknynu6eIX00aTS9cT9R33E9hiFTF/rjOEUNFWGYBJC0HogKOUTEIUfig/QnJgwWJ14hTDdc741/XvyE9NIMK3vYxlB9cO2KuTWCrVcR1K18nHAmehvlKoZd82DciqVUpgKA0cgrfVkaIIQWWgCpJSSHQcV9tS9BdhkjTh1zduvMjG3kDNL+/V+HvE6cLH1gtb1cv+7BXOP5sOJJKEfaYBhN7BCSoqzdOAAzBODH6R5qnALIxGUWtqrsC3HTabWFttgZXg0kTwRrQvApPwrrNRaXqjrt4qS3rPhJoHorKgAbocQlbO8L2QsC5hWnWjRBSYH/cws1eUYiib/OW5hOg0QPzNiCm7cVcU8HY6Zi0cT4JIhN34FrS5iK7UHPNTOl/lyyog71gVoN2w1BqdoSZYsTZHC9hgQWtH98lC8LCBZDl2AvRKaaz1WiXsGp35lheisk/VhMtMSyrStJ+AaNKcyjoObkbqyzBcutIJKlH1tiArFGzbd/IqvmiW0hVvHMHlcIG9AKVo3WSTRkTuSHtqUmjBVqiDakNlyklCm2yfQD0Jao2LZjh/fZVy1WBrs4wqX67XdOP6Nc1TR2yyEKE0CwN2waR7pbLYdV3y4EH3S8314m/zRISRm3pd3hi/xlwaA1XAYoSCPCi0tRntYqbaIJelkLGFFVXZgonY+waPoGycgK3SClnxc0se+6zfal55hp0DEqIvdN7ehBeeFX1RoucF0uI/L/iNrMWzLUzxuuXXX7aVetdZDAU0UU6uFIrgLkibV7xrP2BwzpZKc65sf1enlkwec5m9SUEq5+7z9VLQXQKY9/blQlu3g85mjZDcWehkbSwK3Amy8VKsyfdt/VCCPLzP5tu0g4yOa2/ftbwCRI0TKIKjddKWGBt3ZUTFe0GiqWIouqWa46bJ4TjeraK/cWLuhf3Kf6+q0q4nYXOfQ1C+iWPSazMjEYfYjLujcXvx8m7XBcFJzy7WSkQRYzMjzWqIvjZSKX7bQVunbeMz/Pz3hY2UKGNKyLyp0lES31o8s+1/pQBaSMdjGIGF5sIZEIGKc805W7rg0D2HDuuhDvBpIJCyAAAgAElEQVQlFYUVxrg890VvImdiPLIg90zgNAk7/Lku+L2eqa4U0ZNgrUHV86yEgsjhnT3+rDEjlQB/g9//K8sZHbS1FnsSPSQfX85MZSSESUhOO3LQq9KJWaQ/AU0NxWZHbMKWfjrf9R0XortuVMO+3PKfbN1ZxA5HF0s1IH2Zbc1mp31/rLfkr+s+C6VCGhV4trE0IIRfK3mpvI95rFHJU2ElGNchIYc1+EtV/bAlR6XgIfIWELIb11NFy9ORBSdJOwEnAqIsmxzTWDWL+Yk8UGNyStiRW5fizAuw2gspe7Jc3nDAPvmMVuNsuHxudX56R4oZgSJcZEJzTv63kKKvXTuhJ0+fUjsXtZS+bCQWUkk3YkvJMBSYJUzsNaqiGdKMbKmupggJrxOs7boRA61tpMLDas1GeBhrDOIZ5U9u+oq95Yb/fMx/SiV+mmweqwPUsuHXfChCw3xBxIvmyiYUlm2kw1nUw3XIRrlggxQPLVFOpmznupfAYDY5jMbBbWxxsH4FU7VGN85EbceCD49jurKZxPcTZIhkyGdWPu+QtIGy5a+LjawCT7TZjbTi0L9aZ/qgTxqvbyslUGa97GKeSoSADoKQx+XPhS8lBpTlohjZryHGUpzU48QYSdmKFhWoej26fYYixLKtzxCAqnTOnGxUY/K3QqNAIYxc9A7m3WbzGht8cFkJqQdUqAPk+DwVeIaXNggtI8YnAtZTqyGnMdbbx58exuGWi15VINa27cw8akqFCqYKKaPx0rWQGaahOImv8twi8Jtl0zT03mWL9Jo93RKeNIDNJIXLXKUsbWV5nwxkl0xX6HdyaDJ6x2t+XQmVp/w8AqSfDp3mzWeazwG24Riy5cSrbwMdzht+/zXdDKbDKvny8bJlb8mefGbdNfm+b7t2ITBCMaCDfVhJ412aupp08+Wzh8JDc0Mdr0h6+VI4H9zTtGgYy+qkTjwsG6uoI64hlbRZ7+j8sqf7FwMbTqDTXq4LPydf2+dFgp0IdDwRzTBidoscUgYlydevZ+Ok9nut1XpPxCJAEDi73iq8eY/CKaKbNmD2P5UR7FFhOUESqvj/cfVmMbdt2XnQmHO1u/37095zble3bt0qV9nGDXYcgw2JAQmBEuwgHPyQBAEPyCISDwZFKC95iCUgDw4PCJAsEYEScPKARCciEkhs496usqtuV7c/7d/vdjVzMr4xxlx7F1U695zzn//fe+21xhztN76vUGifL21cvkvj2GtKk06Iv0iF6dIQSAx1D9CfK9NFSIJTA+DZW6NXmuyRDny7+leiL8Y5P2igphDyaQ8RA4xhZwp8GRvQYrGm0WTKuVMvnme7WsuOTAKniO5UpoQTzqpLVHvTvYlUYYaQSSWrSiE+GEcoDKvKhcYStoCxJV755XrJeZ+ioxAWX6JfWEF4y9FsUtKIDXE2G1HFP5uXmfJdAdySZVaJkxBokI3zREEwVeNGJBySR7C/D4YWdnqy0uDP0v5RGL5Xlgt8atXtVkDTz3lTD5H8L+ift+IIamE+3PC9X41rmhy2VC/ZY3PeueDKGfn11Yr/zK9/3kJnlnPk4CQlOsD9BGbYeqvYmhhbqpWgeUnFJUXXYUpkx65Jwncmqy7LlbZKngApqa3kh9bWTl5y4Hmwe6c4gSjj9WA4Lm8DB0pjYZcILWTZMIp38k6xlSElxlaFyeAvhp/KmsVPd/i2tpE3RksEtOYh5vKw4UHRonLmNTphneYHnumUCtOqKed24NpXlTvDoVo+I01ifjCHfBOhHJ1b+6a34YA0uAsFMBfwpFj55YeW8yG43KzZq2zZg7b8GSI954ey4c81m2R0fDymE/51eDSV0O1t/2pARbHBY5qWqlExoDxX4uE8HxiwBTvQ98a1ZOs6IZqHTSK5/U7uwKlhwuNnFiHEgPl6k7iG5GP5rlHuEkthZn3IoAcfPAk4NOO6kxbacrNVQo8K4bGnzaSQYL2G5wVzM/Jt9raXy0AXXKk+a7SDcIjVc2gX8HXOBGCu8/2ptOrIGFBQjPnBWNK2Lbk4IPjH8JKpl2Bc/IXJGKUtwziwDMaBuTz10Z3dawWyuO8Ro0g8Z5Kn2vtGo/iUqk458IO0arvcxBWCZycWfzJr138t3D47lWW/DAQOjaYLheJM4U3x4ovNRtsXXWcPspdQiJua8lmELqywiJfsd+vVMORC+Kxs78b6gTD23FwdRp4ortAeCk1HN2ycSOzP+Xd0AT7m71+z+58eZvSlB3O6f/eQjg5nwjUgJFwDJbdORMSDeSUvcyIpE4YqtEzymaYaEywCCNbTxN6Qq2oBoUBiF3ekcqndh/Qlc/Q98nZaWCDs79D1CaOZ1A6dIeVDphRIOCQl3+8CUvKcltxyhKpLo8ncVvIz4iyQKnCKcI897s26pWv2uu+/3NI5e1hA2287EGaQKMycCuimp2tTbTlyclHDvtUoKfalQswOIKZmSexDxIC96kklowNgBZ0DPyhduz1t3QE6okWrSZF600tQB2YrQ8alKpMyJLtTLgXvFj1Xkiufd4tZ7/LZhZu++jIWf2oVs3+76m6/L2xuvaxKV1xlrxZUjUrJRWD1q9WKxqOxtaBK7Zey8W7Y0425sBJ1DBhpo+hHGDx4L5cbfCAjk2UDxmkf4wlizFkq7SSazDBo6eBIpZ5xeF+IDsDLbksL/rcnfF1XbKCzeUHf/+YZPbp/TMdHc9GwAvEaNmSFqrtpTMqSvVFZ6mqU9FzVYAstSqU6DzKh0gKpk0GA4WotZO3PUhRoo7lfQgC5gZE5DGs3Me50D6Lt0Us4NQ+fGbOLS0BU2SfTyV0ODEVvKyrY75pP9QHzz6zWGzHYdauseGtOEVbrNU0mgc7YYE/nG/rW5wu64fsNeaRb9rKf8Yd+j98bXhapwYmF97lge3dk+WBV3NpCY+G1v6trJFrotM62C0wVZZ+zLFijPw4Yg13+jh6pgGiybFAPVyxqHKg+RYoJdQze/4DztDNa8Om6prxfvk3d1V/jf3izzA4elXR6/Fk8qLL1pVOiM9LQOTwUxZ5K0x7apULQm/MJ31I9Aof/SjyR9Ef5e9rOdnCKYigk0ONMuFbMtTHjn+LfO52liz4qrjvX3m1gb44q/oNmRSv+QUx/Gs5B33n9gL725Ud0cnJMd+6cKe2OobOBTZVDwjddwNSdXgs8bMZF3NYmUoj3GVtrBPEwRn19Z/c87sIVvF6vC4Jhb8IUQxhaGM7IxFIahIZ1tNZVtLxvQCBFVbgb3ift4ntNc4RhL0vqhEGKE+cK+7uBrp2KGqH4A/3RfMSfidOB61XDOW0nxguP+/nLW1o2iAx8DRtPF5z4vwi4h0TP2enc5Vc5jEHUZ+akq9eCoiLVPMjMWOPAmaufTZ5Q0EGMkNj12lmJYWfUtLfZQYP2Ixdw7ORkcwD32u/I+ERYmdSp4P7k47ikU/ecDWTFaUb/r267/t/Y9vzo+wuuqj1NqKayu5aH7S1vQqWMNwXXaTbOZEX65qa1PMztcLBBgSioWL2xAHrjiFJ0lYIXtqLRHjkcYZFOK3yX56ZZ5CUM3zRKf/ZZu6ELAX1wocSRwM0z+rGv3KF33rhPZ6dnUuRNR7WqU2d6gMTL4cOi57vd6jozer6Se/YyS09or4bTF93raS0/7SSk9dbvVJ7YFKI0bx0WICMNM6cshS1ZMrT2TMJYEg3qIMjFpP1mD1DTAk1DkpcNUfWckqyZUE7aEpxLbTFhhmskgsihQBRHZNp2EtWAUkI+/uxqSbOKIwrnsAVXXkgFlmxYN/xalwEAcC6++I3u8N/vIB0wUPjYq/pgZmNvTPCAGiM5KGnSbuvqssTXq7J30GIqT+zULrFiqwE7Y8vxNoUUYTxpfe4fXLaTO+Epzbg2Pjk8fH2zWv2sC1wPA0zCYSTvXtI8lLRevpSpFUI2PM3ixaWAOerxaKh415zgV2WleWlunMf2JooGJx3fZVZ82FjV2bpyLivJGmqcV8pKCbX8Egs2miXnZp93bKQYgfIP3bBXePRwTF97+x69+doDms8PONRPpe0lRVzUAQM6DUqkoIRgMukSeszOxo6dLthlOjHJZadcDSwk4jcbFWtUB0eWto6kzWMVbdhRUQxI+szbzMU+q5f+q07+SosqaadbvI+lAMLTlWXDFkS0vDcNI2RujhzWJN5Vqh7LeJUVL14KzlHhpbXXo0tTTOQzol98ebPmcG7Y2TWnfBg0sMFyZiDdlad8Lc/4/e7x6zzg30/QKw6Kb2j5dcdYA8KolcLeTlpm8kc0GFdvnSQXs0EToLdUKBo8UA6oiT8n4ZFo3QVhVola6ObHfkWHo/H9Oja/2Habb4zZEPM6o4ubhnOZNfmOA0O/Nc+hUyGRMq9qIUCDt2wanWDlue5LzWZzNtyNtHaEAibtTUl1qM1xFFiSTpg3w0meycXqfnvsVIpmw8k2VqE/4VD/jL3QZwB8sBf/6utH9PU379IrD8441N+RxTCMbjGulbwIhVqnuWZvvAO94D17BWtL9a/Xr5uWvUFwldyCBnJdMhCNyZ9vmyE7TQJuIe5WgbPCDz/TNFs1PuNbAs41rZd3rXnM1HfFoIK/X1MrJ9uXKROWVqHIyKt2ixaCXqKBbK/GnbR6cDqmdUaZI/1YbNfye84q5RCEp6uxhVHx+91ynt+ofCdal9dr7YneWFrwEl0C9n4nUnxxasCl1AF/jnsQTnZqZBshvkhr6Lo86LxRtduAP5jMUiqYgskhuT0O3hSJvbMuyUB8j0MZVj88L/N/x/XNX5zXVK87DZUVJ91XHM7D6kLUfROiAPtOMgJzwJuWMutX2AXpJqpxPcl8Fm0eq66dTSsEnMGFzGrTKHjE8kOEd+RGY76BMjPniwP6CSCSl/zrOd/FJ1hvnuT09XdO6EfeeUTHXNEfHh0L7hWDh6T+B8/fbDdWwCiSs+0a8Wgi6tuF3S67s+Iu10oKxiYP2EKX9JVtiiNei98rQXaEShPVbUZKs5n7AcSz44eNAhjXNEGnUmkokOjjEZJFpijPh5TCZ8renSZ4WSrqjLYz9SITqbKylNjWQu6HyZAQjOEaCydFI4yy5jw8m9aS/63bQrZf19tOcuCqUqT+QR610dLF84tNeHke6OJziocPoj99FMKpj20JetBjdGWQU/qdOjkmhNi6EJI6a1NpQz9V9/ocZOHR8CFhuGd+APHrPWv1QF7fXv+tVRZ+lBPsYrnG2gZ7pHIkHglHLK6vlEqmBTC6puVyKQ8U7CdSrQuyvjcu1F1lK6EJlXvTDgADWc1AG8UALKIj1Wurp3LK0w8vjZztlnNJ5KK3/H0fsqF+Bszo1NOPft8d+sG37rORTukYtNrs2QFcIAslIlAmi2kkXQe1G/Xe+NAIqzIOsUJG8AloOnfqSRByNWXIxdNnTrmasswIJtF+aTtr9GvOKvKZmbKWJAQ7iDcS132ar2io3j0YZeTWrQL0bsUhGSGF8N77tNNkCHkDiwytLyuyggkVJ8WZLKoySmuqhDIQxPtjwFGBrIOfZ88/y+nb0RRkcsARw2kougs5+/E4u9y0/X/XuPhrh859vG7CatXF0bsxvHIV3b+08PHPn4b4pda5EqMfMMxMs9wI2hTBJrKd3miObBSbOGtVRrQfBkySa+85BBk7DxxofO3XTbb54vl5MR15Pd1AGiHUtwi9bLC+l1bUan1B2KeDYU7HtSrAoXL2ivGUhretp6S1AxRdXdsOFSpuLF4/TXDQF1xjS0DEGpTdWPQ00XLhD3fJP/sBG/J3MWXi9/6ZLx3TV1+7S3eOD6ni/LgwI83ZQ0uRhP2mlcoBJQlL2SviG7hc31LFhyuG3a57b0YljIWZcfzLfo89cG90j9luhUWILEzxQ/qG3roBe2x2SDkya7vA6BMIJ5qGfZIBV4qjXnNqSo1xTQlk8bFXqiEpOg3Eky5MRHGN/z+3FRBMBiE8F2xlRynm1QubIqvcC+/xffznakRPbm503brkew7nJaldvNy28b/gMuVX1h1dHoxymleB4HSfL7uPrij+1sfe/b3nXf9zpxT+3Ct58dY4dKUAvmV3Te8PrkH7rF5GSBip5j4foknKedx+gzXuGCVTKiY1y1Wc/9Ni8flP3iy6siww/w4y+bhuOE/hrBEzP4RpeIK21dzCmfQOWiPwkEKEZtUwPEkRquFNVcpcc9JgkLeu1we2FvS/etNaSHqdeI0Ve+EbGCifyPdwiznv+/rjMX3p8TEXfVwwoT9aV0P4DuKVg0pT8s+gFZX6gOC8EpIMPvdS5cuKhRoQrqG1BcTOiNPA05oqGGmNWfLfm1ibjoi97XzpBIm8t7RjNxodmvc2ZBAPmmljnGwSGO21g60uy3Jgp92AHp2STNOoRCznbE1ZwOJ7eetOdSRTlmgDmfvEIs0HLaBt2HTyNbSYMrBwo6KHwAc/18XNRsXXct+OqvzvnN9sf4Vf9LKL6Lv2dDoryXNacJIBHRe2qy784Xns3+XC63+6aNu//I7zPx9Cc3zIb1bzZ5xmmfCCyeq58AzofplEmrIcxrU9QOBC25MlaP+whqIDGR2r+tvR/b93mx38wbYLEY3i6+WGbhYbWsQJrWM1eAT8MCYeMLIpGwpyuuVyNVC2ZOYBpMeKTkmrzXVZ88iVxkVDnbp8TJuaPvXpiOZYewZ8sG/oCw75H/Cv97Auwp/mlUM21DdO6e7pkbRaZB27LHR3iHPRzWJBESwpNifO8r3iTaZnreSs8C4AVK/FGDVJR+EEA/fSCdjuCnGrPmEUsmUbbKfdK1+W2xNVGJBJe5W7ox2cTZHtGs5zW3RM6zkuDQfirrsgaDL7vtT41g3ebijsvOW6A3jDUploC4ZhoGajofDDPUMugEiHVAOfpebXGGXA8/LvkorFp4tV83fGdX6FrkHu9VoQiEecm81GJiTCP3s2yzfTSf77TzL3138r9L/0cd9/8/O2CVd8nQuMek0ULY2ic2tHJtyyQFL6/nvm/5oK9NbF24Gw/ao4+pPz6Vd/eT269wcNWv4tRMTG9Dx/lStuT+tGvRUME15MZuNVNvTvpGqONMjxOCP0lVzUPCcGAPBcmRG59tZID8OaRhRj7Uxv9MNuSy/4M1xgbZor/LcfjWk+rmg+qqT9lBkLsbxfZowfxnbdthoOEyi775VoC8Gnl8PTivEinC8Xtyq3Dr4qzs+BAU1ei5IRAerG4TSzwiox0cEggXfFsWQvNOBPMf0KhnwS0g3SQ5x5PwB4FOOrbMx9r9RCipaiYZM2cSUk7gPZ5k2DBevfBgNVu3RdCV1v3QT5lfvhmpH3oc/qLWXJ60IWJyv+fVSnQo7+hJ/xu06Z0mnCOe2k3JPgVHYKGSdPqlzuJV/RxXXufvX3Yv+LH8X4Dz/pu80L/uyX0GlI9OreGLujG4o8GWU33bBW7dyOOnQg+zQQUh6yqruqH/yDZnT6RbE9/5u+3/z4NptnjZvQneXv0AbGIK2eVjwJvJWgbSC9M9AmRqmQV+ypSjYQPHh416zOxBupp/XSEkntoOFUCaLfK6SMf33Or4GWyIWN1B6eTOlkPqZDzoshVwlgSW7sfp0ZRLAqOZhKXDRytkQqLKx7Tts88rP8wyt4YaQcVa1jVWm667hPoHtmsK7b0381mB/yYtwLYGSzQteucSgFMGNwwIRaT22vgam5VwC4T60pG9t6a447F4fqF3/3ltu7vQIsJjZpm/YkLLH1dtT4LcXppfedyyHsZMQNnJCXSeFyvZGDDydyBmCLpO9+sWm7rados/ZAE37PMRsl+qzLVp1PBXww1uIxjAB2t3Dti0X7j/+wDx+/Tu7fZwfw7z507nDUbmnOUbDwzsgltAhtRf1GVuF9IlVLB24HCnADdagS+fq822TFbzbZ6Jf4uv5Lvj/fGG3PKd/eSD64uL5m76Teajqd0PXNreScSoLlB6QQ/loIy/RG5uwp52iNdY9iMPCCesCk0XSSKYr/c04tlvz3j0Ecwf92xnkR9D/xmsilUi4pQI8ss8a+yqpLFWn41qRqnUJHxsbYcC5UgMJHvg9GVgng2JvUliuzoZ0ko8uuG5DqXdsP82oJsb2SMQD3oAyFXtbC0eHA50SKJOAc4V9SoxdgDboo0fgMjBmb9jiZonlxn0h4va7TRCM9zq0ekBQh1y5LsI5LNI8LATPpTQuPQb7X59V8T1hmvGp/iXdlR4KiZ71Gbzxz2y5y1C/Kpu+XeL0bNs7bFrDKKPXD6UFFV7drznd7wcKiM1IILDLS0aQIl6vuu5+G+MvbGJt5CP9B3naHhJWiKhPcRh92U6cYne+Wq9f5D6UQzETzoE4x0gMbonBzSZNd5gZcbOe/xZ/mf0A6CkNthK2v5Bu/1jUS9h7jUakoIwlXmoeBTTpRSeYmzVNaJd4bVA1FtZAZ9Eqw1QY9W7XlWxv+WXjSz/nr52guz2u6d1BJXqW919zClh4M8ZLW/MYH3G43A2pJgLv8/hU2Dfj7NihMOHyj36p5YC790KFCtklYog2SMCvVcWZ9Uq8dC35NtNy8IbEU6VSIMQr1peEnne3DCw8ofj7X4QJeTwo7sGvnhmRPED/L7XUyo7/3e0SKWjwp8zR20VI64IxbIHlw1AYCkhEEfVAFbaPurAptoEPeU6ZWJe5lkKmjfD6V2PvKOHdv4lmPcHiRu3dYizHxOX59LrbkUGn9oduxODiH45yL8Zy9dHZ+Xfi/9dux+9ufdu31U7aDRbBdMRGaGDQhPEeck8z53Bn+VWZ8VmtEO9gayaynpX4/YMb0D4tu8zJvOH9zgNj1Nq7TsIicAjs9epOciQbkg86UrNXyA9I+mU2FLH9SVJWS9ia6cSTyCANAogMc8dKwxLMKvT4UbiP2TCnMJXnr3boiclQyqJ6MaHNtjejouxU0FwwG5Bh4WCgOSpt7Y5JVcd4L48NrZLYhK4djQABZk38Y7RaDkYmnxGuZ8WGEXNjfJUcW0I5OgiRHRTUvTyi3VWPbtDRoZAxxr0PjBll4ua6oGABvYG4yep3OHAGcM5wAnmvazDBVdfXsAuaOim3dy5tH1j0h4Q4THMdDPtZ/Adxk8p74Q5WJYxFNKyOLgLH3Biif1MoUg78fTvh+Y8+sys/Z6fznn4T4K+dd//zFeh2Bz/BZMRDNyRqYiTSHuCuwnEWWtLov07qC9EQZ3AG/XmTry9uyrKmGYvT1pXIlleqNtJqmvZaL9hyBPJ9wHinNe+Q9GAfammyCtfW9jvwEALKn9bkUXXsSvCRGbZPSD723UQU44V7fMe2NW59O2xdk0Dr1WmVVa8+wHst1j8cTUwvEnlNtBZQxfQhlT2a9XdVa1bl8NqDDQpo9ywi5t9FeknpUcEhn6+DBCsgYaViOpL3tymyPwTsVhDJYQBqzx3MvBwEPyA6FNyCxTwwkIW0N2L+Zlwq0Qy0pFkcN0glCSwFEhRWg+IWdsMNxIUUTDgD2OJum+7dmZfbjPXuI1M0oLA3Bn2GQMMY617EtcBN6AFDZRymyJLUo/MXz0v/Nb/X9L33eNh9/tF7GF7EdQOtYKwpW7EYhUusHQrtdxW9IM9Rkymqik5W637hsu3Cr8pAqTmjQspIqE2u8o5G+gYV5/AXeEzmZSEPyTQBxGr6GVKAxJWnhg0KLw6RgwqDWpyuzG76wC7R92LsejNgbQcA12EaorTFLlyHX3aXWCpS27YZpEoqCkVyf0/Qiz+XwyGFJzNY2hoxOPXAhLIDeuFLdUHFnkhJoOykxwcAY4E0xqpVOAHqB4JwyJRkt5kzlxF5Hq2vtjPR7xpnGoFk6DLaXBWMtxCtXqlMvk55kiAaPs/GjHAZDFgbD2IrxGpmH8h4k6XQSvi5ltI4yQkVkKQqvqQE/N6QFcCarDv/u71+umr90ue3v9wYoWrG3XW2DtcCc2IUXOr4orLCa26sXxPPAciSM9c5BdXub+//+gy789Zdt98mSr7UNYUB+cY4q15aeQxQ6dExFOwrbBXWba/5zSznCQmqOZ7Gjg+15/aI4/G7WLR17sSOsRyv5FRT3CumdOuPezyzcXd1cK7OIIII20sZarlfG4+mGQgAfEvs/aSwYbapyhQvzwlXvmz5OSq4C5mOON32nvFajWka2KHBay7+CAXGjYQUUdBKsNaMP3ZVuuLG0R1SY5+Uw7m1tnKt5tybzCmS2ebvpSulqBJnRB8kT0/QoWFiUMO33KN+DIs5K8+b7ekvR9rOSd1b5nSiAEllP6XfDAJ+4QxMIJpDpE0TpIiQ+fGeDBu8TLZOmW56Mc9YpjhasKTDMLbZ6R7n0znHojsYCA8YeU5Z18V/jHPV803S/zJ/jc2SGgGOKAvi2E0n7ceHkPuDe5aKAE1CQ8TMWnIAcANzHg1mx+exy83f5cc7dYvk3/Hg0O/Lai23W68PQdKNYlrfqOQv1uH1Dm/WNGGvc1lBl9NLMxQOsgfOM1QdxcvhXztZfHC2Wq9OqKJy0nWzbUvqVfGFoQ3mDn2HiA+OEB0U+iJuYyK+CrZrIA01ecFCqVhkfeMpeEfEj/uJbZeFeY+P556o8+z72NJWe0lx6s7ooZiQGe3Ayb6zHKP4QSqWgSOHSqeo1/g3Jf+h3mFgB0XhNG5AruSwRyvohtCZxDCkogUCK3shs3TDA8OIxc8WvJqCziagpBbgbYHnBNnZVDUYLv9ZAKdHYnFMDn6xdhcMn1+0tNUgHNegiID6r7KoBgJ7nA3RQiSR2SiSAA1e5jrGJU7Xt5pZmnGNerze04eA55ns84VTAL5opv+Ffro8n5ZOLzX/MxdQlJlzikats0JMi6WzkAxMUeBDgbbFq3rDhtkFTkLN5tX52tf21R1n258/b9p8f54WbYKuizO83q9VBPp08d/u0fpyUVuNjam1vKg828xb6bH7TbT7ejGnxRb1+9sWz5VK818gAx/Vsoq+RK7j57M4p3VxdK4ijrGSKgzYNHpaAUb8n89YAACAASURBVAwBM+LqG3A9IeuCd4ax2wU1VulK6yVgjBr/N86jik3Xv8Gn/j/hB/hzdTWtJDe0nK1L7NVmtJj1a16WK+IdhZLllkZrrRojBlFUlWdvfUKb/VtBljQG4KlRNLUilpHr90Xrg5IeHPxdvHmv5BLJCJ1tQji3o5mLvdHDm8GUqWvg9X5kJggXbGdKR7R+oE1qrQ2mibHXltwwIPeDPqk4it4wDH3YrbwnpsDQW1GIVlXPHrWkNVvoARvf7arl56TcpMBhbDs/aZrw56Z19n/wl/8BF1C99KEjJOM7abltbdwJVqYaXrpXIbhUXHfG+nLARdbtsnn6cdv912cUv9xX4YEILzet65YLV8QTI0BxAzmfpGDlSDsnFHfiWA22C4uaZnHJJ20tYcDZSLDm6njBhos9+YoNt7WlLLmRNo4TKBoXUcubGwnRwxTH8KdpF2ZQqkalGeBVSToJGOdNqzzwidyy5/o2f89/yg/pf+UQEYR+HXjQtvvenSQrLmSlt22H+J56npTouY3WEakK8j9U5jp1ygd6TIH62TRLw6wTLyztJMspU0tI8aA09DSlsIPHsVZUYvLWHXWd82e2fYuxbdt3VpGrx2sld1Ni21b0ptD1wJ+9gJq3KRcENRHIKeTf4x4RrhZM3roI8nUhlDDhX8v53cDr5KQgyoVYo5R21bREKsZF7QbDnd7oJfzZbFT+Vf73R730TDn/5M9593BC8xKrPU5+LbbAhLTSOUh0k72sxauf8Pxzh9Oyb7z7+y/b8DdeLtefbdiaOb/kk7KdhIEKSbtMSRnF5SP5lSuFtUIEBIyFnGhzJfhNPDD5unkOsPVJuCyiQP6EIYWNo6pH4i1KzmFXbMxFng2k6mkPPtIuvxs4vmVCsSN+VQgg500zTLfE0j7m//w3fFP/NBvqCd5rxBV8EDYRDdsAKrextRDuZHszmjKygE/ASlcVMjpVeSlNEVo05VN7y+3WRoIhqHqDmWWmmbTmgzvoY1noTMRkmq9ne+0zNxxIb4JyveEto3bepXKWFMlaQK2kMrqNmyWZzqGbYWF8s5UUTNrf8rpJxU85EVSr1CJn0D2kaCCauswEyuikkNU1ZbiaOUg4cl1sRJduvmro4+dLWvVadLHhOP54X+Nr/crRpPhoLUqMwGXw9fBnxu+3jVIVAT64aoIRp+US+iV65No3J9Ag1WH1wbL71cm2+XRcFT9X9f2PtDeLO7XprEqqZl0TQZJ5LfIEHthZ+Yg8se42NHYbOl9thtCKuTjoJRtL8AGkRoUtEokckqaY89sasfYda3KLlc7xTWFYZSgzPnX9oLqS1hNmfKKFkJdf/87RlC9K1VECuxv++u+M6/Jdvjs/jkmLQhFLWxnZgYOT1IsWU+otFfChRVaGn8mLoaASb2odga4PNlnTsaYwTptAsTcv6m3mnlorWjRpmy3trUvv1fiV0kHtQ1Io1PbPVoAvxlVvlI6Y8gRrVfVB72PiawKHKoxXIonpsKAPjVUhzNuPpjVHoUwA54OyNym7N6IvfCK6MrkrZGwqvLaZLmeikJ1MR/zMexpz7j1mo60vuYDhaPj+87UURxiV5gW7g8zXHNYdR6J4u9QNhRqZCIR3W4U86tqRHvSb1Y66CY5O1s35GuHozlfd8nmk/3m03vzTk3H1Ji0WH6LKl0LKesXC85JSN6ESNQYhVXXr6Kh5SsXmpSzFjUdaIB3PxvTsxYWcEBRN8KQw1DVX9lkiOzNku3f0PVrIuBlpvp/07pPSPJJk8b5ONVSdIZOqcSWEwJ69wKZpF0WeX0Tj+BcDwYNEP7AqbfvTwBLSflLjAoQwsww/tzZQP4wfc1M4cTsOgn5PBUY6GF5GwQnniXwJO+iyqpKGHfZnIf4yEuLectGEKd10jYls6GHu9mg98edNp14VOXwvq+ebwZNiykTWzUDu2LZd6kfJpO3idiXe9P7xjO4cTmkGriyv5OWtFKAi2iMHTOIHOgSFis5lSssiPy+9Vvl9bP1pvu9sfB9fcPqHlIXrbk5DFoXTDSZc3hc3LT2aaZ6NmT0Oy3KrWt/rTSekHk7omDwbLX99rHgObIUUVUfv8we/H9BVaM+hxzCzvjEZ+2AC5QwM1r1S9qiakLC1scXfbnXs5vTEYJSKfhnaLNRrv7QVUgmSHSI/n8n2puRoBpcT4EKpKxbBqC3VCyXtpTBIp7u9ggMrSaMqDD1U+CzwsQqgQpJ20AmN5JQ6MYhMdt6jPYSiUpZrWR0uih0aqdH8FR6ZjCwC8L4UBXLrEKCdpOJtO00kEVTodwDnmLReDVgjVb553TaqdxQVPWzOpt4qUELOEO2mOgisJheNktdhTLnma1ywoWqu10kECwYdXGCb1llLpwdLDRtDoUD0609f8L9vhabzwemcDvmgZ+AuGFeWm1fWTdC1ZhSHeH8vhVu0XipGzLoeAuqgO/NK3uezK/Si6xeLTfsxRqeTWou0RmgunXRsir7T17MpYWJ9gTMYlUDgRVqxER8djOSenM0quman91KggOwEJpNBNdLFOHBJDsuSoj1mmEGpzuOGutWVCqeachweJHIV3RcC15P2SXGz4XGkpyptqVy5+p0yi0hBEv0e65+N+Gg3JsT/AMqecuiHXDoKtWkJtRW+6fxeIZcQOeHDdIQWDrys0CFKB0ANAzkq1mRAuS1EEiKMpo38xnAAuZFMSP5jsj+yIBft4CTPSJpzi3SO7Sv1gyFnipjyWmHnVpEnrEGaZqUhwWqzGZYYJR8FORgbg7DGOCWLuLxd0pLv3XLdSCjH577hPyNydYaJRe7YGo4V7zvhfBveEJ4J5Gmrdis7Zp+9vBHDvVqu6Whc0L2TubwHyN5mpQGCrDYQ8Y4kl0PO1myUJG/K9/Ph6UyeP4zvlg3s+e32E74/L4ONT6OxX99soXkA9FQmvFZo5ldwVjXA7705pVya/zBoALcnBWjYc0kzHHte1AqZdJPcHsOMoc9sSmgCv5lB/yPNwy11Gw7nyF+MQQ83aM0vhvVoGBMqZITB5WKhu0LohSXoGd8whPlSsJc05HXeUOZt39H3JgY00LZs+2jMylp1YmoiD7nP3uYL/pLM7a2pnOVu0BqQh8lGCuEG/N4aBjJabxQHUZbw8mJAWUnhZBKIMsaTIYKORzvbFkCrKxFESEfEUEYJPkhW9ZMZc0o3YLwYasArSUejU10THMJNs+SHpBhfGNQ1f04gkRqj8cRniy4b1oUXxi+LlefCVF0uuYbAmQLjoEzlkOeKsopjR9HR+bKl83VJ3+WwfcAeFTDTR2cH9Na9Q46IUbdwgWM1EbM+6CFMCtJYDKxiRncOxnLfXi4a+ui82VRZ1mEOJ9ytWF0pSOiD0Oi/WW7FwDE6dbL35sSLSk5sY3cvvW/tPeP9RhO2ozWnefM5jR8+MF0Yo0ClnZyQ9qORe4vci75QvnopOlEV5zaHBwf0+ZNnEm5ES4pvcrAGP1Z50b4SBmkjVkLCnhTfoDCtVXAYqBRxWFLvNLdcLbWott1OkhGnDp7UXstxUXDCefIkWKNAVkfwS1ophekdRSN8aHWz1Rr+ZHQ7iSjCiQffqocFyS8/CJl0ISeTRUCdVKGFhTQCRplo3/HD+Fy6jsJek78//Vly3FZ7tPB+8JRBWEyieHLk8uCHveGKGKPIxQoryjCqLS03ujaTGTFb122lSkaFrj8fpLjEQcJ96myfH4zaZRaF/TnLdIsUHnWUa+fAc4S7uFmKd/3k+RVf04reeXyHTqe5Tq46gy8ZPSb5nUYUnutk5Lg26ejOdEGPDprZh5d9vW7cLRwKDPKIfz25bjSn1G1JFL80G7M3XQfb6o3C6erQ3vPa9eHXkA7AAX9fPcrp5K3XyR2wB4/d0EON3sjuUwNFDpPYciYLfTgtONE1H8N+vdStzmEunfp0TvJR1S0SlIy8UJtIa4OuSAiPv/1Ke0laue6EYdOEFZ4E399pXSJEFM5CbG+7VlK55ipdmdiIUy8fhUrTK9ls13cWXp2CvTtreneKhb1dbnSHC4ZpQBKf6YSnaxsL3/zn1WqQz9zlTHpaBOuQqTGJgBo8SwHpTKV/PGcDEapNcJmyId6y59jyQ3hys5HccgkEmvSOFQMAGGLS3SqkM6BrL4KIEmn5TiIMWlPA5SYmEeG9Yg99y/npAbjAZKsg0HxaidecsUdFhYAdOERF8FG9fndOb/Av4Zw1ImGf9hrtM2bKWsopWcU57xEi3FduttuvPbnt/lHlszgGFoM/23SUS5oIwArgfVBs2W46ad9VIuepwwt0CbaWX3dBe6XsCah6cEKPfvgbCryRAsoN9PeJpCJYlyKvZF7OIT3wqXclJ7xjutrwm/OHR6ieT2ZSiaaRIHLRxXbDL1hI2BgLCocGiXNvImhoCsPQamtJoIEc4o5gMVmpEBFk2mfL9iiBZM3CF5FvyDl/dcmXPkl8oUpF6WTMFiEbGfTnWuEP3coBkp4k34/1io0PAAdU1ULbrh8+2namPCEchGYrYVSka5I+krGUyCIgUh9ECksZRLC40VQC73MD4jb+GaycLxBd+Fok7+Q/r9mTvly1YsRg2FtuOzFAfJ6tEHEop5PkvK3qweKBtkE3YUc5/j3ICnTBn//epLLNUjwPoT9R+CLWSgrsP3E9MSmlAEYui+sUynV+0e8+vZbByr2TiVL9ZFpPJB3Y1NNGDg5jPplP6O7R/OzF8uoXbpv2j5GyXvA9RVSaVMqtj2tZrLVwRIRd8GfPjacr4WqTeLE31RP8zGg+pbN33tJujvWzve2bDUUtlkVdRTmoXTp+4E0cifpyyznT+pYNU3Z/oqFiVHu0NxobKUiiAnPRY22FJ9XCt4znNKQn5JHqQ0RDDmnLqusTyZd6B9zohPoB9Cyxi/Bh+A7nSu9zSL3j+aFWhjZCot0aq7UAI9iYQMUIzyGyio16VlSoSz5okLyRvZ+ghwjTocztsJXIg6DgBw2nPNFFInxh0oJD0+iWArwpwq+Q6xr6HofshnNOHA6kB3g4XCZLGtP22rmAsd9uOhkxOsu9sIuE/iXCtrR5MkUzJWW7eY6tYC+tn0IgeSUdTmqZPuW5YR6gEMgPeTYuBi+k5MzaVqsLfl7sLPgW6Iia04Pn10s+EFt6eO9I2oLomHhSLgBZGLSeML53Fgt6cHKY3Wz6n130q/Mnl5tfnlf+Ze81asKzjnI90U3T79biM91oQEQLMa3BeLkHhVcRjMdffZuK2XTQh41mQ/sq1HAQkosDUlUR+IcWNG+f0cvrG6kUw1YfVieMx5zQ12ORH0C4kv1xNqL5ZCQUPtu2GdooMmLLM0MsaWGhJF/6ejHoFqRr1gbWiDoXlnUNp8toNs9GNV9Xbsnh8LK2kSfZFM2JsBpfD0cDjBovbm6loLjm/BBGuloq+QTaNqii11wIyhYmGs/e5Cr536fskQCgECoakIwVKqle4PO0rRygaFsA3namWuu9ylYulAoF1+AlN22CGuKmU68r6QgOGFfe12uF4QE5n7GHQ552cdvQvHK2HRAV5sjXAEa+g1rHtkgrAC8UufeUSmXe1qUrSipH3tBY0jFBVEOHAH1s/uwH85FElMyof9Czvbha0il/He+nWArlNCgyPyxQAmiDOf3RtJ4/2PZ/ZdPF31lt27/LES+iRhAiP3NowtQi12e8UhjwrDtb+44D3iQzW7j72ut0y/dsPJpolLOCPMY9EI31p1W+B7s18BI35zS6+yq1Lz7i0HHCJ3VNfbM0TKij2XRK5y9eSoMf6CmkBltTRMEDRO9Sha+0oAI0T7wQbgK4iman1N1c2bowePwBoGgGpjzZaERot7DWImeuCkSziQKllCayGE/omvO4Z1crMUCEW1TSl7cLugIBWNsPu09o/SjVO5bZrvRarEU25SIRh/TebCSoKIxbay5MplUlm6XSHROWFO1XCr1kp7v0AroBcgws101rNDzgBeiUYpNvPGBwLR9MwLghu4lV417QTeyt5sruMs0xZ9flvFld8PeUMg2Cp8PhLM2jBGNGEcn4It8bR4ch5XIGnUPIBr2Qs/2tMRsjUGMxKMUSqnUxRL4n1+z5M85pQeOOcO6i5oqIeNHpJiuWAI7mY/Cr+qt112ykcIyS4kwAHME95Ws+4oP34qYx3IUivXDgLo3PCpcL9GZiNkQ9g6GSTsuzYc3IFBAGfd1huc8HfsP+mm6yKRXVAbbhqJnc4QfzksPB1hg4+ENzHlaOxnJzEO7BWSpEt52G76Ke8INsFSMqtOi54KOkkiz5cdWnnGvg3xfKOCeAD2/TF4P8kXJDXS9b2XzkCvaIPepDFB8IRTBubD9+86MLwVEih7lZrKRFgjB0sVClazTNUTi1NtnBNqw3UAj6wjDEm8USIBjJhTDGRRrTFTpJm8u2ghZ5aFpDMC0h48kINwSxJMh8LpDQuhNj1uYbCoxRoakDRhqKSW1Ek+pgpOwyZWbTm1yhiLqyorNxGHsuAxRt88A4c6+GA4Cywv4628swJJnQWyqQGjTzaLsd1YVMW9DrzDOFYKJ1JnJL2JjLC2mZIYvKRPJTwdbBeFyloLSSYjwqNnw/nk7KLG5WOoUD5VLNERKOAs8ds34YIqcHtOkVcgj6X3QGkCsfHtScirWS215fXQ4s4KKh4HaelFySa7PNX3g/bJs2Lz+mfvYKHfiGLqsZfwB290dzejE5w3OgbP2c4+gTykdTGQrIfpIRI+gOOfp4K3k44I2C58PJDTZqxN5TUR9RvX7JObB6PGAGsnpGB2wIl9e3cvOC7fPA6ESfymWOw0SGbgR+5pYf/Hsff0rPuYLGQ7m4gpFupJm9sYJhsVyJ0S/YeJCahLhbqxY+Vs5XQbiAg3DNyRtC/oJv7OnBnA9JlFaJGO+oktwca8XwOD0ELiCqYQgf0AptOHTJxmeG/CsVW73klbVU6hpGoWgymntpeEsBUpphGe412jKeKpSnLVUyyvbOUhAnvWHouXrXG6+UFw+v41s1SEcahpXIQTeFS8Grarozq3Ubt7F7U2FBUZetTATNyDSS/hip6FuV61qLfiZF9Kf6Q8icWx3u4NoxAESq1dnQAYcGk8pgTg22ARA+idBHPnAS+EQULLaaD7TqXPW3NFt9RtclJ9acKzRc/YfxCWU3n9IWp+L0G5xPrqjqLmjtRzaD7qUoqidzYfPDgtiaf0/CX4L1RI+xCwPXU80nG6vP8FLACaBviTAEiBkOwnzcSn+xtUU06RqQ3gRRTpHtgJ4+e7GiKw6vEGSD57ri0CW9SLSeNiioNtIaghAFrq03Ud808wcCLOVkXUaSB6vcBl8l57kQET7kqhojS4ReiEqibyxNd1ux0RDrDcKoLSX0NGEgmAbh79g3K42YAkZzAIJdrs6p1/6oHMpIpgNLA5pKIG5LzcO9rZs447tSKKWT10aeO5JUoeL6opTuikwwXWJb6Qf8gRSwkNzk7/VuJzO2zXTaJydCJHeyYfUdcj1y6Np+WDbkv48mVf7gdr11Va6hA00HpBn6rBUEUxi2GFRNAKJvOA+/ezyW56dEFkEAKAdHR8p15vZ2y4ynYJ/0WDdE+OI2+YxOq0gr2TMaU92z1yvmOq3gFyzYkrrVNRXTA1pfP5P8BFOPODkl377gF2yNOxUetFBmEaDWVyvpo+Fkr/n0jCcXnF9OqV8jD1pTzTmvz2pyxYTG/B6g2lGSit64S/mh1ipbjhn90w1X02xoi5slG2Iv+Wkj1OOcKiBXhUcD1RBaRIL+cgrKMOKxCr3BIhNvi8JrxeEKOEwYIkAbC/bLh9NarhcHBriCrHfG4+qtcs0HklncVBDGRctVcV+BfheVbhGncBIVQP6GnH3DYbExIgihnETbDp5/G0QUAiRkwBPAoCac283ZccArYQCBlCc3CvUEnVzwPbm4uGUb419dQ/eOJnQ8qwULgdl9EtMgA3QnOGKijB+zhxNe/mCdHErUTNotcVHhdbh/gpuIm5q97CN+TceFXAROFnk37vnLdSfRTEI96JnGijqrRbNL9/kBzBbIH98DCIDM+F6LvoINbRIvreyJ2RaqsyFTLqOr8oCuyjFtMoADtjS7+YjC5K7kFgi5Jbv5+s5rdJmfsRGvKZ5xwbW9ldZKWV4L6UF5OKHtxXOqj85o8eIph0X1OMCqIsSU4wNhOhGoXmJXGB9LR2E+4+LFz2i7vBWPhAuEIWoDX1slWz7hT25aOr9ZiYEs2ajR8ml79bRojch+/3otXnRWa+6Ln09MevBEdaYcnY3BmHJwguaqRAdswgZ9nFqnN2vOww9nE9msRP5ZimiFVs1CqutMPp5TgLZToIcSQux6ySDZbbqdhBGikWw2gNOK//zymouxVrWtjg9HbKAj7edy/l5xxFKPgyo9kzQE71FJDljx93EInxfyIJG3f/bsJX307Jru8uvcP53za9UmmGGs127Xv0Z1v+2V5A4DH1kjknxSZSYVo2w7ZrLzj96q42/PvsYpCIQCV3L4kXs73RlDKoUOC14XYnUgLYFxwjC3zY79hO/hbD6ZvJN3HKqb5jKW/pYdziLEPpRFpUa6J4Mk19BwOLqpz6g1AgSfT2g9e5069rK9jdVaTgu2xOE61pxbnZGfnlF/9Iiy7pzCy09pmY+FlXo8mVBg76gKKErAEIsx3/QJv1bJn+SI8+FzumCDxIOusl7ILWo+KLE4oLK+YE+2EiPC6UR4C7ae++HLNVf5W0Fr6YPvxGvhxHIZKgXhjCv20Rz6pYVuWZqgryy/2ZpH3FfK6xV8Y2tSlmqQ4B0KFFdCVQKwdiUTITzSXNT8MsOp9lpw5eoFO0D6IDfeKelaANdVqw8OKcdm0xqKPUrvFM3/pnPSrjuYjeR15HoAAuJDfXFzo0UsesK2RqPvVbD3nNq2Z8nea8KpE9E3Dsb8Myv68OOn9Pz8c3r9wSHdPTlQeniTT0L65b1qXWVVoQTEkOqBlGahUEjyKYXTXFXSnWhL3Jn7gaYPd9k6v4uDiMJ0a+AZDDaC8QAs19rGBPIfXv4F2AK57DgexS995XT283fD9i82736r+eaTj69np2fvnb711V+bPXztf2EzXtE+rY+Ra4hHbY36RR8WX9jolINgISBgPEQOyNSzIXHZRti1y/jG3JYnFNaNAkCOXiN/9V0qXvkybUJN2cVnghTK+HWyszf5E1zzi1xTrKZ0e/mF9P5mB4dsAFNaNhmtqzMq2gUdnN6n9acfiheAh6iiIGUxFto+5aJJdu5zUvBDQFgdceG0pskhpw99LmAI5JJoeWAcKi0YA3gIqgm/bJe8k5ZSGCR3IqUBhc4SwV9Xo6UGpjs2WkQDUXNxZHpTeuRHUpjomkc+Bj6Ai7zRWN5/06vXgudcbXUfCW05tG4W61ZQFmWFPm459CAxdj1fKF35k4uV9GXRR89sbx/vAzAU+EzBf/DKyYTOuOh97eGp5NYnB1Mq3nhAn37xgt795Fx6micc7UDkAR4tFECqFwBBNFN1KfKB+C2lCTJ06JSHIQq2ICTitbf58/8Me7//lg2x1YEGDZMyL94+oyv2pADbIG26WTbABD66W2c//xOvnv6Ft+8cvXM0q+ujEXrWWyquv/ihxR9e/CQfk5PJ47d+FbSWNmAfMCC5Vm5u4PmR1pOvNbl1qiqMP/cGkduefYXj+UxDw/Il56nH5O68Sa7m3HMypSDr1F7ShbY+pjh/jS+WU4GwoLC5AjCTRjOu/g/vC6+V317RGnI6o3tU9jc0n45pzXkXQm2r+dwF3+tP+evvADo3Ze9wMC5tEaynY/6wWMDLOdcV7VLsw0u4msq/J/rJtAMGr7YFmpyUglI3KaOtI7vvkSdSFBVJaoC5OZYchfBNWk3SpdJWF6rZ0IrcI7wvwjwYnTdCta7eE14R3w9YKv7e2+QNnjitTyOteXrT0Jqj3GzO1182/Nk4l+Q8GGnWs8uF/FyNvNj39HS1ps9urmn+xS19cX5Fr57O6PH9EzH6e2eHdMXXdo4pFGqHYz7g40rhgujTYj/OsAyJDtJFGihC00QxyWAmhRY+6FP2Eb8YHX3MRdT/ebNq2yATKk3RRmzFHMHPHh1W9dPbtn163cy4VP3a149Hv/DOndnPfOnu4Rif+YgjyLjW6Rfsu+tXj67++Df+an148rv57Oi3B2ZCg/7lwQhfd3MDNc40cw3DaF7BC/3oSIkMkOBur8mfvM6FEz+c41f59LeUx2sK7HX92Vuc136FGtNYkqqwHgunVD99RNMKkxdHz+s5XyWHBTqg2+oh1XN+2IuVzMXhDThv6hZbrj35zoDRo+afA37VcUj2IjqLil1zMUAQgcDBJAfAmUYEbpf855UUEljj1S5BJysxWxvvwRNDZRLTIwDGwcmEzUfkydOgG5nz6YgLgJlt12bDGouq1SEd1umL5KSO05NtK01/ydmaTqp8tL620gj3iooHkRywq2xwTxdszOwITh/cpTdee0hHBzP69d/8fYEBxggyhk6KPsn7+TNP0R5lD3q55IPP1/busxV9fL6hO59f0WunE7o3A00nG2U5FQQZxsi45jLQQFE5yisl0bC/6/hUe5oAv+cGXHG2Y5VJXzfjQt69wwb8nxVF9rf58/zf221zwbk0P+ZuflplP8L37xdc7u/Fm2Z9b5wdf+mgOnv7bD47nU+8qNbgoGD/nz/3+x9+Su1mS/PDMd19fPfNl9/5/Z995Z/9F/+I33WrqC6T77Ee+E7mMKWxzg3o5kE60UgWVOXC0/L0GxyHJpb0op1SEnSr4vFDCve+jyIqevQK2RipmlM/u08thzzHhVrhb6kpZ5SfVNSsl+KlGwAVsIb74nNOebfKWIeuhDSOlXbmaDYWIyVZofXSYHeSYxXSWvICcFZA8eXFFXuUBV3ebrjCJwm1fUDLJteD0JOE46t1NIMN/B49zeuOJuAMBdZysebvO5Sqe8IHZMaVOMK4XMPDEAAAIABJREFUoKxQRXtbg8l0pafjQ6fr072gKwXNL1MyXWtWMjaSJjlSqSsO81drzvEmI3r1tUd07+4ZTbmAQxEFcbfLq48Fhon7Oy/RxsN19ZKDI3LcmY/op77/NeGg/d1vf0afXW7k874y9fToaMTF4EiIQ/D+QnqHVWysq8to18vBKrnoyrLUDkrcqrpWLv1Vp8MHp3tsWF5ydZW/wy/6y20MX2wDpGi7/u6sOjyZlg/arptx/eC+ejKmCb/kK3wNB5wizdmhHbITGI853Tu/oOdPzqlBsdVgj+oKWxjFUTb6M/SDP/FfhaL+0O1NqvIkSxO/x0CDoaXcYKCJLyl9pwCeJyfKxhHT4gCHgOljCp5DlK+txQD+/SmNTr/M6cExbbpbNrqKjZgrdy7O+IIIo/Oc81Zosl5xUVYf3aXu+acCbwuxkAb8qNRqsM60SELjuCx11WQsBMNeCq1rLkC+eHbOYXLJ18HhenKHHp3NxBABw8NWwpo9LCZaoEEX+aFOSTTQDttyvF463V4Npvx8vdjKg8ZyYJGVCoRWKkM7xEl5WXGxwaTlTfBTUUUejfpSQhgKpHa7kaHF9Ybk8D24fyzwSuxOgCIehvraa4/p/Y++kOus88gekPQw9MinMxnd/uT3fYlz3Aldv7ik4yxSMS4kD96y13++aGUMOsVm76hUo0Oxw6lDZ/ScfUyEyn7Yu1HJTAkTxpfg5VCUQmvpTaxYWgiTaV28tQ3aMTjmCxznSrRRc/EMPdQzTjcmAErjoLMXndROIihWW3Hw8WEwIdts2E44OjTPnr69evLpj1ePv/zdtI2CFClPBKp+0IvfAZ2HbEDx9BJWs0TRI6lB9j1y1yIZmM/IH8ylyHLmeSMersimc+iZ35G/P+tK2YzcQiyLH5CQ7BQTTq35RswfUb244Bu+1DYSvwSQ6vdPDzhMLHUGXyqVIgon3HFMxVBAfPL8miYHJ/T4zVfp+PSMw+pWSDKAnsINXBjDNAonIR2WRIxTFszkuZoGflSoltkoW1m+c+yhtoJ1IJtsiXGC6cRWbmC0gNvpBmtv7IhK4AbwhTD8dRqZKlnT6OiTFxs65SLo5DCT8P3kxQ1V1ys6vFlQzd5mdnggh/f7v/pl+oNvvccFyUoMGPLm8H4VR5c37p5ynbCibz99IZ2D09MTepPL/ywqgh+YW+AK8J6YxTv0qGX3jAQhhkKtzFX2CAe2SGPMsGNgxKqP6jZkgyq2jDvZwJZIzbyOD7BxcMjvM2Vng5Ye8vZJWdLU+B5GlQ5Baq4vOi6VgIR3SkcooJmQqWJN3GxGi88/+OHRq1/+H/kCtmnnLSer9H0MQ5jfUauYnzUKHqmMrfIUhIsYbbAjaXQFRWnGHnQVJOpWofL2cYWYT5UtGkuDqECtBaby6/x7XtNi8hpNTm4pW/0RvHV7tWyevHp2CM0JP57UQnGO161L6yEuFvT+p8+4CKnpp//Mn6Xp/Ije/857tLpl78oP8YLz0g8/fymbnsu2t9XsKP3KymNEEWhWOplYnXKFHJyCvOHVUNNinXkjFPFukM3EzYDxd0JxpEx0MtZ02vaSKVKmQB2lc89lvIyR7mcvN0IsgddcrDtJY0YZvBEfDr7WFofr/FY8csE/+41H942WPQgyDb8yE9kAB8AZG+cB56vTcakj0ZLDPXrf5Yl4R+TrqmegfWBci/L65zaJymingOmGjQM38LVqLo70J6b6JQ0RopeC8rDmkM4XM+Uwj3z+7GAi5GczGDVYr3NtE3IlRZFfhyrVGetBEhzVe2/WnGatNtnii0++/17sD7ronyflR1n6CLaSGiLtkOyJRGFvvTelrS79J60X21Zp4mD3BiqIlpdJKRYN2e9yCZFiwE5vuOSL1neo+d86IMRPXye6+JD6ZtMutuHzw+k46m64GyZNaH5DbOL9T55Rm0/ox3/kB0BMT3/8wSf04WfsXZ9d0CdPz9ljbQVcjZaZOWjJ+7C68eJ6Kw8BW5cBa77LBd3jxP6VO0fSwupNIE2b4OgqgLZyYwRoCquTXaxejzGwuChQKLbCapjzGyM1AQUOikD87/UHp/SgU33TjJRKCEJzufAebMQ7t4mzv1Ug+ISvtRGqIcAitzSD5yxzacfBWwFhjxQJxiQTssKQUEKLkxsRXNLS8tJ/FcrNaNhgr6IQ8nkLnbH3QhukUaTnQzgqlAAYz0w2DchLWjRmKzqdViLZjo7MvYOxLGlO0M7rFYMgWgejkbDsjDgarK9vxaOOlo1sccRQCSt4yzVDt7h5HLarE1fPnicyvDxNK+KeaNmOqzsOSyNuV02pnoixyemmocrEyN9j0v7clWapH7YVYQl9uErimqk/B0AiGmED0oNyTCuMr+aPqX/+beyJx4MZV69YnuvWpMqUTthcnnJu9vy2p3/hp79K1+ydXlw/pT/6kw/ot9/9nG75BqDSR8pydDCVNAS78Cgm7h+O6GTCN7tRvOrD+0fyAJ6cr+i752u+uef0tVdPuABR7QH8UuE12knkCOlbmqnrZAw6qdHAJYA8VmJIpdwnvE89nnAU4QNhJL1Y3QASDZ64Geg8neSzPu2Y2aLlDDz6nKKg2R9grBMtujA+RQ6rnlHZAKU4ionMQTW8Bg+JrwD1lagsY9zxUhlrdscFq070FEQirSc+QA/O5vTkpuHI1CqGgQ0T2lTAzj46PaRXOT07HOnAJVN1Yn7djA16weldbZhTrLXn7D1bqXVEJJla2/Rl8++ag2a5eFjU0z9JZHV5Iv1KwrBuT5cq0SEmyT9nDCdpV13sGV+3Pfks27E0J+OWWyEbjplRM6qgbWf7MUaKqD07019aguCCP8zs4A51l+/mi3V7jCESoHjoCS5Xqh8AlNTHX1zSm29/lQ10Sd9+71N6nz3pd1/ccv5Z0Q995TF98NEndMMVi+91L140OvAM+eGGznba2fLFCPjGnfKBiBxGN1xwXS03dDyfAt4mEzAZyYbO2GOQdrSDYh+8Lhr5QkZrRLq6rVCoLHjQ1tS2Ac4AnQw10GhiGNiyxX1BqlB6FWKQbU0MFCR9UmHhYxAsZ7pi4jNU4Njf4sMiqxuaeg2CwTEJv2nLKSb6TwrG8uJ3NUncsT13xsoo9mD6T1p4tTJsASwR/ei1YIrZKPnrbz84lIgxrzMFqth2bkYq5S708LJUGOS+Iz3Z5kanL/TyW10vx6SsbcZsqKf5iXPK8hoS95QbKv9ovaq417NKXKLJ9SaNEC0MdzltGH7E7X5P1Iv284IScjvpxML248kOQBwI1Pjy6iPKy8k99oo/3nP56mW3KBOPit7kYoXtAhLP+u77z+jdT1/Q+88W9PDuCb3B4fX0wUMpaj587wNJxxE2Tyt9GOM86HpzQI5X0ub6hhZbbc6jugaQwqHPyDfxgIsDQOtAVYSbLPKNXbPTJO10yxVAENFV00zehDWcjCeV0ijQLXt9CDsIkzU6VKK+p70mwA2bhvM0Iy7z/H5to/KYkvPCkHGPO2edh0aKJFk7wWGBZgA6BsYyLQWAEQGRKbRkxgsmSivGYJ12JSXMosgsNZdtBzkjzVH7XIcb6GfDAJebXp7TW8djOh6XshJT2M6c7P7bMUCKA7YdCKa2G6R2XOCxM3DZclhdEfxyIpVru7Jdrb4k+aOoY3otpqKOHvR8Kfuu7fUkCcChR0X76as3me6BIW6f4SKYIZPSaUte6nRrUvs+u+5Bk5TmEnBWlIf557LRpJzf+zlaffY1mf+j6GGPsYYYbL+lzRbylzWdc6X8R5+8pCeXW0HlPOL88oir5pP5jOi11+nl85fsVW/Nm/dS7KxRBHC+9NajKQFsj37sbFpIFwE91OlYMZ74jGf8OjOhV1cR2tDbCrXwfhUCssl8oSCeHMQcej+xJgOjBogET7CGXpPDDFzTDXj9jdwqpBe1QO1EC6vDAQRgfUV+rVhPEOjKKnih4OqkIQX4PfJS5JyZALeVO6tpk8JgoqAk5QSTBn4i2tV9/mIQCPZWbCVZIOP0IlW8kYKOPd6D0ykdPb2hp8IvRcIQjokWdvsTIbKSvGNca8zeIZMDjXbZdovpHufCo5EctAiUXK9y7r0SlfnQNYdAaUVboc53NuiGEJ+4nOIAeEmpAe10LClhe+MQ4uOevpLq4um/REtwvYWQxL/kkmBCVHDI7v0hchHmj+vw812d/YdXN/1EhCpGgK6pTGJnhG0Fh56PXlzTi9tWDOKEq8o7R5wnzfiEczi5O83px/6Zr9P/8xu/SwuuqOezOZ/uCZ0eHQo2FJX4erXWiCAAZQ1Zy6UybGMlGH1OKfywfoNdLFy3hXPoigpHvtN+Y9dpxQzEGnqLAJfgcMg9MwIwGM41NhI4DZhNaklnBPQsOIpq0JWF4arIbxhcgG50cjFUjSQ819ZDzkz7VEK1Syve+vVoKn+0N2XCz3ijgXe2q+YMbzBorqalkBCM87YThBQ88KOTCRtqL8MY7GYJ0i2qHgHZwmEQ1T9w6/ZCN6QQSYXwydoZ7hvGz8ugGARReFHPj00RRYbbKoqKxWa7SX+MO0oVs0wXd4qqasfeCq04QMGiSXAPGYMZt3YSLBi6uKOWUTYB3eRMjBhe2a+P3ebk33xl/R+9Fa//0m9t3d1ff+GEqSSbqTdBgTLmm4NqNwMGlX/+hE/z60dz9rBj6q6vhTCjPb9gjwW145y+/tpjaev4XmlkfGhVbRrJu4BUGlmKa7m44acv5MAY+54dzCTs11jBscVC2hO8yPLctj7VYJEN5L23e+UGpWrxMgiNGNUWCkRBxQxCsdKEjBMoRPRTsUNWGi6TgsELDfySGfGwU4ZEYaURnKldW1CiuLQEmcDI3mb6qRiVrVevq8lAbAmjjVPdrT60xnZtOgrWz0Q+X/EhOZlVEEHTFlymOTpGvEk5sTACjjF/H3Ip1DG5UWiKIWKVe5zLZ1xn3tydvh47iOjzfL2r6xXabgbp0sa9hmAzJm9KHj3t9a6GCavpwyTlE3u7Pu56cml0GNzwowN/vU/pBSXuIwkW7k8drf/sT9zZ/HtXXyyPjmvj7kTD2hbtlEYokx5jVbIxjdm4705oziG6mkxpvVjRLda+Ofx5QemTjQ0VQV5648YCw/ZmbUJjXBzwgwFUUQsaT8fTiu4eTG2XKZMctMsgrNFIbzQpkaR4gRii+gDADci+xVBpo/JPIhnwWpVsBfBDGilTn4xbjbU6sVQnQ8Kuk2qs0qB/mtmfBzn21OfuVL0wkR0TaViWCZNTYY7C1lWcDCg6S+3CgAPtU0pn+Wa6Lkk3SNdj7hzx/a6vaXOzFbQUWnS5TTQxQkaatrhZy9bGMUe4cY0wX0jfVKZf2GPjgmzEEeXqxUaqfeHaRTpTVetsdvzNYPLZIoPu3M7EkgFlpgEUh7GpGabbdQLIVO36RLFhHKFhqKjcbrBlBh9NiVmEFPbkZkKirMT6A7/L107cq6NROV1PJzS9XcrN0V2dXDoLCHcjDkPTir3jJEg7ZDp7QAsuMgBwmB5PaLkqaIb4YtC+ZbflirWmfhskzC3YiDgPkjYKmEb46XHRxLko57gwVExaHp7M6YBvJFZnAHgJxnUq3QN4rNaZyAbaOMZrFXXNAkh3TJZEqE3ohFrJBYUiXnqZoLTxNOmUH3W1BkmcFpYoYpJ4RJEnqR03SO4kxpqkHOz26oQsLw0soyzYqYvjc32tItOeMO6jHwg/rA7xqfUYBnIyOYKY8/dk2lv6VaxQH1SOLjMlfBMgORTIVxvxfmjr/dE3P5HP/sq9Q7p/75gm7ASAB4Gs52isjIyqd6DLnVgrP2IPHMvR88npvT+JNHgyDf3p+Dirvp2JGHhDViUdqp6G9upej1UNeCiPvNsVRbQ/LNAKUOQmjblNW1SaTfWSf/Wyu165sDz/6IM++LqY8wca5dmwZy46UiV0BTo6nAZZp4Dh5vzrxeWSVlF7ujmIJDK0mRqhyCliKanHinpZ7sNnamQ9ohEvPD+Yy9QEzXmkFad8w+4cTqT9kjj0R3xw0Jxu2RM4mVHrigXaTKDcUb587JRtVXYRc3t4YRQcRgYn0bnQxcc+qHQO4IMwoo0grgK4QCnNsYXRJeFE+942QndOQDhiodxdaFM/CVok43Yq5aI41iK3XDUIoKe079V2vPW9hdBsx6qXiPASzsMbaQiu48HxlJbtUjoJwdZWRLGbP8NLrMgEtKMcvXixZIPl+uE0srGOhQQYhx41QJp2Ne1WLGwyrWN+cu9b2Wj8GRlGWGknacfhT4lsN41NEWpBxmCntncqEzgw6aVWUoi77kAy5AF9FS00abIsKCUTMmti3OPc1wsILob3r8Lvzc4/Ob+83jw8fetrssosZ8Pr7hLuNT6wLn3N9cNivAhQS8beiY2vz4NMrXyva7wh6NoKfsduzgqURXwjT0+P2RvPJKebsqHO2YMCHneXQ9shF1EgfshN50l5MTKbIWsumNtDciZS4b2SKIjoGqlQMA4TRqcZKuBSefdLeD7M27cKAEHOCoA2BhQAm6hsfCHz7yQGZ7A1MRT0UYV7CsMCM9vCyJC9rqfqarVM83KbRuXy+YWjwJBmIhLnTRFGDLM1ztdcooMIX9hEKyYlayXEoXscuTr+2ZN5PYx2UaxePH/On9+Lbi5BZlTQZF5wFERr4b/NLKUMyI05192AVoo9dDkZNfWjt/6vkBXXQ1wWMMwuPptILQ0MprLO4YJA73ACNlyUFCao2u6GV6pvlHSDo2kuRZ3fJ1CBM/CKH5Dbca8gc5Q06/A676/Hn/5gnj9fXb54+Om336UZ+pOCM60EMwrGO8fFzhFaOlYkiPfBw51P6ZKWEka2VgQEWxlRY20FpzqeTmnCNxUtKoz1ELqAMMIoEvN+wOPgDZVALQ5s1cpGXdIGczanhF+m0ymnH90JHHDZrbed9USJBAMTkQ7jaIKBSN/HlgXFIOtCJzTGjwXqHESFfc4uXFMnLC5e/iyURAB5OyUaLmwJMApYJh9SJtgv2mDqGaMUZcEpPDHLdRkvGlGEctmGYUFQOb90Z99LDp5LC+/YwOOlbT9MZ1N68fSFHIbDo0MK65VsKOP+YQonU71OAU7oWoRYyUpM02+lU+Pq8fPJwzf+iWWfQ+8+HzpCSS99aNx7muHUcB44CgtaYccHC3ggJrM+qGItaZBOTKG+px1Hf/K48oHxAH02AF7cnkjKQI7F//94lV3Hgzvv5/6jH1henLsM/PPIEa1R43MApfOBJlFyHAhRTGa6w84nNy9bKruo6CvXWWM5R2ihMw71FedJuFEi3msFBvqnWOsA/EyovQdaG00HYfyZ7R9JNe31wAk7XfJiWM0ROvVWV54dDSrVUgjFXLQCZBfMyMFCoEHeEp62yo0vFeqHOHyj2oiGU2tQOwMyXRJ+BS9dB7KGfjQP6CydU1E4P5CWKRW6V/bp5HlNQr5P7Ibg29JTIX3dhONIspkq8eOlvTcByKRXRkMY7NHJMbmXNzKwyI6O6PzJFzLDbwDbBAgYPV3+nGh3URKT4EMzndQxzg7/oDg4ek8LdG8dIWmp7ZBR4o4tSE99S4+yC3qY3RIkdTfsss/cmK78XXoW57QKSRTL8JdRq0pvIT8Mi1lxEF/db1l553b5cOoomLe+6uJiMbrz/1Zl+a+vV6E8KHYiCt6p+kigJJKmGwTiscCGMsukRXV03HBBtRL0PG4IWP0waWp7A6cgF5QVYKV8n44rOjs5VLpxIWFLq8baRxQacbTTTJ6mN9SU9+nh7+jdRbEFhHPYOfKp3wqvkBm5cRCVPhEW7nRKJdTyAmZREIwuaHgRyViH7VDA5kJIEYdhSyEVfhyQXUEoPrNBkcabZk+WCrBhJB4HSaNobaikhxAtDRA5eJN/1O3aJBSsnwfDDrCv507Tjt4kgk5OTmh1tVTJ0hEi1zGtbm6lsET62HJl1pR6/1RuXqXZ63HdTh+98RvB+Wsa6iXVD8sTbbkampOKLeMXuusvaRbO+QY2/CKtbIxWjis6/trLjm8sG6sUTelDJk34vUQ17hmrynXvPOnwJ5cCfxwE1DhrCx9sZu99dVwvb6/XZW1MdzJpkfWETLyhinwlQQIOgXyCQRsJYbeKiy14zdFISdqaRnGjaN8IP37XDynOhHNTGCn2tZwVgd7YBXujPA8JiKIjmgEXoSp8On0bBiI2XpZ+pxmMshMqW19O2hslg9vhmrwpTKsY2k49W2l6lCdKadhVsyoXArt+mOil0t+bpFBmhZQ+E0O0mRKKrBX5zHj93UCoIdKVgFDa11SXIIoU5dAbMkxuQs9hvp+euTwT2ennAhhAbQAo+Z/GnGJ1kH5qW6OT1IFNGtpgRb1UTrFFde/x75OwKZjspuB7ksxmoi8XCR8UJVs6K5bCNjfhhBgNXhLSg45qd0uH8XKgrHZDM3rXBN+HBEo/z05GtFnyMDfZrXprqySm0ZuLH7WTj0fz+aW0gyJZ2NJd/1Jk1rUYyAYh3UyKDyzegXkQvccxpwLTg0P+fSo/I3xOuR96uCBDmLFxnhwfirEKzWWvwm1BWibdoH+awr2CTnR/P8m8688pUbAomUTrj9iKsohUWE9Z1mdMEysYDwDaZbp7r8rbZAe+EMEMVYPGBqyQpmXKQSUtvqAaU0KtJJoJQSUfzdt6U+jTBkJnY/EwpEzpmREl2UutNELcCQ9T2k61YtGZ1itaWpkR44mT4Ou6ub2Vg4I0CguJeaZylPgMGN/mQnKh3LW9aScgV18uVgLu9rPZJ/Xp3e/I3N9abjL1I7WbvXxR+UNn8ZYezAK9cf9Q2jQzPiH4JXsrfCNG/Y2gj6KN8+Kgv7QHbNkjD9jnV8I2a2cYWDL8TlqNDUNT0NFHm+pzd3D6AYontKw2/GEEAyAyLwbAAD+6z5WWxnbQBUIYlOEFvEbST7QcWg1cbz5aWjj5AjipSymqQhJF67VAUvlIK4yKYuASGIA8tlacxqKenE2VSDkDfGbbqnFYX2n7JEOkKQYeHh68tKmwu5Sb57T3ENpJK45AKlcaw18iF0sIjDQQCCbSi8ISfE84NJrBaAWfBN4S8bIUsJ0CvzX0RxMki8P2xlBo29o5vIooA8YdjSS+jnspqZjcv0wI9TDilgsQaF8t8MLOZD1BvQTcCTzqdFbF8u4r38onkydkQHv0o6PBD/NguWmSi0SYGLVX5JoNLW9aWi4XciHQypzyRTy/uOU4yvkUF1h9frRj3vj/bbIO21YGD/T0vf8LlpN6k7qRW+ScFUyRzrv8ejk+/fXpuPyp5qotOow9vbfJhzbxZdICkbO8lweFNEUFKHS0CI+33m6suOkl5KOCFmY8/ixjNtSajQMA565th7xMGt5JwTnq7D7ppapqYCugEW9FoQgC57qx6ROHayK7SCJ+MdjcPQxAcl2U1GZ51yVgsyHM9vRV1Ugyq4A1vOBnklK1M06qVBCjwhY8hK17Y7Qn8vGm6oIBRW+tOtFwsw1PLQy1lyqe3ti1naHkJCqQN0pKfc4oMNF7lueBZUlwkLFRikp2yYaJdaPtUhnAO6VqwmesQPCRK3gG97Mcz5vy7OE3o8u2whWbHJlFozwBQwTo61STExrpT59dWcO54SqYQ6v0FEsJIQB3ZOWKf+TQeNd3M9k0pnKm4BaSsJWtryRC1zTbTeuCaX875SJd8O1lqL97f5R1L843Re51g1PmvkaYQIl3XzRYO8NTeml1NtvN4BnBpBdMuKzMjenEFugKa3oP8cAmcCknFfge+AeMIynJkI9AVbTd6M68cFnpe2HBEGPJ3MK5JEdda2E1CqFYphWYeBRFKsVBojKpDSbseqr2C1u7cWRCaSZ/Kaw0kFhio9CeayehF9Hg+vqa78VUW0+dMg6KwUXNU4NJN6X5Qppw4XU7k9tMBZZPEet7hjmmfG0s4vKa/JKX5xfsIKRNIp59veRinItajUidtsxKZc2+lbBfkJvMX9an9/8JO5ou2YNscgQDTtsmtwGh1WjAhXSzXcuuO9YbZIrUawN6tenEWEsuuNq9tephM4B21fuwuRpTNquHYSiv9md/ZrT4hUwGWiG3fhoflyax3e+2YoHRBJjB5d5UnqNMaPAQt6CIFL37XtKYzXItDxCzaPF2BmrBWgQMHoePUuJhHj0NIGSIgBYLNmDxPkY4TJbDCZjHqzSR5G6xt+2GLNG6axO912IOo08hvcU41Zt+QaJ5N4VpeLnMq7JLIghLbNQKt+tttTszKnHtWoTU4/Rq0DDsQ869xcNlmuokxWolIe6H/FMwGUEN2RttJqUplKUJMdKAQ4hmK50xhcvvuToYqPdd3TZUTQ+p3bCHxRoQeMI4CrfGSwC9stkh1z6cxz756AsO+2OK44MPxid33ust18h8luQYdWcqFxtIFbAmySt3QMvmifAuoQhqTdYcPVOsFJOfki9Hg5DaUKI6tx/0hxwodQWSurHmq9Y/HVRSyDxWFCUPPIxn26z5sYNJyN01rRYL5V5igwE2M43zMgNee1OZhpfcLJfCniKtJSDnDQJXlaWRChcc9hUNlWR9vN9rz0TVY4Jxgpy4GM/QRxICNoxfkypLSHncXq6IYUAn3FOZEkcY5xVyun6r7CzCv2+6W6Kc57XPm7oDkgfaCUbnAiEbRobP7YJ2EQSWZ9jh3uTV0WtWceAgho9ecDGfqHcyOXUJ5yZZJEM2IwBWHLt+TxB5GiifbIeVmzRtDLbIiRZVG6ybntp4otDCEcUXUtmj5XZ7c0vrBmQgjVzDydGUTk9nNDsaS2pze7Pgv5924/uPfzPm5eWwc2ApYYKU5mFY3tP/dmDSK49ovamoW91qm8UHI/cSW6d+fiIMHJmtOQxo/rivrrzTCIo2gUqGZeOvNKMaWkI0aLTq3z5e5u/n08kFO49J7PUaZJVCYPQ72h2yZryopVh4gdGBcEGEcNEIl8mJV0rMXBX0MmFXKSWUQpDk93aKAAAgAElEQVRB8j3BVDYyHChr/ozVVEiNW1BcYuWaXwezfW3gZ2bU6ulKDUGcs9W6jeo1Mgi8EaNW4FharWTFuDJLWVIYzzS07+h0VKtL5GvynVAaJMVTzq/c+5pOxJSTyo3XgYCkAbkKxYn2QK4VtXY3MhOJI1vx1opeuG2dSS3FaEvGem9kGNAquD0NFDJLyxcLMNAEAbS3ly/YYWwk6ro6kwg24cr+wZ1Dmk0Uv/rpB59yylJRMZlcn7z2xj/iF2zIaoFog4rk7vJgbQpvo0+QzS7zAzqYPibfXPONXCoKO6q4rBud0nbyiqjFuaRgN/hO++/wIdxQIEVLVAfkVcpy7LTK+q+NcF3QHaEvtpPP1kezT7jyf1RkzpSgtXAir3Ps4PsdthW5YKeSLy2f4u1a15lB1lWP1JvobrpOYSS0sTFjS0AV+0i1UpHLViP+Ogy1kn5oay2cXqjfw6ARgHSoi41xelo3wtRNHLGB5K3Qsme2NGeMH/J6Ta8e1pm6NQ5Tkn1UbIFNC61YCmZc3vuhXadYA4PgeRtCW+hO97a3cS6o7EWlzwS9pIgxWksV22hNVyvaECMXzG4qIlP0TIg7MsY/LYY9vby8oYubTtKt7eJWWmbz4zk9fuWIDjjU6/hUcQyffvKEbq+W9ODhPcoPjr45PrvzB+KyXGqXaecgTTbzmN7I7eb2Xczpqn5Mh9MFjVafSggTZRHwGM2+RKv8RIgi4oBhdYM2feqfJoigfrA019eeqBDdDrwAVoIl+Z89urarrli+9IefleMqVrmiZOXGDhwEbKithifpBEAAl40CQA2Enc6EMMb1WOffoR/aPdGEzUR+SKh5vAJW+Cai71qwoUI+MZf1jVZ0qpL3B+q+t16pTk40nYBxIReUBruBxFMaLh7UBDXg/aX3zC63WXe2z4QCcmt8qH6AE6apXW8oqpRu0NA1sMVKaR21KprRhoGxJbPJlXO7pEyJMqLteKlQRmYttmgdB12B74dGfxpltsY5G404rTDRZfzE82fP6eZmI85CGAcnNR0fVOz0KgHdCKshf/YnTy7p9nYr+OF6OmlHDx//73zDn6mt+CG6Sw4eNCXN99FOfeqp8r/dxpo959s0q+6CMFTUPbpyTn05E0pK5/yO8iem1kVMEMmhsIp7vFWychLD4FkzK956k9LOhluiB4APw+I77cnf/6GTg3+5cvGgb0A+lotXwv685H5WiTrJRzfiIcFu3VsupQ1+lT8cTUbSm0P4lko7V2MSHlNrySAnLEoFpIihIUxvWikGgF+VSt8MXjsLTgXNMonuwtMKo4pO72NmqLPMlEzyqBz44LavrUC54dwXn7owqkdovaKbIevZdmwxK0+5dhhY9qKG4qjiH3gzhPekdy9Cc52Kl7kss8kSaeGV2ZZophOxkGQ4rbGvfVXNnSVn7nWSJukFBJGD5vDRtMGQgjx+9S6dv7jiXLyRSeJsNqGze2d0xEUdPsaqXbPHXQs53WQ6poMDzv9Hk5fTB6/+4wi6mr3aWl+3l3V26aPutL53jd002txkI+rzkQ1ZLMF1cU90NyHcjavf8hw/3N6UiPpBiDWQH3b78r2WCAynyPww//c6vgy/dzv59T99fPc7bMg/2gg5Wa45qIiRKaEvQgSKHEjrQK4GK8M4daOq0iJOlgEBd6tUMbs1AWCrftGgVs2mksazA5N3X/N/1tRuV9SgtQKJ8sWNTpNsBp5GikVeqQxR1+8WIA15n2TH4UErazGJvHtmaKVY0YoNftN1Q9oUXT+kY8OsO98pLcssHhMqA87E3ITUMu2pBqON9EYt5LTPJaHep+0Gr8gw7d8aSYQZaVqP1oW7MHjvrt+NnUWsAkCgSjcoRMBjXNLBmw9F1QZr0YXRauqZUrI18L/CCx+woY4nYwrjg2/nB6ffGbpECgRTEjrwgkGPDM6F9lZEkgLG/9fWu/7atmR3YVU151yvvfd53Xf7uh/Xt7tpu41tbEPb7STYGFlCAilSkBASAvEhf0C+oDjJJ4QSIRQJKQ4SUhRFgfDBIfmCkxaJIYABgV+ysWna3W33dXffe8897/1YrzlnVWr8xm9U1drn2jp9z2Pvtdeas2bVGL/xe1R+qU6SnK+QRGjgpQpJeYox6k5a5k3yw0lswE4oU6akYbTa5bomiJMEiJTovB/cH+77h0/vvPZPHyyvfiQfmYNhhfpka52GGfJMj3oy65Ey7Tj2RGpJX/69oxOfxWGq99LRnd+9i10G4b7ba9S5CkslOJmIO3bk148cECg5WVlLqMbZdUOiSOdmgdDA0DIVqK9WRss5gIe6vxqppPBo9GRRy06iCEdUNmCDXc6T1ogdF2dicFsntbJwDIZFdZnmvBB8VLKk0Igx0zUxIGJCeF0l0qdCx+ScH6NbHQokPhgd5+DAe2dNQ5QHXsjh4vJy2Anlcpcb0w2uwf17d+DUKGK/vMuP/pU3/3V+4l6UQRA3gBIDKhkSi1U9+qMRoe1/8GR3xdC3MJ0KeF/ZRQWs9y00ReYOPJmUJydPp/KCPIHmBJQBmZ5coJ5ERMREBLEV94cPFm985XPD8a/kC/TGROAa0xPD+pjwLFiq3E45ZgPDwxJ3A+VSBlp+i5/wEQtganZBEDmwM04wYxN7HUf6HerdqBbluCmM2xTUQB8Ecxpx2AkiPzdCjr129tJUCTC+xM5u41Gn1hzUGmliN7cVjGIDPaMCBxgBdbjYCymK0vHBNo2UnmwjCS5W63oypZC6rdMSMp5qeop1G/iMiI9XboVNF9UsTWHAKeoM0VQEaLxkExFX7emgGwJyAsTCcw0/r/1uD/VEkF/5e49h+OjBJz/zlXxiHFtbqUikBtdeTkdl+CdS/3yx7DGVaVU71R0StVfjm5pujUZTUZhqwJa9JvIuodvWESm0Wey8rE51tk83fleykH/zef97f/yN4atp+/w15x8EOcIgyBvp4dn1TO1wkObivTLqPDCSxrpjuRiCs1qjIzfOOAZik3N9dan1VK4bxcTMC8Np0E8mNDXgllGPSywUPPUOjZhjWbHLC+kmfz8mP1A0dAzUHaC/l4QUmdf3NIOwES+GD149qcAZokGZLHxbELI+RJ6sdWbHozrhuJV6FGmJsnvD6WRG44ZaWRaOU5xUtoaZzZDSDtXrwEgnJrGObLIix6i2YWETmLizJgtBTsCmZTIHGmdUefiQd1KxbhKoap9PJYHwhKie6985vfL2Lw8X939bMfSOVkkzBy6c0vEk75OrjtKKNNXI71ZRkki1sheoizKV+jMVHVWivrw2WY4d7EyA1fKOWOkV5brquKulhSgJvrHrHl4u7/7tO/OLzx+P41v9oIAzAPuk9jaeHetSgtNmxnsD4O5QS0naBnRJu63erE67b/P2R27n9bXb5kV8czhADrI9zlhQYqMo/4XR26zfgzoT/gLIkseNF67r+x+9cL//nYfuOx9duY8uDzCYOMs15PfeXbh3P3HXvfXKHWTIriT1RCQ0CJ44YufQCUyv0Jbv+NByrs5Iets1lzBcq8QVeIjSwEx5DlqHA4Fg3I+n56kGSoTygHZFiaDMKsGVUbwEPYo9OQWiIDWSdUSaozZTOnDQLU30X0f2DVICwKISsm1FJkRnhlC64fzh3Xe/+PfzF17itrPvkEVv/AUj3iMYY/jMT5Q/mFTacNAysnENr9kar1Al1fZ9xkctEIMRMmS3gEaKidHJoJvK6i9Ogd6Guua6JwZfLv3om93Di+n5D188uPeF/fHoxcQXpJQSlKBH/cQas8A6s+qLdIx65PmlZct+e6O72cj6UHgMV9fu6Ytr9+jplft3X33Pfeu7TwHJrFedEj2kLBgVn1VSjX5uGdh97ZvfdR988Mh1+SYuRUi43cMtEJS8fCOuL7fuJj8IluaH95uvyZPrPTi2m6U2HvK5zHgNkyKrNWnhifLAu2J8obttquyp4IsqGCVFiidufqWa8+rC6NgcOoPRSG3EZiNlz6wcWB1sKBIicKXcP/GZkiNdTtc1LIVkrD0UXkQXNGklTlomqONLPlvf+NRXlm9/9u/mRnPnreFzbN7MC6ur+agaAB6plSGtKTWzKk8DCd+c8TaJCo0DdWFNBc+0viqF9mogpE9pqnKGMn7k35l61YqNSCayFDBTWF32q/N/OqbwZ7rFcoMaFsYH2nQIMweNi0BPxEWlVkXddDwyO9RhPKsIhT69cpFnDhpGH+FKfZO7/EcPH7vHj567xzez++1vPHRvvnbX/dxP/REn8VWS2ALsUUZPXkeR2/0O4WhvvXI/NwtKwnj1YuU+t1PHj4GkE6llJUNg0e8Ru3k97nPXvnDrritguxHIYaMeNXU52uiUxhOKRc/cLZF1oBM4voaFjCUbVJMzoHVyh0Q94wBPTHa2Jqk0R6FOwxxZVbhvk6YNmi/Ds/xgi7erGHWs81HfeStTVCIEeTl4COqNlX+zWzx445/ksuoyeCPKsPRwvuzunevY5AdR5tJp2ggk/hZcVf43nej0XTFVc8WFOhFmUn2UTZ6IRTodp/rQsq0cCdlGA6yHfjVr04V/73wzh6fht+LhcNmtwkaf8gWewNEUm2LtKHUpgGnV2WPcSbvvyK1EFqj8vXaY6qYsdW7AlMljhxXA+q0Hm1zzHdyz7dFdXr1w//zfftV9+ce/gK+RWqw3Cbew2FeaCi2S55B3cBHuvXF+7t7ELh9RZkim6jEvTLmBN4fJXU17zMUvFsawV6mJKkl1OoTmZWLMjpGdKRwK5KB6igwB0HOka0wzdWtRp8DZsREl+XlOdQedicJg8ED1g/qAcdFx+gXhHx8esSRa5ev2PJ8UYb1EpLnck6FTwjewW/4Mabbwo/PNPAyr37n3ylv/X753c3JV4Gmj9i7oEvWhKzTJ3gz9U6gQlG98h2yEhWOHTZF1/q2vv1kA+cZrtRoCR3alycUTVyPLZPfFEDg1/xrtYRD6XJcL8DuvPL558d0nG796U/T20twI9INwMjYNcqNllxQnE0n2ACBOYrAsRGkyttPIYUEsDwRiGRcr9+DVN9zzfMHFwudBvuhn50f3qrCH8tfcvXfhbq40zE2+XlhBkiAYowWeHct0SiTKkPbwycu9Vd7d5ajUhGfxfxWA/xxCwqEYepj1jqaUqKOIoC+yoXRFBFl3LE+IzjJFZaeMIGiPMM3ARtH5QuhxrHMF3lJyd0ANXzpuNjKA+QRrPoxFG2dK4eQ1wxUITX5vQtUbphG49VWu88UVBZIZwmB6e7Ejp10Yvn7x+R/97+Kw/GZhY/FEVdjMqKGNRBTeWJ/+Ce6ioSyqspuaHEFnqzWmsD3mq69a0fClk7UoR+REylgqVjPWTHW8QL7Zx4N3ZTeQ1zwL0X35nYt8vOVn88Xjn8wNzReWi4Uvx1KyblE7UHVMTsVW0VECrjKKGUC/3Bzh3sqvFQjUa7CrhOkv2nSBptQRr8ffC3v9wZ0zUATlfe0YZTlyWIB4IiM4g93UFdqcN2tNau4hn8mL+eL8zG3WK3zmJaQy9I9Cza2Qj1oJhLJpmFpXXht+Twzl1WMzsWTouAvGE4zcfBvqmDSVnVROIkMtRFCoUhFX+BWgU7KGxSCAC1dq1W3eGATuk/eH3KikpE5VsibU/lKk7v3wjYsf/Kn/qn/1e/5RbhbH1GDuQG+YHmkYqmPXjwTz/p0vl4lSHXu6Zm+rC0g13W3T5IsMpbr4VWcUe7GON1AMH+Drz6sWvHehNQ02dpB3J0qBi352P/u5+xKtOC7T4ROXT5/9TMh3aSh+8rE44Nl7S0WxOVObExj9PfK4UwMzIYKsz86wQGVsOiAconP3799D1yzHmQwPRFt15+4FRn/ydR19nxwVmLI4QG4m+0vZUNqMWHTlUnZa+XmiKhDfLIGSenbsfV9SAwFR9V2dsxeGWqo7bnAFd3bNZzZJij7AUYcjca6BZsWfQHfZRHGinmxKg4KlEO+3Tou64kYu2V8zM8ACiUTCq7ibH+KdDAyijj7TNNKHLIqt6LN4/xO/9OBH/uR/27/29lfy6x2TKSnM7KSxC5rQrB7RlOmJnh8UMzX0twFRX91TjA8dY6yL0tcGqLWidJZFxasbygL2ylx31SEwUX6CkVmRs6Syu2K6IwvB0dc0v8Bw5/7vnb14fLM7psVmiBgXtl2s7frKOPdFZGdTD51/c0cSicZiqfr+xYJa+QSo6Dzvem9/oodp2gcfPgS6sMk7YILH6wF+VB0c8XRXA8geU0FJhBK4GBKOddSFg0JiAWZvPOK7joONKpwDpQ9pdqzXUNqwauckShhNElPug00SZygH5P8NKsJUzHDS2RoyX+h8Zn5mkDkaSvoMTGBpBebIKsDvi1SpDiMTyxEJ7hV7Hrk+cv2evNi5x3vn7uQm8Xve/YFHd9/+vr91/tYn/+f8/U+8Kem5TrpO+QMK8OsJYPJ3z0WKRavDVas5T1ZqkWWcMFbT6VMeGldq0wsnzofN467wzTjvNXzMN01YJPQVWQububowpPAnsYxZ5zs/3Pvd1b1Xvnl5+ezHJIa7X6jKMZIAbc2N2Xp3Fpwwa0qLREFKLQrqHRSsCyWi9D1LBU+gHu6T7rX870JmkRuwy509OJ1Bm4QktbEgCqTe7QGBkanv1WPqENVxBmgErNl9qUenpA9iKL5agSSTZmTJm5VKMxNZn87kjlYRoslr7N8UtHcoTxQdof2kU6YYak1OgLxFu8vCWw5mqFudcOZY0B6pH+UuCjdDPv86N1Ly+SDWE9bbVXK/9Jvfdn/2z/3g5Re+/8f/1ubszt/JD+BVIEMusqkOztSwGutpo2nVdanngpBzQGcss/ay0OoOaaykUnd695L52Sk4VZlPVdkaCTVYveGrupGv75vX9bw4kQByIpFFO8AktLuHw70HvxrT+MfSfB0SFJA1MRreSXS9S66K7UAFdGqfY9Y1ctwubJEmzyAEXjSwqxa4Nqtl5ALs82LdAwrDYxFGN1FzJjCMHIka+aPR4cfxyImZHp/y90fEo3f0b/KV20AGfuIu59mVzuQ/dIZLDoGwUOSJVswTqRKdShlU3FKozEVs0jyfhNz1MHqLjVLCF92WfP8YtSma0lgGOhO9XEWmJA1hyr8Xb1nTfYl/1upsne7dPfuXfRz/l7yar3xYQuAXqaW7fYLaugNeHA3i1CkYyqhyZKd069j3RSdzC6vi9pxORqYnfIFbI9V08vKV/uc53TEUIZqlWqriDqRfJz1WGXRxDMPia2dn55P4JomXvylHlaZG5pKvEu4ZpGi13hnnqXi3wgCt74uxgOwoh+MBT7XUpXIcHiHc8/g1I2RC0qu1TnXm8AwJ90C9uuJ+cyz1EnYjqY1xdFNmDSodqI9aNnhZDFFNjmfSFw1fDATgTf5ycho1kmabLNlOK58jwkhYERcdeTrWkVXyjfczG45qPFBtTH0zQjX40nRWOhXziHCXyEypWOQXMro6f8h1+Ffyzvh4tnTDGJk/1i41LlimfuummcrIuCAh7qQirNHT6VYjVYPRmlWXTOimHfftOjfaiV/YOO6lhWziqVKz0p06NeitaHP2o9Ze+TyN3XLzXm5+jrLjFZt2Pp0j6yuLeLTR7gRqG3X3TrVVsKuEEZo2PIVZxJJHjsxIF8GAr+vhVWXTu0Bj3KJv952aTcjOCsaUWoGDBjepuG9m9z8l7ZzlAYw0WJPPPZJsM8mcPunPh8NLEZ0F4sGB3bLnf/Wf4UcgY07P4DYucqQIGjeAvlnODLQ7/fnHcSq7NOQ+RBI6b9ZGifZAgaWUp0tgVxpKYWhpCkt/WK3W30y+n83FsagC7PcYmapxmobKRboQat2vngoaVtyXyVJjcuYbvV5jIndialZm/La7es+EvlDJJY2LdbWWrI7TvlDHZt1VzNwnWTevVz/aLisMfN+lfNzGtYDseWc7RtVKaQBDV8amA9jrUzlm5GiTI9vTDgeSDtpJosnB8c2Old5ZGASA6HLQjlcSl81bIOrYURlG6t9kn1EQhAHoRcejnQFuucGSOg4SlmGwTNG8OGdM7uT3C8zp56IdmykBkQWBKMs+FD8B9RWdYFamXlQ6rvTF8W/i6LPqj2DUxtGviRmVIZb/TdhnmFL6WjIZpmlDAbNpIjNOOKgQK8pDh4UesLFcnG+2y8XyRWTDZZmm9iCAL6BG/jiJfDPNiuV9pXK6h7JOG65j4vZrF6M0zqxhAo/WxDlyabp8NTIoD0BTOjTO6oUxrYu11lq23XdNwHWk1z8eBq/HLcLPxW4711gHLJaOc2jPubjWWB0bH5M5m2syTB+KTmoqZl22gwrYLd9zvb1BdQ3CRS4VlmAheQDhkoos91A3KWVwSS7UWd5174qdpVwvIWk7td2R2jTAQQ+qPO2kGU8Zi9eq7px2DI/0lxLG1RECPcVt8dlEqCigPEsG4wt7ojjmWWBKUhtyBBLTNR/MFS9VM/A1MZ+VSO0wQgMjAjcHjwenD6HshPJw5SY3feZTb//6G6+/9lVAec4s3yMI5kKGBu+iRD15Llh6Xhm+GrpiUCKXhunClQydzGSAN9Wc58wIsOyvRnxolFPt8R5uwV2Otj4WwjU47SZnwFAVI4xFLVD9q2AelnS6khfrk93ucLkY0jncN9gx2pRGDRbo0pxmsnImdRcpYkM9DsF6F1L1rFivMJmM96DqAW/4DaAoYa3fRCXLgOfUaaz5EAYcewLCr4L+wusbzzYoPGVlimZUtfRGDQJ2DI7wZjVPplYpawTik101aTR5n39uzH+OSCCckLjti1U9wFDyAihIlIZOCNNCFkmaE9AR+gJnt3PlFECdG+dqm09vrMRAjC7MhZgN8+JxBgSWF/14786df5W/5jmsN/uOOn2nrDDvTtJbHCGpcqI3NXjkhKrn0q2k6cYr9RZYpUd5sVBvnKXb2J92UTbjWBuROpZaA7OO5gJ5pLrVE1u19xKNWiGhtrleiavV7+z6s6+sxmd/qfd+OM5aX4kbuQnXhIsqOnfhcioflWZbrPM8oRkxl0CAr1jeTArZROuMEXS7AMMfZmC8QYjOWR3duTR5tKmBCUbXgSQsuO/h+ga2l7Pzxabc+KZiJQSzChl+dIEY5ayjTmFMYRSjphRD39FXX81/BS/tC+G5L8JJeJsKGTzSUa6rnGI9YTwWsvz7YqFQlQgBxcUFaAAxVMdmVIwyEqeRkJaYPxh7DtTzoR7ZECySvLJeLp6/+uorv5br+TkQj00N+ciHNljXVZuWVP/CVo7Bdn1x4DOen02VTrRR1bysHA0FOz2tay3NrzRfpdmpT55xVJEYReq4zLONchaMsNtoqiYw9Pt8bIiZQXfp7r72C+9/6+EXF2n8sbwj5pIskXupNt/CH7Uj7ThOtNdJxUfJ3E0wwxYySb7JYObTKE1A/0hl7WLVY7omIr8rCVaTXNLVBnP7iX4D8n6XQmW8EQHblXv+4oUb5XuM0BEoxZHGY3kN7FECF4ZePZjw3jsVLdpETXahwziWRtDbySYcXPhVjTCZgD4pv+54VBxS7HIKEkCdE5xugkpgZmjGFnjoB1qfw39rmkrj28MNWvm2gNbiXMbsql7QvFXP4UE5CaEh6z/41Ce/9+v4ebM2ka6RN6nZxexOWqHG/CMxuyBRkg4Zk4352yA07yufsyah1MVoSRot08rfSvhLoXZjSjAYGhK2hPQWL9maB+B8qUmtXevoN3CcCT8lONWJROq3/Guf/GuHD77+N/Pj/KOLZR8MToMlTmR8JRnwkSNMUVKaGa8acAVQ+0AWjloGLeE6F9wqX2BJNxFx38NHT93DDx8rg134poNOsmRBq+15dI+eXYIjsJW5t9SHnZYg8gAK9iifWRSvXpjuN/v8Pi8RZrHZLNEQLdeDjlRZojh+BrE8N15Fz7n/xGN+mlSLjzwrcWmRNGpxtFYRlXb5HOkapyLx9zKinLgAp5ITQJI1m+RARQOkJkkjR/DQg5E10GmmOn97pNd0Uzxcj08/2OHEKmN2DiZMCGolmSsaKcJj81R6IDOq66OrWabFJMKfwqrFgz+cQv3F4szUksxaioZnsluXOUbXdFR1lG9syVSzrfgwxOY0AGwz6+4Ix3FNkpvTsPqV7o3P/LXx2Yf/fQrHH7JCwuoppaIdaFGpo7o0q0JTJlYjzCr0a5S5H1HHIiJo0MbnycNH7tvf/tBdXm1p/hvQ4HRizyPR5XRD7IOC3RJVfsTDoa4tGgARqgbfa11+IJf0Ki/YpbCPegeCikzaRA8vu+w8T4WGBzUAgfwBvrABse1rpKKMagRM8aLU8sF2QDYnMyTRbIgGbcAGY8NZjKSRrm2Rmm1oY1VpzdWSPrMlQ9esRyXtZJH/LR3gqBLnvToeihsNwpJHrJkDU7kNpw3sL2burAs2bQsOWXojM1t0TxmZBu8aTl6pKU6pKv4EM+3o1GedZ6VWVQJL4s7bfnc0P4FTOWzluOY3dUC42FLJJGWClpdC6H5lXl/83ePh6d9cBn8uY0lJXdkf9viwvkmzM3dBwV8xzco7ipiI7cW0YlJCxSbfeMmkn/Y7953vfuS+/Z1HCPIVQB6Bt0nLEBhoyNE8zWXeDkshi92cVKXpuNOIyhXpKt6clBXagh2mDAPy17y43CIGSHIGVqtOtUz8rIJVyg4qD52TXymXEPmEsF1InaPpDYWdbVFuetlNZwXyxZdLyDjYucgAkwWzIOoAwgkX+GSDB7KujpOmZ/dJH4RIlW3kFBApivfOk1xDafYEmcAY9BjLGB0LPupJO4GNZaNg9kuyoQg9YlgxBmnpetdONVomaqodWCoiPfcSbayiUBGMdfwVIaHQ5KeaDaVvyNGuCVzT44bs9HS6Wyv7vCaCYiSownPR5I+pX/5fN7v+L6789OXl0Hk0RY7jQqoa9XEOlJVoTI48wUc2ULILoWOWHKqbG/fRwyfuD771fj7GlSOwcDZxUhhfbOAAACAASURBVJtJ2aGky9XPqdftOEem81GevNSb1Ks02O2nfYlHh/lD/ndBGZQxNNPCPIHfuVjRPjNqxy4lgrxvIWjflUSXsw14t5GZA5oLZqVToGKYNW1MRDBCqSVVSi5oxwETOlmQ5qQnzRrgowZelAlgx1S8WFhu5hk7YycfFSZM+RZ8mOZxC7x6lkW6U9r2ONJHawH0RBatJKZMo5p2SL28ltC6SLHhpNCXIBO9bz2jbjVP3tcUjpNhUrV3O/m3egEaH+mGo+o/lrTqaunRhKrZUWJfIaksSipxgGdKZ4gLFb4bh/X/dpzHH8l77lmZSaOWHBrvpAnNwQQ/JS3od/stiRDyBvINygvnI6lHHz3Pi3TEwweZyqj6fTVrmPA9xkmQRgU81ag7FBoQ6aTFDAMPXt5R8w2Jobq74PPKIEEgLOKjjiZkSMk76nj12c0xN2XR3ckL98GFWOSc5e/tsTBkNDoMax1SBDqhgOyhiIHVnGUAYnUovWqRMSXc01mbo1QkIWRbcfI5014SOG5kWdDVexddrYXztY+vvfbq188u7myn/Q1Vqz3KDEwEew464NASYWMv90Jqe81q9WiaHcPvolNebp8qDlR14a3oxDcTpfQxk/zUcPW9axhRqRaZ5pdEIqylUNZ5Q6rhFP50kVqTtT1ODFTzdOtT6QVHh7mzWP0/2+urb6zn+EM97NInWDQK7rcISvZAvTtNvHkjjlzRNhnbS+y3t7lmfJQX6fOrPca2OOKjzOl3hfamID39Qamnl/JB2HiJHljgwCbFbK/zzic6K2FUyU4+89lXfVN17EYCXojALuW97Q65QbvWmu7tBwu1hfd7AuHO3btzhtQXcSMBYE8cek5zjZ3k4AMLl8STSAt8q/I81Z+poXIqw6ljDFEljqCEoXGvIx/VpCpMfJzON4tvbK9fjLvrF/l9DTDecIhb7+BMI/mzglIsV2clKn3RGy0zkvTuNJVbdmQkyjTSZBTbbbfTpErXiZZpaVoSf6r1QKq7cWy0+ibZi3zqW08qfVOh4KU1XSQVVE1G/Z5kZDETk7YfacVOged8o74d+sU/Oo7bL4RFWIh+/rA/lqgd3fH1eBEJi+xIQvUTOYksMshFup077kf35PImL1LNJJ15zMu4Txj/+1GNJWRC1fNzmsboxfUNfJVWMAeOOAonmqN5fs8yLArTP9GwDKynpKNLPI4MoxjDmHdR7159sEGAsA5nhPw95x3oiBrQn63oGdAXBYNxhVMhJiuzSurLzhaY+fUTIYmGFQfFhitmqhvLxPobBHE/F/uhKkou494Up0PeB/ZJfpa8x+Pu2m13W+ymSNjGLp6v5fZaP6tUocOCyEAqXF3HfCxkHbQ/raJNNYpGV1zbO9mc11UnvqZv8v6WwrRgoYnEk9D8xNSoAxpXQO7kBQ7jgg8m3aYxLRzunKWA+INfbf7v7dX+L/dzentgIzPONj0x8WFEltQI2fMRN/xmm3e8/ZG2ORpCK0FqWGj56w7IU53dM0msziWINGvr/GsjU6ihK2WGjFS3Mlrdju5MkkGERrhYu81ihfGrcl590YE5ulUzDQMO2ruJO+/x4C4EP82v8+BsAVnyhICPVL2vEuXbeIiovO1UoKdZADq1m9gsGeQ0kOpoGauBujUMGAQao+OL7OoaJzSVplci5Je50bMAvGD29y7R7shjkHB+50IdFmmtdN6dkW+s7uVS7sC1RR4+/NcXq/eBilo0p165qb372OlS5TumlkniGsC2fZwae3PXLnCbRJhbVbE+9I0Ti3ld64zdN8LBNvzXwryCZX3KTqQySg2kFSFbH742T8ffno9X3wNDIsHwxoOylgzvS4rXzQDSZ+yml7l5eX69d5c3R1zogVbjIgoUo939bnKbfIS9c/+Bu7+WhbfQqCGb3Ag5ZVLewEFEhuLHit2pBx6rxGDlv0q8kFIaE0wZJPVZFim4U/m3a7EXFxlH/rcH+Wi8e54Xaf6aXT5y96PumB2nR6L9mvtQYJ2OEzJf4CLt9uUHCq91QaJOR3L2Dq57Qs/zZUwdqeqdSQiyeCLkJUDtqwQWm/0bv9XUFZ4OLDEf2dIk7fYHXPv1elPakn3+O8G0l34NWuXNRLM71NWU2scaRoL0wgLBNzVhYgKbhfemxrC1cgBOmf/VaPpUS1qJ1EIoCSfdvncfQ15tcq9a9n/HKUskGaIxCtSFLjY/wT3PW9g/Tsf0J4/H4wZFOOpapxlHgqsKR1MuXoyFnCtH4uX1zj3fTu7x1dFd75VR/qlXLtw7b77pHmzuuPO8M12s1u7e2Vn+fq1v8dlIwQMpJt+oF9fXcFEO1lxS6Hdkc5OYd68cBGUf7Ua1YhQVg0y/zjcbd/di4y7yIl0NDhJrkXNvVh3tIOciS7FGESK8iRJu+PQfNR+AlvOB91l3yMio9F4RCDrOiNes1J4YOkSS1vG6kQqHIzDSgaLDFG3nTjWwLC9wMUBenz/A9rOJWmYIgUhRLvVCkCbKtjtxThynueC4gNAmOjaSuN0XPZGZ49Iu0TcNjYG8Jaqn8ZRq1xhUO42Mt8VcC1AQGk1L4/efmpwUmyS1u7ypGwsFUNyTY8c0ZH2y82KZ+s3FL+2vnvyFpXdfQlcPWGZRiBQ9+AL1uFQptwY2LIeUF+LS3b/o3Tr/+d03XnNvv/66u7c5RwrK+fmFG4Qb+/zGnZN1dQAhOmHXFqB/mcuFi4tzjYwUKl/STjv6yEc4qmyc/M5dvkmpA9UJ+PBqLTBUj+MV+WFphlXPWaeL7nCQYYWOVux0MShKriBS9mBztGz6h3RCXZtZe8sOfBijEl1Qv/cnQkvl8Sp/VRogj1hJDbmQxQZYj01a8qnInpfrM3fntbdJrmEsez+cID44BcSCXuAnCdxzNrWayOGlABEBc7EuVN9on4K5t73ESrFjO55AS3UNp/L95nKCGXVUC0lXjvRQA1QaGUoZv7ZSGP4c08fPJNeaxbmVDpjUJGl24nvD+b1fnK8e5+4/rHfbHaY3AJotuEBqV9a9SJ9b9O5ss0J3+n0XF5iGyMTqzuoM8BZyUYFxTqhb1+er3CCMalXTQXbofGNBDPhLOJqzYrUYPB7HEkwGonbSBECJ/YHeSLwFhITcC6lbEu884h015VnJQD0eJmYX0PElEI9MDFCWcgOoCLeAEKovv1H+7JoKrglGWK/QHAIxUP+mwmCDM/dEUB4WS7p7RlI8+yY8zX4mpNZ9Lo96Gj5HXahqqDbiF6Is8/fsRZa+v6GCWHOllqsNiUNKiEFTlhr3/dbBxJ+4RruTOX4733eNZ7+Rc5tyVZ98ZhbVqWm6Vef6Wy1d3b3B0uGCBVTCPE/o6BmK5q1FU9eVMazO/vF48/w/z3Xo59Hdi99oH6qS1uwnuVDl9Tbrhdvkp//1B3fyjnqe6798UY/qhC226GKfmM+ofPSt3BZNTUAommjaexh4BNResgMKNgtp8qjJLJHs9YRMU7EEykd5XhzdQmmDQaI7xYqxmzGZAozo5hLJgwpC8GCvWixNAVRvU6Sh9NTSp6ANDadJXQMXWthaISXT3ExDLBQPPlCYaP8nUJQoEMD8l6HD0GGhwugjGHqgG89sjyn9v6AV811JwxHSOxysYcCcS62nH2G9CDFHSg3ZVYOnXajvCidaeMFwCfe+mkqklmqqPjEnXlPultGEP5H1+dLxuxN7nnRCHzzx7fe3HQGp1ym1aawiMJYUfadTLvFOtb+HEdesgbC9ZqK+5zfn/+rw/Oln840NBxzxAWklkckpajHTQc68RqBEwpN8J9eMg+TB5kWUUGh6PNUHWbgi4EPwrID5eTc8SoZALiGEZDNT3xCVoicQmLzPeRoLm97wYZkK+k5cpxNqyhWieEZMxjSgL9H8zHz1GUbRWSCbMKE4IvXVVyE0fl1mNjeRDaaaqIZULnCZNKCO1uZkV00spWbmWRnXIDD/a6DBm7HQlLvqShQSdGPCnRCyjDRn8wgjX9v41F5yxJhAPu9iucFCNPIJ5QlqdT9rcyvDif5ESdos2NnfPveTc7cMJtoMVIOeisNxslUYCq/RHoLYpDCX7t6lkpvkb+lbK38gUgpihTfhETLkCzyT0vWwufjF49WLP5um46s94yYFjoJO3al3lCXObdZLcJZlrrxZDSgzRDYii3SeNWQMCX35+8TSRxj6QriQmTiyTZPKZWRRLNEQHfWBm6bCn4Dkl1HhPXmfG3kYZrEBmlVd2nGqhweW6Vup470jtiqcB0uOdrF4TOGkoNpi6Aatg2MNpui6atnkaMJc0gTpChg5cpYFJ/CRLVRQ9wRZWXRlMGMYq8q3Aw9AzdDOu+dZPO5C/rf5INOpOPL+BY0xyq8p9X5nnl+SjzruyKTyWC8TkADN25Wat0/N8L5om9ypPXb5VzM5c9VyJ7UMgdC6Vn+MwW86dVEJvjZSyYYBJ5SXumThzOwF/skLzE/qxCELltE2KnGe0Bwshz75Yfnrfrn6zTQdflZ+kiUHetshgjKHhF7XhSUuvHBYwfzR7E037o7AOcUSXbys4mECpiiYqlAFYyFseI4bExZnotGvgeodWfZTUmfqAO6shlz0+cEYVnqszwV6KgqhmoZCYZxgo3DtJtfWJfUz6LtQ6v1E9+qO8BFGqJ2SWiBj6TW9D07aUTNTI0PqgAgQq8VCn5XZtFx0IB2ZDCnSnUbXALUfWLyxn46Hz8ZxL7PS2ZcYHhpzAHrLXXw+6sf9pds+e4zche3NFjU9PLJyeaW+tppte+fufcJTpRu3HHrVt9RxPrmn3r0EKdkky58gALY7VoYpAKZG4hua0WHLpEoNUcUGD50Bg9Ch5w49JK1KMDWKqGNgMMtxJjQ9KT0Jq/NfTIftT6Z5OpMDUMx5N3K8Ok+HaGXld7DUGdS2vNcdDNOaZQeWD+ZMueuFunTRAc6SpBPZY6eoO89EifLEKCGTfkBIBz8oVXKC3wknE1WwDr3W4TM/twDkfVIHFU+HP6hHBb3oAnfjVBKdAz21jO3kvSvmyIkL3Qw6pkkXvTSBxngyoziNr1QlgSAZGGAwqrz3kc6FdB6nKrW959aDEPBZuNAV5xfzG0ONCjO0JerQfrFx3/3Ob+df76kzeH5RgQlFmXFnvS6S6WeP3rdm+rRBsrAEA0d9c2Q09mynmKqJAn3jQeVPLSqdSy/5UoVbG3DgbuJLlJAOV3tKTBCwIHWSWH9PSkQ2a231D2VkTt56FmcX/+zmxZOv9yH+MELWhFonqRwMHZMjp4epUYeFs2SIrrqgKJAu71wY/lMX3fZ6D5GdSJGPSY3WpjmWU0GTp48A12dS5ByV2zLuXQjCkCs9QRVkx17KpYHTii9NnQXrqiKgg5+rgvS+pA2GjrWoOSFyQGNIig7wUpGyoDxyhnfqtZ1Yg0KbL2JFLkwkHUqnHxOaUBk2CCqilVsoRBdb8GayZub5EBVPo889gI8MUEauAsI+IpJpoJ6ADdLSrdZncKmWRtAGBOKmeLPsMX6Vsa6Mh3tD032qHpWBEtfJuVN5iu2eTZeebCGWRVrVizFV/VVFt/QY9NG5JseiamoazyuXajkSuPOqkE+ln6aeUQmLZhEhKyAoyypfrT8Mm4t/Ml8//4EuxEFYTWA7MVhBx3VDScP2RaoSi87AjjixApKNIBcV7vrm4Hb+4A65BBECtLzeMddXEsFzTOokAvtJ4p1LkE2sXlQjBqlvo9cFKQtVd3JCYXQomRhlqf5RiRish4ZLLX6aIUwLIVK1HhhApyl4DFOj4USiPEanUOrKZx62Bu7LhrDsOIlyxsivWVWm8edOqhtcfnIOu+335kV31q3OdoKjGikbfURPFINW9uJU8+D+fQQxT+PCvS7u5OKdENQy6PzsHBO1/nRh2IJk7qWlLZtRRMuMquTlygBqBHqln6ehgnpCeVpf+1OSS0P7a49+z/SOonOS73cqXwguFfc/e54x7YkaNBHU7+kQVmf/cHt1+WcWMf0RmCMUFpFCPz2zlhSmEc6kJaQEHO/yOjJqnKJaVE75znurKQUzJXjvY++GWWXcFmqx6DwTCSOjkBwyCUReIykwOM4FmhFVgU+sogOOSF/c+JLKfhh8ZqnPqFtjTQas3raVnhlM5cr7gd2aI0/52TNlz4GGD7KDy4Bkf1BMU9AIsJpqPm3JDDDOgd0De4gwyJjG+/nvlgjqCIqjxjTS36qnZwBl2NIXrO9IYJKaIOdG8M7FXQggEdSR61URSYbK06u8U0AMmDaY5i+d8FB9qj4mpteuosDW9IxEEFczUyGLoB9VajEu37qjpAoiMzYG5mTMcSqhh1xswlZXmTBrRF68Xrzih8Wv95vzvz8lvzeFQWwCak0BsKchrwnLJkonsHO7xDDfEciB4KTTfIDRj/iCDQLSS9R4bo3X+d6Ig/TZoHKWHnKKDg7UC6QTRvBT5fUGqHEZu8n3BrKJfAbIZGZjQeBnJzqKGB6MmnKOxT4y8SSYzSuAmqlIi55EQ465dOpabwobS84sxIjKeFge5iQIhlLZO3omCA48u8SYIl9yW5WHXAMtZsJ4cJKhCYfe6K4aZZHcLQvT56Oqy/VqboAB80mqjGwOgkvLa97sD6VVe8lux/z8obz1vpkSxZcILK7VzJRZaRMW6fXgnlM1k3W33FNOjCpu210ldUJBDA0B6Ymu0fZkJuYlFe9VaojyBT4co/8/Yhj+g82xZGecy9yZwBvxypkEj4LjyhEkUueug0xFyCYLMM49pkQD/j24tVgEsZ4aIHBbAPJCQBnhG/na3qVqrmFuJFZDEiXQeKCJVpGpNDllQXBRmj8pTDZi9d6Plqw9czdProSjyWugHmVaH1mIKEWEGSaLQq71+Xqg8pMGFSQMdQ22C4iwyRczq6N84q1yU3hmVEFcR8GtheZnXqt8UNRHdpn7gDN3fn4HUJQgN3LtjqyBz/PuaolmtxRQxoZpUtksXa/pyB2fVAsHi43ktR2Hel9rQFeMgG2vSKc76wk8lcrYThZFiqnRW9F/lUf/TA9Qf+LnOtPYK3yjW5//r5PvXqhOvAdqkJr5Nzp3wUpLLv0MKEVuuFqFd4w+95Aoy8wbDRiofj0XrOZraWjZUVOop5kkn4CHA5iyGGREXyQsbMXIgiLhhF5R1eDY19DeRiJkZOnARsyS9ELoqj0Yv+7IuCI7emc2XCKDkX+7vLlR5INDlZmqUrtOlm7SpuPUU7axJJvnN4/77buCXUdjGcvn6bX0EmaVeaHqwCnQG2vh9ke1CxVr+vXmAjvu2dkFrYTaStxXW/SZTwPZhu5ky2t24hN/6pPt0JdANdfKoGMDGJsC1fCvVD8xGWrYgaSoH8meqk1YatI8HK0pqzEugGo1QTsuzs7/Xr8+/0ruZufU1HT2eUcG12o8j9LOzCII3Tw0/5GEbcV1pSMeOuUBlEPCBeCs0riNdAKEaZjkLuVdVuIvNRGxw6RIfUhJLjEeb4F1PN2y1WkkMvW5C6H4I5h7oRJUlA/QBX/C95Vd9HDUpO2Jnw2gvizS/GDc5Ifx+fWNPoSd49iW+V/oznkSklll2VI4wDt/ErWMP83T+fXzZ5/FO8MItcOCE56+EqLrPZaaVdMHPUI85B4KAUheaZn/2w8rzX0F3lXGqC+dubTWCS8tQt/YU9aunnhruo2p6k5ShgTtYo4OF4jupU0efB3Dym1d9ar96Ujc7ghHFQvvRrZiuUhmwAZLya5/1J3d/R/i9ubdMI8/kh+MACNdg4/yLum4k83GcI8zs5WM7aSEEoxg4Quqf48u3JnorQNFDzNv1tPCXu9oeiwLY7VQcnLN1wrUEZkBmppvSHODeHNySDtbnDaBi5Y55cvnlZ3cF+dtPaIncnE14Vt3iomf6VpMNfYHvA8ZdvgGebE8AVwP2WlB7klNo0t4MlVzYX1gUr+/unzHaebhIbD0M2soa7pT1J1cromWhR2C62a4N+bPtlTS9PPnTy20N52a97XSkpdZoyW8oZWmuJYY7V0hKBhjf+ZOkdrGjG4oU2wiXJqO1ZJWZDGtBt6oqBddrXR8CXMoO+nE/I7kuJiTgc5p8v5fr++/9vM3H73/P8Zx/L6wUD6mZs5rA2PTXzj/FQNg2v8gtSMBPsHuLpHmg063FMftgReaVNw4qOafrzN3VZvOICEHnTRxbNoz+NezjjcusPlJmfuzme2qajbRwyo/ZMyimmcpESbU9ieTMyoe5D1KWSP6rZu9ljarhc7XS74treSDbQrSdB3UWSWQ81rUFhZyIQiK3p/u8unjPzoednfnYfGRIycB14CjYfUsmIoEyrwBQGYhzRNhvfnPT588dr1rHaeZQW0TjgLM+/ZY9+WIsjda68JW5uzq0waTfgXW293WYI9oF/JWUEUZrcbKddQAsFkrnJkXZ1TJhByphu0pB0C73I5DhFzz5et28S8O5/f+3vbxh/9FGOeLftWfyrYZTmEeVh2JKYmLyW64wCbCG+37JcoWGb8CPpvr+NHGlzVLNn+OXgcDU9BQCzsyFSozcVtN3u4JQ6m3/qyWmcVKUyE1TZXmrow4nmNjxRDVrQXmwfreZNe92WmMpvyMTY90ROLVgXzgBC5pNTfzRcpjJZYS6kOJHY2pOmUft1fvjNvrT27uv/7ROO3prjJxViQ+Wwu8L62lPbVaagJydn4Oz4Iu765C7tntboyP2jCekm9szVPjPn1rqnSLOVUrA9/wAW7P+31xrmtZU66Mbd2pCQXtfKJRBvEg6R86jtyMx2jHlF0oAeg7joWRl4q5uNRY/W51597f2V1fvj4ft38116PLYWnW6DS9tWQRqBKcplUHqAs5NXIll6pDnGJfXfcIp8nXQXfPeXthOAXddULqaKOu48mZ/lJYGHSwk8XZlShJB+Db03YdE6RZSxB4rZYQ4rkMZ4ohBlAABfanSeEfSGZg1qGLtOM6UGl1V3im0YLSOCxAWAZ3W9wfnnA2ANDDGAZXr18+fvTH1/de/Y1+WET5LONxi897ONzQm1bFhJC88AQL6taIB17gqe3VU3d1s1XAvxhE+mYhEdcrcudixlpFfq0DimvcOtqZviNXMbZOKyqLrFS/ZGbArVKwlblUZzc52sWiEq4jqvXlVCxolzwrccQns6NUMnFKrmiF8i19uL73yt/eP4ufnOL+5/IN7LFLsIyweYZ4MyFIGcZjCz7T+nOkQVDlpwL2eU91W9HuzxoHKRdZul40X0Pf+J1qvRmaxqlwQL02rYPZD1nMZFLysC34xB040HjCaHo2fp5oFXlA9pURU1RSIkLGmdM24RlYDldsew92m5CD96q9koXU2YI6GYNzE2msP1VUkBbPPvzuj7317ufXoV/dwJNqsVF5Sr9Ck2QmF7IBjWnCtZC8L4GxpJGScavwVO/eeyDScw1ySIQJytsN4UQqUtn4sWmGUhn9d8E7/zG0Kd/4+rcS6TZ0raURlIFCI8SyHRsdJqYZnYrmSNkzQFk4kBHBvNTeJNekYevXyqxeBGXDcvF7d9/4xM/3m7u/6nyftAHrsTDUNn1VEo4HGKH1qAnFqHcleOpSM6NWYqgmF7rBdQXSioB+Rv3vOJYBhnk7OWKS6uPqCyogzQTqM/5MjRlSayLpuCc0IGMJzbDpEBZrXrQy3RFStygRFMSfgZGKfdDlzQ5yGdmtjL/q2Q/A10t2x+BLUgqw71gNMzStpC+mwMnC2swqtOEBSHVy9eTDn7x+9uRdb8jOCZF7LJCmTi2D8k5xDwa4twAR6DWhOhS0s1o+nwRLeO9vEatbv399gs2D3mIqfRMfaQyoVKwCTyEuX9koxeW4Srarv2dPM1jzBJhpmGAR4IfjngEOFp3Nr+fCMUGbXOAF/Ob71K9WvxtX53997Jb/3jF3Y6A7X8egXbHlWZCdpdGSq7w41zhu15uN+lEVO/dARzslNyO5ehob1+cmttxi40uMuFptBnIVEl2xYyF90AJTFLAE+G2qNs1zwYETj3/HyCKzb5fufj9qs6jp1q529kmD4sA78OrjqiFp1dvV3K+Np1o2mcY7oDNc25rr+fiZj779rT+fr8FKJnqWGyVaKdFgabMWCtQpDexhnMrJpWtSobwAxww6Zzjqe4pRWmocUglhpVP0qbE2rpOs1ADNVrOdwFqpWKU0elX/EgfVl0C1W7zV2ekFixqGazfEahw4CM6qN5IfI6ZgYjZx5EWIDHoQxvJyvfl/1w/e+C/TYvXvpR3XcFrdVQeOZWUXkYUJO0qBUBZLLNY2aQ+235Fxk1HdUgLxUE1zmUkLnDnWnFFWSC1tzYqULIjIZFKLbSCJkZMWdS5spmROXJy5T1Ed8mQMepzUIggxmvnP17lxgkQZ5hGKoiAKiUwtcym0a46Jlkt079Y+wNy3AaEFV4wuVC3QBjsnTqhgZbT44Jtf+093z598cRqPfjrs3M3Vi2L6q9zYoWx2Ty6v3NV2B3RlKrTEAbTAzn36T1QH3tRsmKmJ/Wu6f38SLdkQrmM6QQlMP+WYyGY14GnV4E9Cfl3j6uft/cjEJ3//f/LOxt0/U/gmJEvkqIa12EG7rqgBSgZpjAgyQy2XtMYSeKjrtPYTACr0iz8Iw/CHh93ND8V5fFUVzTzSgoZTdNTnW3lggwDhCEhtKhdXdm7RGW2RRTVR8z8V/9lA6qDhzrLLBNanyDVFoosrhse666UG/qshdFZQyWI8UHyHOpQjV/n5MhK9yjWp7FKix8frcTBgunw75uXaWc5ruaZCVplmDmWUhhha23wbh4caTxkb3y9gz+Px3s125195861/kWvSg3yvWPkY606ux1bq5rxcBCqTDXMtG0TQE00Ww+XVVd6tP/2lsluWENKXXE5ehqd8a4/C8aqRfbUnY3pf1FAF1xnL+2OwgBJogANY58fBbAh1Pv4f54X66gVdPPCkz+SoxlpOM8NeMcmenqgO/podkuWWaLJkx5KnteON/Wt0/QAAEltJREFUQkRW1/9+foEX+bj6cufTWceFbiYTNglCJA5dWmSRzORwXt/cwAcqEpKKVtqQ/JIItBvshAVLZ+klgi3UdEKphgb9TeTE1s5fjs4RuiadpslxLEe6pxWPHOHyAIpjy+V2h/c3YILmK6eXfQacBx0RBQwOiKFbt88V23E8W1QFXAodp2c2lwKa0elm0MheuqsXL95erDYfnN9/8NVhdTZ1izV2Urk/woyShSo3UKPpR2VyCadCPGzzNb5B4EdyJ/rPsgjLk1WFe0YANVC+umy1VnzV6c83H1ypAfEkVK1YBBVNVOUHFGJwudn2/b44KNuceE5dCRMahiV+We0DM1hJM1ms0PjAx0j8p8QKfZ443cF4Mrf2m/8znN37n8a8CUeOPQGjEBkJtJ0caUYL2AdK1B3n6BO6epHLyMjyiEV0KPWxZ1AwakqnNaVnSK0qKkzzz9AHp1JlPAxwMBlxD2SByS66pwug7KTCH4WNev7aFzcH9+xyq1FC4CG4GmEe55JlYPo2iApJWJH9xQB+GzC0qMtE7oLFXSZKsR0XdppTKe9KxP08vfGN3/r1//ry0Ud/KpjJLAOABTYz8jdOSFHYYpmoJwBcZnznQjsTbo3/S8WR2m7cWFSNqcGt8sAifRL9+JUjGT/WAbDUpEEZRMk3ziq3gtR8cMXS8oCC3mGWji6duVGxafJaWqEjgG6kD6lX10u9OQeSTpQi6K78+t4vpNXdf3DI60BsdODMQl6tLBRl8MsiOWJByvENt2rsBjOdq3VH3R72oK3BGpOLbj+NJfRBrstemgqpbfngGK8XC12aIl6bmb4EcpSLxSS6+aimbeIUKF5Z4pX7/HoHOYfW9xYPr4tMHibrBQIlzzJkCG2yOJlcsensS9zlPBViUMG4ufumlv6ZXJnE0e3Ez4fdp37n3/zL/2b7/OkfjeLdnk4deuaY6BOmRJ9A5pjjxLFzn/wT1Teo6fCLtXmdqShjvLHlOU32swapTZPyOKbluHWSK9ouat9gt+bL06T3mV23/PUiv+bPvrtxr1z0OPqnoxrigqwhDyjfuzQJcR5LpzpzqiULExgsuky6+6UKnVnYL4+z6+Vq87v77Vbq1U/nutIDv+xo3ciZvnqFzsqbPB45DpQZ9Yh5OlJHeLyZFMSuS+Ai6jmk6JmMYjtu8O1UyRVo54C5uKpfU9QZvmClAknJ+xD7dg2p0K6+LyWL7oRALrpQE8CxCJTIjF0ydAUjtezV0BDqA+PaLb8VQWoMq6gW575EWVq4hEJlzueH+c3nT588eO3NT/xG7gmey32Re3GAmbEHy1+97xUF6jngGOV+o0Y1tk1s0N5GL2WDgFA0+fEkQKCynRjy2xbcarrvoOMoi/PjalTnTvA2Kx2QNuLcn/78ubu76UDXEHhjf9higoILIzvUdCxPeWJeU4cxnYdNukFEQuiVXUTqydRouDoe8dJdd8Py+Wq9eXK4ufpSfsX7cpTMVFNKc0GeK0H9iJm5HFf7vAuObGZAQOFOodxNIR6nyvYnSK95qDUJr+xEDL6YeTrt800sTVNUp0EhPAt/VN6H1qYJtah3OhDpCTcl8gukDJCvAzKCBm4oD57ZuHtioxO8vEJhZCU6crfRTuauaKrPUFK863kZSfaegOfOIR73n3388P3XX/+et39z9t0LYaUBd04OhnVyr2TQstqcoWTb5vp0hFPhp3+ixqqcsKTCLVcUdxri6/0tbxPfmKQ1iABzUlO/POnMWjdp33iwplsprPJ663zx//Tnztzdsx6gvsAcstgAhPsapQh7wp5UMnSyqoeS41WJyPo0yo4swL8GS3QwYujs5qkLX8rN1Xv9YvH0uL/5qRSns2muC8yjw5+wc8h/j+Rzatc91xA150voxUS2FJhicipEbZRUI6VJhWrYNukwA1bqE0D8BA0VrXKACyuZQ7pkWah6pCvcFGhv5Kkjs11RY3qi6uip0yoLjeRrI6Ynaqx8qKYgC0acWy/Rk+5nvgymOrDpmDVTwF/J86VStp+P+88/efjwnfuvvPqt5MOHx8MxwWFxUqO3QIWuiP5kkV9eXubr85kvVYjJV4d937qcNRaSqSzqU9GfCeNuB6N7wQkxj1wU9WqDSVVnltSwsozqx4ZOjv6feXft7p9p1y9gMRhLthOyKWhth3xjn7m9uS4UOSkNTLEpC1UvyBKvIU82vKa0JBAo9jt5R/iBcb/7ghAeBbvVgAiFgcCU558tbMLS+AqjnoOJierOtrNOtBRyJL+U3YslhJkhH4CJahmw3x/xc2620jBd8RRyJLS4kmrdDhYKrBiURiiGcziyJx2AyDUMvkEFfOW3WjR5KDtSPFUMp4raFEYV3VesIhwbzoEBOcfd9nMfffD+D6/PLh75xeq9bT4yBJ1RV8YOZYpkX8lpud1ey0L9iWY3Dae++qdukM5afqPznSzmdArkF5MJzN2FNbRoGFq3E6tTCxa423vtMl+on/7sxj24WKBpkaPfpMXBwrToJqJYauOlKs2XOErTxE0uhPp86pxcdtAlHKJ1MIBQXcYt5tc75F26v37+9OfyrrrEjjkqI34CPnsoQQ4ax14lPUgaMVojSxg7I5TNlSD0S5as5+tiBngPkH1GM3YYFXiHXXr++c9f3IBYgjqXiycSUQmc3AXqnFR2bcx/86lSrVWpU5uNKDKBsO+7OnHizmpScpxaPlQyfaou4uaZGujvpTH0LQnJWRmZy4DDJ54/+vAn8SMXm28fxvEqSXYIUqolsnOB00XuX1+bpaY+LXVmPBmfet/6np6apN1y/i+0PE07uRXgm2rgVGo6xWqrlsqDAPPzcrFUhCcmsB2tEmev0g059p3Vp8QpBUBfgi2uR2pHa/UhdVrjkRM6MrDXcwdEcoeWDzG/7q/lWulbzy/3P4i1IDtdTNXzlV6eJdeUxyhshGR3IOSi9Dht7kY2CyNZ8jJJ2x/VOid0rFFzPXvYj6UXkL+9zruoJKZA794pEXlOekwac76j3l5qVXmM1f1PFwtohdEYThZl1JeIH7UDUjfpyKme8St8CE39qVzbnmTuVPRv2r8E84bwSio3hrzUyUKMcUAcoOrw6bj75LNvffXn+zsPf7q7+8bf8MPyV/Iin8zUwuw0exxD7PBOA1BSYxgRygizKlYqGmDNTwmKSLfNfG6FqJ0Qs5mLVJ636NytyDXx9OiLjbKSM6RJS5xFW1NnExtv8/JGyWo+WCIR6Vm3WbaRBSXIjLtfLEhVpLNJ332wOb/43S5NX3xytfUHp8QQN+kiOsAax3xPefRSS4amhLN6cEnlNJK8U+qPNA0vwoo98WHvkVcw0hdK6w/ZuaWzl0ZwvZBgBlMmKLYLsrFGXGO0rA+HchrsgRJP1Yh0l5Hx7Ir5eY2ELP4FlqOFKSJI1kM1mPBa/86xukxHxgtV/4EaI2QKe3AK+BsJjpCSqYuxBObFcT47PHn4M8Nx/0o4u/8L8f7rXwmrzUf5tUeMcYFCSDNlphG3iCL+xMOnmco3ZhTJVRjC3wqm0KJJybmuW9yKm26jfGJjCtyMYVli5Gbf/cznNoiwkaaop78/OJydjvY8pSmebDCDnjD9yDWqhXrJzYZnlUT7LJd6xOSi3SC6Hj6eqX4W76f8T69NV8/+1LIPg7ymEDyOMyc7XsNwTYasRgzadMnXgmRRHmKON2OlSKL7J4ZoYWPTpBCU1KPX1/mY3x2wAMWjDBJmrw+W1NMLMotMGSombzKChGqBc3ubHibizoGjZuyiloqSlDqozidq+wjnGOLb43EsTVjHByTGhv1EfwTPssY2reQsvILGHr7uwNBm2UMhx9d4fDPtr3562l5+Oc3Ta+v1+km+DJe5dp371gyiHN8n8il/StlLL9P4bNf1Ljb/nk4am3TioX7is3Jijda4/eiggIu1KGHluNc0Wg1QliNepF9wr6tNQGK8IiAe3qwUtQQQT5Chq0dmIIEX4D0tucVZj1IM+Z9/E7vuo0Xwn7rntXN/di0dtwcGiJRo+jwh6KHjruEC850iCc/8tDiKJ1jcWBNigbky5RL4S/99hjGF7KLG91T37QFHsnpmVVhJajpRyDpOvYJX3qvjEQzEwaumTD5/AhKS/+yJ5bLZ0trWFXGjNF2BMZOWLWegTyCmGlLLA0mlng2N4ticbYRqOBSoSxP8OAnzPsY7/bj7j3YffuvH988++vObV97837/3U+/+w961riRJ6x7f1JK+yX46Gf43dj2p5a3SWDedGK7eJg34k3C11IQFnz4JnsZoGl9p3XFkWMRiUckn86z5TIjOCbH4VnkSnZEa0mkJI7/vvao1hVfa2uKYxNo+PKYzPnx7GBa/f9zdfEpe63yY3dmDVX7UJZV6iZn69c0eWKoFhyH8wakCx5qMSK0QHrxkDDCd7ESmm4hLynJgMNjCYdfsreFizbkcAseeoYTP9ZzF24awMi9YRkYuF6qpF8zX+2oa4cgjDr1aT8rD3AdPxYDxS7sSAWQx6ZaVCkINf3ZPYnoVgcTaiUdVMuABDlp/RiPEhI7E787KTPnRaz8d/tjl++994YP3H32pryfwLeFzOsUzvfeF3lctdzzjK5q5f1GnOjXCNXZ/GRYkdxozYdBYOhXAkuMpF1Ld5NTxA850gKhGN8wDIm+s9DB/pXFSKx4fTvmvkXNuq0ll18FO5rWp0BuvbCnEqXOkGZbrm0O/+G7ntylNk1fH5eTubwY3LiZ3b33mxgd33FU+oq+FnCxjTSACEZ262vJo0wVZNh4WtZgMpNPJTiglTbfQPFHDPgfunB1RjQG471DIxliUy77oqmyhhBLb6egZ6yHO6xgJKaNXoB1JozDBK4ApWl9KH90t58Kk8oysgbbfu0KWSQ2PIXRaWugYuW42VprUSZzW8CZMstOmo5rV024ol0Hrp88efX+fXGqlZxWMMgeSJrXN6rbT3dWfkKDTx9n+u9Dor5qQitT4/tiMockIAIYnCsmQmJinRr4ghXjlME7ITUqQO2OnGufilGI5SjaksNcAnDQG+Mwjv1Miabxm2ffqA1A0PHgf/XBYrM9/7fLFs/8sf93KZucoMxD3E6ALFkLy/fO1u8k77OVVAGtrLxohmVhNapGz6PQBkBwqT89TKV08iCh09ZNZt7O4Rd0QVquFwkw8gpFhzyDhUGI5E0uMviSMBEY2ykMp7xO25ez0QSuU+jM/VPZajophZD0R+O/IUkt0ok5wigknCeHFDMRXHvJL1SNLAu/ciTtPx/G2uWkHvD+SXRKYVKlkoSbra1KtOc0yIjVsKPcSBNVMkVpCFXfc6P1pdOVtZas7TQG2KHb7O7jh5XpRSCSox/IHARu9s6bAN+Zg4r2ZSoMWYx37GgdTJSNariwJfGMXoIYeMT9YnGzMlFo3L9ab38g381mI81s+MDSYj/ZMprqE6krTkesPvO913umurm5gnnGUbFNIhDVBRbv6YOavtHR0RaOPo7TvOEGqHAlFNwIWsaPIrqdrS2QnbT4A01HTSxynVkc2RJHONkbZw1SOn0c5AeoKjcWPrjuVCZt9jylsBVkwo2JXpEquQFSp7W28ng5RZ/+NLEfJ16ayDaZ4ReniU7c8+1rfIvoGWbxkNuFDY6TmTo93dnje10hzq20SDddeqlHLwgyFO+DbtGrf6lSrLBv6maSj01msX7igE7OMWv7kyXu3UR+hLNWOO9L1ZGiWL94hqYCPI0AjthgzKCyWf5AX2HshHt8S7/7AXUY67O2eET5SQy4HnTLlz9RJnbdZuh38UaW7N8x2Vqm7GZUxWyn4VMaHPpA6J75XJGr3NhoWUnHfMTy3K2NS3+k42bF0gGjO1LFUkBa1p5UO5L+qE6L5F/hil267ZGSeg2idipcWd2bs1kNHGU6dVullj7QzsvtTVcqO8hU0u46NYSMKlc9+c5iev/ODX/wHPaYHPtziiSgFLTFY10wqyvnc7JCpYdgkV3fC1I5KmwyiKiNwp6NUanBuGQQpxS7RI0nsIVkGSGKDRBmW1BQy6JNBP6FeFGiM3EyRmldnPTBzAuGkRJXnVMBtD4kEiTFi8NWdPV6e3/3l/ZPtA28OF9wJzM5chwU9fWH1gQHXFVOwvABmbQp1zNnxodbmKyCEotP6LemAo+PuXseZvojsLFEPdZ81lGwYgdtOJFjbwAAlh06sUgnmVYPkjnY9Hj6tixMb0RirtshAfJX6180JPzuqtdJADNcCMmZ6uQI1YCqKYd7qMlhDdSM9XxM3F3nmpm79q+9+/w/88v8Pk6QvnAieswkAAAAASUVORK5CYII=';
const FR={r:0.7425,fx:0.6065,fy:0.6882};
let HK=0,U=0;
for(const id of ['hb','cb','slide-button']){
  const button=document.getElementById(id);
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    unlockAudio();
    if(st!=='play'||paused) return;
    if(id==='hb') actionQueued=true;
    if(id==='cb'){U=1;jump()}
    if(id==='slide-button') p.sl=true;
  });
  const release=()=>{
    if(id==='cb') U=0;
    if(id==='slide-button') p.sl=false;
  };
  button.addEventListener('pointerup',release);
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',release);
  button.addEventListener('click',event=>{
    if(event.detail!==0||st!=='play'||paused) return;
    if(id==='hb') actionQueued=true;
    if(id==='cb') jump();
    if(id==='slide-button') p.sl=!p.sl;
  });
}
function reset(){p={y:G,vy:0,sl:false,j:0,gy:G,cl:0};ob=[];co=[];pu=[];fx=[];gap=180;sp=6;dist=0;coins=0;inv=0;nx=600;shake=0;shield=0;turbo=0;alert=policeWarning=policeReveal=officerStride=0;cartInPursuit=null;nextAl=2000;msgT=0}
function jump(){
  if(paused){setPaused(false);return}
  if(st==='play'){
    if(p.y>=p.gy-.5||p.cl||coyoteTicks>0){
      p.vy=-13.5;p.j=1;p.cl=0;coyoteTicks=0;jumpBuffer=0;snd(440);
    }else if(p.j===1){
      p.vy=-12;p.j=2;jumpBuffer=0;snd(620);burst(170,p.y,'#fff',6);
    }else jumpBuffer=6;
    return;
  }
  if(onlineMode&&st==='over') return;
  if(st!=='menu'&&t-overT<40) return;
  if(st==='win'){stageWallet=coins;lvl++}
  else if(st==='menu'||st==='end'){lvl=0;stageWallet=0}
  go();
}

function setPaused(value){
  if(onlineMode||st!=='play') return;
  paused=value;
  releaseControls();
  last=performance.now();
  acc=0;
  syncAudio();
  updateInterface();
}

function togglePause(){
  setPaused(!paused);
}
function finishPursuit(message){
  alert=policeWarning=0;
  cartInPursuit=null;
  msg=message;
  msgT=120;
  nextAl=dist+DF[diff].ali*LV[lvl].sprintInterval;
}

function updatePursuit(stage,difficulty,meters){
  const progress=Math.min(1,meters/stage.goal);
  if(!alert&&!policeWarning&&!stumble&&dist>=nextAl){
    policeWarning=WARNING_TICKS;
    snd(260,.16);
    shout(pick(POLICE));
    if(!chaseCart()) placeObstacle({k:'cart',w:80,h:50,y:G-50},W+50);
  }

  if(policeWarning>0&&--policeWarning===0) alert=SPRINT_TICKS;
  if(cartInPursuit&&cartInPursuit.x<=policeX()+22){
    stumble=46;
    shake=10;
    snd(180,.22);
    finishPursuit('The boulis tripped over the cart!');
  }

  const sprintAge=SPRINT_TICKS-alert;
  const sprintEffort=alert?mix(.62,1,Math.min(1,sprintAge/72)):0;
  const recovery=difficulty.recovery*(alert?.35:1);
  const pressure=(.03*lvl+.10*progress)*difficulty.ramp;
  gap=Math.min(230,gap+recovery-pressure);
  if(alert){
    gap-=(difficulty.drain+lvl*.025)*sprintEffort;
    if(--alert===0) finishPursuit('The boulis slowed down');
  }
  if(stumble>0){
    gap=Math.min(230,gap+1.6);
    stumble--;
  }

  if(alert) policeReveal=1;
  else if(policeWarning) policeReveal=Math.min(1,policeReveal+1/(WARNING_TICKS-1));
  else if(!stumble) policeReveal=Math.max(0,policeReveal-.035);
  officerStride+=stumble?.12:.28+.2*sprintEffort;
}
function drawActionMarker(){
  if(st!=='play'||paused) return;
  const target=nearAct()||((alert||policeWarning)&&!cartInPursuit?chaseCart():null);
  if(!target||target.x>W) return;
  const markerX=Math.min(W-16,Math.max(16,target.x+target.w/2));
  const markerY=target.k==='stall'?G-127:G-102;
  x.fillStyle='#fff3bb';x.strokeStyle='#183a45';x.lineWidth=2;
  x.beginPath();x.moveTo(markerX-8,markerY);x.lineTo(markerX+8,markerY);
  x.lineTo(markerX,markerY+10);x.closePath();x.fill();x.stroke();
}
{const drawScene=draw;draw=function(){drawScene();drawActionMarker()}}
const DF=[
  {n:'EASY',g0:195,recovery:.23,ramp:.75,hit:30,ali:4700,drain:.24},
  {n:'NORMAL',g0:165,recovery:.17,ramp:1,hit:42,ali:3500,drain:.40},
  {n:'HARD',g0:140,recovery:.12,ramp:1.15,hit:52,ali:2700,drain:.52},
];
const SPRINT_TICKS = 360;
const WARNING_TICKS = 48;
function setDiff(i){diff=i;for(let k=0;k<3;k++){const b=document.getElementById('df'+k);if(b)b.className=k===i?'on':''}}
for(let k=0;k<3;k++){const b=document.getElementById('df'+k);b.onclick=()=>{if(!onlineMode&&st!=='play')setDiff(k)}}
setDiff(1);
addEventListener('keydown',e=>{if(!onlineMode&&st!=='play'&&/^Digit[123]$/.test(e.code))setDiff(+e.code[5]-1)});
let policeReveal = 0;
let policeWarning = 0;
let officerStride = 0;
let cartInPursuit = null;
function policeX(){
  const distanceX = 144 - gap;
  // Keep the officer visible during a sprint while still showing the gap closing.
  const sprintX = mix(134, 42, Math.max(0, Math.min(1, (gap - 10) / 220)));
  const stumbleX = stumble>0?Math.min(1,(46-stumble)/12)*15:0;
  return mix(distanceX, sprintX, policeReveal) - stumbleX;
}
function soukB(i,bx){
  const w=230,r=mod(i,5);
  let g=x.createLinearGradient(0,0,0,G);g.addColorStop(0,'#2e1a0f');g.addColorStop(.4,'#a06b3a');g.addColorStop(1,'#d9a76a');x.fillStyle=g;x.fillRect(bx,0,w+1,G);
  x.fillStyle='rgba(255,230,170,.10)';x.beginPath();x.moveTo(bx+60,0);x.lineTo(bx+100,0);x.lineTo(bx+170,G);x.lineTo(bx+90,G);x.fill();
  x.lineCap='butt';x.beginPath();x.moveTo(bx,G);x.lineTo(bx,140);x.quadraticCurveTo(bx,50,bx+w/2,34);x.quadraticCurveTo(bx+w,50,bx+w,140);x.lineTo(bx+w,G);
  x.strokeStyle='#4b2e18';x.lineWidth=14;x.stroke();x.strokeStyle='#e0b878';x.lineWidth=3;x.stroke();
  x.fillStyle='#1b100a';x.beginPath();x.moveTo(bx+34,G);x.lineTo(bx+34,G-112);x.arc(bx+w/2,G-112,w/2-34,Math.PI,0);x.lineTo(bx+w-34,G);x.fill();
  for(let a=0;a<3;a++){const sy=G-140+a*34;x.fillStyle='#6b4423';x.fillRect(bx+44,sy+26,w-88,4);
    for(let b=0;b<6;b++){const gx=bx+50+b*26;
      if((r+a)%2){x.fillStyle=(b+a)%2?'#c8102e':'#a8081c';rr(gx,sy+6,14,20,2);x.fill();x.fillStyle='#111';x.fillRect(gx+10,sy+4,2,8)}
      else{x.fillStyle=b%2?'#d9a441':'#b9792c';x.beginPath();x.arc(gx+8,sy+17,9,0,7);x.fill();x.fillStyle='#f6d98a';x.beginPath();x.arc(gx+6,sy+14,3,0,7);x.fill()}}}
  x.fillStyle='#74492a';x.fillRect(bx+28,G-32,w-56,32);x.fillStyle='#8b5a33';x.fillRect(bx+28,G-34,w-56,5);
  ['#c8102e','#e0a030','#7a4a22','#4c8f3b','#d9541e'].forEach((c,b)=>{x.fillStyle=c;x.beginPath();x.moveTo(bx+46+b*30,G-34);x.lineTo(bx+58+b*30,G-54);x.lineTo(bx+70+b*30,G-34);x.fill()});
  for(let s=0;s<9;s++){x.fillStyle=s%2?'#fff0d8':'#c8102e';x.fillRect(bx+26+s*20.5,G-176,20.5,26);x.beginPath();x.arc(bx+36.25+s*20.5,G-150,10.25,0,Math.PI);x.fill()}
  for(const lx of[bx+70,bx+160]){const ly=64+mod(lx,3)*6;x.strokeStyle='#333';x.lineWidth=1.5;x.beginPath();x.moveTo(lx,30);x.lineTo(lx,ly);x.stroke();
    const lg=x.createRadialGradient(lx,ly+12,2,lx,ly+12,50);lg.addColorStop(0,'rgba(255,200,90,.6)');lg.addColorStop(1,'rgba(255,200,90,0)');x.fillStyle=lg;x.fillRect(lx-50,ly-38,100,100);
    x.fillStyle='#d9a441';x.fillRect(lx-7,ly,14,22);x.fillStyle='#ffe08a';x.fillRect(lx-4,ly+4,8,14)}
  if(r%2===0){x.fillStyle='#8b1e2d';x.fillRect(bx+6,100,24,80);x.fillStyle='#e7c27d';for(let a=0;a<4;a++)x.fillRect(bx+14,108+a*18,8,8)}
}
function pillar(bx,i){
  const g=x.createLinearGradient(bx,0,bx+18,0);g.addColorStop(0,'#3b2412');g.addColorStop(.5,'#7a5030');g.addColorStop(1,'#3b2412');x.fillStyle=g;x.fillRect(bx,0,18,G);
  x.fillStyle='#d9a441';x.fillRect(bx-4,G-14,26,6);x.fillRect(bx-4,120,26,6);
  const lg=x.createRadialGradient(bx+9,92,2,bx+9,92,44);lg.addColorStop(0,'rgba(255,190,80,.55)');lg.addColorStop(1,'rgba(255,190,80,0)');x.fillStyle=lg;x.fillRect(bx-36,48,90,90);
  x.fillStyle='#c8102e';x.fillRect(bx+2,80,14,24);x.fillStyle='#ffe08a';x.fillRect(bx+5,85,8,14);
}
function skyline(i,bx){
  const r=mod(i,4);x.fillStyle='#121842';x.fillRect(bx,170+mod(i*29,25),132,120);
  if(r===1){x.fillRect(bx+40,70,26,150);x.fillRect(bx+36,66,34,8);x.fillRect(bx+44,52,18,16);x.beginPath();x.arc(bx+53,52,9,Math.PI,0);x.fill();x.fillRect(bx+52,34,2,14);x.fillStyle='#ffd36b';x.fillRect(bx+49,100,5,9);x.fillRect(bx+49,130,5,9)}
  else if(r===3){x.beginPath();x.arc(bx+60,175,34,Math.PI,0);x.fill()}
}
function nightB(i,bx){
  const r=mod(i,6),top=100+r*10,w=230;
  const g=x.createLinearGradient(0,top,0,G);g.addColorStop(0,'#1b2347');g.addColorStop(1,'#2d3566');x.fillStyle=g;x.fillRect(bx,top,w-10,G-top);
  x.fillStyle='#10163a';x.fillRect(bx+w-10,top+6,10,G-top-6);x.fillStyle='#252d5a';x.fillRect(bx-3,top-8,w-4,9);
  if(r%2===0){x.strokeStyle='#6a739d';x.lineWidth=2;x.beginPath();x.moveTo(bx+40,top-8);x.lineTo(bx+40,top-40);x.moveTo(bx+30,top-34);x.lineTo(bx+50,top-34);x.moveTo(bx+33,top-26);x.lineTo(bx+47,top-26);x.stroke()}
  else{x.fillStyle='#8c95b8';x.beginPath();x.arc(bx+150,top-8,12,Math.PI,0);x.fill();x.fillRect(bx+149,top-8,2,8)}
  for(let a=0;a<3;a++)for(let b=0;b<3;b++){const on=mod(i*7+a*3+b*5,4)<2,wx=bx+110+b*30,wy=top+22+a*40;
    if(on){x.fillStyle='rgba(255,200,90,.16)';x.fillRect(wx-5,wy-5,26,36)}
    x.fillStyle=on?'#ffcf5a':'#161c3d';x.fillRect(wx,wy,16,26);if(on){x.fillStyle='#8b5a2b';x.fillRect(wx+7,wy,2,26);x.fillRect(wx,wy+12,16,2)}}
  x.fillStyle='#ffb347';x.beginPath();x.moveTo(bx+24,G);x.lineTo(bx+24,G-60);x.arc(bx+48,G-60,24,Math.PI,0);x.lineTo(bx+72,G);x.fill();
  x.fillStyle='#3a2010';x.beginPath();x.moveTo(bx+30,G);x.lineTo(bx+30,G-58);x.arc(bx+48,G-58,18,Math.PI,0);x.lineTo(bx+66,G);x.fill();
  if(r%3===0){const f=((t>>3)+i)%11?1:.25;x.shadowColor='#ff3c8c';x.shadowBlur=14;x.fillStyle='rgba(255,90,160,'+f+')';x.font='800 17px system-ui,sans-serif';x.textAlign='left';x.fillText('CAF\u00c9',bx+20,top+34);x.shadowBlur=0}
  x.strokeStyle='#222';x.lineWidth=1;x.beginPath();x.moveTo(bx,top+90);x.quadraticCurveTo(bx+w/2,top+112,bx+w,top+90);x.stroke();
  for(let b=0;b<9;b++){const u=b/8,bxx=bx+u*w,byy=top+90+Math.sin(u*Math.PI)*22;x.fillStyle=['#ffd45a','#ff6b6b','#7be0ff'][b%3];x.beginPath();x.arc(bxx,byy+3,3,0,7);x.fill()}
}
function lamp(bx,i){
  x.strokeStyle='#1a1d33';x.lineWidth=6;x.beginPath();x.moveTo(bx,G);x.lineTo(bx,G-150);x.quadraticCurveTo(bx,G-170,bx+22,G-168);x.stroke();
  const lx=bx+22,ly=G-160;
  const cg=x.createRadialGradient(lx,ly,2,lx,ly,110);cg.addColorStop(0,'rgba(255,215,120,.55)');cg.addColorStop(1,'rgba(255,215,120,0)');x.fillStyle=cg;x.fillRect(lx-110,ly-110,220,260);
  x.fillStyle='#ffe29a';x.fillRect(lx-6,ly-6,12,16);x.fillStyle='#1a1d33';x.fillRect(lx-8,ly-9,16,4);
  x.fillStyle='rgba(255,215,120,.16)';x.beginPath();x.ellipse(lx,G+6,80,9,0,0,7);x.fill();
  x.fillStyle='#fff';for(let a=0;a<3;a++)x.fillRect(lx+Math.cos(t*.1+a*2)*18,ly+Math.sin(t*.13+a*3)*12,2,2);
}
let prevAct=0,combo=0,stumble=0,sub='',capT=0;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const POLICE=[{ar:'وقّف! بوليس!',tr:'Wa99ef! Boulis!',en:'Stop! Police!'},{ar:'يا هارب، وقّف!',tr:'Ya harb, wa99ef!',en:'Hey runner, stop!'}];
const ANGRY=[{ar:'آه، سلعتي!',tr:'Ah, sel3ati!',en:'Ah, my goods!'},{ar:'يا ستّار، الخضرة متاعي!',tr:'Ya sattar, el khodra mte3i!',en:'Oh dear, my vegetables!'}];
const WATCH=[{ar:'انتبه يا سيدي!',tr:'Intabeh ya sidi!',en:'Watch out, sir!'}];
const BYE=[{ar:'بالسلامة!',tr:'Bessalma!',en:'Safe travels!'},{ar:'يعطيك الصحّة!',tr:'Y3attik essa7a!',en:'Bless you!'}];
const WK=[['#d97b3f','#a85a28'],['#4f7fb3','#355a82'],['#8b5fa8','#68437f'],['#5aa26b','#3f7a4e']].map(c=>({shirt:c[0],shirt2:c[1],pants:'#3b3b4f',pants2:'#26263a',shoe:'#222',skin:'#c98d5e',gy:G,deco:()=>{},head:(hx,hy)=>{x.fillStyle='#2a1a10';x.beginPath();x.arc(hx,hy-2,9,Math.PI,0);x.fill()}}));
const VEN={shirt:'#2f8f6a',shirt2:'#1f6b4d',pants:'#3a3a3a',pants2:'#222',shoe:'#222',skin:'#c98d5e',gy:G-22,deco:()=>{},head:(hx,hy)=>{x.fillStyle='#e8e0cc';rr(hx-9,hy-14,18,9,4);x.fill()}};
function chaseCart(){
  return ob.find(o=>o.k==='cart'&&!o.tip&&o.x+o.w>174);
}

function obstacleBounds(obstacle){
  const bounds={left:obstacle.x-8,right:obstacle.x+obstacle.w+8,top:obstacle.y-8,bottom:obstacle.y+obstacle.h+8};
  if(obstacle.k==='cart'){
    bounds.left=obstacle.x-55;
    bounds.top=G-96;
  }else if(obstacle.k==='stall'){
    bounds.top=G-116;
  }else if(obstacle.k==='walker'){
    bounds.left-=18;
    bounds.right+=18;
    bounds.top=G-80;
  }
  return bounds;
}

function pickupOverlaps(pickup,obstacle,radius=20){
  const bounds=obstacleBounds(obstacle);
  return pickup.x+radius>bounds.left&&pickup.x-radius<bounds.right&&
    pickup.y+radius>bounds.top&&pickup.y-radius<bounds.bottom;
}

function placePickup(pickup){
  // Moving a pickup upward can meet an overhead obstacle, so resolve the whole stack.
  for(let pass=0;pass<=ob.length;pass++){
    const obstacle=ob.find(item=>pickupOverlaps(pickup,item));
    if(!obstacle) return true;
    pickup.y=obstacleBounds(obstacle).top-24;
  }
  return false;
}

function addCoin(x,y){
  const coin={x,y};
  if(placePickup(coin)&&coin.y>=80) co.push(coin);
}

function placeObstacle(obstacle,startX){
  const spacing=Math.max(170,sp*24);
  obstacle.x=ob.reduce((right,other)=>Math.max(right,other.x+other.w+spacing),startX);
  ob.push(obstacle);
  for(const pickup of [...co,...pu]) placePickup(pickup);
  co=co.filter(coin=>coin.y>=80);
  pu=pu.filter(pickup=>pickup.y>=80);
}

function nearAct(){
  if(p.y<G-70) return null;
  const inReach=o=>o.x<260&&o.x+o.w>150;
  if(alert||policeWarning){
    const cart=ob.find(o=>o.k==='cart'&&!o.tip&&o.x+o.w>174&&inReach(o));
    if(cart) return cart;
  }
  return ob.find(o=>(o.k==='cart'&&!o.tip||o.k==='stall'&&!o.used)&&inReach(o));
}
function doAct(o){
  if(o.k==='cart'){o.tip=1;o.tt=0;shake=7;snd(200,.25);
    for(let i=0;i<8;i++)fx.push({x:o.x+30,y:o.y+10,vx:-1.5-Math.random()*3,vy:-3-Math.random()*3,l:50,c:Math.random()<.5?'#f08a1c':'#f4b13a',r:5,g:1});
    for(let i=0;i<3;i++)addCoin(o.x+o.w+30+i*28,G-28);
    if(alert||policeWarning) cartInPursuit=cartInPursuit||o;
    else{gap=Math.min(230,gap+30);msg='Cart tipped';msgT=100}
    shout(pick(ANGRY))}
  else{if(coins>=o.cost){coins-=o.cost;o.used=1;if(o.offer==='brik'){shield=1;float('Brik shield!')}else{turbo=240;float('HARISSA TURBO!')}snd(800,.15);shout(pick(BYE))}
    else{msg='Not enough dinar!';msgT=80;snd(150,.15)}}
}
function propDraw(o){
  if(o.k==='cart'){
    const a=o.tip?Math.min(1.4,(o.tt||0)*.08):0;x.save();x.translate(o.x,G);x.rotate(-a);
    x.fillStyle='#3a2410';x.beginPath();x.arc(16,-8,10,0,7);x.arc(64,-8,10,0,7);x.fill();x.fillStyle='#b88a4a';x.beginPath();x.arc(16,-8,4,0,7);x.arc(64,-8,4,0,7);x.fill();
    x.fillStyle='#8f5a26';rr(0,-40,o.w,26,3);x.fill();x.fillStyle='#c98d4a';x.fillRect(2,-40,o.w-4,6);
    if(!o.tip)for(let i=0;i<9;i++){x.fillStyle=i%2?'#f08a1c':'#f4b13a';x.beginPath();x.arc(8+i*8.5,-46-(i%3)*3,6,0,7);x.fill()}
    x.restore()}
  else if(o.k==='stall'){
    hero(o.x+o.w/2,G-22,VEN);
    x.fillStyle='#74492a';x.fillRect(o.x,G-30,o.w,30);x.fillStyle='#8b5a33';x.fillRect(o.x-3,G-33,o.w+6,5);
    for(let i=0;i<5;i++){x.fillStyle=o.offer==='brik'?'#e8b86d':'#c8102e';x.beginPath();if(o.offer==='brik'){x.moveTo(o.x+8+i*18,G-33);x.lineTo(o.x+17+i*18,G-46);x.lineTo(o.x+26+i*18,G-33)}else{x.arc(o.x+16+i*17,G-40,7,0,7)}x.fill()}
    for(let s=0;s<6;s++){x.fillStyle=s%2?'#fff0d8':'#c8102e';x.fillRect(o.x-4+s*17.3,G-112,17.3,16);x.beginPath();x.arc(o.x+4.6+s*17.3,G-96,8.6,0,Math.PI);x.fill()}
    x.fillStyle='#f4e7c8';rr(o.x+8,G-26,o.w-16,16,3);x.fill();x.fillStyle='#12315a';x.font='800 10px system-ui,sans-serif';x.textAlign='center';
    x.fillText(o.used?'SOLD':(o.offer==='brik'?'BRIK ':'HARISSA ')+o.cost+' D',o.x+o.w/2,G-14)}
  else{x.save();x.translate(o.x+13,0);x.scale(-1,1);hero(0,G,WK[o.pal%4]);x.restore()}
}
function spawn(){
  const r=Math.random();let o;
  const localObstacle=LV[lvl].obstacle;
  if(r<.18&&localObstacle)o={...localObstacle,y:G-localObstacle.h,sol:1};
  else if(r<.18)o={k:'crate',w:42,h:42,y:G-42,sol:1};
  else if(r<.34)o={k:'vespa',w:64,h:40,y:G-40};
  else if(r<.42)o={k:'cat',w:28,h:20,y:G-20};
  else if(r<.55)o={k:'wash',w:90,h:48,y:238};
  else if(r<.66)o={k:'walker',w:26,h:58,y:G-58,v:1.8+lvl*.3,pal:Math.floor(Math.random()*4)};
  else if(r<.78)o={k:'cart',w:80,h:50,y:G-50};
  else if(r<.87){const b=Math.random()<.5;o={k:'stall',w:96,h:76,y:G-76,offer:b?'brik':'harissa',cost:b?5:10}}
  else{const hh=lvl?[96,125,150][Math.floor(Math.random()*3)]:96;o={k:'wall',w:100,h:hh,y:G-hh,sol:1}}
  placeObstacle(o,W+50);
  if(o.sol&&Math.random()<.8){
    for(let i=0;i<3;i++) addCoin(o.x-12+i*(o.w+24)/2,o.y-36);
  }
  else if(o.k!=='cart'&&o.k!=='stall'&&Math.random()<.6){const cy=o.k==='wash'?G-20:G-95-Math.random()*35;for(let i=0;i<4;i++)addCoin(o.x-20+i*34,cy)}
  if(Math.random()<.2){
    const pickup={k:Math.random()<.5?'brik':'harissa',x:o.x+270,y:G-110};
    if(placePickup(pickup)&&pickup.y>=80) pu.push(pickup);
  }
  nx=dist+(o.x-W-50)+360+Math.random()*240+sp*14;
}
function update(){
  const Lv=LV[lvl],D=DF[diff];
  const press=actionQueued||(HK&&!prevAct);prevAct=HK;actionQueued=false;
  if(press){const nr=nearAct();if(nr)doAct(nr)}
  sp=Math.min(Lv.spd+dist/3600,Lv.spd+4)*(turbo>0?1.5:1);
  const S=sp*(p.cl?.5:1);dist+=S;const m=dist/50;
  for(const q of co)q.x-=S;
  for(const pickup of pu)pickup.x-=S;
  for(const o of ob)o.x-=S+(o.v||0);
  // Pedestrians move independently and can cross an existing pickup trail.
  co=co.filter(coin=>!ob.some(obstacle=>pickupOverlaps(coin,obstacle)));
  pu=pu.filter(pickup=>!ob.some(obstacle=>pickupOverlaps(pickup,obstacle)));
  coyoteTicks=p.y>=p.gy-1&&p.vy===0?6:Math.max(0,coyoteTicks-1);
  updatePursuit(Lv,D,m);
  p.vy+=.7+(p.sl&&p.y<p.gy-1?1.2:0);
  const wasCl=p.cl;p.cl=0;if(wasCl&&U)p.vy=-12;
  const py0=p.y;p.y+=p.vy;
  let gy=G;for(const o of ob)if(o.sol&&o.x<190&&o.x+o.w>166&&py0<=o.y+4&&o.y<gy)gy=o.y;
  p.gy=gy;if(p.y>=gy){
    p.y=gy;p.vy=0;p.j=0;p.cl=0;
    if(jumpBuffer>0) jump();
  }
  jumpBuffer=Math.max(0,jumpBuffer-1);
  if(dist>nx)spawn();
  if(inv>0)inv--;if(shake>0)shake--;
  if(turbo>0){turbo--;inv=Math.max(inv,2);gap=Math.min(230,gap+.7);if(t%4===0)burst(150,p.y-20,'#e0203a',2)}
  const s=p.sl&&p.y>=gy-1,h=s?30:62,w=s?46:28,pb={x:166,y:p.y-h+8,w:w-12,h:h-12};
  for(const o of ob){
    if(o.k==='cart'){if(o.tip)o.tt++;continue}
    if(o.k==='stall')continue;
    const ov=pb.x<o.x+o.w&&pb.x+pb.w>o.x;
    if(ov&&pb.y<o.y+o.h&&pb.y+pb.h>o.y){
      if(o.sol&&U){p.cl=1;continue}
      if(inv>0)continue;
      if(shield){shield=0;inv=60;snd(300);burst(174,p.y-30,'#f4c542',12);float('Shield used!')}
      else{gap-=D.hit;inv=90;shake=12;snd(120,.2);combo=0;msg='Hit! The boulis gained ground';msgT=75;if(o.k==='walker')shout(pick(WATCH))}
      o.hit=1;break}
    if(ov){let c=1e9;if(pb.y+pb.h<=o.y)c=o.y-(pb.y+pb.h);else if(pb.y>=o.y+o.h)c=pb.y-(o.y+o.h);o.min=Math.min(o.min===undefined?1e9:o.min,c)}
    else if(!o.cc&&o.x+o.w<pb.x&&o.min<16&&!o.hit){o.cc=1;combo++;const b=1+Math.min(combo,5);coins+=b;gap=Math.min(230,gap+3);float('CLOSE CALL! +'+b+(combo>1?'  x'+combo:''));snd(1200,.08)}
  }
  for(const q of co){if(Math.hypot(q.x-(160+w/2),q.y-(p.y-h/2))<38){q.d=1;coins++;gap=Math.min(230,gap+5);snd(880+coins%8*60,.05);burst(q.x,q.y,'#f4c542',4);if(coins%10===0){float(coins+' dinar!');gap=Math.min(230,gap+18)}}}
  co=co.filter(q=>!q.d&&q.x>-30);
  for(const u of pu){if(Math.hypot(u.x-(160+w/2),u.y-(p.y-h/2))<36){u.d=1;snd(700,.15);if(u.k==='brik'){shield=1;float('Brik shield!')}else{turbo=240;float('HARISSA TURBO!')}}}
  pu=pu.filter(u=>!u.d&&u.x>-40);
  ob=ob.filter(o=>o.x>-160);
  for(const f of fx){f.x+=f.vx;f.y+=f.vy;if(f.g)f.vy+=.25;f.l--}fx=fx.filter(f=>f.l>0);
  if(msgT>0)msgT--;
  if(capT>0)capT--;
  if(m>=Lv.goal){st=lvl===LV.length-1?'end':'win';overT=t;snd(1000,.4)}
  else if(gap<=10){st='over';overT=t}
  if(st!=='play'){
    const score=Math.floor(LV.slice(0,lvl).reduce((sum,stage)=>sum+stage.goal,0)+Math.min(m,Lv.goal));
    if(score>best){best=score;try{localStorage.setItem('harba:stages',best)}catch{}}
  }
}

const ambience = [
  makeTrack('market.mp3', 0.24),
  makeTrack('bazaar.mp3', 0.30),
  makeTrack('medina.mp3', 0.18),
];
const footsteps = makeTrack('footsteps.mp3', 0.34);
const siren = makeTrack('siren.mp3', 0.26);
const soundButton = document.getElementById('sb');
let soundEnabled = true;
let audioUnlocked = false;
const trackStates = new WeakMap();
let onlineMode = false;
let lastReport = -1;

function makeTrack(file, volume) {
  const track = new Audio('./assets/' + file);
  track.preload = 'none';
  track.loop = true;
  track.volume = volume;
  return track;
}

function setTrack(track, playing, restart = false) {
  if(restart&&!playing&&track.currentTime) track.currentTime=0;
  if (trackStates.get(track) === playing) return;
  trackStates.set(track, playing);
  if (playing) {
    track.play().catch(() => {});
  } else {
    track.pause();
    if (restart) track.currentTime = 0;
  }
}

function syncAudio() {
  const running = soundEnabled && audioUnlocked && !document.hidden && st === 'play' && !paused;
  ambience.forEach((track, index) => setTrack(track, running && index === LV[lvl].ambience));
  setTrack(footsteps, running && p.y >= p.gy - 1 && !p.sl && !p.cl);
  const sprintAudible = running && alert > 0;
  if(sprintAudible) siren.volume = mix(.38,.15,Math.max(0,Math.min(1,gap/230)));
  setTrack(siren,sprintAudible,alert === 0 || st !== 'play');
}

function unlockAudio() {
  if (!soundEnabled) return;
  audioUnlocked = true;
  for (const track of [...ambience, footsteps, siren]) {
    if (track.paused && trackStates.get(track)) trackStates.delete(track);
  }
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  } catch {}
  syncAudio();
}

soundButton.onclick = () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) unlockAudio();
  else syncAudio();
};

addEventListener('pointerdown', unlockAudio);
addEventListener('keydown', unlockAudio);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    releaseControls();
    if(st==='play'&&!onlineMode) setPaused(true);
  }
  last=performance.now();
  acc=0;
  syncAudio();
});

function shout(phrase) {
  sub = phrase.tr + ' – ' + phrase.en;
  capT = 150;
}

function reportProgress(finished = false) {
  if (!onlineMode) return;
  const total = LV.reduce((sum, stage) => sum + stage.goal, 0);
  const completed = LV.slice(0, lvl).reduce((sum, stage) => sum + stage.goal, 0);
  const distance = completed + Math.min(dist / 50, LV[lvl].goal);
  const score = st === 'end' ? 1000 : Math.floor(1000 * distance / total);
  if (!finished && score <= lastReport) return;
  lastReport = score;
  parent.postMessage({ type: 'gamez-progress', game: 'harba', score, finished }, location.origin);
}

function go() {
  reset();
  coins=stageWallet;
  paused=false;
  releaseControls();
  coyoteTicks=0;
  gap = DF[diff].g0;
  nextAl = DF[diff].ali * LV[lvl].sprintInterval * .5;
  st = 'play';
  msg = 'LEVEL ' + (lvl + 1) + ' – ' + LV[lvl].n.toUpperCase();
  msgT = 160;
  combo = stumble = capT = 0;
  prevAct = HK;
  syncAudio();
  reportProgress();
}

function step() {
  t++;
  if (st === 'play') {
    if(!paused) update();
    reportProgress(st === 'over' || st === 'end');
  } else if (st === 'menu') {
    dist += 2;
  }
  syncAudio();
  updateInterface();
}

addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin ||
      event.data?.type !== 'gamez-online-start' || event.data.game !== 'harba' || onlineMode) return;
  onlineMode = true;
  setDiff(1);
  for (let i = 0; i < 3; i++) document.getElementById('df' + i).disabled = true;
  lvl = 0;
  stageWallet=0;
  go();
});


const ui=Object.fromEntries([
  'stage-name','stage-distance','stage-progress','coin-count','best-distance','boost-status',
  'chase-panel','chase-status','chase-hint','chase-progress','feedback','action-label',
  'overlay','overlay-kicker','overlay-title','overlay-copy','overlay-action','pause-button',
].map(id=>[id,document.getElementById(id)]));
const route=document.getElementById('route');
const routeSteps=LV.map(stage=>{
  const item=document.createElement('li');
  item.textContent=stage.n;
  route.appendChild(item);
  return item;
});
function uiText(id,value){
  if(ui[id].textContent!==value) ui[id].textContent=value;
}
function updateInterface(){
  const playing=st==='play',active=playing&&!paused,stage=LV[lvl];
  const meters=st==='menu'?0:Math.min(stage.goal,Math.floor(dist/50));
  uiText('stage-name',stage.n);
  uiText('stage-distance',meters+' / '+stage.goal+' m');
  ui['stage-progress'].max=stage.goal;
  ui['stage-progress'].value=meters;
  uiText('coin-count',String(coins));
  uiText('best-distance',best+' m');
  uiText('boost-status',turbo?'Harissa · '+Math.ceil(turbo/60)+'s':shield?'Brik shield ready':'Collect dinars to buy boosts');
  routeSteps.forEach((item,index)=>{
    item.className=index<lvl?'complete':index===lvl?'current':'';
    if(index===lvl) item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
  });
  for(let index=0;index<3;index++){
    const button=document.getElementById('df'+index);
    button.disabled=onlineMode||playing;
    button.setAttribute('aria-pressed',String(diff===index));
  }
  ui['pause-button'].disabled=!playing||onlineMode;
  ui['pause-button'].hidden=onlineMode;
  uiText('pause-button',paused?'Resume':'Pause');
  document.getElementById('cb').disabled=!active;
  document.getElementById('slide-button').disabled=!active;
  const action=active?nearAct():null;
  document.getElementById('hb').disabled=!action;
  const actionLabel=action?(action.k==='cart'?'Tip cart':'Buy '+action.offer+' · '+action.cost+' D'):'Act';
  uiText('action-label',actionLabel);
  const chasing=active&&alert>0,warning=active&&policeWarning>0;
  ui['chase-panel'].className='chase-panel'+(chasing?' sprint':warning?' warning':'');
  uiText('chase-status',paused?'Run paused':chasing?'Boulis sprint · '+Math.ceil(alert/60)+'s':warning?'The boulis spotted you':active&&gap<65?'Boulis closing in':active?'Keep your lead':st==='over'?'Caught by the patrol':st==='win'||st==='end'?'Stage cleared':'Ready to run');
  uiText('chase-hint',cartInPursuit?'Cart tipped — keep running':chasing||warning?'Tip a cart to slow the patrol':stumble?'Patrol recovering':active?'Collect dinars and avoid obstacles':'Five stages through Tunisia');
  ui['chase-progress'].value=Math.max(0,Math.min(100,gap/230*100));
  uiText('feedback',msgT>0&&playing?msg:capT>0&&playing?sub:action?('Press E or tap '+actionLabel):'');
  ui.overlay.hidden=active;
  if(active) return;
  const screens={
    menu:['TUNISIAN STREET RUN','HARBA!','Jump, slide, and climb through five districts. Tip carts to outsmart the boulis.','Start running'],
    win:['STAGE '+(lvl+1)+' COMPLETE','You made it!','Next stop · '+LV[Math.min(lvl+1,LV.length-1)].n+'. Your '+coins+' dinars carry over.','Next stage'],
    over:['END OF THE CHASE','Caught!','You reached '+meters+' m in '+stage.n+'. Watch for the patrol warning and tip a cart.','Retry stage'],
    end:['ALL FIVE STAGES COMPLETE','You escaped!','You made it through Tunis with '+coins+' dinars.','Run again'],
  };
  const screen=paused?['TAKE A BREATHER','Paused','Your run will continue from here.','Resume running']:screens[st];
  uiText('overlay-kicker',screen[0]);
  uiText('overlay-title',screen[1]);
  uiText('overlay-copy',screen[2]);
  uiText('overlay-action',screen[3]);
  ui['overlay-action'].hidden=onlineMode&&st==='over';
}
ui['pause-button'].onclick=togglePause;
ui['overlay-action'].onclick=()=>{
  unlockAudio();
  if(paused) setPaused(false);
  else jump();
  c.focus({preventScroll:true});
  updateInterface();
};

reset();
updateInterface();
requestAnimationFrame(loop);
