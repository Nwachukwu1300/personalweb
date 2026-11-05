/* Soma's portrait: the photo becomes a grid of code characters on one side of a blue sweep
   and a blue duotone photo on the other. Idle, the characters shimmer and scatter near the pointer.
   const p=portrait(canvas,src,{reduced,onload}); p.cut=0..1 (sweep position); p.photoLeft=true
   puts the photo left of the sweep; p.draw(t) paints one frame; p.ready turns true once loaded. */
function portrait(av,src,{reduced=false,onload}={}){
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ax=av.getContext('2d'),N=46,AS=av.width,cell=AS/N,ramp=' .:-=+*#%@';
  let lum=null,duo=null,ptr={x:-1,y:-1};
  const p={cut:0,photoLeft:true,ready:false,draw};
  const img=new Image();
  img.onload=()=>{
    const s=330,c=document.createElement('canvas');c.width=c.height=s;const cx=c.getContext('2d');cx.drawImage(img,0,0,s,s);
    const d=cx.getImageData(0,0,s,s).data,L=new Float32Array(s*s);
    for(let i=0;i<s*s;i++)L[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];
    // histogram equalisation, so a dark portrait on a dark background still reads as characters
    const hist=new Float32Array(256);for(const v of L)hist[Math.min(255,v|0)]++;const cdf=new Float32Array(256);let acc=0;for(let i=0;i<256;i++){acc+=hist[i];cdf[i]=acc/(s*s)}
    const floor=cdf[12];const norm=v=>Math.pow(clamp((cdf[Math.min(255,v|0)]-floor)/(1-floor)),1.15);
    const out=cx.createImageData(s,s);
    for(let i=0;i<s*s;i++){const t=norm(L[i]);out.data[i*4]=6+t*(169-6);out.data[i*4+1]=7+t*(198-7);out.data[i*4+2]=11+t*(255-11);out.data[i*4+3]=255}
    cx.putImageData(out,0,0);duo=c;
    // edges (eyes, mouth, collar) carry the likeness; brightness fills the rest
    const E=new Float32Array(s*s);let em=0;
    for(let y=1;y<s-1;y++)for(let x=1;x<s-1;x++){const i=y*s+x;const gx=L[i+1]-L[i-1]+(L[i-s+1]-L[i-s-1]+L[i+s+1]-L[i+s-1])*.5,gy=L[i+s]-L[i-s]+(L[i+s-1]-L[i-s-1]+L[i+s+1]-L[i-s+1])*.5;E[i]=Math.hypot(gx,gy);if(E[i]>em)em=E[i]}
    lum=new Float32Array(N*N);const k=s/N;
    for(let r=0;r<N;r++)for(let q=0;q<N;q++){let a=0,e=0,n=0;for(let y=Math.floor(r*k);y<Math.floor((r+1)*k);y++)for(let x=Math.floor(q*k);x<Math.floor((q+1)*k);x++){a+=L[y*s+x];e+=E[y*s+x];n++}
      const base=norm(a/n);lum[r*N+q]=base<.04?0:clamp(base*.45+Math.pow(e/n/em*4,.8)*.85)}
    p.ready=true;
    if(onload)onload();else draw(performance.now());
  };
  img.src=src;
  av.addEventListener('pointermove',e=>{const r=av.getBoundingClientRect();ptr={x:(e.clientX-r.left)/r.width*N,y:(e.clientY-r.top)/r.height*N}});
  av.addEventListener('pointerleave',()=>ptr={x:-1,y:-1});
  function draw(t){
    if(!lum)return;
    ax.fillStyle='#06070b';ax.fillRect(0,0,AS,AS);
    const cut=p.cut,cutX=cut*AS,fromIsAscii=p.photoLeft;
    ax.save();ax.beginPath();fromIsAscii?ax.rect(0,0,cutX,AS):ax.rect(cutX,0,AS-cutX,AS);ax.clip();ax.imageSmoothingEnabled=true;ax.drawImage(duo,0,0,AS,AS);ax.restore();
    ax.save();ax.beginPath();fromIsAscii?ax.rect(cutX,0,AS-cutX,AS):ax.rect(0,0,cutX,AS);ax.clip();
    ax.font=`500 ${cell*1.05}px "JetBrains Mono",monospace`;ax.textAlign='center';ax.textBaseline='middle';
    for(let r=0;r<N;r++)for(let q=0;q<N;q++){
      const v=lum[r*N+q];if(v<.04)continue;
      const dist=Math.hypot(q-ptr.x,r-ptr.y),near=reduced?0:dist<7?(1-dist/7):0;
      const flick=reduced?0:(Math.sin(t*.002+q*.7+r*1.3)*.5+.5)*.12;
      let ch=ramp[Math.min(ramp.length-1,Math.floor((v+flick)*(ramp.length-1)))];
      if(near>0&&Math.random()<near)ch='01<>{}/;'[Math.floor(Math.random()*8)];
      const ox=near*(Math.random()-.5)*cell*1.6,oy=near*(Math.random()-.5)*cell*1.6;
      ax.fillStyle=near>.2?'#4f8cf6':`rgba(169,198,255,${.4+v*.6})`;
      ax.fillText(ch,q*cell+cell/2+ox,r*cell+cell/2+oy);
    }
    ax.restore();
    if(cut>.001&&cut<.999){const w=(6+Math.sin(Math.PI*cut)*22);ax.fillStyle='#4f8cf6';ax.fillRect(cutX-w/2,0,w,AS)}
  }
  return p;
}
