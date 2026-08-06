(()=>{const $=s=>document.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeJSON=(key,fallback)=>{
  try{
    const raw=localStorage.getItem(key);
    return raw===null?fallback:JSON.parse(raw);
  }catch(err){
    console.warn('Dữ liệu cục bộ lỗi, đã khôi phục:',key,err);
    localStorage.removeItem(key);
    return fallback;
  }
};
let ALL=[],RESULTS=[],shown=0,details=new Map(),
saved=new Set(safeJSON('ky13saved',safeJSON('ky10saved',[]))),
compare=new Set(safeJSON('ky13compare',[])),
recent=safeJSON('ky13recent',[]),
events=safeJSON('ky13events',[]);
let quickMinPrice=0;
let PRIVACY={knownImages:[],knownPropertyIds:[]};
let STREET_ALIASES=[];const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const overrides=()=>safeJSON('ky13overrides',{});
const hidden=()=>new Set(safeJSON('ky13hidden',[]));
const LOCATION_DATA=window.KY_LOCATION_DATA||{oldDistricts:[],newUnits:[]};
function locationLabel(unit){return `${unit.type} ${unit.name}`}
function populateLocations(){
  const select=$('#district'),lead=$('#leadDistrict');
  if(select){
    select.innerHTML='<option value="">Tất cả khu vực</option>';
    const oldGroup=document.createElement('optgroup');
    oldGroup.label='ĐÀ NẴNG CŨ – THEO THÓI QUEN';
    LOCATION_DATA.oldDistricts.forEach(name=>{
      const o=document.createElement('option');
      o.value=`old:${name}`;o.textContent=`${name} (cũ)`;oldGroup.appendChild(o);
    });
    select.appendChild(oldGroup);
    const newGroup=document.createElement('optgroup');
    newGroup.label='ĐÀ NẴNG MỚI – 94 XÃ, PHƯỜNG, ĐẶC KHU';
    LOCATION_DATA.newUnits.forEach(unit=>{
      const o=document.createElement('option');
      o.value=`new:${unit.name}`;o.textContent=locationLabel(unit);newGroup.appendChild(o);
    });
    select.appendChild(newGroup);
  }
  if(lead){
    lead.innerHTML='<option value="">Khu vực quan tâm</option>';
    LOCATION_DATA.oldDistricts.forEach(name=>{
      const o=document.createElement('option');o.value=`${name} (cũ)`;o.textContent=`${name} (cũ)`;lead.appendChild(o);
    });
    LOCATION_DATA.newUnits.forEach(unit=>{
      const o=document.createElement('option');o.value=locationLabel(unit);o.textContent=locationLabel(unit);lead.appendChild(o);
    });
  }
}
function propertyText(x,detail=null){
  return norm([x?.t,x?.st,x?.d,(x?.at||[]).join(' '),detail?.title,detail?.street,detail?.district,detail?.description].join(' '));
}
function findUnitByName(name){return LOCATION_DATA.newUnits.find(u=>u.name===name)}
function unitMatchesProperty(x,unit,detail=null){
  if(!unit)return false;
  const text=propertyText(x,detail);
  const candidates=[unit.name,...unit.sources].map(norm).sort((a,b)=>b.length-a.length);
  return candidates.some(alias=>alias.length>1&&text.includes(alias));
}
function locationMatchesProperty(x,value,detail=null){
  if(!value)return true;
  if(value.startsWith('old:'))return norm(x.d)===norm(value.slice(4));
  if(value.startsWith('new:'))return unitMatchesProperty(x,findUnitByName(value.slice(4)),detail);
  return norm(x.d)===norm(value);
}
function resolveNewUnit(x,detail=null){
  const text=propertyText(x,detail);
  let best=null,bestLen=0;
  LOCATION_DATA.newUnits.forEach(unit=>{
    [unit.name,...unit.sources].forEach(alias=>{
      const n=norm(alias);
      if(n.length>bestLen&&text.includes(n)){best=unit;bestLen=n.length}
    });
  });
  return best;
}
function oldAddressText(x,detail=null){
  const street=detail?.street||x?.st||'';
  const district=detail?.district||x?.d||'';
  const city=detail?.city||'Đà Nẵng';
  return [street,district,city].filter(Boolean).join(', ');
}
function newAddressHTML(x,detail=null){
  const unit=resolveNewUnit(x,detail);
  if(unit)return `<div class="addressNew"><b>🆕 Địa chỉ mới:</b> ${esc(locationLabel(unit))}, TP Đà Nẵng <small>KY đối chiếu từ tên phường/xã cũ trong nội dung.</small></div>`;
  return `<div class="addressNew pending"><b>🆕 Địa chỉ mới:</b> KY chưa đủ dữ liệu phường/xã cũ để đối chiếu chính xác.</div>`;
}
function inferQueryUnit(q){
  const nq=norm(q);
  return [...LOCATION_DATA.newUnits].sort((a,b)=>b.name.length-a.name.length).find(u=>nq.includes(norm(u.name)))||null;
}


function normalizeStreetText(value){
  let text=String(value||'');
  [...STREET_ALIASES].sort((a,b)=>String(b.from).length-String(a.from).length).forEach(rule=>{
    const escaped=rule.from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    text=text.replace(new RegExp(escaped,'gi'),rule.to);
  });
  return text;
}
function normalizeProperty(x){return {...x,t:normalizeStreetText(x.t),st:normalizeStreetText(x.st),at:Array.isArray(x.at)?x.at.map(normalizeStreetText):x.at}}
function isKnownPrivacyImage(src,id=''){const clean=String(src||'').split('?')[0];return PRIVACY.knownImages.some(v=>clean===String(v).split('?')[0])||PRIVACY.knownPropertyIds.includes(id)}
function replacePrivateImage(img,wrapper){
  if(!img)return;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="%23eaf3ff"/><circle cx="450" cy="245" r="92" fill="%230b6ce8"/><text x="450" y="270" text-anchor="middle" font-family="Arial" font-size="72" font-weight="700" fill="white">KY</text><text x="450" y="390" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="%23064596">ẢNH RIÊNG TƯ ĐÃ ẨN</text></svg>`;
  img.removeAttribute('srcset');img.src='data:image/svg+xml;charset=UTF-8,'+svg;img.alt='Ảnh riêng tư đã ẩn';img.dataset.privateReplaced='1';
  wrapper?.querySelectorAll('.faceLogoMask').forEach(n=>n.remove());
}
function addLogoMask(wrapper,rect=null){
  if(!wrapper||wrapper.querySelector('.faceLogoMask'))return;
  const mask=document.createElement('div');mask.className='faceLogoMask';mask.innerHTML='<span>KY</span><b>AI</b>';
  if(rect)Object.assign(mask.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${Math.max(48,rect.width)}px`,height:`${Math.max(48,rect.height)}px`,transform:'none'});
  wrapper.appendChild(mask);
}
function mapFaceRect(img,box){
  const w=img.clientWidth,h=img.clientHeight,nw=img.naturalWidth,nh=img.naturalHeight;if(!w||!h||!nw||!nh)return null;
  const scale=Math.max(w/nw,h/nh),rw=nw*scale,rh=nh*scale,ox=(rw-w)/2,oy=(rh-h)/2;
  return {left:box.x*scale-ox,top:box.y*scale-oy,width:box.width*scale,height:box.height*scale};
}
async function scanImagePrivacy(img,id=''){
  if(!img||img.dataset.privacyScanned==='1')return;img.dataset.privacyScanned='1';
  const wrapper=img.closest('.coverWrap,.mobileHero,.privacyImageWrap');
  if(isKnownPrivacyImage(img.currentSrc||img.src,id)){replacePrivateImage(img,wrapper);return}
  if('FaceDetector'in window)try{
    const detector=new FaceDetector({fastMode:true,maxDetectedFaces:8}),faces=await detector.detect(img);
    faces.forEach(face=>{const mapped=mapFaceRect(img,face.boundingBox);if(mapped)addLogoMask(wrapper,mapped)});
  }catch(e){console.debug('KY privacy scan skipped',e)}
}
function scanVisiblePrivacy(root=document){
  $$('img[data-privacy]',root).forEach(img=>{if(img.complete)scanImagePrivacy(img,img.dataset.propertyId||'');else img.addEventListener('load',()=>scanImagePrivacy(img,img.dataset.propertyId||''),{once:true})});
}
function setupSplash(){
  const splash=$('#kySplash');
  if(!splash)return;
  const close=e=>window.KYEnterHome?window.KYEnterHome(e):(()=>{splash.classList.add('hidden');splash.style.display='none';document.body.classList.remove('splashLock')})();
  $('#skipSplash')?.addEventListener('click',close);
  $('#startSplash')?.addEventListener('click',close);
}
function track(type,id='',meta={}){events.push({type,id,meta,time:new Date().toISOString()});if(events.length>1500)events=events.slice(-1500);localStorage.setItem('ky13events',JSON.stringify(events))}
function updateCompareUI(){const n=compare.size;const c=$('#compareCount');if(c)c.textContent=n;const d=$('#compareDrawer');if(d){d.classList.toggle('hidden',n===0);$('#compareText').textContent=n?`${n} căn đã chọn`:'Chưa chọn căn'}}
function toggleCompare(id,b){compare.has(id)?compare.delete(id):compare.add(id);if(compare.size>5){compare.delete(id);alert('Chỉ so sánh tối đa 5 căn.');return}localStorage.setItem('ky13compare',JSON.stringify([...compare]));if(b)b.textContent=compare.has(id)?'✓ Đã chọn':'⚖️ So sánh';updateCompareUI();track('compare',id,{selected:compare.has(id)})}
function districtMedian(d){const vals=ALL.filter(x=>x.d===d&&x.a>0&&x.p>0).map(x=>x.p/x.a).sort((a,b)=>a-b);if(!vals.length)return 0;const m=Math.floor(vals.length/2);return vals.length%2?vals[m]:(vals[m-1]+vals[m])/2}
function valuation(x){const med=districtMedian(x.d);if(!med||!x.a)return null;const estimate=med*x.a;return {low:estimate*.93,high:estimate*1.07,estimate}}
function propertyType(x){
  const t=norm([x.t,x.st,(x.at||[]).join(' ')].join(' '));
  if(/dat|lo dat/.test(t))return 'land';
  if(/can ho|chung cu/.test(t))return 'apartment';
  if(/mat tien|mat pho|frontage/.test(t)||(x.f&&x.f.frontage))return 'frontage';
  if(/kiet|hem/.test(t))return 'alley';
  return 'house';
}
function segmentSimilarity(seed,x){
  if(!seed||!x||seed.id===x.id)return -1e9;
  const sp=Number(seed.p)||0,xp=Number(x.p)||0,sa=Number(seed.a)||0,xa=Number(x.a)||0;
  if(!sp||!xp)return -1e9;
  const priceGap=Math.abs(xp-sp)/sp;
  if(priceGap>.20)return -1e9;
  if(propertyType(seed)!==propertyType(x))return -1e9;
  let s=100-priceGap*260;
  if(seed.d&&x.d===seed.d)s+=25;
  else if(seed.c&&x.c===seed.c)s+=7;
  if(sa&&xa){const areaGap=Math.abs(xa-sa)/sa;if(areaGap>.35)s-=25;else s+=Math.max(0,20-areaGap*45)}
  if(seed.b&&x.b)s+=Math.max(0,7-Math.abs(Number(x.b)-Number(seed.b))*3);
  const a=new Set((seed.at||[]).map(norm)),b=(x.at||[]).map(norm);s+=Math.min(12,b.filter(v=>a.has(v)).length*4);
  return s;
}
function smartCompareRows(){
  const chosen=ALL.filter(x=>compare.has(x.id));
  if(!chosen.length)return [];
  const seed=chosen[0],seen=new Set(chosen.map(x=>x.id));
  const candidates=ALL.filter(x=>!seen.has(x.id)).map(x=>({x,s:segmentSimilarity(seed,x)})).filter(r=>r.s>-1e8).sort((a,b)=>b.s-a.s);
  const rows=[...chosen];
  for(const r of candidates){if(rows.length>=10)break;rows.push(r.x)}
  return rows.slice(0,10);
}
function compareKYScore(x){
  let n=6.2,f=x.f||{};if(f.frontage)n+=.4;if(f.business)n+=.3;if(f.corner)n+=.3;if(x.a>=70)n+=.3;if(x.a>=100)n+=.2;if(x.b>=3)n+=.2;if((x.at||[]).length>1)n+=.2;return Math.min(9.6,Math.round(n*10)/10)
}
function showCompare(){const rows=smartCompareRows();if(!rows.length){alert('Bạn chưa chọn căn để so sánh.');return}$('#modal').classList.remove('hidden');document.body.classList.add('noScroll');$('#detail').innerHTML=`<div class="comparePage"><h1>KY so sánh 10 căn cùng phân khúc</h1><p class="compareIntro">${compare.size} căn bạn chọn · KY tự động bổ sung ${Math.max(0,rows.length-compare.size)} căn phù hợp nhất. Chạm vào tên căn để mở hồ sơ ngay.</p><div class="compareTable">
<div class="compareRow head"><b>Tiêu chí</b>${rows.map((x,i)=>`<button class="comparePropertyLink ${compare.has(x.id)?'selected':''}" data-open-compare="${esc(x.id)}"><small>${compare.has(x.id)?'ĐÃ CHỌN':'KY GỢI Ý '+(i+1)}</small><strong>${esc(x.t)}</strong><span>Chạm để xem hồ sơ ›</span></button>`).join('')}</div>
<div class="compareRow comparePriceRow"><span>GIÁ</span>${rows.map(x=>`<span><b>${esc(x.pt||((x.p||0)+' tỷ'))}</b></span>`).join('')}</div>
<div class="compareRow"><span>Giá/m²</span>${rows.map(x=>`<span>${x.a&&x.p?((x.p*1000/x.a).toFixed(1)+' triệu'):'—'}</span>`).join('')}</div>
<div class="compareRow compareAreaRow"><span>DIỆN TÍCH</span>${rows.map(x=>`<span><b>${x.a?esc(x.a)+' m²':'—'}</b></span>`).join('')}</div>
<div class="compareRow"><span>KY Score</span>${rows.map(x=>`<span><b>⭐ ${compareKYScore(x)}</b>/10</span>`).join('')}</div>
<div class="compareRow"><span>Phòng ngủ</span>${rows.map(x=>`<span>${esc(x.b||'—')}</span>`).join('')}</div>
<div class="compareRow"><span>Khu vực</span>${rows.map(x=>`<span>${esc(x.d||'Đà Nẵng')}</span>`).join('')}</div>
<div class="compareRow"><span>Địa chỉ</span>${rows.map(x=>`<span>${esc([x.st,x.d].filter(Boolean).join(', ')||x.t)}</span>`).join('')}</div>
<div class="compareRow"><span>Đặc điểm</span>${rows.map(x=>`<span>${esc((x.at||[]).join(' • ')||'—')}</span>`).join('')}</div>
<div class="compareRow"><span>Mở căn</span>${rows.map(x=>`<button class="compareOpenBtn" data-open-compare="${esc(x.id)}">Xem hồ sơ</button>`).join('')}</div>
</div><p class="safeNote">KY lựa chọn các căn gần nhất theo khu vực, mức giá, diện tích, phòng ngủ và đặc điểm bất động sản. Thông tin cần được xác nhận trước giao dịch.</p></div>`;
  $$('[data-open-compare]',$('#detail')).forEach(b=>b.onclick=()=>openDetail(b.dataset.openCompare));
  track('open_compare','',{count:rows.length,selected:compare.size})}
