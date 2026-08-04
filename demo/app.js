
let DATASET=Array.isArray(window.KY_PROPERTIES)?window.KY_PROPERTIES:[];let P=[...DATASET];const state={step:0,answers:{},selected:[],manageSelected:new Set(),usingRealData:false,currentPage:1,pageSize:12};
/* ===== KY AI V2.2 – SAFE VERIFIED DISPLAY ===== */
function hasMeaningfulValue(value){
  if(value === null || value === undefined) return false;
  if(typeof value === 'number') return Number.isFinite(value) && value > 0;
  const text = String(value).trim().toLowerCase();
  return Boolean(text) && !['0','0 phòng','0 phòng ngủ','0 wc','không rõ','chưa rõ','n/a','null','undefined'].includes(text);
}
function aiPendingText(label='AI đang xác minh'){
  return `<span class="ai-pending"><i></i>${label}</span>`;
}
function verifiedText(value, suffix=''){
  return hasMeaningfulValue(value)
    ? `<span class="verified-value">${escapeHTML(String(value))}${suffix}</span>`
    : aiPendingText();
}
function plainVerifiedValue(value, suffix=''){
  return hasMeaningfulValue(value) ? `${value}${suffix}` : 'AI đang xác minh';
}
function verifiedStatusClass(value){
  return hasMeaningfulValue(value) ? 'verified' : 'pending';
}

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];function showView(n){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+n+'View').classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}$$('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));$('#brandBtn').onclick=()=>showView('home');$('#themeBtn').onclick=()=>document.body.classList.toggle('dark');
function addMsg(t,w='ky'){const d=document.createElement('div');d.className='msg '+w;d.innerHTML=(w==='ky'?'<div class="avatar">KY</div>':'')+`<div class="bubble">${t}</div>`;$('#chatMessages').appendChild(d);$('#chatMessages').scrollTop=99999}function thinking(next){const d=document.createElement('div');d.className='msg ky';d.innerHTML='<div class="avatar">KY</div><div class="bubble thinking"><i></i><i></i><i></i><span>KY đang phân tích...</span></div>';$('#chatMessages').appendChild(d);setTimeout(()=>{d.remove();next()},900)}function choices(a,h){const q=$('#quickChoices');q.innerHTML='';q.classList.remove('hidden');a.forEach(x=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>{q.classList.add('hidden');h(x)};q.appendChild(b)})}function userSay(t){addMsg(t,'user')}
function normalizeVN(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')}
function parseNeed(text){
  const raw=String(text||''); const t=normalizeVN(raw);
  const money=[...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:ty|tỷ)/g)].map(m=>Number(m[1].replace(',','.')));
  const districts=['son tra','hai chau','ngu hanh son','thanh khe','lien chieu','cam le','hoa vang'];
  const district=districts.find(d=>t.includes(d))||'';
  return {raw,maxPrice:money[0]||0,district,car:/o\s*to|oto|xe hoi/.test(t),frontage:/mat tien|mat pho/.test(t),beach:/gan bien|my khe|an thuong|bien/.test(t),income:/dong tien|cho thue|thu nhap/.test(t),business:/kinh doanh/.test(t),bedrooms:Number((t.match(/(\d+)\s*(?:phong ngu|pn)/)||[])[1]||0),invest:/dau tu/.test(t)};
}
function propertyText(p){return normalizeVN([p.title,p.address,p.street,p.district,p.location,p.description,p.public_article,(p.attributes||[]).join(' '),(p.tags||[]).join(' ')].join(' '))}

