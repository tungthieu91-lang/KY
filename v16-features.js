(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const state={filters:new Set(),customer:null,ready:false};
try{state.customer=JSON.parse(localStorage.getItem('ky16_customer')||'null')}catch{}
let B=null, scoreCache=new Map();
function flags(x){const t=norm([x.t,x.st,x.d,(x.at||[]).join(' ')].join(' ')),f=x.f||{};return{frontage:!!f.frontage||t.includes('mat tien'),business:!!f.business||/kinh doanh|shophouse|buon ban/.test(t),home:/nha o|o ngay|gia dinh|dinh cu/.test(t)||!/cho thue|dong tien/.test(t),rental:/cho thue|dang thue|khach thue/.test(t),cashflow:/dong tien|thu nhap|khai thac|loi nhuan/.test(t)}}
function score(x){if(scoreCache.has(x.id))return scoreCache.get(x.id);let n=6.3,f=flags(x);if(f.frontage)n+=.35;if(f.business)n+=.25;if(x.a>=70)n+=.3;if(x.a>=100)n+=.25;if(x.b>=3)n+=.2;if((x.at||[]).length>1)n+=.25;n=Math.min(9.6,Math.round(n*10)/10);scoreCache.set(x.id,n);return n}
function installUI(){
 const quick=$('#quick');if(quick&&!$('#v15Filters'))quick.insertAdjacentHTML('afterend','<div id="v15Filters" class="v15Filters"><button data-f="frontage">🏙 Mặt tiền</button><button data-f="business">🏪 Kinh doanh</button><button data-f="home">🏠 Nhà ở</button><button data-f="rental">🔑 Cho thuê</button><button data-f="cashflow">💰 Dòng tiền</button></div>');
 const rs=$('#resultsSection');if(rs&&!$('#v15Discovery'))rs.insertAdjacentHTML('beforebegin','<section id="v15Discovery" class="v15Discovery"><div class="v15Head"><div><small>KY AI ĐỀ XUẤT</small><h2>⭐ Căn nổi bật hôm nay</h2></div><span id="v15PickScore"></span></div><div id="v15Pick"></div><h3>🔥 Đang HOT hôm nay</h3><div id="v15Hot" class="rail"></div></section>');
 if(!$('#v15Modal'))document.body.insertAdjacentHTML('beforeend','<div id="v15Modal" class="v15Modal hidden"><div class="v15Panel"><button class="v15Close">×</button><div id="v15ModalBody"></div></div></div>');
 $('#v15Filters')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.f;state.filters.has(k)?state.filters.delete(k):state.filters.add(k);b.classList.toggle('active',state.filters.has(k));applyFilters()});
 $('#v15Modal')?.addEventListener('click',e=>{if(e.target.id==='v15Modal'||e.target.classList.contains('v15Close'))closeModal()});
}
function decorate(root=document){$$('.card',root).forEach(c=>{const x=B.getAll().find(v=>v.id===c.dataset.id);if(!x)return;const cover=c.querySelector('.coverWrap');if(cover&&!cover.querySelector('.v15Score'))cover.insertAdjacentHTML('beforeend',`<span class="v15Score">⭐ ${score(x)}</span>`);const body=c.querySelector('.body');if(body&&!body.querySelector('.v15Tags')){const f=flags(x),a=[];if(f.frontage)a.push('Mặt tiền');if(f.business)a.push('Kinh doanh');if(f.rental)a.push('Cho thuê');if(f.cashflow)a.push('Dòng tiền');if(!a.length)a.push('Nhà ở');body.querySelector('h3')?.insertAdjacentHTML('afterend',`<div class="v15Tags">${a.slice(0,3).map(v=>`<span>${v}</span>`).join('')}</div>`)}const actions=c.querySelector('.actions');if(actions&&!actions.querySelector('[data-amenities]'))actions.insertAdjacentHTML('beforeend','<button data-amenities>📍 Tiện ích</button><button data-location>🗺️ Vị trí</button>')})}
function renderDiscovery(){const all=B.getAll();if(!all.length)return;const sample=all.length>400?all.slice(0,400):all;let pick=sample[0];for(const x of sample)if(score(x)>score(pick))pick=x;$('#v15Pick').innerHTML=B.card(pick,true);$('#v15PickScore').textContent=`KY Score ${score(pick)}/10`;const hot=[...sample].sort((a,b)=>score(b)-score(a)).slice(0,12);$('#v15Hot').innerHTML=hot.map(x=>B.card(x,true)).join('');B.bind($('#v15Discovery'));decorate($('#v15Discovery'))}
function applyFilters(){let arr=B.getAll().filter(x=>{const f=flags(x);return [...state.filters].every(k=>f[k])});B.setResults(arr);B.render(true);decorate($('#grid'));$('#title').textContent=state.filters.size?'Kết quả theo nhu cầu':'Tất cả sản phẩm bất động sản';$('#summary').textContent=`${arr.length.toLocaleString('vi-VN')} căn phù hợp.`}
function openModal(html){$('#v15ModalBody').innerHTML=html;$('#v15Modal').classList.remove('hidden');document.body.classList.add('noScroll')}
function closeModal(){$('#v15Modal').classList.add('hidden');document.body.classList.remove('noScroll')}
function timeoutFetch(url,opts={},ms=6500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(url,{...opts,signal:c.signal}).finally(()=>clearTimeout(t))}
function cleanStreetName(x){
 let raw=String(x.st||x.t||'').trim();
 raw=raw.replace(/^mặt\s*phố\s+/i,'').replace(/^mặt\s*tiền\s+/i,'').replace(/^đường\s+/i,'').trim();
 const n=norm(raw);
 if(n==='ke'||n==='dong ke') return 'Đồng Kè';
 if(n==='quy don'||n==='le quy don') return 'Lê Quý Đôn';
 if(n==='luong 24'||n==='thanh luong 24') return 'Thanh Lương 24';
 if(n==='duc chinh'||n==='pho duc chinh') return 'Phó Đức Chính';
 return raw||String(x.d||'Khu vực Đà Nẵng');
}
function areaLabel(x){return [cleanStreetName(x),x.d,x.c||'Đà Nẵng'].filter(Boolean).join(', ')}
function mapSearchUrl(term,x){const q=[term,cleanStreetName(x),x.d||'',x.c||'Đà Nẵng'].filter(Boolean).join(', ');return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
const DISTRICT_HINTS={
 'lien chieu':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'thanh khe':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'hai chau':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'son tra':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'ngu hanh son':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'cam le':{school:true,market:true,health:true,bank:true,park:true,pharmacy:true},
 'hoa vang':{school:true,market:true,health:true,bank:true,park:false,pharmacy:true}
};
function inferAmenities(x){
 const d=norm(x.d||''),base=DISTRICT_HINTS[d]||{school:true,market:true,health:true,bank:true,park:true,pharmacy:true};
 return {...base,radius:1,source:x.d?'Tên đường và quận/huyện':'Tên đường và khu vực Đà Nẵng'};
}
function resultRow(icon,title,key,term,x,inferred){
 const yes=inferred[key];
 return `<a class="v16AmenityCard" href="${mapSearchUrl(term,x)}" target="_blank" rel="noopener"><span class="v16AmenityIcon">${icon}</span><span><b>${title}</b><small>Tìm quanh bán kính ${inferred.radius} km</small></span><strong class="${yes?'v16AmenityYes':'v16AmenityMaybe'}">Mở ›</strong></a>`
}
function integratedAmenities(x,msg=''){
 const inf=inferAmenities(x),area=esc(areaLabel(x));
 return `<div class="v15LocationScore"><b>Khu vực đang tra cứu:</b> ${area}<br><small>Bán kính 1 km · Giữ nguyên cơ chế bản đồ của V16</small></div><div class="v16AmenityGrid">${resultRow('🏫','Trường học','school','trường học',x,inf)}${resultRow('🛒','Chợ & siêu thị','market','chợ siêu thị',x,inf)}${resultRow('🏥','Y tế','health','bệnh viện phòng khám',x,inf)}${resultRow('🏦','Ngân hàng & ATM','bank','ngân hàng ATM',x,inf)}${resultRow('🌳','Công viên','park','công viên',x,inf)}${resultRow('💊','Nhà thuốc','pharmacy','nhà thuốc',x,inf)}</div><div id="v16NearbyLive" class="v16NearbyLoading">⏳ Đang bổ sung danh sách địa điểm thực tế trong 1 km…</div><a class="v16AreaMap" href="${mapSearchUrl('',x)}" target="_blank" rel="noopener">📍 Mở khu vực trên Google Maps</a>${msg?`<small class="v16AmenityNote">${esc(msg)}</small>`:''}`
}
function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=v=>v*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(a)))}
function amenityCategory(tags={}){const a=tags.amenity||'',shop=tags.shop||'',leisure=tags.leisure||'';if(/school|kindergarten|college|university/.test(a))return 'Trường học';if(a==='marketplace'||/supermarket|mall|convenience/.test(shop))return 'Chợ & siêu thị';if(/hospital|clinic|doctors/.test(a))return 'Y tế';if(a==='pharmacy'||shop==='chemist')return 'Nhà thuốc';if(/bank|atm/.test(a))return 'Ngân hàng & ATM';if(/park|playground|sports_centre/.test(leisure)||a==='park')return 'Công viên & vui chơi';if(/fuel|parking|bus_station/.test(a)||tags.highway==='bus_stop')return 'Giao thông';if(/restaurant|cafe|fast_food/.test(a))return 'Ăn uống';return 'Khác'}
async function geocodeProperty(x){
 const street=cleanStreetName(x),queries=[`${street}, ${x.d||''}, Đà Nẵng, Việt Nam`,`${street}, Đà Nẵng, Việt Nam`,`${x.d||''}, Đà Nẵng, Việt Nam`].filter(Boolean);
 for(const qq of queries){try{const g=await timeoutFetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(qq)}`,{headers:{'Accept-Language':'vi'}},3500);if(g.ok){const a=await g.json();if(a.length)return {...a[0],query:qq}}}catch(e){}}
 return null
}
function locationPopup(x){
 const q=areaLabel(x),embed=`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`,open=mapSearchUrl('',x);
 openModal(`<h2>🗺️ Vị trí căn nhà</h2><div class="v17MapAddress"><b>${esc(q)}</b><small>Bản đồ tìm theo địa chỉ có trong dữ liệu căn nhà.</small></div><iframe class="v17MapFrame" src="${embed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bản đồ vị trí"></iframe><a class="v16AreaMap" href="${open}" target="_blank" rel="noopener">Mở toàn màn hình trên Google Maps</a>`)
}
async function amenities(x){
 const key='ky17_amenity_1km_'+x.id,street=cleanStreetName(x);
 openModal(`<h2>📍 Tiện ích quanh ${esc(street)}</h2><div id="amenityStatus">${integratedAmenities(x,'Nếu dịch vụ bản đồ công cộng gián đoạn, các nút tìm theo nhóm phía trên vẫn hoạt động.')}</div>`);
 try{
  const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&Date.now()-cached.time<7*864e5&&cached.items?.length){appendNearbyItems(cached.items);return}
  const geo=await geocodeProperty(x);if(!geo){showAmenityError('Không xác định được tọa độ từ địa chỉ này. Hãy dùng các nút tìm theo nhóm hoặc mở Google Maps.');return}
  const lat=+geo.lat,lon=+geo.lon,query=`[out:json][timeout:12];(nwr(around:1000,${lat},${lon})[amenity~"school|kindergarten|college|university|hospital|clinic|doctors|marketplace|bank|atm|pharmacy|fuel|parking|bus_station|restaurant|cafe|fast_food"];nwr(around:1000,${lat},${lon})[shop~"supermarket|mall|convenience|chemist"];nwr(around:1000,${lat},${lon})[leisure~"park|playground|sports_centre"];nwr(around:1000,${lat},${lon})[highway="bus_stop"];);out center 60;`;
  let data=null;for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){try{const r=await timeoutFetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:query},13000);if(r.ok){data=await r.json();break}}catch(e){}}
  if(!data){showAmenityError('Chưa tải được danh sách địa điểm. Bạn có thể thử lại hoặc dùng các nút tìm theo nhóm.');return}
  const seen=new Set(),items=[];for(const e of data.elements||[]){const tags=e.tags||{},name=tags.name||tags['name:vi'];if(!name)continue;const elat=+(e.lat??e.center?.lat),elon=+(e.lon??e.center?.lon);if(!Number.isFinite(elat)||!Number.isFinite(elon))continue;const distance=haversine(lat,lon,elat,elon);if(distance>1000)continue;const k=norm(name);if(seen.has(k))continue;seen.add(k);items.push({name,category:amenityCategory(tags),distance})}
  items.sort((a,b)=>a.distance-b.distance);if(!items.length){showAmenityError('Không tìm thấy địa điểm có tên trong bán kính 1 km từ tọa độ tra cứu.');return}
  localStorage.setItem(key,JSON.stringify({time:Date.now(),items}));appendNearbyItems(items)
 }catch(e){showAmenityError('Dữ liệu bản đồ đang gián đoạn. Hãy thử lại sau hoặc mở Google Maps.')}
}
function appendNearbyItems(items){const host=$('#v16NearbyLive');if(!host)return;const groups={};items.slice(0,40).forEach(i=>(groups[i.category]??=[]).push(i));host.className='v16Nearby';host.innerHTML=`<b>Địa điểm được xác nhận trong bán kính 1 km (${items.length})</b>${Object.entries(groups).map(([g,a])=>`<section class="v17AmenityGroup"><h4>${esc(g)}</h4>${a.map(i=>`<div><span>📌 ${esc(i.name)}</span><strong>${i.distance<1000?i.distance+' m':'1 km'}</strong></div>`).join('')}</section>`).join('')}`}
function showAmenityError(msg){const host=$('#v16NearbyLive');if(!host)return;host.className='v16AmenityError';host.innerHTML=`⚠️ ${esc(msg)}<br><button type="button" onclick="this.closest('.v15Panel').querySelector('.v15Close').click()">Đóng</button>`}
function capture(){document.addEventListener('click',e=>{const card=e.target.closest('.card'),id=card?.dataset.id,x=id&&B.getAll().find(v=>v.id===id);if(!x)return;if(e.target.closest('[data-amenities]')){e.preventDefault();e.stopImmediatePropagation();amenities(x)}else if(e.target.closest('[data-location]')){e.preventDefault();e.stopImmediatePropagation();locationPopup(x)}},true)}
function observe(){new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)decorate(n)}).observe(document.body,{childList:true,subtree:true})}
function init(){if(state.ready)return;B=window.KYBridge;if(!B)return;state.ready=true;installUI();decorate();renderDiscovery();capture();observe();window.KYV16={score,amenities};window.addEventListener('ky:full-data-ready',()=>{scoreCache.clear();renderDiscovery();decorate()},{once:true})}
if(window.KYBridge)init();else window.addEventListener('ky:data-ready',init,{once:true});
})();