function setupAds(){
 const ads=safeJSON('ky13ads',null)||[
  {title:'Hỗ trợ vay mua nhà',text:'Tư vấn phương án tài chính phù hợp nhu cầu.',url:'tel:0935202777',active:true},
  {title:'Nội thất cho nhà mới',text:'Thiết kế và thi công theo ngân sách.',url:'https://zalo.me/0935202777',active:true}
 ];
 const a=ads.filter(x=>x.active!==false);if(!a.length)return;
 let i=0;const set=()=>{const x=a[i%a.length];$('#topAdTitle').textContent=x.title;$('#topAdText').textContent=x.text;$('#topAdCta').onclick=()=>location.href=x.url;i++};set();setInterval(set,8000);
 const n=a[1]||a[0];$('#nativeAdTitle').textContent=n.title;$('#nativeAdText').textContent=n.text;$('#nativeAdCta').onclick=()=>location.href=n.url;
}

async function loadIndex(url,cacheMode='default'){
  const r=await fetch(url,{cache:cacheMode});
  if(!r.ok)throw Error('HTTP '+r.status);
  const d=await r.json();
  if(!d||!Array.isArray(d.items))throw Error('Cấu trúc dữ liệu không hợp lệ');
  return d;
}
function installBridge(){
  window.KYBridge={
    getAll:()=>ALL,getResults:()=>RESULTS,setResults:v=>{RESULTS=v},
    render,renderRails,card,bind,openDetail,loadDetail,toggleSave,showSaved,
    home,filter,track,valuation,districtMedian,propertyText,norm,esc,
    saved,compare,updateCompareUI,newAddressHTML,oldAddressText
  };
}
async function boot(){
  populateLocations();setupSplash();
  try{
    // V16: tải chỉ mục nhẹ để vẽ trang chủ trước.
    const initial=await loadIndex('./data/initial.json','default');
    const ov=overrides(),hid=hidden();
    ALL=initial.items.filter(x=>!hid.has(x.id)).map(x=>normalizeProperty({...x,...(ov[x.id]||{})}));
    RESULTS=shuffleProperties(ALL);
    $('#summary').textContent=`✓ Đang hiển thị nhanh ${ALL.length} căn đầu tiên…`;
    render(true);renderRails();
    window.dispatchEvent(new CustomEvent('ky:data-ready',{detail:{count:ALL.length,partial:true}}));

    // Các dữ liệu phụ và 5.003 căn được nạp sau khi giao diện đã hiện.
    const loadFull=async()=>{
      try{
        const [d,privacyRes,streetRes]=await Promise.all([
          loadIndex('./data/index.json','default'),
          fetch('./privacy-images.json',{cache:'default'}),
          fetch('./street-normalization.json',{cache:'default'})
        ]);
        if(privacyRes.ok)PRIVACY=await privacyRes.json();
        if(streetRes.ok)STREET_ALIASES=(await streetRes.json()).aliases||[];
        ALL=d.items.filter(x=>!hid.has(x.id)).map(x=>normalizeProperty({...x,...(ov[x.id]||{})}));
        RESULTS=shuffleProperties(ALL);
        $('#summary').textContent=`✓ Đã sẵn sàng ${d.count.toLocaleString('vi-VN')} căn. Dữ liệu chi tiết chỉ tải khi mở hồ sơ.`;
        render(true);renderRails();
        window.dispatchEvent(new CustomEvent('ky:full-data-ready',{detail:{count:ALL.length}}));
      }catch(e){console.warn('KY V16 full index deferred:',e);$('#summary').textContent=`✓ Đang dùng ${ALL.length} căn đã tải. Có thể thử lại khi mạng ổn định.`}
    };
    if('requestIdleCallback'in window)requestIdleCallback(loadFull,{timeout:1800});else setTimeout(loadFull,250);
  }catch(e){
    // Dự phòng trực tiếp bằng chỉ mục đầy đủ.
    try{
      const d=await loadIndex('./data/index.json','default'),ov=overrides(),hid=hidden();
      ALL=d.items.filter(x=>!hid.has(x.id)).map(x=>normalizeProperty({...x,...(ov[x.id]||{})}));
      RESULTS=shuffleProperties(ALL);
      $('#summary').textContent=`✓ Đã tải ${d.count.toLocaleString('vi-VN')} căn.`;
      window.dispatchEvent(new CustomEvent('ky:data-ready',{detail:{count:ALL.length,partial:false}}));
    }catch(e2){$('#summary').textContent='Không tải được dữ liệu: '+e2.message;console.error(e2)}
  }
}
function score(x,c){
  let s=0,t=propertyText(x),q=norm(c.q);
  if(q){
    let words=q.split(/\s+/).filter(w=>w.length>1);
    words.forEach(w=>{if(t.includes(w))s+=5});
    if(t.includes(q))s+=50;
    if(c.inferredUnit&&unitMatchesProperty(x,c.inferredUnit))s+=55;
  }
  if(c.d)s+=locationMatchesProperty(x,c.d)?40:-20;
  if(c.area)s+=x.a>=c.area?10:-6;
  if(c.beds&&x.b)s+=x.b>=c.beds?10:-5;
  return s
}
function filter(){
  let c={
    q:$('#q').value.trim(),
    d:$('#district').value,
    max:+$('#maxPrice').value||0,
    min:quickMinPrice,
    area:+$('#minArea').value||0,
    beds:+$('#beds').value||0
  };
  c.inferredUnit=inferQueryUnit(c.q);
  let arr=ALL.map(x=>({...x,_s:score(x,c)}));
  if(c.q){
    const q=norm(c.q);
    let strict=arr.filter(x=>propertyText(x).includes(q));
    if(c.inferredUnit)strict=arr.filter(x=>unitMatchesProperty(x,c.inferredUnit));
    if(strict.length)arr=strict;else arr=arr.filter(x=>x._s>0);
  }
  if(c.d)arr=arr.filter(x=>locationMatchesProperty(x,c.d));
  if(c.min)arr=arr.filter(x=>x.p>c.min);
  if(c.area)arr=arr.filter(x=>x.a>=c.area);
  if(c.beds)arr=arr.filter(x=>!x.b||x.b>=c.beds);
  arr.sort((a,b)=>{
    if(c.max){
      const ag=a.p<=c.max?0:1,bg=b.p<=c.max?0:1;
      if(ag!==bg)return ag-bg;
      const ad=Math.abs(c.max-a.p),bd=Math.abs(c.max-b.p);
      if(ad!==bd)return ad-bd
    }
    return b._s-a._s||String(b.u).localeCompare(String(a.u))
  });
  RESULTS=arr;
  $('#title').textContent='Kết quả KY AI phù hợp nhất';
  $('#summary').textContent=`KY tìm thấy ${arr.length.toLocaleString('vi-VN')} căn. Tiêu chí chưa nhập được xem là tùy chọn.`;
  render(true);
  $('#resultsSection').scrollIntoView({behavior:'smooth'});
  $('#discovery').after($('#resultsSection'))
}
function card(x,small=false){let is=saved.has(x.id);return `<article class="card" data-id="${esc(x.id)}"><div class="coverWrap"><img loading="lazy" data-privacy data-property-id="${esc(x.id)}" src="${esc(x.im)}" alt="${esc(x.t)}" onerror="this.style.visibility='hidden'"></div><div class="body"><h3>${esc(x.t)}</h3><div class="loc"><span>📍 Địa chỉ cũ: ${esc([x.st,x.d].filter(Boolean).join(', '))}</span>${newAddressHTML(x)}</div><div class="primaryFacts"><div class="primaryPrice"><small>GIÁ BÁN</small><strong>${esc(x.pt||x.p+' tỷ')}</strong></div><div class="primaryArea"><small>DIỆN TÍCH</small><strong>${esc(x.a)} m²</strong></div></div>${x.b?`<div class="secondaryFact">🛏 ${x.b} phòng ngủ</div>`:''}<div class="actions"><button class="save" data-save>${is?'❤️ Đã lưu':'♡ Lưu'}</button><button class="compareBtn" data-compare>${compare.has(x.id)?'✓ Đã chọn':'⚖️ So sánh'}</button><button class="view" data-view>Xem hồ sơ</button></div></div></article>`}
function bind(root=document){$$('[data-view]',root).forEach(b=>b.onclick=()=>openDetail(b.closest('.card').dataset.id));$$('[data-save]',root).forEach(b=>b.onclick=()=>toggleSave(b.closest('.card').dataset.id,b));$$('[data-compare]',root).forEach(b=>b.onclick=()=>toggleCompare(b.closest('.card').dataset.id,b))}
/* V17.2 UI 1.1 — tạo thứ tự kho hàng mới */
function shuffleProperties(items){
  const result=[...items];

  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }

  return result;
}
function render(reset=false){if(reset){shown=0;$('#grid').innerHTML=''}let batch=RESULTS.slice(shown,shown+30);$('#grid').insertAdjacentHTML('beforeend',batch.map(x=>card(x)).join(''));shown+=batch.length;$('#count').textContent=`${RESULTS.length.toLocaleString('vi-VN')} căn`;$('#more').style.display=shown<RESULTS.length?'block':'none';bind($('#grid'));scanVisiblePrivacy($('#grid'))}
function renderRails() {
  const hot = [...ALL]
    .sort(
      (a, b) =>
        Number(b.f?.corner) +
        Number(b.f?.frontage) +
        Number(b.f?.business) -
        (Number(a.f?.corner) +
          Number(a.f?.frontage) +
          Number(a.f?.business))
    )
    .slice(0, 15);

  const news = [...ALL]
    .sort((a, b) => String(b.u).localeCompare(String(a.u)))
    .slice(0, 15);

  const hotRail = $('#hot');
  const newestRail = $('#newest');

  hotRail.innerHTML = hot.map((x) => card(x, true)).join('');
  newestRail.innerHTML = news.map((x) => card(x, true)).join('');

  bind($('#discovery'));
  scanVisiblePrivacy($('#discovery'));

  [hotRail, newestRail].forEach((rail) => {
    if (!rail || rail.dataset.autoScrollReady === '1') return;

    rail.dataset.autoScrollReady = '1';

    let paused = false;

    const pause = () => {
      paused = true;
    };

    const resume = () => {
      setTimeout(() => {
        paused = false;
      }, 1200);
    };

    rail.addEventListener('pointerdown', pause);
    rail.addEventListener('pointerup', resume);
    rail.addEventListener('pointercancel', resume);
    rail.addEventListener('mouseenter', pause);
    rail.addEventListener('mouseleave', resume);

    setInterval(() => {
      if (paused || rail.scrollWidth <= rail.clientWidth) return;

      rail.scrollLeft += 1;

      if (rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2) {
        rail.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 30);
  });
}
async function loadDetail(x){
  if(!x) throw Error('Không tìm thấy căn');
  if(details.has(x.id))return details.get(x.id);
  const r=await fetch(`./data/details/${x.s}.json`,{cache:'force-cache'});
  if(!r.ok)throw Error('Không tải được gói chi tiết: HTTP '+r.status);
  const a=await r.json();
  if(!Array.isArray(a))throw Error('Gói chi tiết không hợp lệ');
  a.forEach(p=>p&&p.id&&details.set(p.id,p));
  const found=details.get(x.id);
  if(!found)throw Error('Không tìm thấy hồ sơ trong gói dữ liệu');
  return found;
}
function closePropertyModal(){
  const m=$('#modal');
  if(m)m.classList.add('hidden');
  document.body.classList.remove('noScroll');
  const detail=$('#detail');
  if(detail)detail.innerHTML='';
}
function openLead(prefill=''){
  const m=$('#leadModal');
  if(!m)return;
  if(prefill&&$('#leadNeed'))$('#leadNeed').value=prefill;
  m.classList.remove('hidden');
  document.body.classList.add('noScroll');
}
function closeLead(){
  const m=$('#leadModal');
  if(m)m.classList.add('hidden');
  document.body.classList.remove('noScroll');
  localStorage.setItem('ky13LeadDismissedAt',String(Date.now()));
}
async function openDetail(id){let x=ALL.find(x=>x.id===id);recent=[id,...recent.filter(v=>v!==id)].slice(0,50);localStorage.setItem('ky13recent',JSON.stringify(recent));track('view_property',id);$('#modal').classList.remove('hidden');document.body.classList.add('noScroll');$('#detail').innerHTML='<div style="padding:60px;text-align:center">Đang tải hồ sơ…</div>';try{let p=await loadDetail(x);p={...p,title:normalizeStreetText(p.title),street:normalizeStreetText(p.street),description:normalizeStreetText(p.description)};let imgs=[p.cover_image,...(p.images||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i),cover=imgs[0]||'',v=valuation(x);$('#detail').innerHTML=`<div class="mobileDetail"><div class="mobileHero"><img id="mainImg" data-privacy data-property-id="${esc(id)}" src="${esc(cover)}"><div class="photoCount">📷 ${imgs.length}</div></div><div class="thumbs">${imgs.slice(0,12).map((u,i)=>`<button class="${i===0?'active':''}" data-img="${esc(u)}"><img data-privacy data-property-id="${esc(id)}" src="${esc(u)}"></button>`).join('')}</div><div class="detailBody"><div class="verified">✓ Thông tin AI đã xác minh & chuẩn hóa</div><h1>${esc(p.title)}</h1><div class="addressPair"><div class="addressOld"><b>📍 Địa chỉ cũ:</b> ${esc(oldAddressText(x,p))}</div>${newAddressHTML(x,p)}</div><h2 class="price">${esc(p.price_text)}</h2><div class="statGrid"><div><b>${esc(p.area_m2||'—')}</b><span>m² diện tích</span></div><div><b>${esc(p.frontage_m||'—')}</b><span>m mặt tiền</span></div><div><b>${esc(p.bedrooms||'—')}</b><span>phòng ngủ</span></div><div><b>${esc(p.structure||'—')}</b><span>kết cấu</span></div></div>${v?`<div class="valuationBox"><b>📊 Định giá tham khảo</b><span>${v.low.toFixed(2)}–${v.high.toFixed(2)} tỷ</span><small>Dựa trên giá/m² trung vị trong ${esc(x.d)}.</small></div>`:''}<details open class="infoBlock"><summary>Thông tin chi tiết</summary><div class="article">${esc(p.description)}</div></details><button class="consultBtn" id="consultBtn">Nhận tư vấn căn này</button></div><div class="mobileContact"><button id="detailSave">${saved.has(id)?'❤️ Đã lưu':'♡ Lưu'}</button><a href="https://zalo.me/0935202777" target="_blank">Zalo</a><a class="call" href="tel:0935202777">Gọi ngay</a></div></div>`;$$('.thumbs button').forEach(btn=>btn.onclick=()=>{$('#mainImg').dataset.privacyScanned='0';$('#mainImg').src=btn.dataset.img;$('#mainImg').addEventListener('load',()=>scanImagePrivacy($('#mainImg'),id),{once:true});$$('.thumbs button').forEach(x=>x.classList.remove('active'));btn.classList.add('active')});scanVisiblePrivacy($('#detail'));$('#detailSave').onclick=()=>toggleSave(id,$('#detailSave'));$('#consultBtn').onclick=()=>openLead(`Quan tâm căn: ${p.title} (${p.price_text})`)}catch(e){$('#detail').innerHTML='<div style="padding:40px">Không tải được hồ sơ. Hãy thử lại.</div>'}}
function toggleSave(id,b){saved.has(id)?saved.delete(id):saved.add(id);localStorage.setItem('ky13saved',JSON.stringify([...saved]));track('save',id,{saved:saved.has(id)});b.textContent=saved.has(id)?'❤️ Đã lưu':'♡ Lưu'}
function showSaved(){RESULTS=ALL.filter(x=>saved.has(x.id));$('#title').textContent='Các căn đã lưu';$('#summary').textContent=RESULTS.length?`Bạn đã lưu ${RESULTS.length} căn.`:'Bạn chưa lưu căn nào.';render(true);$('#resultsSection').scrollIntoView({behavior:'smooth'})}
function home(){
  $('#q').value='';
  $('#district').value='';
  $('#maxPrice').value='';
  $('#minArea').value='';
  $('#beds').value='';
  quickMinPrice=0;
  $$('#quick button').forEach(b=>b.classList.remove('active'));
  document.activeElement?.blur?.();
  closePropertyModal();
  closeLead();
  RESULTS=shuffleProperties(ALL);
  $('#title').textContent='Tất cả sản phẩm bất động sản';
  $('#summary').textContent=`✓ Đã tải chỉ mục ${ALL.length.toLocaleString('vi-VN')} căn. Dữ liệu chi tiết chỉ tải khi bạn mở hồ sơ.`;
  render(true);
  $('#nativeAd').before($('#resultsSection'));
  window.scrollTo({top:0,behavior:'smooth'});
}
$('#go').onclick=filter;
$('#q').onkeydown=e=>{if(e.key==='Enter')filter()};
$('#more').onclick=()=>render();
$('#homeBtn').onclick=home;
$('#savedBtn').onclick=showSaved;
$('#themeBtn').onclick=()=>document.body.classList.toggle('dark');
$('#quick').onclick=e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  $$('#quick button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const max=btn.dataset.price,min=btn.dataset.minPrice;
  if(min){
    quickMinPrice=+min;
    $('#maxPrice').value='';
  }else if(max){
    quickMinPrice=0;
    $('#maxPrice').value=max;
  }
  filter();
};

$('#modal').onclick=e=>{
  if(e.target.id==='modal'||e.target.classList.contains('close'))closePropertyModal();
};
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!$('#leadModal')?.classList.contains('hidden'))closeLead();
    else if(!$('#modal')?.classList.contains('hidden'))closePropertyModal();
  }
});