function cleanTitleLine(line){
  return String(line||'')
    .replace(/^\s*[🔥✨⭐🏠📌💎🚨]+\s*/u,'')
    .replace(/\*\*/g,'')
    .replace(/^[\-–—|:.\s]+|[\-–—|:.\s]+$/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function titleFromArticle(article){
  const raw=String(article||'').replace(/\r/g,'').trim();
  if(!raw)return '';

  // Tách theo xuống dòng hoặc các mốc bố cục phổ biến nếu bài bị dính một dòng.
  const candidates=raw
    .split(/\n+|(?=✨)|(?=📌\s*(?:THÔNG TIN|THÔNG SỐ))|(?=⭐\s*ĐIỂM)|(?=💰\s*GIÁ)|(?=📞\s*LIÊN HỆ)/u)
    .map(x=>x.trim())
    .filter(Boolean);

  let first=candidates.find(x=>/^🔥/u.test(x)) || candidates[0] || '';
  first=cleanTitleLine(first)
    .replace(/\s*(?:✨|📌|⭐|💰|📞).*$/u,'')
    .replace(/\s+/g,' ')
    .trim();

  // Tiêu đề không được nuốt phần mô tả/bài viết.
  if(first.length>110) first=first.slice(0,110).replace(/\s+\S*$/,'').trim();
  if(first.length<8 || /^(THÔNG TIN|ĐIỂM NỔI BẬT|GIÁ CHÀO BÁN|LIÊN HỆ)/i.test(first)) return '';
  return first;
}
function articleBody(article){
  const raw=String(article||'').replace(/\r/g,'').trim();
  if(!raw)return '';
  const title=titleFromArticle(raw);
  let body=raw;
  const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(lines.length>1 && cleanTitleLine(lines[0]).startsWith(title.slice(0,30))){
    body=lines.slice(1).join('\n\n');
  }else if(/^🔥/u.test(raw)){
    body=raw.replace(/^🔥[^\n]*(?:\n+|(?=✨)|(?=📌))/u,'').trim();
  }
  return body || raw;
}
function compactLocation(p){
  return [p.street||p.address,p.district].filter(Boolean).join(', ');
}
function synthesizeProfessionalTitle(p,i){
  const f=p.flags||p.features||{};
  const parts=[];
  if(f.corner) parts.push('LÔ GÓC');
  else if(f.frontage && f.business) parts.push('MẶT TIỀN KINH DOANH');
  else if(f.frontage) parts.push('MẶT TIỀN');
  else if(f.near_beach) parts.push('GẦN BIỂN');
  else if(f.car_avoid) parts.push('Ô TÔ TRÁNH');
  else if(f.car_access) parts.push('Ô TÔ VÀO');

  const place=p.street||p.address||p.district||'ĐÀ NẴNG';
  const area=Number(p.area_m2||0);
  const price=Number(p.price_billion||0);
  const tail=[
    place ? String(place).toUpperCase() : '',
    area ? `${area.toLocaleString('vi-VN')}M²` : '',
    price ? `${price.toLocaleString('vi-VN')} TỶ` : ''
  ].filter(Boolean).join(' – ');

  return [parts.join(' – '),tail].filter(Boolean).join(' – ') || `BẤT ĐỘNG SẢN ${i+1}`;
}
function professionalTitle(p,i){
  const article=p.description||p.public_article||p.article||'';
  return titleFromArticle(article) || synthesizeProfessionalTitle(p,i);
}
function propertyFacts(p){
  const facts=[];
  if(p.price_text||p.price_billion) facts.push(`💰 ${p.price_text||p.price_billion+' tỷ'}`);
  if(p.area_m2) facts.push(`📐 ${Number(p.area_m2).toLocaleString('vi-VN')} m²`);
  if(p.bedrooms) facts.push(`🛏 ${p.bedrooms} PN`);
  const f=p.flags||p.features||{};
  if(f.car_avoid) facts.push('🚙 Ô tô tránh');
  else if(f.car_access) facts.push('🚗 Ô tô');
  if(f.frontage) facts.push('🏢 Mặt tiền');
  return facts;
}

function adaptProperty(p,i){
  if(p.price_billion!==undefined){
    const f=p.flags||p.features||{};
    const images=[...new Set([p.cover_image,...(Array.isArray(p.images)?p.images:[])].filter(Boolean))];
    return {...p,
      title:professionalTitle(p,i),
      source_title:p.title||p.address||'',
      price:p.price_text||`${p.price_billion} tỷ`,
      area:`${p.area_m2||0} m²`,
      location:[p.street||p.address,p.district,p.city].filter(Boolean).join(', '),
      road:f.frontage?'Mặt tiền':f.car_avoid?'Ô tô tránh':f.car_access?'Ô tô':'Chưa xác nhận',
      bedrooms:p.bedrooms||0,score:0,
      tags:[...(p.attributes||[]),f.near_beach?'Gần biển':'',f.rental_income?'Dòng tiền':'',f.business?'Kinh doanh':''].filter(Boolean).slice(0,6),
      reasons:[],
      image:images[0]||'',
      images,
      article:p.description||p.public_article||p.article||'',
      strengths:[],
      cautions:['Thông tin pháp lý và tình trạng còn bán cần được xác nhận trực tiếp.']
    };
  }
  return p;
}
function scoreProperty(p,n){
  p=adaptProperty(p,0);const txt=propertyText(p);let score=20,reasons=[];const price=Number(p.price_billion||String(p.price||'').replace(',','.').match(/[\d.]+/)?.[0]||0);
  if(n.maxPrice){const diff=price-n.maxPrice;if(price&&diff<=0){score+=28;reasons.push('Nằm trong ngân sách')}else if(diff<=0.5){score+=15;reasons.push('Chỉ vượt nhẹ ngân sách')}else score-=20}
  if(n.district){const ok=txt.includes(n.district);score+=ok?22:-8;if(ok)reasons.push('Đúng khu vực ưu tiên')}
  const f=p.flags||{};
  if(n.car){if(f.car_access||f.car_avoid||/o to|oto/.test(txt)){score+=15;reasons.push('Đáp ứng yêu cầu ô tô')}else score-=8}
  if(n.frontage){if(f.frontage||/mat tien|mat pho/.test(txt)){score+=15;reasons.push('Có mặt tiền theo dữ liệu')}else score-=8}
  if(n.beach){if(f.near_beach||/gan bien|my khe|an thuong/.test(txt)){score+=12;reasons.push('Có yếu tố gần biển')}else score-=4}
  if(n.income){if(f.rental_income||/dong tien|cho thue|trieu\/thang/.test(txt)){score+=15;reasons.push('Có thông tin dòng tiền/cho thuê')}else score-=7}
  if(n.business){if(f.business||/kinh doanh/.test(txt)){score+=10;reasons.push('Phù hợp nhu cầu kinh doanh')}else score-=4}
  if(n.bedrooms){if((p.bedrooms||0)>=n.bedrooms){score+=10;reasons.push(`Đáp ứng từ ${n.bedrooms} phòng ngủ`)}else score-=5}
  if(!reasons.length) reasons.push('Có thông số gần với nhu cầu ban đầu');
  return {...p,score:Math.max(1,Math.min(99,Math.round(score))),reasons};
}
function runSearch(query){const n=parseNeed(query);return DATASET.map((x,i)=>scoreProperty(adaptProperty(x,i),n)).sort((a,b)=>b.score-a.score).slice(0,Math.min(8,DATASET.length))}
function flow(input){
  state.lastQuery=input; userSay(input);
  thinking(()=>{
    if(!DATASET.length){addMsg('<b>Kho dữ liệu đang trống.</b><p>Hãy nhập file ky-package hoặc ky-data được xuất từ tiện ích Đại Thế Kỷ.</p>');return}
    const need=parseNeed(input);const understood=[];
    if(need.maxPrice)understood.push(`💰 Ngân sách: khoảng ${need.maxPrice} tỷ`);if(need.district)understood.push(`📍 Khu vực: ${need.district}`);if(need.car)understood.push('🚗 Ô tô');if(need.frontage)understood.push('🏢 Mặt tiền');if(need.beach)understood.push('🌊 Gần biển');if(need.income)understood.push('📈 Dòng tiền');
    P=runSearch(input);
    addMsg(`<b>KY đã hiểu nhu cầu:</b><p>${understood.length?understood.join('<br>'):'Mình sẽ tìm theo nội dung bạn vừa mô tả.'}</p><p>Mình đã phân tích ${P.length} kết quả phù hợp nhất trong kho hiện có.</p>`);
    renderResults();$('#resultsSection').classList.remove('hidden');$('#resultsSection').scrollIntoView({behavior:'smooth'});state.resultsShown=true;
  });
}
$('#chatForm').onsubmit=e=>{e.preventDefault();const i=$('#chatInput'),t=i.value.trim();if(!t)return;i.value='';flow(t)};$$('.prompt-chips button').forEach(b=>b.onclick=()=>{if(state.step===0){$('#chatInput').value=b.textContent;$('#chatForm').requestSubmit()}});

function escapeHTML(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function rawMediaList(p){
  return [...new Set([...(Array.isArray(p.images)?p.images:[]),p.image,p.cover_image].filter(Boolean))];
}
function visionCacheFor(id){
  try{return JSON.parse(localStorage.getItem('ky_vision_v27_'+id)||'null')}catch{return null}
}
function mediaList(p){
  const raw=rawMediaList(p);
  const cache=visionCacheFor(p.id);
  const fingerprint=visionFingerprint(raw);
  const settings=visionSettings();

  // Hiển thị album đã được bộ lọc trình duyệt xử lý hoặc quản trị viên duyệt.
  if(cache && cache.fingerprint===fingerprint && (cache.approvedByAdmin===true || cache.autoApproved===true)){
    return [...new Set(Array.isArray(cache.approved)?cache.approved:[])];
  }

  // Trong lúc chưa phân tích xong, không lộ ảnh gốc cho khách.
  if(settings.strictCustomerMode) return [];
  return raw;
}
function setMainImage(src, alt='Ảnh bất động sản'){
  const main=$('#detailMainImage');
  if(main){main.src=src;main.alt=alt}
  $$('.gallery-thumb').forEach(x=>x.classList.toggle('active',x.dataset.src===src));
}
function openLightbox(src, images, title){
  let modal=$('#kyLightbox');
  if(!modal){
    modal=document.createElement('div');modal.id='kyLightbox';modal.className='lightbox hidden';
    modal.innerHTML='<button class="lightbox-close" aria-label="Đóng">×</button><button class="lightbox-prev" aria-label="Ảnh trước">‹</button><img alt=""><button class="lightbox-next" aria-label="Ảnh sau">›</button><div class="lightbox-count"></div>';
    document.body.appendChild(modal);
    modal.querySelector('.lightbox-close').onclick=()=>modal.classList.add('hidden');
    modal.onclick=e=>{if(e.target===modal)modal.classList.add('hidden')};
  }
  let index=Math.max(0,images.indexOf(src));
  const draw=()=>{modal.querySelector('img').src=images[index];modal.querySelector('img').alt=title;modal.querySelector('.lightbox-count').textContent=`${index+1}/${images.length}`};
  modal.querySelector('.lightbox-prev').onclick=e=>{e.stopPropagation();index=(index-1+images.length)%images.length;draw()};
  modal.querySelector('.lightbox-next').onclick=e=>{e.stopPropagation();index=(index+1)%images.length;draw()};
  draw();modal.classList.remove('hidden');
}
async function copyArticle(text,button){
  try{
    await navigator.clipboard.writeText(text||'');
    const old=button.textContent;button.textContent='Đã sao chép ✓';setTimeout(()=>button.textContent=old,1400);
  }catch{alert('Không thể sao chép tự động. Hãy bôi đen nội dung và sao chép thủ công.')}
}


const KY_DATA_KEY='ky_demo_dataset_v033';
function persistDataset(){
  const payload={
    schema:'ky-demo-local-v1',
    generated_at:new Date().toISOString(),
    properties:DATASET
  };
  localStorage.setItem(KY_DATA_KEY,JSON.stringify(payload));
}
function refreshAfterDataChange(message=''){
  P=P.filter(x=>DATASET.some(d=>d.id===x.id));
  if(!P.length)P=[...DATASET];
  state.selected=state.selected.filter(id=>DATASET.some(x=>x.id===id));
  state.manageSelected=new Set([...state.manageSelected].filter(id=>DATASET.some(x=>x.id===id)));
  state.currentPage=1;
  renderDiscoverySections();
  renderResults();
  updateBrainMetrics();
  updateManageToolbar();
  const s=$('#dataStatus');
  if(s){
    s.className=DATASET.length?'data-status ready':'data-status';
    s.textContent=message||`${DATASET.length} căn đang được lưu trong KY.`;
  }
}
function updateManageToolbar(){
  const total=P.length,chosen=[...state.manageSelected].filter(id=>P.some(x=>x.id===id)).length;
  const count=$('#manageSelectedCount');
  if(count)count.textContent=`Đã chọn ${chosen}/${total} căn`;
  const del=$('#deleteSelectedBtn');
  if(del)del.disabled=chosen===0;
  const all=$('#selectAllManageBtn');
  if(all)all.textContent=chosen===total&&total?'Bỏ chọn tất cả':'Chọn tất cả';
}
function toggleManageSelection(id,checked){
  checked?state.manageSelected.add(id):state.manageSelected.delete(id);
  updateManageToolbar();
}
function deletePropertyById(id){
  const p=DATASET.find(x=>x.id===id);
  if(!p)return;
  if(!confirm(`Xóa căn “${p.title}” khỏi KY Demo?`))return;
  DATASET=DATASET.filter(x=>x.id!==id);
  P=P.filter(x=>x.id!==id);
  state.manageSelected.delete(id);
  state.selected=state.selected.filter(x=>x!==id);
  persistDataset();
  refreshAfterDataChange(`Đã xóa căn. Kho KY còn ${DATASET.length} căn.`);
}
function deleteSelectedProperties(){
  const ids=[...state.manageSelected];
  if(!ids.length)return;
  if(!confirm(`Xóa ${ids.length} căn đã chọn khỏi KY Demo?`))return;
  const set=new Set(ids);
  DATASET=DATASET.filter(x=>!set.has(x.id));
  P=P.filter(x=>!set.has(x.id));
  state.manageSelected.clear();
  state.selected=state.selected.filter(x=>!set.has(x));
  persistDataset();
  refreshAfterDataChange(`Đã xóa ${ids.length} căn. Kho KY còn ${DATASET.length} căn.`);
}
function clearAllProperties(){
  if(!DATASET.length)return;
  if(!confirm(`Xóa toàn bộ ${DATASET.length} căn khỏi KY Demo? Thao tác này không xóa dữ liệu trong tiện ích Đại Thế Kỷ.`))return;
  DATASET=[];P=[];state.manageSelected.clear();state.selected=[];
  localStorage.removeItem(KY_DATA_KEY);
  localStorage.removeItem('ky_demo_payload');
  renderResults();updateManageToolbar();
  const s=$('#dataStatus');if(s){s.className='data-status';s.textContent='Kho KY đang trống. Hãy nhập dữ liệu Đại Thế Kỷ.'}
}

function renderResults(){
  const g=$('#propertyGrid');
  if(!g)return;
  g.innerHTML='';

  const totalItems=P.length;
  const totalPages=Math.max(1,Math.ceil(totalItems/state.pageSize));
  state.currentPage=Math.min(Math.max(1,state.currentPage),totalPages);
  const startIndex=(state.currentPage-1)*state.pageSize;
  const pageItems=P.slice(startIndex,startIndex+state.pageSize);

  pageItems.forEach(p=>{
    const c=document.createElement('article');c.className='property-card';
    const facts=propertyFacts(p);
    const location=compactLocation(p)||p.location||'Đà Nẵng';
    const misses=(p.matchMiss||[]).slice(0,2);
    const isManageSelected=state.manageSelected.has(p.id);
    c.innerHTML=`
      <div class="card-media-wrap">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}">
        <label class="manage-check" title="Chọn căn để quản lý">
          <input class="manageCheckbox" data-id="${escapeHTML(p.id)}" type="checkbox" ${isManageSelected?'checked':''}>
          <span>✓</span>
        </label>
        <div class="card-edit-tools">
          <button class="manualEditBtn" data-id="${escapeHTML(p.id)}" type="button" title="Sửa thủ công">✏️</button>
          <button class="aiRewriteBtn" data-id="${escapeHTML(p.id)}" type="button" title="Viết lại bằng AI">🤖</button>
        </div>
        <button class="card-reader-btn readerVerifyBtn" data-id="${escapeHTML(p.id)}" type="button" title="AI Reader + Verify">🧠</button><button class="card-vision-btn visionFilterBtn" data-id="${escapeHTML(p.id)}" type="button" title="Lọc ảnh">🖼</button><button class="quick-delete deletePropertyBtn" data-id="${escapeHTML(p.id)}" type="button" title="Xóa căn khỏi KY Demo">🗑</button>
      </div>
      <div class="property-body">
        <div class="card-topline">
          <div class="detail-score-row">
          <span class="score">${p.score}/100 phù hợp</span>
          <span id="detailCompletionBadge" class="completion-badge">Đang tính độ hoàn thiện...</span>
        </div>
          <span class="property-code">${escapeHTML(p.id||'')}</span>
        </div>
        <h3 class="professional-card-title">${escapeHTML(p.title)}</h3>
        <div class="card-location">📍 ${escapeHTML(location)}</div>
        <div class="card-facts">${facts.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div>
        <div class="tags">${[...new Set(p.tags||[])].slice(0,5).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div>
        <ul class="reasons">${(p.reasons||[]).slice(0,3).map(r=>`<li>${escapeHTML(r)}</li>`).join('')}</ul>
        ${misses.length?`<div class="card-note">Cần kiểm tra: ${misses.map(escapeHTML).join(' · ')}</div>`:''}
        <div class="card-actions">
          <button class="selectBtn" data-id="${escapeHTML(p.id)}">Chọn so sánh</button>
          <button class="primary detailBtn" data-id="${escapeHTML(p.id)}">Xem hồ sơ</button>
        </div>
      </div>`;
    g.appendChild(c)
  });

  $$('.detailBtn').forEach(b=>b.onclick=()=>openDetail(b.dataset.id));
  $$('.selectBtn').forEach(b=>b.onclick=()=>toggleSelect(b));
  $$('.manageCheckbox').forEach(b=>b.onchange=()=>toggleManageSelection(b.dataset.id,b.checked));
  $$('.deletePropertyBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();deletePropertyById(b.dataset.id)});
  $$('.manualEditBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();openPropertyEditor(b.dataset.id,false)});
  $$('.aiRewriteBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();openPropertyEditor(b.dataset.id,true)});
  $$('.visionFilterBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();openVisionFilter(b.dataset.id)});
  $$('.readerVerifyBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();openReaderVerify(b.dataset.id)});
  renderDiscoverySections();
  updateBrainMetrics();
  updateManageToolbar();

  renderResultsPagination(totalItems,totalPages,startIndex,pageItems.length);
  const totalBadge=$('#catalogTotalBadge');
  if(totalBadge) totalBadge.textContent=`${totalItems.toLocaleString('vi-VN')} sản phẩm`;
}

function paginationSequence(current,total){
  if(total<=7)return Array.from({length:total},(_,i)=>i+1);
  const pages=[1];
  const left=Math.max(2,current-1);
  const right=Math.min(total-1,current+1);
  if(left>2)pages.push('…');
  for(let p=left;p<=right;p++)pages.push(p);
  if(right<total-1)pages.push('…');
  pages.push(total);
  return pages;
}
function goToResultsPage(page){
  const totalPages=Math.max(1,Math.ceil(P.length/state.pageSize));
  state.currentPage=Math.min(Math.max(1,Number(page)||1),totalPages);
  renderResults();
  $('#resultsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderResultsPagination(totalItems,totalPages,startIndex,visibleCount){
  const wrap=$('#resultsPagination'),buttons=$('#resultsPageButtons'),range=$('#resultsRangeText');
  if(!wrap||!buttons||!range)return;
  wrap.classList.toggle('hidden',totalItems===0);
  const from=totalItems?startIndex+1:0;
  const to=totalItems?startIndex+visibleCount:0;
  range.textContent=`${from}–${to} / ${totalItems.toLocaleString('vi-VN')} căn`;

  const sequence=paginationSequence(state.currentPage,totalPages);
  buttons.innerHTML=`
    <button type="button" data-page="1" title="Trang đầu" ${state.currentPage===1?'disabled':''}>|‹</button>
    <button type="button" data-page="${state.currentPage-1}" title="Trang trước" ${state.currentPage===1?'disabled':''}>‹</button>
    ${sequence.map(item=>item==='…'
      ?'<span class="dtk-ellipsis">…</span>'
      :`<button type="button" data-page="${item}" class="${item===state.currentPage?'active':''}">${item}</button>`
    ).join('')}
    <button type="button" data-page="${state.currentPage+1}" title="Trang sau" ${state.currentPage===totalPages?'disabled':''}>›</button>
    <button type="button" data-page="${totalPages}" title="Trang cuối" ${state.currentPage===totalPages?'disabled':''}>›|</button>
  `;
  buttons.querySelectorAll('[data-page]').forEach(btn=>{
    btn.onclick=()=>goToResultsPage(btn.dataset.page);
  });
}

function toggleSelect(b){const id=b.dataset.id,i=state.selected.indexOf(id);if(i>=0){state.selected.splice(i,1);b.textContent='Chọn so sánh'}else if(state.selected.length<2){state.selected.push(id);b.textContent='Đã chọn ✓'}else alert('Demo chỉ so sánh tối đa 2 căn.');$('#compareSelectedBtn').disabled=state.selected.length!==2}$('#compareSelectedBtn').onclick=()=>{renderCompare();showView('compare')};

const KY_ENGAGEMENT_KEY='ky_demo_engagement_v034';
function readEngagement(){
  try{return JSON.parse(localStorage.getItem(KY_ENGAGEMENT_KEY)||'{}')}catch{return {}}
}
function saveEngagement(data){localStorage.setItem(KY_ENGAGEMENT_KEY,JSON.stringify(data))}
function engagementFor(id){
  const all=readEngagement();
  return all[id]||{liked:false,interested:false,likes:0,comments:[]};
}
function updateEngagement(id,patch){
  const all=readEngagement();
  const current=all[id]||{liked:false,interested:false,likes:0,comments:[]};
  all[id]={...current,...patch};saveEngagement(all);return all[id];
}
function toggleLike(id,btn,countNode){
  const current=engagementFor(id),liked=!current.liked;
  const next=updateEngagement(id,{liked,likes:Math.max(0,(current.likes||0)+(liked?1:-1))});
  btn.classList.toggle('active',next.liked);
  btn.innerHTML=`👍 ${next.liked?'Đã thích':'Thích'}`;
  countNode.textContent=`${next.likes} lượt thích`;
}
function toggleInterest(id,btn){
  const current=engagementFor(id);
  const next=updateEngagement(id,{interested:!current.interested});
  btn.classList.toggle('active',next.interested);
  btn.innerHTML=`⭐ ${next.interested?'Đang quan tâm':'Quan tâm'}`;
}
function addComment(id,input,list,countNode){
  const text=input.value.trim();if(!text)return;
  const current=engagementFor(id);
  updateEngagement(id,{comments:[...(current.comments||[]),{text,at:new Date().toISOString()}]});
  input.value='';renderComments(id,list,countNode);
}
function renderComments(id,list,countNode){
  const comments=engagementFor(id).comments||[];
  countNode.textContent=`${comments.length} bình luận`;
  list.innerHTML=comments.length
    ? comments.map(c=>`<div class="comment-item"><div class="comment-avatar">K</div><div><b>Khách quan tâm</b><p>${escapeHTML(c.text)}</p><small>${new Date(c.at).toLocaleString('vi-VN')}</small></div></div>`).join('')
    : '<div class="comment-empty">Chưa có bình luận. Hãy để lại câu hỏi về căn này.</div>';
}
function showAllProducts(){
  SMART.text='';
  SMART.filters={district:'',minPrice:0,maxPrice:0,minArea:0,type:'',bedrooms:0,features:[]};
  if($('#smartInput'))$('#smartInput').value='';
  ['districtFilter','minPriceFilter','maxPriceFilter','minAreaFilter','typeFilter','bedroomsFilter'].forEach(id=>{
    const el=$('#'+id);if(!el)return;
    if(el.tagName==='SELECT')el.selectedIndex=0;else el.value='';
  });
  $$('.feature-chip.active').forEach(x=>x.classList.remove('active'));
  P=DATASET.map((x,i)=>adaptProperty({...x,title:professionalTitle(x,i)},i))
    .map(p=>({...p,score:85,reasons:['Hồ sơ có dữ liệu tương đối đầy đủ']}))
    .sort((a,b)=>mediaList(b).length-mediaList(a).length);
  renderResults();$('#resultsSection').classList.remove('hidden');
  let box=$('#resultInsight');
  if(!box){box=document.createElement('div');box.id='resultInsight';box.className='result-insight';$('#propertyGrid').before(box)}
  box.innerHTML='<span class="match-badge">✦ Tất cả sản phẩm</span><br><span class="result-count">Đang hiển thị toàn bộ kho bất động sản hiện có trong KY.</span>';
  $('#smartSummary').textContent='Đang xem tất cả sản phẩm.';
  $('#resultsSection').scrollIntoView({behavior:'smooth'});
}

function openDetail(id){
  const p=P.find(x=>x.id===id)||DATASET.map(adaptProperty).find(x=>x.id===id);
  if(!p)return;

  const images=mediaList(p);
  const raw=findRawProperty(p.id)||p;
  const reader=readerCache(p.id);
  const currentArticle=String(p.article||p.description||p.public_article||'').trim();
  const normalizedArticle=String(reader?.normalizedArticle||currentArticle||'').trim();
  const originalArticle=String(reader?.sourceArticle||articleTextOf(raw,p)||currentArticle||'').trim();
  const compactTitle=(titleFromArticle(normalizedArticle)||synthesizeProfessionalTitle(p,0)).trim();

  const gallery=images.length
    ? `<div class="property-gallery">
        <button class="main-image-wrap" id="mainImageWrap" type="button" title="Bấm để xem ảnh lớn">
          <img id="detailMainImage" src="${escapeHTML(images[0])}" alt="${escapeHTML(p.title)}">
          <span class="safe-gallery-badge">🛡 Album đã được quản trị viên duyệt</span>
          <span class="image-counter">📷 ${images.length} ảnh</span>
        </button>
        <div class="gallery-thumbs">
          ${images.map((src,i)=>`<button class="gallery-thumb ${i===0?'active':''}" data-src="${escapeHTML(src)}" type="button"><img src="${escapeHTML(src)}" alt="Ảnh ${i+1}"></button>`).join('')}
        </div>
      </div>`
    : `<div class="no-media"><div><b>🛡 KY đang tự động loại ảnh selfie</b><small>Ảnh đầu tiên và ảnh có dấu hiệu rủi ro được tự động ẩn; album sạch sẽ hiển thị ngay sau khi xử lý.</small></div></div>`;

  const bedrooms=hasMeaningfulValue(reader?.fields?.bedrooms)?reader.fields.bedrooms:(hasMeaningfulValue(p.bedrooms)?p.bedrooms:'');
  const bathrooms=hasMeaningfulValue(reader?.fields?.bathrooms)?reader.fields.bathrooms:(hasMeaningfulValue(p.bathrooms)?p.bathrooms:'');
  const floors=hasMeaningfulValue(reader?.fields?.floors)?reader.fields.floors:'';
  const frontage=hasMeaningfulValue(reader?.fields?.frontage)?reader.fields.frontage:'';
  const legal=hasMeaningfulValue(reader?.fields?.legal)?reader.fields.legal:'';
  const direction=hasMeaningfulValue(reader?.fields?.direction)?reader.fields.direction:'';

  $('#detailContent').innerHTML=`
    <div class="detail-focus-layout">
      <section class="detail-left-column">
        ${gallery}

        <article class="article-workspace">
          <div class="article-workspace-head">
            <div class="article-tabs" role="tablist">
              <button id="normalizedArticleTab" class="active" type="button">Nội dung AI chuẩn hóa</button>
              <button id="originalArticleTab" type="button">Nội dung gốc (AI Reader)</button>
            </div>
            <div class="article-tools">
              <button id="copyFocusedArticleBtn" type="button">Sao chép</button>
              <button id="exportFocusedArticleBtn" type="button">⇩ Xuất bài đăng</button>
            </div>
          </div>
          <div id="focusedArticleTitle" class="focused-article-title">${escapeHTML(compactTitle)}</div>
          <div id="focusedArticleBody" class="focused-article-body">${escapeHTML(articleBody(normalizedArticle)||'AI đang chuẩn hóa nội dung bài đăng...')}</div>
          <div class="focused-article-source">Nguồn: <span id="focusedArticleSource">AI tổng hợp và chuẩn hóa từ bài đăng</span></div>
        </article>
      </section>

      <aside class="detail-right-column">
        <article class="compact-property-summary">
          <div class="detail-score-row">
            <span class="score">${p.score}/100 phù hợp</span>
            <span id="detailCompletionBadge" class="completion-badge">Đang tính độ hoàn thiện...</span>
          </div>

          <div id="customerWaitingBanner" class="customer-waiting-banner hidden"><div><b>🔔 Đã báo cho quản trị viên</b><small>Album sẽ tự cập nhật sau khi được duyệt.</small></div><span id="customerWaitingTimer">00:00</span></div>
          <div class="vision-detail-banner compact">
            <span id="detailVisionStatus" class="vision-auto-status"><i></i><span>Đang kiểm tra trạng thái ảnh...</span></span>
            <button id="detailVisionBtn" type="button">🖼 Lọc ảnh</button>
          </div>

          <div class="compact-price-location">
            <div class="detail-price">${escapeHTML(p.price)}</div>
            <p>📍 ${escapeHTML(p.location)}</p>
          </div>

          <div id="detailReaderBanner" class="detail-reader-banner compact">
            <div><b>Địa chỉ chưa được AI xác minh</b><small>KY có thể trích xuất từ nội dung bài đăng</small></div>
            <button id="detailReaderBtn" type="button">🧠 AI Verify</button>
          </div>

          <div class="top-fact-strip">
            <div><span>📐</span><b>${hasMeaningfulValue(p.area)?escapeHTML(p.area):'AI đang xác minh'}</b><small>Diện tích</small></div>
            <div><span>🛏</span><b>${hasMeaningfulValue(bedrooms)?`${bedrooms} PN`:'AI đang xác minh'}</b><small>Phòng ngủ</small></div>
            <div><span>🚿</span><b>${hasMeaningfulValue(bathrooms)?`${bathrooms} WC`:'AI đang xác minh'}</b><small>Nhà vệ sinh</small></div>
            <div><span>🚗</span><b>${hasMeaningfulValue(p.road)?escapeHTML(p.road):'AI đang xác minh'}</b><small>Đường</small></div>
          </div>
        </article>

        <article class="compact-detail-card">
          <div class="compact-card-head"><b>Thông tin chi tiết</b><button id="copyDetailFactsBtn" type="button">Sao chép</button></div>
          <div class="compact-fact-grid">
            <div><span>🏡 Diện tích</span><b>${hasMeaningfulValue(p.area)?escapeHTML(p.area):'AI đang xác minh'}</b></div>
            <div><span>🛏 Phòng ngủ</span><b>${hasMeaningfulValue(bedrooms)?`${bedrooms} PN`:'AI đang xác minh'}</b></div>
            <div><span>📏 Mặt tiền</span><b>${hasMeaningfulValue(frontage)?`${frontage}m`:'AI đang xác minh'}</b></div>
            <div><span>🚿 Nhà vệ sinh</span><b>${hasMeaningfulValue(bathrooms)?`${bathrooms} WC`:'AI đang xác minh'}</b></div>
            <div><span>🏢 Kết cấu</span><b>${hasMeaningfulValue(floors)?`${floors} tầng`:'AI đang xác minh'}</b></div>
            <div><span>📄 Pháp lý</span><b>${hasMeaningfulValue(legal)?escapeHTML(legal):'AI đang xác minh'}</b></div>
            <div><span>🧭 Hướng</span><b>${hasMeaningfulValue(direction)?escapeHTML(direction):'AI đang xác minh'}</b></div>
            <div><span>🚗 Đường trước nhà</span><b>${hasMeaningfulValue(p.road)?escapeHTML(p.road):'AI đang xác minh'}</b></div>
          </div>
          <div class="cta compact-cta">
            <a class="call" href="tel:0935202777">Gọi 0935202777</a>
            <a class="zalo" href="https://zalo.me/0935202777" target="_blank" rel="noopener">Nhắn Zalo</a>
          </div>
        </article>

        <article class="hidden-image-summary">
          <b>🔒 Quyền riêng tư hình ảnh</b>
          <p>Ảnh đầu tiên và ảnh rủi ro được tự động ẩn; quản trị viên vẫn có thể xem và khôi phục.</p>
          <button id="openVisionFromPrivacyBtn" type="button">Mở trình duyệt ảnh</button>
        </article>
      </aside>
    </div>

    <div class="score-grid compact-score-grid">
      <div><b>${p.score}</b><small>Tổng phù hợp</small></div>
      <div><b>${Math.min(100,Math.max(1,p.score+10))}</b><small>Ngân sách</small></div>
      <div><b>${Math.min(100,Math.max(1,p.score+6))}</b><small>Khu vực</small></div>
      <div><b>${Math.min(100,Math.max(1,p.score+4))}</b><small>Nhu cầu</small></div>
    </div>
  `;

  const articleState={mode:'normalized',normalized:normalizedArticle,original:originalArticle};
  function renderFocusedArticle(){
    const isNormalized=articleState.mode==='normalized';
    const text=isNormalized?articleState.normalized:articleState.original;
    $('#normalizedArticleTab').classList.toggle('active',isNormalized);
    $('#originalArticleTab').classList.toggle('active',!isNormalized);
    $('#focusedArticleTitle').textContent=isNormalized?compactTitle:(titleFromArticle(text)||p.title||'Nội dung bài đăng gốc');
    $('#focusedArticleBody').textContent=articleBody(text)||text||'Chưa có nội dung.';
    $('#focusedArticleSource').textContent=isNormalized?'AI tổng hợp và chuẩn hóa từ bài đăng':'Nội dung nguyên bản được đồng bộ từ Đại Thế Kỷ';
  }

  $('#normalizedArticleTab').onclick=()=>{articleState.mode='normalized';renderFocusedArticle()};
  $('#originalArticleTab').onclick=()=>{articleState.mode='original';renderFocusedArticle()};
  $('#copyFocusedArticleBtn').onclick=()=>copyArticle(articleState.mode==='normalized'?articleState.normalized:articleState.original,$('#copyFocusedArticleBtn'));
  $('#exportFocusedArticleBtn').onclick=()=>{
    const text=articleState.mode==='normalized'?articleState.normalized:articleState.original;
    const blob=new Blob([text||''],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`KY-${p.id||'property'}-${articleState.mode}.txt`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  $('#copyDetailFactsBtn').onclick=()=>{
    const facts=[
      `Diện tích: ${hasMeaningfulValue(p.area)?p.area:'AI đang xác minh'}`,
      `Phòng ngủ: ${hasMeaningfulValue(bedrooms)?bedrooms+' PN':'AI đang xác minh'}`,
      `Nhà vệ sinh: ${hasMeaningfulValue(bathrooms)?bathrooms+' WC':'AI đang xác minh'}`,
      `Mặt tiền: ${hasMeaningfulValue(frontage)?frontage+'m':'AI đang xác minh'}`,
      `Kết cấu: ${hasMeaningfulValue(floors)?floors+' tầng':'AI đang xác minh'}`,
      `Pháp lý: ${hasMeaningfulValue(legal)?legal:'AI đang xác minh'}`,
      `Hướng: ${hasMeaningfulValue(direction)?direction:'AI đang xác minh'}`
    ].join('\n');
    copyArticle(facts,$('#copyDetailFactsBtn'));
  };

  $$('.gallery-thumb').forEach(btn=>btn.onclick=()=>setMainImage(btn.dataset.src,p.title));
  const mainWrap=$('#mainImageWrap');
  if(mainWrap)mainWrap.onclick=()=>openLightbox($('#detailMainImage').src,images,p.title);

  $('#detailVisionBtn').onclick=()=>openVisionFilter(p.id);
  $('#openVisionFromPrivacyBtn').onclick=()=>openVisionFilter(p.id);
  $('#detailReaderBtn').onclick=()=>openReaderVerify(p.id);

  updateDetailReaderBanner(p);
  updateDetailCompletion(p);
  updateDetailVisionStatus(p);
  showView('detail');
  queuePropertyForApproval(p);
  maybeAutoRunVision(p);
  if(!readerCache(p.id)){
    runReaderAnalysis(p.id,{force:true}).then(result=>{
      if(result && $('#detailView').classList.contains('active')) openDetail(p.id);
    });
  }
}
function renderCompare(){const a=state.selected.map(id=>P.find(x=>x.id===id));if(a.length!==2)return;const w=a[0].score>=a[1].score?a[0]:a[1];$('#compareContent').className='compare-table';$('#compareContent').innerHTML=a.map(p=>`<article class="compare-card"><img src="${p.image}"><h3>${p.title}</h3><p><b>${p.score}/100</b> phù hợp</p><p>💰 ${p.price}</p><p>📐 ${p.area}</p><p>🚗 ${p.road}</p><p>🛏 ${hasMeaningfulValue(p.bedrooms)?`${p.bedrooms} phòng ngủ`:"AI đang xác minh"}</p><ul>${p.reasons.map(x=>`<li>${x}</li>`).join('')}</ul></article>`).join('')+`<article class="ky-verdict"><h3>Khuyến nghị của KY</h3><p>Với nhu cầu hiện tại, <b>${w.title}</b> phù hợp hơn vì có điểm tổng thể ${w.score}/100. Đây chỉ là gợi ý dựa trên dữ liệu mẫu; pháp lý và tình trạng còn bán cần được xác nhận.</p></article>`}$('#floatingKy').onclick=()=>$('#floatingPanel').classList.toggle('hidden');


function extractPropertiesPayload(payload){
  if(Array.isArray(payload)) return {properties:payload, exported_at:new Date().toISOString(), schema:'raw-array'};
  if(!payload||typeof payload!=='object') throw new Error('Tệp JSON không hợp lệ.');
  if(payload.schema==='ky-search-index-v1') throw new Error('Bạn đang chọn file ky-search-index. Hãy chọn file ky-package hoặc ky-data.');
  if(payload.schema==='ky-engine-package-v1' && Array.isArray(payload.properties)) return {properties:payload.properties, exported_at:payload.generated_at||payload.exported_at, schema:payload.schema};
  if(payload.schema==='ky-properties-v1' && Array.isArray(payload.properties)) return {properties:payload.properties, exported_at:payload.generated_at||payload.exported_at, schema:payload.schema};
  if(Array.isArray(payload.properties)) return {properties:payload.properties, exported_at:payload.generated_at||payload.exported_at, schema:payload.schema||'properties-wrapper'};
  if(Array.isArray(payload.data)) return {properties:payload.data, exported_at:payload.generated_at||payload.exported_at, schema:payload.schema||'data-wrapper'};
  if(Array.isArray(payload.items)) return {properties:payload.items, exported_at:payload.generated_at||payload.exported_at, schema:payload.schema||'items-wrapper'};
  throw new Error('Không tìm thấy danh sách bất động sản trong tệp.');
}
function importKYPayload(payload,{silent=false}={}){
  const parsed=extractPropertiesPayload(payload);
  const next=parsed.properties
    .map((x,i)=>adaptProperty({...x,title:professionalTitle(x,i)},i))
    .filter(x=>x&&x.id);

  // Luôn thay thế toàn bộ kho cũ, không cộng dồn và không giữ bản cache trước.
  DATASET=next;
  P=[...DATASET];
  state.usingRealData=true;
  state.selected=[];
  state.manageSelected.clear();

  localStorage.removeItem('ky_demo_payload');
  persistDataset();

  const s=$('#dataStatus');s.className='data-status ready';
  const when=parsed.exported_at?new Date(parsed.exported_at).toLocaleString('vi-VN'):'không rõ';
  s.textContent=`Đã thay thế kho cũ bằng ${DATASET.length} căn · Cập nhật ${when}`;
  renderResults();
  updateManageToolbar();

  if(!silent){
    addMsg(`<b>Đã thay thế toàn bộ kho dữ liệu cũ.</b><p>KY hiện dùng ${DATASET.length} căn từ tệp vừa nhập. Dữ liệu lần trước đã bị ghi đè.</p>`);
    alert(`Đã thay thế thành công.\nKho KY hiện có ${DATASET.length} căn.`);
  }
}
$('#importDataBtn').onclick=()=>$('#dataFileInput').click();
$('#dataFileInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const text=await f.text();importKYPayload(JSON.parse(text))}catch(err){alert('Không nhập được dữ liệu: '+err.message)}finally{e.target.value=''}};
try{
  localStorage.removeItem('ky_demo_payload');
  const saved=localStorage.getItem(KY_DATA_KEY);
  if(saved)importKYPayload(JSON.parse(saved),{silent:true});
}catch(_){
  localStorage.removeItem(KY_DATA_KEY);
  localStorage.removeItem('ky_demo_payload');
}
setTimeout(()=>$('#chatInput')?.focus(),250);


/* ===== KY V0.3 Smart Search + AI Conversation ===== */
const SMART = {speak:false,lastNeed:null};
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function propPrice(p){if(Number.isFinite(Number(p.price_billion)))return Number(p.price_billion);const m=String(p.price||'').replace(',','.').match(/(\d+(?:\.\d+)?)/);return m?Number(m[1]):0}
function propArea(p){if(Number.isFinite(Number(p.area_m2)))return Number(p.area_m2);const m=String(p.area||'').replace(',','.').match(/(\d+(?:\.\d+)?)/);return m?Number(m[1]):0}
function propFlags(p){const f=p.flags||p.features||{};const t=propertyText(p);return {car:!!(f.car_access||f.car_avoid||/o to|oto|xe hoi/.test(t)),car_avoid:!!(f.car_avoid||/o to tranh|oto tranh/.test(t)),frontage:!!(f.frontage||/mat tien|mat pho/.test(t)),business:!!(f.business||/kinh doanh/.test(t)),beach:!!(f.near_beach||/gan bien|my khe|an thuong|bien/.test(t)),income:!!(f.rental_income||/dong tien|cho thue|thu nhap/.test(t)),corner:!!(f.corner||/lo goc|2 mat tien|hai mat tien/.test(t))}}
function readUI(){return {raw:$('#smartQuery')?.value.trim()||'',district:$('#filterDistrict')?.value||'',minPrice:num($('#filterMinPrice')?.value),maxPrice:num($('#filterMaxPrice')?.value),minArea:num($('#filterMinArea')?.value),type:$('#filterType')?.value||'',bedrooms:num($('#filterBedrooms')?.value),features:$$('#featureFilters input:checked').map(x=>x.value)}}
function parseAdvanced(text){const b=parseNeed(text);const t=normalizeVN(text);const nums=[...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:ty|tỷ)/g)].map(m=>Number(m[1].replace(',','.')));let minPrice=0,maxPrice=b.maxPrice||0;if(nums.length>=2){minPrice=Math.min(...nums);maxPrice=Math.max(...nums)}else if(/tu\s+\d/.test(t)&&nums[0])minPrice=nums[0];const am=t.match(/(?:dien tich|dt|tren|tu)\s*(\d+(?:[.,]\d+)?)\s*m2/);return {...b,minPrice,maxPrice,minArea:am?Number(am[1].replace(',','.')):0,carAvoid:/o to tranh|oto tranh/.test(t),corner:/lo goc|2 mat tien|hai mat tien/.test(t),type:/\bdat\b/.test(t)?'dat':/can ho/.test(t)?'can ho':/khach san/.test(t)?'khach san':/\bnha\b/.test(t)?'nha':'',features:[]}}
function syncNeedToUI(n){if(n.district){const map={'son tra':'Sơn Trà','hai chau':'Hải Châu','ngu hanh son':'Ngũ Hành Sơn','thanh khe':'Thanh Khê','lien chieu':'Liên Chiểu','cam le':'Cẩm Lệ','hoa vang':'Hòa Vang'};$('#filterDistrict').value=map[n.district]||n.district}if(n.minPrice)$('#filterMinPrice').value=n.minPrice;if(n.maxPrice)$('#filterMaxPrice').value=n.maxPrice;if(n.minArea)$('#filterMinArea').value=n.minArea;if(n.type)$('#filterType').value=n.type;if(n.bedrooms)$('#filterBedrooms').value=n.bedrooms;const want={car:n.car,car_avoid:n.carAvoid,frontage:n.frontage,business:n.business,beach:n.beach,income:n.income,corner:n.corner};$$('#featureFilters input').forEach(x=>{if(want[x.value])x.checked=true})}
function combinedNeed(){const q=$('#smartQuery').value.trim();const parsed=parseAdvanced(q);syncNeedToUI(parsed);const ui=readUI();return {...parsed,...ui,raw:q,district:ui.district||parsed.district,minPrice:ui.minPrice||parsed.minPrice,maxPrice:ui.maxPrice||parsed.maxPrice,minArea:ui.minArea||parsed.minArea,type:ui.type||parsed.type,bedrooms:ui.bedrooms||parsed.bedrooms,features:[...new Set([...(ui.features||[]),parsed.car?'car':'',parsed.carAvoid?'car_avoid':'',parsed.frontage?'frontage':'',parsed.business?'business':'',parsed.beach?'beach':'',parsed.income?'income':'',parsed.corner?'corner':''].filter(Boolean))]}}
function needSummary(n){const a=[];if(n.district)a.push('📍 '+n.district);if(n.minPrice||n.maxPrice)a.push('💰 '+(n.minPrice?`${n.minPrice}–`: '≤ ')+(n.maxPrice||'không giới hạn')+' tỷ');if(n.minArea)a.push('📐 từ '+n.minArea+' m²');if(n.type)a.push('🏠 '+n.type);if(n.bedrooms)a.push('🛏 từ '+n.bedrooms+' PN');const names={car:'Ô tô',car_avoid:'Ô tô tránh',frontage:'Mặt tiền',business:'Kinh doanh',beach:'Gần biển',income:'Dòng tiền',corner:'Lô góc'};(n.features||[]).forEach(x=>a.push('✓ '+names[x]));return a.length?a.join(' · '):'KY chưa nhận được điều kiện cụ thể.'}
function scoreSmart(p,n){
  const f=propFlags(p),text=propertyText(p);
  const price=propPrice(p),area=propArea(p);
  let score=50,reasons=[],miss=[],criteria=0,matched=0;

  if(n.district){
    criteria++;
    const d=normalizeVN(n.district);
    if(text.includes(d)){score+=18;matched++;reasons.push('Đúng khu vực '+n.district)}
    else{score-=7;miss.push('khác khu vực ưu tiên')}
  }
  if(n.minPrice){
    criteria++;
    if(price&&price>=n.minPrice){score+=7;matched++;reasons.push('Đạt mức giá tối thiểu')}
    else if(price){score-=4;miss.push('giá thấp hơn khoảng mong muốn')}
  }
  if(n.maxPrice){
    criteria++;
    if(price&&price<=n.maxPrice){score+=18;matched++;reasons.push('Nằm trong mức tài chính')}
    else if(price){score-=Math.min(18,Math.max(4,(price-n.maxPrice)*2.5));miss.push('vượt ngân sách')}
  }
  if(n.minArea){
    criteria++;
    if(area&&area>=n.minArea){score+=12;matched++;reasons.push('Đạt diện tích tối thiểu')}
    else if(area){score-=6;miss.push('diện tích thấp hơn yêu cầu')}
  }
  if(n.bedrooms){
    criteria++;
    if((p.bedrooms||0)>=n.bedrooms){score+=10;matched++;reasons.push('Đủ số phòng ngủ')}
    else if(p.bedrooms){score-=5;miss.push('chưa đủ phòng ngủ')}
    else{miss.push('chưa có dữ liệu phòng ngủ')}
  }
  if(n.type){
    criteria++;
    if(text.includes(normalizeVN(n.type))){score+=8;matched++;reasons.push('Đúng loại hình')}
    else{score-=3;miss.push('khác loại hình ưu tiên')}
  }

  (n.features||[]).forEach(k=>{
    criteria++;
    if(f[k]){
      score+=12;matched++;
      reasons.push(({car:'Có đường ô tô',car_avoid:'Ô tô tránh',frontage:'Mặt tiền',business:'Phù hợp kinh doanh',beach:'Có yếu tố gần biển',income:'Có thông tin dòng tiền',corner:'Lô góc'}[k]));
    }else{
      score-=4;
      miss.push(({car:'chưa xác nhận ô tô',car_avoid:'chưa xác nhận ô tô tránh',frontage:'không phải mặt tiền',business:'chưa rõ khả năng kinh doanh',beach:'chưa xác nhận gần biển',income:'chưa có dòng tiền',corner:'không phải lô góc'}[k]));
    }
  });

  // Không nhập tiêu chí nào vẫn trả toàn bộ kho và xếp theo độ đầy đủ dữ liệu.
  if(criteria===0){
    const completeness=[
      !!p.title, !!price, !!area, !!p.location,
      mediaList(p).length>0, !!(p.article||p.description||p.public_article)
    ].filter(Boolean).length;
    score=55+completeness*5;
    reasons.push('Hồ sơ có dữ liệu tương đối đầy đủ');
  }else if(matched===0){
    reasons.push('Có thể tham khảo thêm dù chưa khớp hoàn toàn');
  }

  return {
    score:Math.max(1,Math.min(100,Math.round(score))),
    reasons:[...new Set(reasons)].slice(0,5),
    miss:[...new Set(miss)].slice(0,4),
    criteria,matched
  };
}
function smartSearch(){
  const n=combinedNeed();
  SMART.lastNeed=n;
  const summary=needSummary(n);
  $('#smartSummary').textContent='KY đã hiểu: '+summary;

  const source=DATASET.map((x,i)=>adaptProperty({...x,title:professionalTitle(x,i)},i));
  const hasCriteria=!!(
    n.district||n.minPrice||n.maxPrice||n.minArea||n.type||n.bedrooms||
    (n.features&&n.features.length)
  );

  P=source.map(p=>{
    const m=scoreSmart(p,n);
    return {...p,score:m.score,reasons:m.reasons.length?m.reasons:['Có thể tham khảo'],matchMiss:m.miss,matchedCriteria:m.matched,totalCriteria:m.criteria};
  }).sort((a,b)=>{
    if(b.score!==a.score)return b.score-a.score;
    return mediaList(b).length-mediaList(a).length;
  }).slice(0,30);

  renderResults();
  $('#resultsSection').classList.remove('hidden');

  let box=$('#resultInsight');
  if(!box){
    box=document.createElement('div');
    box.id='resultInsight';
    box.className='result-insight';
    $('#propertyGrid').before(box);
  }

  box.innerHTML=hasCriteria
    ? `<span class="match-badge">✦ KY đã phân tích ${source.length} căn</span><br>
       <span class="result-count">Bạn không cần nhập đủ thông tin. KY đang hiển thị ${P.length} căn tốt nhất theo những tiêu chí đã có; tiêu chí chưa nhập được xem là tùy chọn.</span>`
    : `<span class="match-badge">✦ Khám phá kho bất động sản</span><br>
       <span class="result-count">Bạn chưa nhập điều kiện cụ thể nên KY đang xếp ${P.length} hồ sơ nổi bật theo độ đầy đủ dữ liệu. Bạn có thể bổ sung bất kỳ một tiêu chí nào để kết quả sát hơn.</span>`;

  const message=hasCriteria
    ? `<b>KY đã tìm xong.</b><p>Bạn không cần nhập đủ thông số. Mình đã dùng những điều kiện hiện có để xếp hạng ${P.length} căn phù hợp nhất.</p><p><b>KY đã hiểu:</b> ${escapeHTML(summary)}</p>`
    : `<b>KY đã mở kho bất động sản.</b><p>Bạn chưa cần nhập đủ thông tin. Mình đang giới thiệu các hồ sơ nổi bật trước; chỉ cần nói thêm một tiêu chí như tài chính, khu vực hoặc ô tô là kết quả sẽ được tinh chỉnh ngay.</p>`;

  addMsg(message);
  speakText(hasCriteria
    ? `KY đã dùng các điều kiện hiện có và chọn ${P.length} căn phù hợp nhất.`
    : `KY đang hiển thị các bất động sản nổi bật. Bạn có thể bổ sung bất kỳ một tiêu chí nào.`);
  $('#resultsSection').scrollIntoView({behavior:'smooth'});
}
function speakText(text){if(!SMART.speak||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g,''));u.lang='vi-VN';u.rate=1;speechSynthesis.speak(u)}
$('#smartSearchBtn').onclick=smartSearch;$('#smartQuery').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();smartSearch()}});$('#chatInput').addEventListener('input',()=>{$('#smartQuery').value=$('#chatInput').value});$('#smartQuery').addEventListener('input',()=>{$('#chatInput').value=$('#smartQuery').value});
$('#resetFiltersBtn').onclick=()=>{$('#smartQuery').value='';$('#chatInput').value='';$$('.filter-grid input').forEach(x=>x.value='');$$('.filter-grid select').forEach(x=>x.selectedIndex=0);$$('#featureFilters input').forEach(x=>x.checked=false);$('#smartSummary').textContent='KY đang chờ nhu cầu của bạn.'};
$('#speakToggle').onclick=()=>{SMART.speak=!SMART.speak;$('#speakToggle').textContent=`🔊 KY đọc câu trả lời: ${SMART.speak?'Bật':'Tắt'}`;if(SMART.speak)speakText('Xin chào. KY đã sẵn sàng hỗ trợ bạn tìm bất động sản.')};
$('#voiceBtn').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('Trình duyệt này chưa hỗ trợ nhập giọng nói. Hãy dùng Chrome hoặc Edge mới.');return}const r=new SR();r.lang='vi-VN';r.interimResults=false;$('#voiceBtn').classList.add('voice-active');r.onresult=e=>{const t=e.results[0][0].transcript;$('#smartQuery').value=t;$('#chatInput').value=t;$('#voiceBtn').classList.remove('voice-active');smartSearch()};r.onerror=r.onend=()=>$('#voiceBtn').classList.remove('voice-active');r.start()};
// Form chat trực tiếp dùng Smart Search thay luồng cứng
$('#chatForm').onsubmit=e=>{e.preventDefault();const t=$('#chatInput').value.trim();if(!t)return;userSay(escapeHTML(t));$('#smartQuery').value=t;thinking(()=>smartSearch())};
$$('.prompt-chips button').forEach(b=>b.onclick=()=>{$('#smartQuery').value=b.textContent;$('#chatInput').value=b.textContent;smartSearch()});


/* ===== KY V0.3.3 Data Manager ===== */
$('#selectAllManageBtn').onclick=()=>{
  const ids=P.map(x=>x.id);
  const allSelected=ids.length&&ids.every(id=>state.manageSelected.has(id));
  if(allSelected)ids.forEach(id=>state.manageSelected.delete(id));
  else ids.forEach(id=>state.manageSelected.add(id));
  renderResults();
};
$('#deleteSelectedBtn').onclick=deleteSelectedProperties;
$('#clearAllDataBtn').onclick=clearAllProperties;

const allProductsBtn=$('#allProductsBtn');if(allProductsBtn)allProductsBtn.onclick=showAllProducts;

const filterApplyButton=document.querySelector('#filterApplyBtn');
if(filterApplyButton){filterApplyButton.addEventListener('click',()=>{const summary=document.querySelector('#smartSummary');if(summary){summary.innerHTML='<span class="summary-dot"></span><span>KY AI đang áp dụng các điều kiện lọc...</span>';}document.querySelector('#smartSearchBtn')?.click();});}


/* ===== KY AI DEMO V1.0: HOT, NEW, EDITOR, ASSISTANT ===== */
function demoDateValue(p,index){
  const value=p.updated_at||p.updatedAt||p.created_at||p.createdAt||p.synced_at||p.exported_at||'';
  const time=Date.parse(value);
  return Number.isFinite(time)?time:(Date.now()-index*3600000);
}
function hotValue(p,index){
  const tags=(p.tags||[]).join(' ').toLowerCase();
  const flags=p.flags||p.features||{};
  let value=Number(p.score||0)*10+mediaList(p).length*3;
  if(flags.frontage||tags.includes('mặt tiền'))value+=35;
  if(flags.business||tags.includes('kinh doanh'))value+=25;
  if(flags.near_beach||tags.includes('gần biển'))value+=20;
  if(flags.corner||tags.includes('lô góc'))value+=18;
  value+=Math.max(0,20-index);
  return value;
}
function discoveryProperty(p,index,type){
  const badge=type==='hot'?'HOT':'NEW';
  const price=p.price_text||p.price||((p.price_billion||0)+' tỷ');
  const area=p.area_m2?`${p.area_m2} m²`:p.area||'';
  return `<article class="mini-property">
    <span class="mini-badge ${type}">${badge}</span>
    <button class="mini-edit" data-mini-edit="${escapeHTML(p.id)}" title="Sửa bài">✏️</button>
    <img src="${escapeHTML(p.image||mediaList(p)[0]||'')}" alt="${escapeHTML(p.title)}">
    <span class="rank-dot">${index+1}</span>
    <div class="mini-property-body">
      <h4>${escapeHTML(p.title)}</h4>
      <p>${escapeHTML(compactLocation(p)||p.location||'Đà Nẵng')}</p>
      <p class="mini-price">${escapeHTML(price)}</p>
      <p>${escapeHTML(area)} · ${escapeHTML(p.road||'')}</p>
    </div>
  </article>`;
}
function renderDiscoverySections(){
  const hotRail=$('#hotPropertyRail'),newRail=$('#newPropertyRail');
  if(!hotRail||!newRail)return;
  const source=(P.length?P:DATASET).map((x,i)=>adaptProperty(x,i));
  const hot=[...source].sort((a,b)=>hotValue(b,0)-hotValue(a,0)).slice(0,10);
  const newest=[...source].sort((a,b)=>demoDateValue(b,0)-demoDateValue(a,0)).slice(0,10);
  hotRail.innerHTML=hot.map((p,i)=>discoveryProperty(p,i,'hot')).join('');
  newRail.innerHTML=newest.map((p,i)=>discoveryProperty(p,i,'new')).join('');
  $$('[data-mini-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();openPropertyEditor(b.dataset.miniEdit,false)});
  $$('.mini-property img,.mini-property h4').forEach(el=>el.onclick=()=>{
    const card=el.closest('.mini-property');
    const btn=card?.querySelector('[data-mini-edit]');
    if(btn)openDetail(btn.dataset.miniEdit);
  });
}
function updateBrainMetrics(){
  const total=DATASET.length;
  const matched=P.length;
  const a=$('#brainAnalyzed'),m=$('#brainMatched');
  if(a)a.textContent=total.toLocaleString('vi-VN');
  if(m)m.textContent=matched.toLocaleString('vi-VN');
}
function findRawProperty(id){return DATASET.find(x=>String(x.id)===String(id))}
function aiRewriteDraft(p){
  const item=adaptProperty(p,0);
  const title=synthesizeProfessionalTitle(item,0);
  const facts=propertyFacts(item);
  const location=compactLocation(item)||item.location||'Đà Nẵng';
  const tags=[...new Set(item.tags||[])].slice(0,5);
  return {
    title,
    article:[
      `🔥 ${title}`,
      '',
      `✨ Bất động sản tại ${location}, được KY AI chuẩn hóa để khách hàng nắm nhanh thông tin quan trọng.`,
      '',
      '📌 THÔNG TIN CƠ BẢN',
      ...facts.map(x=>x),
      '',
      '⭐ ĐIỂM NỔI BẬT',
      ...(tags.length?tags.map(x=>`✅ ${x}`):['✅ Hồ sơ đang được tiếp tục hoàn thiện']),
      '',
      `💰 GIÁ CHÀO BÁN: ${item.price||'Liên hệ xác nhận'}`,
      '',
      '📞 LIÊN HỆ TƯ VẤN & XEM NHÀ',
      '☎️ 0935202777',
      '🏠 KY AI Đại Kỷ Nguyên Bất Động Sản'
    ].join('\n')
  };
}
function openPropertyEditor(id,useAI=false){
  const raw=findRawProperty(id);if(!raw)return;
  const adapted=adaptProperty(raw,0);
  const draft=useAI?aiRewriteDraft(raw):{
    title:adapted.title||raw.title||'',
    article:adapted.article||raw.description||raw.public_article||''
  };
  $('#editPropertyId').value=id;
  $('#editTitleInput').value=draft.title;
  $('#editArticleInput').value=draft.article;
  $('#editModalTitle').textContent=useAI?'KY AI đã viết lại – hãy kiểm tra':'Sửa bài đăng thủ công';
  $('#editPropertyModal').classList.remove('hidden');
}
function closePropertyEditor(){$('#editPropertyModal').classList.add('hidden')}
$('#closeEditModal').onclick=closePropertyEditor;
$('#editPropertyModal').onclick=e=>{if(e.target.id==='editPropertyModal')closePropertyEditor()};
$('#rewriteInsideModal').onclick=()=>{
  const raw=findRawProperty($('#editPropertyId').value);if(!raw)return;
  const draft=aiRewriteDraft(raw);
  $('#editTitleInput').value=draft.title;$('#editArticleInput').value=draft.article;
  $('#editModalTitle').textContent='KY AI đã viết lại – hãy kiểm tra';
};
$('#savePropertyEdit').onclick=()=>{
  const id=$('#editPropertyId').value;
  const raw=findRawProperty(id);if(!raw)return;
  const title=$('#editTitleInput').value.trim();
  const article=$('#editArticleInput').value.trim();
  raw.title=title;raw.description=article;raw.public_article=article;raw.article=article;
  raw.updated_at=new Date().toISOString();
  P=P.map((x,i)=>String(x.id)===String(id)?adaptProperty(raw,i):x);
  persistDataset();renderResults();closePropertyEditor();
  const status=$('#dataStatus');if(status){status.className='data-status ready';status.textContent=`Đã lưu chỉnh sửa căn ${id}.`;}
};
function assistantAnalyze(query){
  const need=parseNeed(query);
  const rows=[];
  if(need.district)rows.push(`📍 Khu vực: ${need.district}`);
  if(need.maxPrice)rows.push(`💰 Ngân sách: khoảng ${need.maxPrice} tỷ`);
  if(need.car)rows.push('🚗 Yêu cầu: ô tô');
  if(need.frontage)rows.push('🏢 Loại hình: mặt tiền');
  if(need.business)rows.push('💼 Mục đích: kinh doanh');
  if(need.beach)rows.push('🌊 Ưu tiên: gần biển');
  $('#assistantNeed').innerHTML=`<b>PHÂN TÍCH NHU CẦU</b><p>${rows.length?rows.join('<br>'):'KY sẽ phân tích theo nội dung bạn vừa mô tả.'}</p>`;
  $('#assistantResult').innerHTML=`<b>KẾT QUẢ AI</b><p>Đang phân tích kho dữ liệu…</p>`;
  $('#smartQuery').value=query;$('#chatInput').value=query;
  smartSearch();
  setTimeout(()=>{
    $('#assistantResult').innerHTML=`<b>KẾT QUẢ AI</b><p>✅ Đã tìm thấy ${P.length} căn phù hợp<br>⭐ Top đề xuất: ${Math.min(10,P.length)} căn<br>📊 Điểm phù hợp cao nhất: ${P[0]?.score||0}/100</p>`;
    updateBrainMetrics();
  },1100);
}
$('#assistantForm').onsubmit=e=>{e.preventDefault();const q=$('#assistantInput').value.trim();if(!q)return;assistantAnalyze(q);$('#assistantInput').value=''};
$$('[data-ai-prompt]').forEach(b=>b.onclick=()=>assistantAnalyze(b.dataset.aiPrompt));
$('#openAiChatBtn').onclick=()=>{$('#aiAssistantPanel').classList.add('open');$('#assistantInput')?.focus()};
$('#closeAiChatBtn').onclick=()=>$('#aiAssistantPanel').classList.remove('open');
$('#showHotBtn').onclick=()=>{P=[...(P.length?P:DATASET)].sort((a,b)=>hotValue(b,0)-hotValue(a,0));renderResults();$('#resultsSection').classList.remove('hidden');$('#resultsSection').scrollIntoView({behavior:'smooth'})};
$('#showNewBtn').onclick=()=>{P=[...(P.length?P:DATASET)].sort((a,b)=>demoDateValue(b,0)-demoDateValue(a,0));renderResults();$('#resultsSection').classList.remove('hidden');$('#resultsSection').scrollIntoView({behavior:'smooth'})};

P=[...DATASET];
state.currentPage=1;
renderDiscoverySections();
renderResults();
updateBrainMetrics();
$('#resultsSection')?.classList.remove('hidden');


/* ===== KY AI V2.0.1 – ON-DEMAND IMAGE FILTER ===== */
const VISION_SETTINGS_KEY='ky_vision_settings_v201';
let VISION_WORKING={id:'',items:[],showHidden:false};

function visionSettings(){
  const defaults={autoOnOpen:true,onlyNew:true,autoCover:true,keepOriginal:true,hideExcluded:true,strictCustomerMode:true,neverUseFaceCover:true};
  try{return {...defaults,...JSON.parse(localStorage.getItem(VISION_SETTINGS_KEY)||'{}')}}catch{return defaults}
}
function saveVisionSettingsData(settings){localStorage.setItem(VISION_SETTINGS_KEY,JSON.stringify(settings))}
function visionFingerprint(urls){
  let h=2166136261;
  for(const ch of urls.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return String(h>>>0);
}
function visionMetadataRisk(url){
  const t=normalizeVN(decodeURIComponent(String(url||'')));
  const rules=[
    ['selfie','Có dấu hiệu selfie trong tên tệp'],
    ['avatar','Có dấu hiệu ảnh đại diện'],
    ['portrait','Có dấu hiệu ảnh chân dung'],
    ['face','Có dấu hiệu khuôn mặt'],
    ['nguoi','Có dấu hiệu có người'],
    ['moi-gioi','Có dấu hiệu ảnh môi giới'],
    ['avatar','Có dấu hiệu ảnh đại diện'],
    ['cccd','Có dấu hiệu giấy tờ cá nhân'],
    ['cmnd','Có dấu hiệu giấy tờ cá nhân'],
    ['giay-to','Có dấu hiệu giấy tờ'],
    ['giayto','Có dấu hiệu giấy tờ'],
    ['logo','Có dấu hiệu logo'],
    ['watermark','Có dấu hiệu watermark'],
    ['qr','Có dấu hiệu mã QR'],
    ['map','Có dấu hiệu bản đồ']
  ];
  return rules.find(([token])=>t.includes(token))?.[1]||'';
}
function loadImageMetrics(url){
  return new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight,ok:true});
    image.onerror=()=>resolve({width:0,height:0,ok:false});
    image.src=url;
  });
}
async function detectFacesInBrowser(url){
  if(!('FaceDetector' in window)){
    return {supported:false,faces:[]};
  }
  const image=new Image();
  image.crossOrigin='anonymous';
  await new Promise((resolve,reject)=>{
    image.onload=resolve;
    image.onerror=()=>reject(new Error('Không tải được ảnh'));
    image.src=url;
  });
  const detector=new FaceDetector({fastMode:true,maxDetectedFaces:10});
  const faces=await detector.detect(image);
  return {
    supported:true,
    faces,
    width:image.naturalWidth,
    height:image.naturalHeight
  };
}
async function analyzeVisionImage(url,index,seen){
  const duplicate=seen.has(url);
  seen.add(url);
  const metrics=await loadImageMetrics(url);

  if(duplicate){
    return {
      url,index,decision:'excluded',reason:'Ảnh trùng',
      width:metrics.width,height:metrics.height,coverScore:-100,
      userModified:false,suspectedPerson:false,customerVisible:false,
      coverEligible:false,visionSource:'duplicate'
    };
  }

  try{
    const result=await detectFacesInBrowser(url);

    if(!result.supported){
      return {
        url,index,decision:'review',
        reason:'Trình duyệt chưa hỗ trợ nhận diện khuôn mặt · cần duyệt',
        width:metrics.width,height:metrics.height,coverScore:10,
        userModified:false,suspectedPerson:false,customerVisible:false,
        coverEligible:false,visionSource:'browser-unsupported'
      };
    }

    if(result.faces.length>0){
      return {
        url,index,decision:'excluded',
        reason:`Phát hiện ${result.faces.length} khuôn mặt · tự động ẩn`,
        width:result.width||metrics.width,height:result.height||metrics.height,
        coverScore:-100,userModified:false,suspectedPerson:true,
        customerVisible:false,coverEligible:false,
        visionSource:'browser-face',faceCount:result.faces.length
      };
    }

    return {
      url,index,decision:'accepted',
      reason:'Không phát hiện khuôn mặt · tự động giữ',
      width:result.width||metrics.width,height:result.height||metrics.height,
      coverScore:70-index*.2,userModified:false,suspectedPerson:false,
      customerVisible:true,coverEligible:true,
      visionSource:'browser-no-face'
    };
  }catch(error){
    return {
      url,index,decision:'review',
      reason:'Không phân tích được ảnh · cần duyệt',
      width:metrics.width,height:metrics.height,coverScore:5,
      userModified:false,suspectedPerson:false,customerVisible:false,
      coverEligible:false,visionSource:'browser-error',error:String(error?.message||error)
    };
  }
}
async function analyzeVisionProperty(property,{force=false}={}){
  const urls=rawMediaList(property);
  const fingerprint=visionFingerprint(urls);
  const current=visionCacheFor(property.id);
  if(!force && current && current.fingerprint===fingerprint)return current;

  const items=[],seen=new Set();
  for(let i=0;i<urls.length;i++){
    updateVisionProgress(i,urls.length,`Đang kiểm tra ảnh ${i+1}/${urls.length}`);
    items.push(await analyzeVisionImage(urls[i],i,seen));
  }
  const accepted=items.filter(x=>x.decision==='accepted'&&x.customerVisible===true).sort((a,b)=>b.coverScore-a.coverScore);
  const review=items.filter(x=>x.decision==='review');
  const excluded=items.filter(x=>x.decision==='excluded');
  const cover=(accepted.find(x=>x.coverEligible!==false)||accepted[0])?.url||'';
  const cache={
    version:'2.7-browser-vision',
    propertyId:property.id,
    fingerprint,
    processedAt:new Date().toISOString(),
    cover,
    approved:accepted.map(x=>x.url),
    hidden:excluded.map(x=>x.url),
    review:review.map(x=>x.url),
    items,
    approvedByAdmin:true,
    autoApproved:true,
    visionMode:items.some(x=>x.visionSource==='browser-face'||x.visionSource==='browser-no-face')
      ?'browser-face-detector'
      :'manual-review'
  };
  localStorage.setItem('ky_vision_v27_'+property.id,JSON.stringify({...cache,approvedByAdmin:false,proposalOnly:true}));
  updateVisionProgress(urls.length,urls.length,'Hoàn tất');
  return cache;
}
function updateVisionProgress(done,total,text){
  const box=$('#visionProgress'),bar=$('#visionProgressBar'),label=$('#visionProgressText');
  if(!box||!bar||!label)return;
  box.classList.remove('hidden');
  bar.style.width=`${total?Math.round(done/total*100):0}%`;
  label.textContent=text;
}
function visionProperty(id){
  return DATASET.map((x,i)=>adaptProperty(x,i)).find(x=>String(x.id)===String(id))||
         P.find(x=>String(x.id)===String(id));
}
function renderVisionModal(){
  const items=VISION_WORKING.items||[];
  const accepted=items.filter(x=>x.decision==='accepted').length;
  const review=items.filter(x=>x.decision==='review').length;
  const excluded=items.filter(x=>x.decision==='excluded').length;
  const cover=items.find(x=>x.isCover)?.url||'';
  $('#visionSummary').innerHTML=[
    ['Ảnh gốc',items.length],
    ['Giữ',accepted],
    ['Cần duyệt',review],
    ['Đã ẩn',excluded],
    ['Ảnh bìa',cover?'Đã chọn':'Chưa chọn']
  ].map(([label,value])=>`<div><b>${value}</b><small>${label}</small></div>`).join('');
  $('#visionShowHidden').textContent=VISION_WORKING.showHidden?'🙈 Ẩn ảnh đã loại':'👁 Xem ảnh đã ẩn';
  $('#visionImageGrid').innerHTML=items.map((item,index)=>{
    const hidden=item.decision==='excluded'&&!VISION_WORKING.showHidden;
    return `<article class="vision-image-card ${item.decision} ${hidden?'hidden-by-filter':''}" data-vision-index="${index}">
      ${item.isCover?'<span class="vision-cover-badge">ẢNH BÌA</span>':''}${item.suspectedPerson?'<span class="vision-person-badge">CẦN DUYỆT</span>':''}
      <span class="vision-status-badge ${item.decision}">${item.decision==='accepted'?'GIỮ':item.decision==='review'?'DUYỆT':'ẨN'}</span>
      <img src="${escapeHTML(item.url)}" alt="Ảnh ${index+1}">
      <div class="vision-image-meta">
        <b>${item.width||'?'} × ${item.height||'?'}</b>
        <small>${escapeHTML(item.reason||'')}</small>
        <div class="vision-image-actions">
          <button data-vision-decision="accepted" class="${item.decision==='accepted'?'active':''}">Giữ</button>
          <button data-vision-decision="review" class="${item.decision==='review'?'active':''}">Duyệt</button>
          <button data-vision-decision="excluded" class="${item.decision==='excluded'?'active':''}">Ẩn</button>
        </div>
        <button data-set-cover="${index}" class="secondary" style="width:100%;margin-top:5px;padding:6px" type="button">Đặt làm ảnh bìa</button>
      </div>
    </article>`;
  }).join('');
  $$('[data-vision-decision]').forEach(btn=>btn.onclick=()=>{
    const card=btn.closest('[data-vision-index]');
    const item=VISION_WORKING.items[Number(card.dataset.visionIndex)];
    item.decision=btn.dataset.visionDecision;
    item.userModified=true;
    item.customerVisible=item.decision==='accepted';
    item.coverEligible=item.decision==='accepted';
    item.reason=item.decision==='accepted'
      ?'Quản trị viên xác nhận là ảnh bất động sản'
      :item.decision==='excluded'
        ?'Quản trị viên xác nhận cần ẩn'
        :'Chờ quản trị viên quyết định';
    renderVisionModal();
  });
  $$('[data-set-cover]').forEach(btn=>btn.onclick=()=>{
    VISION_WORKING.items.forEach(x=>x.isCover=false);
    VISION_WORKING.items[Number(btn.dataset.setCover)].isCover=true;
    renderVisionModal();
  });
}
async function openVisionFilter(id,{force=false}={}){
  const p=visionProperty(id);if(!p)return;
  VISION_WORKING={id:p.id,items:[],showHidden:true};
  $('#visionPropertyId').value=p.id;
  $('#visionModalTitle').textContent=`🖼 KY Vision – ${p.title}`;
  $('#visionFilterModal').classList.remove('hidden');
  $('#visionSummary').innerHTML='<div><b>...</b><small>Đang đọc ảnh</small></div>';
  $('#visionImageGrid').innerHTML='';
  $('#visionProgress').classList.remove('hidden');
  const cache=await analyzeVisionProperty(p,{force});
  VISION_WORKING.items=(cache.items||[]).map(x=>({...x,isCover:x.url===cache.cover}));
  if(!VISION_WORKING.items.some(x=>x.isCover)&&VISION_WORKING.items[0])VISION_WORKING.items[0].isCover=true;
  $('#visionProgress').classList.add('hidden');
  renderVisionModal();
}
function closeVisionFilter(){$('#visionFilterModal').classList.add('hidden')}
$('#closeVisionModal').onclick=closeVisionFilter;
$('#visionFilterModal').onclick=e=>{if(e.target.id==='visionFilterModal')closeVisionFilter()};
$('#visionRunAgain').onclick=()=>openVisionFilter(VISION_WORKING.id,{force:true});
$('#visionAcceptAll').onclick=()=>{
  VISION_WORKING.items.forEach(x=>{
    x.decision='accepted';
    x.reason='Quản trị viên chủ động chọn giữ tất cả';
    x.userModified=true;
    x.customerVisible=true;
    x.coverEligible=true;
  });
  renderVisionModal();
};
$('#visionShowHidden').onclick=()=>{VISION_WORKING.showHidden=!VISION_WORKING.showHidden;renderVisionModal()};
$('#visionRestoreOriginal').onclick=()=>{
  VISION_WORKING.items.forEach(x=>{
    x.decision='review';
    x.reason='Ảnh gốc đã khôi phục – chờ quản trị viên duyệt';
    x.isCover=false;
    x.userModified=false;
    x.customerVisible=false;
    x.coverEligible=false;
  });
  renderVisionModal();
};
$('#visionSave').onclick=()=>{
  const p=visionProperty(VISION_WORKING.id);if(!p)return;
  const raw=rawMediaList(p);
  const acceptedItems=VISION_WORKING.items.filter(x=>x.decision==='accepted'&&x.userModified===true);
  const cover=acceptedItems.find(x=>x.isCover)?.url||acceptedItems[0]?.url||'';
  const approved=VISION_WORKING.items.filter(x=>x.decision==='accepted' && x.userModified===true)
    .sort((a,b)=>(a.url===cover?-1:b.url===cover?1:a.index-b.index)).map(x=>x.url);
  const hidden=VISION_WORKING.items.filter(x=>!approved.includes(x.url)).map(x=>x.url);
  if(!approved.length){
    alert('Bạn cần chọn ít nhất 1 ảnh bất động sản bằng nút “Giữ” trước khi lưu album khách.');
    return;
  }
  const cache={
    version:'2.3.2-strict',propertyId:p.id,fingerprint:visionFingerprint(raw),
    processedAt:new Date().toISOString(),cover,approved,hidden,items:VISION_WORKING.items,
    approvedByAdmin:true,proposalOnly:false
  };
  localStorage.setItem('ky_vision_v27_'+p.id,JSON.stringify(cache));
  closeVisionFilter();
  renderResults();
  if($('#detailView').classList.contains('active'))openDetail(p.id);
};
function updateDetailVisionStatus(p){
  const el=$('#detailVisionStatus');if(!el)return;
  const cache=visionCacheFor(p.id),fingerprint=visionFingerprint(rawMediaList(p));
  if(cache&&cache.fingerprint===fingerprint&&cache.approvedByAdmin===true){
    el.className='vision-auto-status ready';
    el.innerHTML=`<i></i><span>Album đã xử lý: ${cache.approved?.length||0} ảnh hiển thị, ${cache.hidden?.length||0} ảnh ẩn</span>`;
  }else if(cache&&cache.fingerprint===fingerprint){
    el.className='vision-auto-status';
    el.innerHTML='<i></i><span>AI đang nhận diện khuôn mặt trên trình duyệt</span>';
  }else{
    el.className='vision-auto-status';
    el.innerHTML='<i></i><span>Ảnh chưa được kiểm tra</span>';
  }
}
async function maybeAutoRunVision(p){
  const settings=visionSettings(),cache=visionCacheFor(p.id),fingerprint=visionFingerprint(rawMediaList(p));
  if(!settings.autoOnOpen)return;
  if(cache&&cache.fingerprint===fingerprint)return;
  const el=$('#detailVisionStatus');
  if(el){el.className='vision-auto-status processing';el.innerHTML='<i></i><span>KY đang lọc ảnh trước khi hiển thị cho khách...</span>'}
  await analyzeVisionProperty(p,{force:true});
  updateDetailVisionStatus(p);
  if($('#detailView').classList.contains('active')){
    openDetail(p.id);
  }
}
function loadVisionSettingsUI(){
  const s=visionSettings();
  $('#settingAutoOnOpen').checked=s.autoOnOpen;
  $('#settingOnlyNew').checked=s.onlyNew;
  $('#settingAutoCover').checked=s.autoCover;
  $('#settingHideExcluded').checked=s.hideExcluded;
  $('#settingStrictCustomerMode').checked=s.strictCustomerMode;
  $('#settingNeverUseFaceCover').checked=s.neverUseFaceCover;
}
$('#openVisionSettingsBtn').onclick=()=>{loadVisionSettingsUI();$('#visionSettingsModal').classList.remove('hidden')};
$('#closeVisionSettings').onclick=()=>$('#visionSettingsModal').classList.add('hidden');
$('#visionSettingsModal').onclick=e=>{if(e.target.id==='visionSettingsModal')$('#visionSettingsModal').classList.add('hidden')};
$('#saveVisionSettings').onclick=()=>{
  saveVisionSettingsData({
    autoOnOpen:$('#settingAutoOnOpen').checked,
    onlyNew:$('#settingOnlyNew').checked,
    autoCover:$('#settingAutoCover').checked,
    keepOriginal:true,
    hideExcluded:$('#settingHideExcluded').checked,
    strictCustomerMode:$('#settingStrictCustomerMode').checked,
    neverUseFaceCover:$('#settingNeverUseFaceCover').checked
  });
  $('#visionSettingsModal').classList.add('hidden');
};


/* ===== KY AI V2.3 – VIETNAMESE REAL-ESTATE SEMANTIC ENGINE ===== */
function semanticNumber(text, token){
  const source=normalizeVN(String(text||''))
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
  const patterns={
    bedrooms:[
      /(?:^|\s)(\d+)\s*pn(?:\s|$)/i,
      /(?:^|\s)pn\s*(\d+)(?:\s|$)/i,
      /(\d+)\s*phong ngu(?:\s|$)/i,
      /(\d+)\s*ngu(?:\s|$)/i
    ],
    bathrooms:[
      /(?:^|\s)(\d+)\s*wc(?:\s|$)/i,
      /(?:^|\s)wc\s*(\d+)(?:\s|$)/i,
      /(\d+)\s*(?:toilet|nha ve sinh|ve sinh)(?:\s|$)/i
    ],
    floors:[
      /(?:^|\s)(\d+)\s*t(?:\s|$)/i,
      /(?:^|\s)(\d+)\s*tang(?:\s|$)/i
    ]
  };
  for(const pattern of patterns[token]||[]){
    const match=source.match(pattern);
    if(match?.[1]) return Number(match[1]);
  }
  return 0;
}
function semanticFlags(text){
  const source=normalizeVN(String(text||''));
  return {
    livingRoom:/(?:^|\s)pk\b|phong khach/.test(source),
    kitchen:/(?:^|\s)bep\b|khu bep/.test(source),
    worshipRoom:/(?:^|\s)pt\b|phong tho/.test(source),
    dryingYard:/(?:^|\s)sp\b|san phoi/.test(source),
    business:/(?:^|\s)kd\b|kinh doanh/.test(source),
    carAccess:/oto|o to/.test(source),
    carAvoid:/oto tranh|o to tranh/.test(source),
    corner:/lo goc/.test(source)
  };
}

const READER_CACHE_PREFIX='ky_reader_v21_';
let READER_CURRENT=null;
function articleTextOf(raw,adapted){return String(raw?.description||raw?.public_article||raw?.article||adapted?.article||adapted?.description||'').trim()}
function normalizeStreetCandidate(text){return String(text||'').replace(/\s+/g,' ').replace(/^[,.\-\s]+|[,.\-\s]+$/g,'').trim()}
function firstMatch(text,patterns){for(const pattern of patterns){const m=text.match(pattern);if(m?.[1])return normalizeStreetCandidate(m[1])}return ''}
function extractReaderData(raw){
  const p=adaptProperty(raw,0),article=articleTextOf(raw,p),source=`${raw?.title||p.title||''}\n${article}`,plain=source.replace(/\r/g,' '),lower=normalizeVN(plain);
  const price=p.price_billion||Number((plain.match(/(\d+(?:[.,]\d+)?)\s*tỷ/i)||[])[1]?.replace(',','.'))||0;
  const area=p.area_m2||Number((plain.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i)||[])[1]?.replace(',','.'))||0;
  const frontage=Number((plain.match(/(?:mặt tiền|ngang)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*m/i)||[])[1]?.replace(',','.'))||0;
  const floors=semanticNumber(plain,'floors')||Number((plain.match(/(\d+)\s*(?:tầng|tang)/i)||[])[1])||0;
  const bedrooms=semanticNumber(plain,'bedrooms')||Number((plain.match(/(\d+)\s*(?:phòng ngủ|pn)\b/i)||[])[1])||0;
  const bathrooms=semanticNumber(plain,'bathrooms')||Number((plain.match(/(\d+)\s*(?:wc|vệ sinh)/i)||[])[1])||0;
  let street=firstMatch(article||plain,[
    /(?:đường|mặt tiền|mt)\s+([A-ZÀ-ỸĐ][^,\n.;]{2,45}?\d{0,3})(?:,|\n|\.|phường|p\.|quận|q\.|$)/iu,
    /(?:vị trí|địa chỉ)\s*[:\-]\s*([^,\n.;]{3,60})/iu,
    /\b([A-ZÀ-ỸĐ][A-Za-zÀ-ỹĐđ\s]{2,35}\s+\d{1,3})\b/u
  ]);
  if(!street)street=(p.location||'').split(',')[0]||'';
  const wards=['Mân Thái','An Hải Bắc','An Hải Đông','An Hải Tây','Phước Mỹ','Mỹ An','Khuê Mỹ','Hòa Hải','Hòa Quý','Thạch Thang','Hải Châu I','Hải Châu II','Thanh Bình','Thuận Phước','Hòa Cường Bắc','Hòa Cường Nam','Chính Gián','Thạc Gián','Vĩnh Trung','Tân Chính','Tam Thuận','Xuân Hà','An Khê','Hòa Khê','Hòa Minh','Hòa Hiệp Bắc','Hòa Hiệp Nam','Hòa Khánh Bắc','Hòa Khánh Nam','Hòa Xuân'];
  const districts=['Sơn Trà','Ngũ Hành Sơn','Hải Châu','Thanh Khê','Liên Chiểu','Cẩm Lệ','Hòa Vang'];
  const ward=wards.find(x=>lower.includes(normalizeVN(x)))||'',district=districts.find(x=>lower.includes(normalizeVN(x)))||p.district||'',city='Đà Nẵng';
  const legal=firstMatch(plain,[/(sổ hồng(?:\s+chính chủ)?)/iu,/(sổ đỏ(?:\s+chính chủ)?)/iu,/(pháp lý\s*[:\-]?\s*[^,\n.;]{2,35})/iu]);
  const direction=firstMatch(plain,[/hướng\s*[:\-]?\s*(đông nam|đông bắc|tây nam|tây bắc|đông|tây|nam|bắc)/iu]);
  const address=[street,ward?`Phường ${ward}`:'',district,city].filter(Boolean).join(', ');
  const titleParts=[frontage?'MẶT TIỀN':floors?`NHÀ ${floors} TẦNG`:'BẤT ĐỘNG SẢN',street?street.toUpperCase():'',area?`${area}M²`:'',price?`${price} TỶ`:''].filter(Boolean);
  const normalizedTitle=titleParts.join(' – ');
  const confidence=Math.min(99,60+[street,ward,district,price,area].filter(Boolean).length*7+(legal?3:0)+(floors?2:0));
  const originalTitle=String(raw?.title||p.title||''),addressMismatch=Boolean(street&&!normalizeVN(originalTitle).includes(normalizeVN(street)));
  const semantic=semanticFlags(plain);
  const fields={street,ward,district,city,address,price,area,frontage,floors,bedrooms,bathrooms,legal,direction,semantic};
  const normalizedArticle=[
    `🔥 ${normalizedTitle}`,'',`✨ Bất động sản tại ${address||p.location||'Đà Nẵng'}, được KY AI trích xuất và chuẩn hóa từ nội dung bài đăng.`,'','📌 THÔNG TIN CƠ BẢN',
    address?`📍 Vị trí: ${address}`:'',area?`🏡 Diện tích: ${area}m²`:'',frontage?`📐 Mặt tiền: ${frontage}m`:'',floors?`🏢 Kết cấu: ${floors} tầng`:'',bedrooms?`🛏 Phòng ngủ: ${bedrooms}`:'',bathrooms?`🚿 Nhà vệ sinh: ${bathrooms}`:'',semantic.livingRoom?'🛋 Phòng khách: Có':'',semantic.kitchen?'🍳 Bếp: Có':'',semantic.worshipRoom?'🙏 Phòng thờ: Có':'',semantic.dryingYard?'👕 Sân phơi: Có':'',legal?`📄 Pháp lý: ${legal}`:'',direction?`🧭 Hướng: ${direction}`:'',
    '',price?`💰 GIÁ CHÀO BÁN: ${price} tỷ`:'','','📞 LIÊN HỆ TƯ VẤN & XEM NHÀ','☎️ 0935202777','🏠 Đại Kỷ Nguyên'
  ].filter(Boolean).join('\n');
  return {propertyId:p.id,processedAt:new Date().toISOString(),sourceTitle:originalTitle,sourceArticle:article,fields,confidence,addressMismatch,normalizedTitle,normalizedArticle};
}
function saveReaderCache(r){localStorage.setItem(READER_CACHE_PREFIX+r.propertyId,JSON.stringify(r))}
function readerCache(id){try{return JSON.parse(localStorage.getItem(READER_CACHE_PREFIX+id)||'null')}catch{return null}}
function readerField(label,value){return `<div class="reader-field ${verifiedStatusClass(value)}"><small>${label}</small><b>${hasMeaningfulValue(value)?escapeHTML(String(value)):'AI đang xác minh'}</b></div>`}
function renderReaderResult(r){
  READER_CURRENT=r;$('#readerPropertyId').value=r.propertyId;$('#readerOriginalTitle').textContent=r.sourceTitle||'Không có tiêu đề gốc';$('#readerOriginalArticle').textContent=r.sourceArticle||'Không có nội dung bài đăng';$('#readerConfidenceBadge').textContent=`Độ tin cậy ${r.confidence}%`;
  const f=r.fields;$('#readerExtractedFields').innerHTML=[
    readerField('Đường',f.street),readerField('Phường',f.ward),readerField('Quận',f.district),readerField('Thành phố',f.city),readerField('Giá',f.price?`${f.price} tỷ`:''),readerField('Diện tích',f.area?`${f.area}m²`:''),readerField('Mặt tiền',f.frontage?`${f.frontage}m`:''),readerField('Kết cấu',f.floors?`${f.floors} tầng`:''),readerField('Phòng ngủ',f.bedrooms),readerField('WC',f.bathrooms),readerField('Pháp lý',f.legal),readerField('Hướng',f.direction)
  ].join('');
  const checks=[['Địa chỉ',f.address,r.addressMismatch?'warn':'ok',r.addressMismatch?'Tiêu đề chưa khớp nội dung':'Đã khớp'],['Giá bán',hasMeaningfulValue(f.price)?`${f.price} tỷ`:'AI đang xác minh',f.price?'ok':'warn','Từ nội dung'],['Diện tích',hasMeaningfulValue(f.area)?`${f.area}m²`:'AI đang xác minh',f.area?'ok':'warn','Từ nội dung'],['Mặt tiền',hasMeaningfulValue(f.frontage)?`${f.frontage}m`:'AI đang xác minh',f.frontage?'ok':'warn','Từ nội dung'],['Kết cấu',hasMeaningfulValue(f.floors)?`${f.floors} tầng`:'AI đang xác minh',f.floors?'ok':'warn','Từ nội dung'],['Phòng ngủ',hasMeaningfulValue(f.bedrooms)?f.bedrooms:'AI đang xác minh',f.bedrooms?'ok':'warn','Từ nội dung'],['Pháp lý',hasMeaningfulValue(f.legal)?f.legal:'AI đang xác minh',f.legal?'ok':'warn','Từ nội dung'],['Hướng',hasMeaningfulValue(f.direction)?f.direction:'AI đang xác minh',f.direction?'ok':'warn','Từ nội dung']];
  $('#readerVerifyRows').innerHTML=checks.map(([l,v,s,n])=>`<div class="verify-row ${s}"><b>${l}<span class="verify-icon">${s==='ok'?'✓':'⚠'}</span></b><small>${escapeHTML(v)}</small><small>${escapeHTML(n)}</small></div>`).join('');
  $('#normalizedTitleInput').value=r.normalizedTitle;$('#normalizedAddressInput').value=f.address;$('#normalizedArticleInput').value=r.normalizedArticle;
}
async function runReaderAnalysis(id,{force=false}={}){
  const raw=findRawProperty(id);if(!raw)return null;if(!force){const c=readerCache(id);if(c)return c}
  $('#readerProgress').classList.remove('hidden');
  for(const [p,t] of [[25,'AI Reader đang đọc toàn bộ nội dung...'],[58,'AI Verify đang đối chiếu tiêu đề và dữ liệu...'],[85,'AI Normalize đang chuẩn hóa hồ sơ...'],[100,'Hoàn tất']]){$('#readerProgressBar').style.width=p+'%';$('#readerProgressText').textContent=t;await new Promise(r=>setTimeout(r,220))}
  const r=extractReaderData(raw);saveReaderCache(r);$('#readerProgress').classList.add('hidden');return r;
}
async function openReaderVerify(id,{force=false}={}){$('#readerVerifyModal').classList.remove('hidden');const r=await runReaderAnalysis(id,{force});if(r)renderReaderResult(r)}
function closeReaderVerify(){$('#readerVerifyModal').classList.add('hidden')}
$('#closeReaderVerify').onclick=closeReaderVerify;
$('#readerVerifyModal').onclick=e=>{if(e.target.id==='readerVerifyModal')closeReaderVerify()};
$('#readerAnalyzeAgain').onclick=()=>openReaderVerify($('#readerPropertyId').value,{force:true});
$('#copyOriginalArticle').onclick=async()=>{await navigator.clipboard.writeText($('#readerOriginalArticle').textContent||'');$('#copyOriginalArticle').textContent='Đã sao chép'};
$('#readerApplyChanges').onclick=()=>{const id=$('#readerPropertyId').value,raw=findRawProperty(id);if(!raw)return;raw.title=$('#normalizedTitleInput').value.trim();raw.location=$('#normalizedAddressInput').value.trim();raw.address=raw.location;raw.description=$('#normalizedArticleInput').value.trim();raw.public_article=raw.description;raw.article=raw.description;raw.ai_verified=true;raw.ai_verify_confidence=READER_CURRENT?.confidence||0;raw.updated_at=new Date().toISOString();persistDataset();renderResults();closeReaderVerify();if($('#detailView').classList.contains('active'))openDetail(id)};
function updateDetailReaderBanner(p){const el=$('#detailReaderBanner');if(!el)return;const c=readerCache(p.id);if(c){el.innerHTML=`<div><b>📍 ${escapeHTML(c.fields?.address||p.location||'Chưa xác định')}</b><small>${c.addressMismatch?'⚠ Tiêu đề gốc chưa khớp nội dung':'✓ Đã xác minh'} · AI Verify ${c.confidence}% · Trích xuất từ nội dung</small></div><button id="detailReaderBtn" type="button">🧠 Xem nguồn</button>`}else{el.innerHTML=`<div><b>Địa chỉ chưa được AI xác minh</b><small>KY có thể trích xuất từ nội dung bài đăng</small></div><button id="detailReaderBtn" type="button">🧠 AI Verify</button>`}$('#detailReaderBtn').onclick=()=>openReaderVerify(p.id)}
$('#openReaderVerifyBtn').onclick=()=>{const id=P[0]?.id||DATASET[0]?.id;if(id)openReaderVerify(id);else alert('Kho dữ liệu chưa có căn để phân tích.')};


function propertyVerifiedFields(p){
  const cache=readerCache(p.id);
  const f=cache?.fields||{};
  return [
    {label:'Diện tích', icon:'📐', value:hasMeaningfulValue(f.area)?`${f.area} m²`:(hasMeaningfulValue(p.area)?p.area:'')},
    {label:'Phòng ngủ', icon:'🛏', value:hasMeaningfulValue(f.bedrooms)?`${f.bedrooms} phòng`:(hasMeaningfulValue(p.bedrooms)?`${p.bedrooms} phòng`:'')},
    {label:'WC', icon:'🚿', value:hasMeaningfulValue(f.bathrooms)?`${f.bathrooms} WC`:(hasMeaningfulValue(p.bathrooms)?`${p.bathrooms} WC`:'')},
    {label:'Mặt tiền', icon:'📏', value:hasMeaningfulValue(f.frontage)?`${f.frontage} m`:''},
    {label:'Kết cấu', icon:'🏢', value:hasMeaningfulValue(f.floors)?`${f.floors} tầng`:''},
    {label:'Pháp lý', icon:'📄', value:hasMeaningfulValue(f.legal)?f.legal:''},
    {label:'Hướng', icon:'🧭', value:hasMeaningfulValue(f.direction)?f.direction:''},
    {label:'Đường trước nhà', icon:'🚗', value:hasMeaningfulValue(p.road)?p.road:''}
  ];
}
function renderVerifiedQuickFacts(p){
  const box=$('#verifiedQuickFacts'); if(!box) return;
  const fields=propertyVerifiedFields(p).slice(0,4);
  box.innerHTML=fields.map(x=>`<div class="verified-fact ${verifiedStatusClass(x.value)}">
    <span class="verified-fact-icon">${x.icon}</span>
    <div><small>${x.label}</small><b>${hasMeaningfulValue(x.value)?escapeHTML(String(x.value)):'AI đang xác minh'}</b></div>
  </div>`).join('');
}
function updateDetailCompletion(p){
  const badge=$('#detailCompletionBadge'); if(!badge) return;
  const fields=propertyVerifiedFields(p);
  const verified=fields.filter(x=>hasMeaningfulValue(x.value)).length;
  const percent=Math.round(verified/fields.length*100);
  badge.textContent=`AI đã xác minh ${verified}/${fields.length} thông tin · ${percent}%`;
  badge.classList.toggle('complete',percent>=75);
}

const resultsPageSizeSelect=$('#resultsPageSize');
if(resultsPageSizeSelect){
  resultsPageSizeSelect.value=String(state.pageSize);
  resultsPageSizeSelect.onchange=()=>{
    state.pageSize=Number(resultsPageSizeSelect.value)||12;
    state.currentPage=1;
    renderResults();
  };
}

document.querySelectorAll('[data-view="home"],#brandBtn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(!P.length && DATASET.length) P=[...DATASET];
    $('#resultsSection')?.classList.remove('hidden');
    renderResults();
  });
});

