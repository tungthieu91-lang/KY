(()=>{
  const SEEN_KEY='kySplashSeen';
  function getSplash(){return document.getElementById('kySplash')}
  function enterHome(event){
    if(event){event.preventDefault();event.stopPropagation()}
    const splash=getSplash();
    if(splash){
      splash.classList.add('hidden');
      splash.setAttribute('aria-hidden','true');
      splash.style.display='none';
      splash.style.pointerEvents='none';
    }
    document.documentElement.classList.remove('splashLock');
    document.body?.classList.remove('splashLock');
    try{sessionStorage.setItem(SEEN_KEY,'1')}catch(_e){}
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_e){window.scrollTo(0,0)}
    return false;
  }
  window.KYEnterHome=enterHome;
  function bind(){
    const splash=getSplash();
    if(!splash)return;
    let seen=false;try{seen=sessionStorage.getItem(SEEN_KEY)==='1'}catch(_e){}
    if(seen){enterHome();return}
    document.documentElement.classList.add('splashLock');
    document.body?.classList.add('splashLock');
    ['skipSplash','startSplash'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      el.onclick=enterHome;
      el.addEventListener('pointerup',enterHome,{passive:false});
      el.addEventListener('touchend',enterHome,{passive:false});
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')enterHome(e)});
    // Phương án dự phòng: nếu trình duyệt chặn sự kiện, không giữ khách quá lâu ở splash.
    setTimeout(()=>{
      const s=getSplash();
      if(s&&!s.classList.contains('hidden')){
        const btn=document.getElementById('startSplash');
        if(btn)btn.setAttribute('data-ready','1');
      }
    },1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