$$('.bottom button').forEach(b=>b.onclick=()=>{
  const a=b.dataset.act;
  if(a==='home')home();
  else if(a==='ai'){
    $('#q').scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>$('#q').focus(),350);
  }else if(a==='saved')showSaved();
  else if(a==='compare')showCompare();
  else if(a==='account')openLead();
});

$('#compareBtn').onclick=showCompare;
$('#openCompare').onclick=showCompare;
$('#clearCompare').onclick=()=>{
  compare.clear();
  localStorage.setItem('ky13compare','[]');
  updateCompareUI();
  render(true);
  renderRails();
};

$('#closeLead').onclick=closeLead;
$('#leadModal').onclick=e=>{if(e.target.id==='leadModal')closeLead()};

$('#leadForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('#leadName').value.trim();
  const phone=$('#leadPhone').value.replace(/\s+/g,'').trim();
  if(name.length<2){alert('Vui lòng nhập họ tên.');$('#leadName').focus();return}
  if(!/^(0|\+84)\d{8,10}$/.test(phone)){alert('Số điện thoại chưa đúng.');$('#leadPhone').focus();return}
  const leads=safeJSON('ky13leads',[]);
  leads.push({
    id:'lead_'+Date.now(),
    name,
    phone,
    district:$('#leadDistrict').value,
    budget:$('#leadBudget').value,
    need:$('#leadNeed').value.trim(),
    time:new Date().toISOString(),
    status:'Mới'
  });
  localStorage.setItem('ky13leads',JSON.stringify(leads));
  track('lead','',{phoneLast4:phone.slice(-4)});
  closeLead();
  e.target.reset();
  alert('Đã lưu nhu cầu thành công trên thiết bị này. Mở trang Admin bằng cùng trình duyệt để xem CRM.');
};

updateCompareUI();
window.addEventListener('error',e=>{
  console.error(e.error||e.message);
  const s=$('#summary');
  if(s&&(!ALL.length))s.textContent='Website gặp lỗi khi khởi động. Hãy tải lại trang.';
});
window.addEventListener('unhandledrejection',e=>{
  console.error(e.reason);
  const s=$('#summary');
  if(s&&(!ALL.length))s.textContent='Không tải được dữ liệu. Hãy kiểm tra mạng và tải lại.';
});

if('serviceWorker'in navigator){
  navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(console.warn);
}
boot();})();