function updateBrowserVisionNotice(){
  const box=$('#browserVisionNotice');
  if(!box)return;
  if('FaceDetector' in window){
    box.className='browser-vision-notice ready';
    box.textContent='✓ Trình duyệt hỗ trợ nhận diện khuôn mặt. Có mặt người → Ẩn; không có mặt người → Giữ.';
  }else{
    box.className='browser-vision-notice warn';
    box.textContent='⚠ Trình duyệt này chưa hỗ trợ FaceDetector. Ảnh sẽ chuyển sang “Cần duyệt”, không tự giữ hoặc tự ẩn sai.';
  }
}
$('#openVisionSettingsBtn')?.addEventListener('click',updateBrowserVisionNotice);


/* ===== KY AI V2.8 – VIEWER ALERT & APPROVAL QUEUE ===== */
const APPROVAL_QUEUE_KEY='ky_approval_queue_v28';
const ACTIVE_VIEW_KEY='ky_active_property_view_v28';
let approvalTimerHandle=null;

function approvalQueue(){
  try{return JSON.parse(localStorage.getItem(APPROVAL_QUEUE_KEY)||'[]')}catch{return []}
}
function saveApprovalQueue(items){
  localStorage.setItem(APPROVAL_QUEUE_KEY,JSON.stringify(items));
  renderApprovalQueueBadge();
}
function findApprovalItem(propertyId){
  return approvalQueue().find(x=>String(x.propertyId)===String(propertyId));
}
function queuePropertyForApproval(property){
  const rawImages=rawMediaList(property);
  if(!rawImages.length)return;

  const cache=visionCacheFor(property.id);
  const fingerprint=visionFingerprint(rawImages);
  const alreadyApproved=cache && cache.fingerprint===fingerprint &&
    Array.isArray(cache.approved) && cache.approved.length>0 &&
    (cache.approvedByAdmin===true || cache.autoApproved===true);

  if(alreadyApproved)return;

  const items=approvalQueue();
  const existing=items.find(x=>String(x.propertyId)===String(property.id));
  const now=Date.now();
  if(existing){
    existing.lastViewedAt=now;
    existing.viewerCount=(existing.viewerCount||0)+1;
    existing.imageCount=rawImages.length;
    existing.title=property.title;
  }else{
    items.unshift({
      propertyId:property.id,
      title:property.title,
      location:property.location||'',
      price:property.price||'',
      imageCount:rawImages.length,
      viewerCount:1,
      firstViewedAt:now,
      lastViewedAt:now,
      status:'waiting'
    });
  }
  saveApprovalQueue(items);
  localStorage.setItem(ACTIVE_VIEW_KEY,JSON.stringify({propertyId:property.id,startedAt:now}));
  showCustomerWaiting(property);
}
function showCustomerWaiting(property){
  const banner=$('#customerWaitingBanner');
  if(!banner)return;
  banner.classList.remove('hidden');
  const timer=$('#customerWaitingTimer');
  const started=findApprovalItem(property.id)?.firstViewedAt||Date.now();
  if(approvalTimerHandle)clearInterval(approvalTimerHandle);
  const tick=()=>{
    const seconds=Math.max(0,Math.floor((Date.now()-started)/1000));
    const mm=String(Math.floor(seconds/60)).padStart(2,'0');
    const ss=String(seconds%60).padStart(2,'0');
    if(timer)timer.textContent=`${mm}:${ss}`;
  };
  tick();
  approvalTimerHandle=setInterval(tick,1000);
}
function renderApprovalQueueBadge(){
  const items=approvalQueue().filter(x=>x.status==='waiting');
  const badge=$('#approvalQueueCount');
  if(badge)badge.textContent=String(items.length);
  const trigger=$('#openApprovalQueueBtn');
  if(trigger)trigger.classList.toggle('has-items',items.length>0);
}
function renderApprovalQueue(){
  const items=approvalQueue().filter(x=>x.status==='waiting');
  const list=$('#approvalQueueList');
  if(!list)return;
  $('#approvalWaitingProperties').textContent=items.length;
  $('#approvalWaitingImages').textContent=items.reduce((sum,x)=>sum+(x.imageCount||0),0);
  $('#approvalActiveViewers').textContent=items.reduce((sum,x)=>sum+(x.viewerCount||0),0);

  if(!items.length){
    list.innerHTML='<div class="approval-empty">Không có album nào đang chờ duyệt.</div>';
    return;
  }

  list.innerHTML=items.map(item=>{
    const elapsed=Math.max(0,Math.floor((Date.now()-item.firstViewedAt)/1000));
    const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss=String(elapsed%60).padStart(2,'0');
    return `<article class="approval-item">
      <div class="approval-item-main">
        <span class="approval-live-dot"></span>
        <div>
          <b>${escapeHTML(item.title||'Bất động sản')}</b>
          <small>${escapeHTML(item.location||'')} · ${escapeHTML(item.price||'')}</small>
          <p>${item.imageCount||0} ảnh · ${item.viewerCount||1} lượt xem · chờ ${mm}:${ss}</p>
        </div>
      </div>
      <div class="approval-item-actions">
        <button data-approval-review="${escapeHTML(item.propertyId)}" type="button">Xem & duyệt</button>
        <button data-approval-quick="${escapeHTML(item.propertyId)}" class="primary-save" type="button">Duyệt nhanh</button>
      </div>
    </article>`;
  }).join('');

  $$('[data-approval-review]').forEach(btn=>btn.onclick=()=>{
    $('#approvalQueueModal').classList.add('hidden');
    openVisionFilter(btn.dataset.approvalReview,{force:true});
  });
  $$('[data-approval-quick]').forEach(btn=>btn.onclick=()=>quickApproveProperty(btn.dataset.approvalQuick));
}
async function quickApproveProperty(propertyId){
  const p=visionProperty(propertyId);
  if(!p)return;
  const raw=rawMediaList(p);
  const cache=await analyzeVisionProperty(p,{force:true});
  const safe=(cache.items||[]).filter(x=>x.decision==='accepted'&&x.suspectedPerson!==true);
  const approved=(safe.length?safe:(cache.items||[]).filter(x=>x.decision!=='excluded')).map(x=>x.url);
  if(!approved.length){
    alert('KY chưa tìm thấy ảnh đủ an toàn để duyệt nhanh. Hãy chọn thủ công.');
    openVisionFilter(propertyId,{force:false});
    return;
  }
  const cover=approved[0];
  localStorage.setItem('ky_vision_v27_'+p.id,JSON.stringify({
    ...cache,
    version:'2.8-approval-queue',
    approved,
    hidden:raw.filter(url=>!approved.includes(url)),
    cover,
    approvedByAdmin:true,
    autoApproved:false,
    approvedAt:new Date().toISOString()
  }));
  markApprovalDone(propertyId);
  renderResults();
  if($('#detailView').classList.contains('active'))openDetail(propertyId);
}
function markApprovalDone(propertyId){
  const items=approvalQueue();
  const item=items.find(x=>String(x.propertyId)===String(propertyId));
  if(item)item.status='approved';
  saveApprovalQueue(items);
  renderApprovalQueue();
}
function openApprovalQueue(){
  renderApprovalQueue();
  $('#approvalQueueModal').classList.remove('hidden');
}
$('#openApprovalQueueBtn')?.addEventListener('click',openApprovalQueue);
$('#closeApprovalQueue')?.addEventListener('click',()=>$('#approvalQueueModal').classList.add('hidden'));
$('#approvalQueueModal')?.addEventListener('click',e=>{
  if(e.target.id==='approvalQueueModal')$('#approvalQueueModal').classList.add('hidden');
});

// Sau khi lưu bộ ảnh thủ công, đánh dấu hàng chờ đã hoàn thành.
const originalVisionSaveHandler=$('#visionSave')?.onclick;
if($('#visionSave')){
  $('#visionSave').onclick=()=>{
    const propertyId=$('#visionPropertyId').value;
    const beforeCount=(visionCacheFor(propertyId)?.approved||[]).length;
    const result=originalVisionSaveHandler?.();
    setTimeout(()=>{
      const afterCount=(visionCacheFor(propertyId)?.approved||[]).length;
      if(afterCount>0 || beforeCount>0)markApprovalDone(propertyId);
    },80);
    return result;
  };
}

renderApprovalQueueBadge();
setInterval(()=>{
  if(!$('#approvalQueueModal')?.classList.contains('hidden'))renderApprovalQueue();
},1000);


/* ===== KY AI V2.9 – OFFLINE AI TEST LAB ===== */
const OFFLINE_TEST_KEY='ky_offline_ai_test_v29';
let OFFLINE_TEST_DATA=[];
let OFFLINE_TEST={
  conversation:[],
  requirements:{
    budgetMax:null,
    purpose:null,
    area:null,
    propertyType:null,
    features:[]
  },
  ready:false
};

function normalizeOfflineText(value){
  return String(value||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d');
}
function offlineMoneyNumber(text){
  const source=normalizeOfflineText(text);
  let match=source.match(/(\d+(?:[.,]\d+)?)\s*(?:ty|ti)\b/);
  if(match)return Number(match[1].replace(',','.'));
  match=source.match(/(\d+(?:[.,]\d+)?)\s*trieu\b/);
  if(match)return Number(match[1].replace(',','.'))/1000;
  return null;
}
function updateOfflineRequirements(message){
  const text=normalizeOfflineText(message);
  const req=OFFLINE_TEST.requirements;
  const money=offlineMoneyNumber(message);
  if(money)req.budgetMax=money;

  if(/dau tu|sinh loi|tang gia|dong tien/.test(text))req.purpose='Đầu tư';
  else if(/kinh doanh|mo cua hang|van phong/.test(text))req.purpose='Kinh doanh';
  else if(/de o|mua o|an cu|gia dinh/.test(text))req.purpose='Để ở';
  else if(/cho thue/.test(text))req.purpose='Cho thuê';

  const areas=[
    ['Sơn Trà','son tra'],['Hải Châu','hai chau'],['Thanh Khê','thanh khe'],
    ['Ngũ Hành Sơn','ngu hanh son'],['Cẩm Lệ','cam le'],['Liên Chiểu','lien chieu'],
    ['Hòa Vang','hoa vang']
  ];
  for(const [label,key] of areas){
    if(text.includes(key)){req.area=label;break}
  }

  if(/mat tien/.test(text))req.propertyType='Mặt tiền';
  else if(/lo goc/.test(text))req.propertyType='Lô góc';
  else if(/dat/.test(text))req.propertyType='Đất';
  else if(/nha/.test(text)&&!req.propertyType)req.propertyType='Nhà';

  const featureMap=[
    ['Ô tô tránh',/oto tranh|o to tranh/],
    ['Gần biển',/gan bien|bien/],
    ['Dòng tiền',/dong tien|cho thue/],
    ['Kinh doanh',/kinh doanh/],
    ['Lô góc',/lo goc/]
  ];
  featureMap.forEach(([label,pattern])=>{
    if(pattern.test(text)&&!req.features.includes(label))req.features.push(label);
  });

  OFFLINE_TEST.ready=Boolean(req.budgetMax && req.purpose && req.area);
}
function offlineNextReply(){
  const req=OFFLINE_TEST.requirements;
  if(!req.budgetMax){
    return 'Anh/chị dự kiến ngân sách tối đa khoảng bao nhiêu tỷ?';
  }
  if(!req.purpose){
    return `Em đã ghi nhận ngân sách tối đa ${req.budgetMax} tỷ. Anh/chị mua để ở, đầu tư, kinh doanh hay cho thuê?`;
  }
  if(!req.area){
    return `Em đã ghi nhận mục đích ${req.purpose.toLowerCase()}. Anh/chị ưu tiên khu vực nào tại Đà Nẵng?`;
  }
  const optional=[];
  if(!req.propertyType)optional.push('loại hình');
  if(!req.features.length)optional.push('đặc điểm ưu tiên');
  if(optional.length){
    return `Thông tin chính đã đủ. Anh/chị có muốn bổ sung ${optional.join(' và ')} không? Em có thể tìm ngay nếu anh/chị đồng ý.`;
  }
  return `Em đã hiểu: ngân sách tối đa ${req.budgetMax} tỷ, mục đích ${req.purpose.toLowerCase()}, khu vực ${req.area}${req.propertyType?`, loại hình ${req.propertyType.toLowerCase()}`:''}. Em sẽ lọc các căn phù hợp nhất.`;
}
function saveOfflineTest(){
  localStorage.setItem(OFFLINE_TEST_KEY,JSON.stringify(OFFLINE_TEST));
}
function loadOfflineTest(){
  try{
    const saved=JSON.parse(localStorage.getItem(OFFLINE_TEST_KEY)||'null');
    if(saved)OFFLINE_TEST={...OFFLINE_TEST,...saved};
  }catch{}
}
function addOfflineMessage(role,text){
  OFFLINE_TEST.conversation.push({role,text,time:new Date().toISOString()});
  saveOfflineTest();
  renderOfflineConversation();
}
function sendOfflineMessage(message){
  const text=String(message||'').trim();
  if(!text)return;
  addOfflineMessage('user',text);
  updateOfflineRequirements(text);
  addOfflineMessage('assistant',offlineNextReply());
  renderOfflineState();
  if(OFFLINE_TEST.ready){
    $('#applyTestSearchBtn').disabled=false;
  }
}
function renderOfflineConversation(){
  const box=$('#testConversation');
  if(!box)return;
  if(!OFFLINE_TEST.conversation.length){
    box.innerHTML='<div class="test-empty-chat">Hãy nhập một nhu cầu để bắt đầu kiểm thử.</div>';
    return;
  }
  box.innerHTML=OFFLINE_TEST.conversation.map(item=>`
    <div class="test-message ${item.role}">
      <span>${item.role==='assistant'?'KY AI':'Bạn'}</span>
      <p>${escapeHTML(item.text)}</p>
    </div>`).join('');
  box.scrollTop=box.scrollHeight;
}
function renderOfflineState(){
  const req=OFFLINE_TEST.requirements;
  const box=$('#testRequirementState');
  if(!box)return;
  const rows=[
    ['Ngân sách',req.budgetMax?`${req.budgetMax} tỷ`:'Chưa có'],
    ['Mục đích',req.purpose||'Chưa có'],
    ['Khu vực',req.area||'Chưa có'],
    ['Loại hình',req.propertyType||'Chưa có'],
    ['Đặc điểm',req.features.length?req.features.join(', '):'Chưa có']
  ];
  box.innerHTML=rows.map(([label,value])=>`
    <div class="${value==='Chưa có'?'missing':'ready'}">
      <span>${label}</span><b>${escapeHTML(value)}</b>
    </div>`).join('');
  const badge=$('#testReadyBadge');
  badge.className=`test-ready-badge ${OFFLINE_TEST.ready?'ready':'waiting'}`;
  badge.textContent=OFFLINE_TEST.ready?'Đủ thông tin để tìm':'Chưa đủ nhu cầu';
  $('#applyTestSearchBtn').disabled=!OFFLINE_TEST.ready;
}
function parseNumericPrice(property){
  const source=String(property.price||property.gia||'').replace(',','.').toLowerCase();
  const match=source.match(/(\d+(?:\.\d+)?)/);
  return match?Number(match[1]):0;
}
function propertySearchText(property){
  return normalizeOfflineText([
    property.title,property.location,property.article,property.description,
    property.type,property.tags?.join?.(' ')
  ].filter(Boolean).join(' '));
}
function offlineSearchResults(){
  const req=OFFLINE_TEST.requirements;
  const source=(OFFLINE_TEST_DATA.length?OFFLINE_TEST_DATA:(Array.isArray(P)&&P.length?P:DATASET||[]))
    .map(item=>typeof adaptProperty==='function'?adaptProperty(item):item);
  return source.map(p=>{
    const text=propertySearchText(p);
    let score=0;
    const price=parseNumericPrice(p);
    if(req.budgetMax && price>0 && price<=req.budgetMax)score+=35;
    else if(req.budgetMax && price===0)score+=5;
    if(req.area && text.includes(normalizeOfflineText(req.area)))score+=30;
    if(req.propertyType && text.includes(normalizeOfflineText(req.propertyType)))score+=15;
    if(req.purpose==='Đầu tư' && /dong tien|cho thue|kinh doanh|mat tien|lo goc/.test(text))score+=10;
    if(req.purpose==='Kinh doanh' && /kinh doanh|mat tien|oto|o to/.test(text))score+=10;
    if(req.purpose==='Để ở' && /khu dan cu|an ninh|truong|cho|noi that/.test(text))score+=10;
    req.features.forEach(feature=>{
      if(text.includes(normalizeOfflineText(feature)))score+=5;
    });
    return {p,score};
  }).filter(x=>x.score>20).sort((a,b)=>b.score-a.score).slice(0,12);
}
function renderOfflineResults(){
  const grid=$('#testResultsGrid');
  if(!grid)return;
  if(!OFFLINE_TEST.ready){
    grid.innerHTML='';
    $('#testResultsCaption').textContent='AI đang chờ thêm thông tin, chưa đề xuất căn.';
    $('#testResultCount').textContent='0 căn';
    return;
  }
  const matches=offlineSearchResults();
  $('#testResultsCaption').textContent=`Đã lọc theo ngân sách, mục đích và khu vực. Đây là kết quả mô phỏng, chưa dùng API.`;
  $('#testResultCount').textContent=`${matches.length} căn`;
  grid.innerHTML=matches.map(({p,score})=>`
    <article class="property-card test-result-card">
      <div class="property-image-wrap">
        ${p.image?`<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title||'Bất động sản')}">`:'<div class="no-card-image">KY</div>'}
        <span class="test-match-score">${score}% phù hợp</span>
      </div>
      <div class="property-card-body">
        <h3>${escapeHTML(p.title||'Bất động sản')}</h3>
        <p>📍 ${escapeHTML(p.location||'Đang xác minh')}</p>
        <div class="property-meta"><b>${escapeHTML(p.price||'Liên hệ')}</b><span>${escapeHTML(p.area||'')}</span></div>
        <button class="detailBtn" data-id="${escapeHTML(p.id)}" type="button">Xem hồ sơ</button>
      </div>
    </article>`).join('');
  $$('#testResultsGrid .detailBtn').forEach(btn=>btn.onclick=()=>openDetail(btn.dataset.id));
}
function downloadJSONFile(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
function csvToObjects(text){
  const lines=String(text||'').split(/\r?\n/).filter(Boolean);
  if(!lines.length)return [];
  const headers=lines[0].split(',').map(x=>x.trim());
  return lines.slice(1).map(line=>{
    const values=line.split(',');
    const obj={};
    headers.forEach((h,i)=>obj[h]=values[i]?.trim()||'');
    return obj;
  });
}
function resetOfflineTest(){
  OFFLINE_TEST={conversation:[],requirements:{budgetMax:null,purpose:null,area:null,propertyType:null,features:[]},ready:false};
  saveOfflineTest();
  renderOfflineConversation();
  renderOfflineState();
  renderOfflineResults();
}
function openOfflineTestLab(){
  showView('aiTestLab');
  loadOfflineTest();
  renderOfflineConversation();
  renderOfflineState();
  renderOfflineResults();
  const source=(Array.isArray(P)&&P.length?P:DATASET||[]);
  if(!OFFLINE_TEST_DATA.length)OFFLINE_TEST_DATA=[...source];
  $('#testDataStatus').textContent=`Đang dùng ${OFFLINE_TEST_DATA.length.toLocaleString('vi-VN')} căn để test.`;
}
$('#openAiTestLabBtn')?.addEventListener('click',openOfflineTestLab);
$('#backFromTestLabBtn')?.addEventListener('click',()=>showView('home'));
$('#sendTestChatBtn')?.addEventListener('click',()=>{
  sendOfflineMessage($('#testChatInput').value);
  $('#testChatInput').value='';
});
$('#testChatInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();$('#sendTestChatBtn').click()}
});
$$('[data-test-prompt]').forEach(btn=>btn.addEventListener('click',()=>sendOfflineMessage(btn.dataset.testPrompt)));
$('#applyTestSearchBtn')?.addEventListener('click',renderOfflineResults);
$('#resetTestLabBtn')?.addEventListener('click',resetOfflineTest);
$('#downloadConversationBtn')?.addEventListener('click',()=>downloadJSONFile('ky-ai-hoi-thoai-test.json',OFFLINE_TEST));
$('#exportTestDataBtn')?.addEventListener('click',()=>{
  downloadJSONFile('ky-ai-bo-du-lieu-test.json',{
    exportedAt:new Date().toISOString(),
    properties:OFFLINE_TEST_DATA.length?OFFLINE_TEST_DATA:(P||DATASET||[]),
    conversation:OFFLINE_TEST.conversation,
    requirements:OFFLINE_TEST.requirements
  });
});
$('#loadCurrentDatasetBtn')?.addEventListener('click',()=>{
  OFFLINE_TEST_DATA=[...(Array.isArray(P)&&P.length?P:DATASET||[])];
  $('#testDataStatus').textContent=`Đã nạp ${OFFLINE_TEST_DATA.length.toLocaleString('vi-VN')} căn từ kho hiện tại.`;
});
$('#downloadSampleDataBtn')?.addEventListener('click',()=>{
  const sample=[
    {id:'sample-1',title:'Nhà mặt tiền Sơn Trà',price:'18.5 tỷ',area:'120 m²',location:'Sơn Trà, Đà Nẵng',type:'Mặt tiền',description:'Phù hợp kinh doanh, gần biển, ô tô tránh.'},
    {id:'sample-2',title:'Nhà dòng tiền Hải Châu',price:'22 tỷ',area:'95 m²',location:'Hải Châu, Đà Nẵng',type:'Nhà',description:'Đang cho thuê, dòng tiền ổn định, trung tâm.'},
    {id:'sample-3',title:'Lô góc Ngũ Hành Sơn',price:'15.8 tỷ',area:'110 m²',location:'Ngũ Hành Sơn, Đà Nẵng',type:'Lô góc',description:'Lô góc, gần biển, phù hợp đầu tư.'}
  ];
  downloadJSONFile('ky-ai-du-lieu-mau.json',sample);
});
$('#testDataFile')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  const text=await file.text();
  try{
    const parsed=file.name.toLowerCase().endsWith('.csv')?csvToObjects(text):JSON.parse(text);
    OFFLINE_TEST_DATA=Array.isArray(parsed)?parsed:(parsed.properties||[]);
    $('#testDataStatus').textContent=`Đã nạp ${OFFLINE_TEST_DATA.length.toLocaleString('vi-VN')} căn từ ${file.name}.`;
  }catch(error){
    alert('Không đọc được tệp dữ liệu: '+error.message);
  }
});


/* ===== KY ĐẠI KỶ NGUYÊN PWA V3.0 ===== */
let deferredPwaPrompt=null;

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js').catch(error=>{
      console.warn('Không đăng ký được Service Worker:',error);
    });
  });
}

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredPwaPrompt=event;
  $('#installPwaBtn')?.classList.remove('hidden');
  if(!localStorage.getItem('ky_pwa_install_dismissed')){
    $('#pwaInstallToast')?.classList.remove('hidden');
  }
});

async function triggerPwaInstall(){
  if(!deferredPwaPrompt){
    alert('Hãy mở website bằng Chrome hoặc Safari qua đường dẫn HTTPS. Trên iPhone, chọn Chia sẻ → Thêm vào Màn hình chính.');
    return;
  }
  deferredPwaPrompt.prompt();
  await deferredPwaPrompt.userChoice;
  deferredPwaPrompt=null;
  $('#installPwaBtn')?.classList.add('hidden');
  $('#pwaInstallToast')?.classList.add('hidden');
}
$('#installPwaBtn')?.addEventListener('click',triggerPwaInstall);
$('#pwaInstallToastBtn')?.addEventListener('click',triggerPwaInstall);
$('#dismissPwaToastBtn')?.addEventListener('click',()=>{
  $('#pwaInstallToast')?.classList.add('hidden');
  localStorage.setItem('ky_pwa_install_dismissed','1');
});

window.addEventListener('appinstalled',()=>{
  $('#pwaInstallToast')?.classList.add('hidden');
  $('#installPwaBtn')?.classList.add('hidden');
});

$$('[data-mobile-view]').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.mobile-app-nav button').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  if(btn.dataset.mobileView==='home')showView('home');
  if(btn.dataset.mobileView==='aiTest')openOfflineTestLab();
  window.scrollTo({top:0,behavior:'smooth'});
}));
$('#mobileApprovalBtn')?.addEventListener('click',()=>{
  $$('.mobile-app-nav button').forEach(x=>x.classList.remove('active'));
  $('#mobileApprovalBtn').classList.add('active');
  if(typeof openApprovalQueue==='function')openApprovalQueue();
});
$('#mobileSavedBtn')?.addEventListener('click',()=>{
  alert('Mục Đã lưu sẽ được kết nối với tài khoản khách hàng ở phiên bản backend.');
});
$('#mobileAccountBtn')?.addEventListener('click',()=>{
  alert('Mục Tài khoản sẽ được bổ sung khi kết nối đăng nhập và cơ sở dữ liệu.');
});

function syncMobileApprovalBadge(){
  const desktop=$('#approvalQueueCount');
  const mobile=$('#mobileApprovalCount');
  if(!mobile)return;
  const count=desktop?.textContent||'0';
  mobile.textContent=count;
  mobile.classList.toggle('hidden',count==='0');
}
setInterval(syncMobileApprovalBadge,800);
syncMobileApprovalBadge();
