'use strict';

/* 차여기 MVP — no account, no backend. Photos and sessions live in IndexedDB on this device. */
const STORE_NAME='sessions', DB_NAME='chayeogi-mvp', DB_VERSION=1;
const $=selector=>document.querySelector(selector);
const main=$('#mainContent');
const state={db:null,sessions:[],page:'home',selectedId:null,editingId:null,scanEnabled:true};
let renderUrls=[],modalUrl=null,toastTimer=null,ocrRunning=false,libraryLoading=false;

const ICONS={
  house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  'clock-3':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'settings-2':'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  camera:'<path d="M4 7h4l2-3h4l2 3h4a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  'image-plus':'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6M17 7v6m-3-3h6"/>',
  'image':'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  'car-front':'<rect x="4" y="10" width="16" height="9" rx="2"/><path d="m6 10 2-5h8l2 5M4 14h16M6 19v2m12-2v2"/><path d="M7 14h1m8 0h1"/>',
  'scan-line':'<path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4m0 6v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4M3 12h18"/>',
  'arrow-right':'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  'arrow-left':'<path d="M19 12H5m6-6-6 6 6 6"/>',
  'check':'<path d="m4 12 5 5L20 6"/>',
  'check-circle-2':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  'shield-check':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  'map-pin':'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  'door-open':'<path d="M5 21V5l11-2v18H5Zm11-15h3v15h-3M9 12h.5"/>',
  'share-2':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.5 10.8 7-4.2m-7 6.8 7 4.2"/>',
  'pencil':'<path d="m14 6 4 4M4 20l5-1 11-11a2.8 2.8 0 0 0-4-4L5 15l-1 5z"/>',
  'plus':'<path d="M12 5v14M5 12h14"/>',
  'trash-2':'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  'x':'<path d="M5 5 19 19M19 5 5 19"/>',
  'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  'alert-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
  'chevron-right':'<path d="m9 5 7 7-7 7"/>',
  'sparkles':'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Zm7 13 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  'rotate-ccw':'<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
  'calendar-clock':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/><circle cx="13" cy="15" r="3"/><path d="M13 13.5V15l1 1"/>',
  'lock-keyhole':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  'file-text':'<path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 0v5h5M8 12h8M8 16h8"/>',
  'phone':'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  'navigation':'<path d="m3 11 18-8-8 18-2.5-7.5L3 11Z"/>',
  'more-horizontal':'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};
function icon(name,size){return `<svg aria-hidden="true" width="${size||19}" height="${size||19}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.info}</svg>`;}
function injectIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
function esc(val){return String(val??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);}
function formatWhen(time,withYear=false){return new Intl.DateTimeFormat('ko-KR',{year:withYear?'numeric':undefined,month:'long',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(time));}
function elapsed(since,end){const m=Math.max(0,Math.floor(((end||Date.now())-since)/60000));if(m<1)return '방금';if(m<60)return `${m}분`;const h=Math.floor(m/60);return h>=24?`${Math.floor(h/24)}일 ${h%24}시간`:`${h}시간 ${m%60}분`;}
function position(record){const parts=[record.floor, [record.section,record.spot].filter(Boolean).join('-')].filter(Boolean);return parts.join(' · ')||'위치 정보 미입력';}
function titlePlace(record){return record.place||'주차 장소 이름 미입력';}
function activeRecord(){return state.sessions.find(record=>!record.completedAt)||null;}
function getRecord(id){return state.sessions.find(record=>record.id===id)||null;}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3100);}
function makeUrl(blob){if(!blob)return '';const url=URL.createObjectURL(blob);renderUrls.push(url);return url;}
function revokeUrls(){renderUrls.forEach(url=>URL.revokeObjectURL(url));renderUrls=[];}
function cover(record,field='photoBlob'){return record?.[field]?`<img src="${makeUrl(record[field])}" alt="저장된 사진" />`:icon('image');}

function openDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('이 브라우저는 기기 저장소를 지원하지 않습니다.'));const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('데이터베이스를 열지 못했습니다.'));});}
function txPromise(method,record){return new Promise((resolve,reject)=>{const tx=state.db.transaction(STORE_NAME,'readwrite');const store=tx.objectStore(STORE_NAME);let request;if(method==='put')request=store.put(record);if(method==='delete')request=store.delete(record);if(method==='clear')request=store.clear();tx.oncomplete=()=>resolve(request?.result);tx.onerror=()=>reject(tx.error||new Error('저장 중 오류가 발생했습니다.'));tx.onabort=()=>reject(tx.error||new Error('저장이 중단되었습니다.'));});}
function loadSessions(){return new Promise((resolve,reject)=>{const tx=state.db.transaction(STORE_NAME,'readonly');const request=tx.objectStore(STORE_NAME).getAll();request.onsuccess=()=>resolve(request.result.sort((a,b)=>b.createdAt-a.createdAt));request.onerror=()=>reject(request.error);});}
async function refresh(){state.sessions=await loadSessions();render();}
async function save(record){record.updatedAt=Date.now();await txPromise('put',record);await refresh();}

function emptyHome(){return `
  <section class="welcome"><p class="eyebrow">PARK IT. FIND IT.</p><h1 class="screen-heading">주차 위치는<br>이제 기억하지 마세요.</h1><p class="subcopy">기둥 번호를 사진으로 남기면<br>차를 찾을 때 바로 보여드릴게요.</p></section>
  <div class="intro-scene" aria-hidden="true"><div class="parking-pillar"></div><div class="pillar-marker">B3</div><div class="mini-car"></div><div class="scene-flash">${icon('camera',23)}</div><div class="floor-line"></div><div class="scene-note">B3 · C-27, 그 자리 그대로</div></div>
  <button class="button button-primary button-full" data-action="camera">${icon('camera',20)} 사진 찍고 바로 기록</button>
  <div class="button-row" style="margin-top:9px"><button class="button button-outline" data-action="library">${icon('image',17)} 사진 불러오기</button><button class="button button-outline" data-action="manual">${icon('pencil',17)} 직접 입력</button></div>
  <button class="quiet-button" data-action="demo">실제 주차 중이 아니신가요? 샘플로 체험하기 ${icon('arrow-right',13)}</button>
  <div class="tip-stack"><div class="tip-row"><div class="tip-icon">${icon('camera')}</div><div><b>한 장 찍으면 자동 저장</b><span>추가 저장 버튼 없이 기록됩니다.</span></div></div><div class="tip-row"><div class="tip-icon">${icon('sparkles')}</div><div><b>층·구역 정보 인식 시도</b><span>잘못 읽으면 직접 바꿀 수 있어요.</span></div></div><div class="tip-row"><div class="tip-icon">${icon('navigation')}</div><div><b>돌아올 때 바로 확인</b><span>사진첩을 뒤질 필요가 없어요.</span></div></div></div>
  <p class="footer-note">가입 없이 시작 · 사진은 기기 안에 저장</p>`;}

function activeHome(record){const ocr=record.ocr||{};const isVerified=!!record.verifiedAt;const pending=ocr.status==='running'||ocr.status==='waiting';return `
  <div class="welcome" style="margin-top:8px;margin-bottom:18px"><p class="eyebrow">YOUR PARKING MEMORY</p><h1 class="screen-heading">내 차는 여기 있어요.</h1><p class="subcopy">차량을 찾을 때 바로 확인하세요.</p></div>
  <section class="active-hero"><div class="hero-label"><span class="pulse"></span> 현재 주차 중 ${record.demo?'· 체험 기록':''}</div><div class="hero-place">${esc(titlePlace(record))}</div><div class="hero-main ${!(record.floor||record.section||record.spot)?'small':''}">${esc(position(record))}</div><div class="hero-summary">${record.entrance?esc(record.entrance):'출입구 정보가 있다면 추가할 수 있어요.'}</div><div class="hero-divider"></div><div class="hero-bottom"><div class="hero-stat">${icon('clock-3')} <span class="mono">${elapsed(record.createdAt)} 경과</span></div><div class="hero-confidence">${pending?'문자 인식 중…':isVerified?'내가 확인한 정보':ocr.status==='done'?'자동 추정 · 확인 필요':'사진 기록 완료'}</div></div></section>
  <div class="actions-area"><button class="button button-primary" data-action="find">${icon('navigation')} 내 차 찾기 ${icon('arrow-right',18)}</button><button class="button button-outline" data-action="edit">${icon('pencil',16)} 위치 수정</button><button class="button button-outline" data-action="share">${icon('share-2',16)} 위치 공유</button></div>
  ${ocr.status==='done'&&!isVerified&&[record.floor,record.section,record.spot].some(Boolean)?`<div class="warning-strip">${icon('alert-circle')} 사진에서 추정한 정보입니다. 실제 주차 표기를 확인해 주세요.<button data-action="verify" class="inline-link" style="border:0;background:none;white-space:nowrap;padding:0">확인 완료</button></div>`:''}
  <div class="section-head"><h2>내 주차 기록</h2><button class="link-action" data-action="edit">수정하기 ${icon('chevron-right',12)}</button></div>
  <div class="photo-card"><div class="photo-card-inner"><button class="photo-thumb" data-action="photo" data-id="${esc(record.id)}" ${record.photoBlob?'':'disabled'} aria-label="주차 사진 보기">${cover(record)}</button><div style="flex:1;min-width:0"><h3>주차 위치 사진</h3><p>${record.photoBlob?'촬영한 사진을 보관 중입니다.':'사진 없이 생성한 주차 기록입니다.'}</p>${record.photoBlob?`<button data-action="photo" data-id="${esc(record.id)}">원본 사진 보기 ${icon('arrow-right',12)}</button>`:`<button data-action="library" data-replace="true">사진 추가하기 ${icon('arrow-right',12)}</button>`}</div></div></div>
  <div class="section-head"><h2>돌아올 때 필요한 단서</h2></div>
  <div class="simple-card"><div class="info-row"><div class="info-icon">${icon('door-open')}</div><div style="flex:1"><b>출입구·엘리베이터</b><span>${record.entrance?esc(record.entrance):'아직 기록되지 않았어요.'}</span></div></div>
  <button class="list-button" data-action="entrance">${icon('image-plus')} ${record.entryBlob?'출입구 사진 다시 촬영':'출입구 사진 추가하기'} ${icon('chevron-right')}</button>
  ${record.entryBlob?`<button class="list-button" data-action="entrance-photo" data-id="${esc(record.id)}">${icon('image')} 출입구 사진 확인 ${icon('chevron-right')}</button>`:''}
  ${record.note?`<div class="info-row"><div class="info-icon">${icon('file-text')}</div><div><b>추가 메모</b><span>${esc(record.note)}</span></div></div>`:''}
  <div class="info-row"><div class="info-icon">${icon('calendar-clock')}</div><div><b>기록한 시각</b><span>${esc(formatWhen(record.createdAt))}</span></div></div>
  </div>
  ${ocr.status==='failed'||ocr.status==='none'?`<div class="warning-strip">${icon('info')} 사진 자동 인식에 ${ocr.status==='failed'?'연결되지 않았거나 오류가 발생했습니다.':'읽을 수 있는 층·구역 정보가 없었습니다.'} 사진은 안전하게 저장되어 있습니다. <button data-action="rescan" style="border:0;background:none;color:#86652a;text-decoration:underline;font-weight:800">재시도</button></div>`:''}
  <button class="quiet-button" data-action="new">${icon('plus',15)} 다른 곳에 새로 주차했어요</button>`;}

function findScreen(record){if(!record){state.page='home';return emptyHome();}return `
  <button class="back-button" data-action="back">${icon('arrow-left')} 현재 주차로 돌아가기</button><p class="eyebrow">FIND MY CAR</p><h1 class="screen-heading">차를 찾으러 가볼까요?</h1><p class="subcopy">저장된 주차 위치를 보면서 이동하세요.</p>
  <div class="place-card"><p class="eyebrow">주차 위치</p><h3>${esc(position(record))}</h3><p>${esc(titlePlace(record))}</p></div>
  <div class="kv-grid"><div class="kv"><small>주차한 층</small><b>${esc(record.floor||'미입력')}</b></div><div class="kv"><small>구역 · 번호</small><b>${esc([record.section,record.spot].filter(Boolean).join('-')||'미입력')}</b></div></div>
  <div class="section-head"><h2>기록 사진</h2><button class="link-action" data-action="edit">정보 수정 ${icon('chevron-right',12)}</button></div>
  ${record.photoBlob?`<button class="photo-button" data-action="photo" data-id="${esc(record.id)}"><img class="detail-photo" src="${makeUrl(record.photoBlob)}" alt="주차 위치 원본 사진. 탭하여 확대" /></button>`:`<div class="placeholder-photo">${icon('image')}</div>`}
  <div class="simple-card" style="margin-top:13px"><div class="info-row"><div class="info-icon">${icon('door-open')}</div><div><b>복귀할 출입구 · 엘리베이터</b><span>${esc(record.entrance||'기록 없음 · 아는 경우 추가해 주세요')}</span></div></div>${record.entryBlob?`<button class="photo-button" data-action="entrance-photo" data-id="${esc(record.id)}"><img class="detail-photo" src="${makeUrl(record.entryBlob)}" alt="출입구 사진. 탭하여 확대" /></button>`:''}${record.note?`<div class="info-row"><div class="info-icon">${icon('file-text')}</div><div><b>복귀 메모</b><span>${esc(record.note)}</span></div></div>`:''}</div>
  <div class="warning-strip">${icon('info')} 정확한 실내 길 안내는 제공하지 않습니다. 촬영한 위치와 출입구 단서를 확인하세요.</div>
  <div class="stack-gap" style="margin-top:18px"><button class="button button-primary button-full" data-action="complete">${icon('check-circle-2')} 차를 찾았어요 · 기록 완료</button><button class="button button-outline button-full" data-action="share">${icon('share-2')} 동승자에게 위치 공유</button></div>`;}

function historyScreen(){const past=state.sessions.filter(s=>!!s.completedAt);return `<div class="welcome" style="margin-top:13px"><p class="eyebrow">PARKING HISTORY</p><h1 class="screen-heading">지난 주차 기록</h1><p class="subcopy">사진과 위치 정보는 이 기기에만 남아 있어요.</p></div>${past.length?`<p class="eyebrow" style="margin-bottom:13px">완료한 기록 ${past.length}건</p>${past.map(record=>`<button class="history-item" data-action="detail" data-id="${esc(record.id)}"><div class="history-thumb">${cover(record)}</div><div class="history-copy"><strong>${esc(record.place||position(record))}</strong><span>${esc(record.place?position(record):'주차 위치 기록')}</span><small>${esc(formatWhen(record.createdAt,true))} · ${elapsed(record.createdAt,record.completedAt)}</small></div><div class="chevron">${icon('chevron-right')}</div></button>`).join('')}`:`<div class="empty-history"><div class="empty-symbol">${icon('clock-3',30)}</div><h2>아직 지난 기록이 없어요</h2><p>차를 찾았다고 완료하면<br>이곳에서 과거 기록을 다시 볼 수 있어요.</p></div>`}`;}

function detailScreen(record){if(!record)return historyScreen();return `<button class="back-button" data-action="history">${icon('arrow-left')} 지난 기록</button><p class="eyebrow">PARKING HISTORY DETAIL</p><h1 class="screen-heading">${esc(record.place||'지난 주차 기록')}</h1><div class="detail-meta"><span class="tag green">${record.completedAt?'복귀 완료':'현재 주차 중'}</span><span class="tag">${esc(formatWhen(record.createdAt,true))}</span></div><div class="place-card"><p class="eyebrow">당시 기록한 주차 위치</p><h3>${esc(position(record))}</h3><p>${record.entrance?`출입구: ${esc(record.entrance)}`:'출입구 정보 없음'}</p>${record.note?`<p>메모: ${esc(record.note)}</p>`:''}</div>${record.photoBlob?`<button class="photo-button" data-action="photo" data-id="${esc(record.id)}"><img class="detail-photo" alt="저장된 주차 위치 사진" src="${makeUrl(record.photoBlob)}" /></button>`:`<div class="placeholder-photo">${icon('image')}</div>`}${record.entryBlob?`<div class="section-head"><h2>출입구 사진</h2></div><button class="photo-button" data-action="entrance-photo" data-id="${esc(record.id)}"><img class="detail-photo" alt="출입구 사진" src="${makeUrl(record.entryBlob)}" /></button>`:''}<div class="section-head"><h2>기록 관리</h2></div><div class="simple-card"><button class="list-button" data-action="share" data-id="${esc(record.id)}">${icon('share-2')} 위치 정보 공유 ${icon('chevron-right')}</button>${record.completedAt?`<button class="list-button" data-action="reactivate" data-id="${esc(record.id)}">${icon('rotate-ccw')} 현재 주차로 다시 전환 ${icon('chevron-right')}</button>`:''}<button class="list-button" data-action="delete" data-id="${esc(record.id)}" style="color:#b44545">${icon('trash-2')} 이 기록 삭제 ${icon('chevron-right')}</button></div>`;}

function settingsScreen(){return `<div class="welcome" style="margin-top:13px"><p class="eyebrow">PREFERENCES</p><h1 class="screen-heading">설정과 개인정보</h1><p class="subcopy">꼭 필요한 기능만 켜고, 기록은 직접 관리하세요.</p></div>
<div class="settings-card"><div class="settings-row"><div><h3>사진 문자 자동 인식</h3><p>사진 촬영 후 층수·구역 분석을 시도합니다.<br>실패해도 사진 기록은 유지돼요.</p></div><button type="button" id="ocrToggle" class="toggle" role="switch" aria-label="사진 문자 자동 인식" aria-checked="${state.scanEnabled}"></button></div></div>
<div class="settings-card"><h3>${icon('lock-keyhole',16)} 저장 및 개인정보</h3><p>사진과 기록은 이 기기의 브라우저 저장소(IndexedDB)에 보관됩니다. 자체 서버로 보내지 않습니다. 자동 인식을 켜면 외부 CDN에서 OCR 실행 파일과 인식 모델을 받아옵니다. 브라우저의 데이터 삭제 시 기록도 사라질 수 있습니다.</p><div class="warning-strip">${icon('alert-circle')} 브라우저 개인 정보 보호 모드에서는 기록 저장이 제한될 수 있습니다. 중요한 사진은 별도로 보관하세요.</div><button class="danger-button" data-action="clear">${icon('trash-2',15)} 이 기기의 모든 주차 기록 삭제</button></div>
<div class="settings-card"><h3>${icon('phone',16)} 휴대폰에서 빠르게 실행</h3><p>Safari에서는 공유 메뉴 → 홈 화면에 추가, Android Chrome에서는 메뉴 → 홈 화면에 추가 또는 앱 설치를 이용해 보세요. 설치 가능한 환경에서 아이콘이 만들어집니다.</p><p style="margin-top:9px">잠금화면 카메라 및 차량 하차 자동 감지는 이 웹 MVP에서 제공하지 않습니다. 별도의 모바일 앱 개발 단계에서 검증합니다.</p></div>
<div class="settings-card"><h3>${icon('info',16)} 프로토타입 범위</h3><p>주차장 내 실내 위치 추적, 실제 차량 위치 감지, 자동 주차요금 계산, 공식 입차 시각 증명은 제공하지 않습니다. 사진 촬영 시각은 기기의 현재 시각을 사용합니다.</p></div><p class="footer-note">차여기 · 사용성 검증용 웹 MVP v1.0</p>`;}

function render(){revokeUrls();const active=activeRecord();let content='';if(state.page==='home')content=active?activeHome(active):emptyHome();else if(state.page==='find')content=findScreen(active);else if(state.page==='history')content=historyScreen();else if(state.page==='detail')content=detailScreen(getRecord(state.selectedId));else if(state.page==='settings')content=settingsScreen();main.innerHTML=content;document.querySelectorAll('.nav-item').forEach(el=>{const selected=el.dataset.nav===(state.page==='find'?'home':state.page==='detail'?'history':state.page);el.classList.toggle('active',selected);el.setAttribute('aria-current',selected?'page':'false');});injectIcons();}
function navigate(page){state.page=page;state.selectedId=null;render();window.scrollTo({top:0,behavior:'instant'});}

function confirmExisting(){return !activeRecord()||window.confirm('현재 주차 기록이 있습니다. 이전 기록을 완료 처리하고 새로 기록할까요?');}
async function closeExisting(){const existing=activeRecord();if(existing){existing.completedAt=Date.now();await txPromise('put',existing);}}
async function createSession(photoBlob,options={}){
  const proceed=confirmExisting();if(!proceed)return null;
  try{await closeExisting();const record={id:uid(),createdAt:Date.now(),updatedAt:Date.now(),photoBlob:photoBlob||null,entryBlob:null,place:'',floor:'',section:'',spot:'',entrance:'',note:'',verifiedAt:null,completedAt:null,demo:!!options.demo,ocr:{status:photoBlob&&state.scanEnabled?'waiting':'disabled',raw:'',confidence:null}};
    if(options.demo){Object.assign(record,{place:'샘플 주차장',floor:'B3',section:'C',spot:'27',entrance:'5번 엘리베이터',note:'기둥 옆 파란색 표지판',verifiedAt:Date.now()});}
    await txPromise('put',record);state.page='home';await refresh();window.scrollTo({top:0,behavior:'instant'});showToast(photoBlob?'사진을 저장했어요. 차를 찾을 때 확인하세요.':options.demo?'체험 기록을 만들었어요.':'새 주차 기록을 만들었어요.');if(photoBlob&&state.scanEnabled)runOCR(record.id);return record;
  }catch(error){console.error(error);showToast('저장하지 못했습니다. 기기 저장 공간을 확인해 주세요.');return null;}}

function openEditor(id){const record=id?getRecord(id):null;state.editingId=record?.id||null;$('#editTitle').textContent=record?'주차 위치를 수정하세요':'주차 위치를 기록하세요';$('#editPlace').value=record?.place||'';$('#editFloor').value=record?.floor||'';$('#editSection').value=record?.section||'';$('#editSpot').value=record?.spot||'';$('#editEntrance').value=record?.entrance||'';$('#editNote').value=record?.note||'';$('#editDialog').showModal();}
async function saveEditor(event){event.preventDefault();const existing=state.editingId?getRecord(state.editingId):null;if(!existing&&!confirmExisting())return;
  const record=existing?{...existing}:{id:uid(),createdAt:Date.now(),photoBlob:null,entryBlob:null,completedAt:null,demo:false,ocr:{status:'disabled'}};
  Object.assign(record,{place:$('#editPlace').value.trim(),floor:$('#editFloor').value.trim().toUpperCase(),section:$('#editSection').value.trim().toUpperCase(),spot:$('#editSpot').value.trim().toUpperCase(),entrance:$('#editEntrance').value.trim(),note:$('#editNote').value.trim(),verifiedAt:Date.now()});
  try{if(!existing)await closeExisting();await txPromise('put',record);$('#editDialog').close();state.page='home';await refresh();showToast('주차 정보가 저장됐어요.');}catch(error){console.error(error);showToast('저장하지 못했습니다. 다시 시도해 주세요.');}}

async function handlePhoto(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!file.type.startsWith('image/')){showToast('사진 파일만 기록할 수 있어요.');return;}if(file.size>35*1024*1024){showToast('사진 크기는 35MB 이하여야 해요.');return;}
  if(event.target.id==='entranceInput'){const active=activeRecord();if(!active){showToast('먼저 주차 위치를 기록해 주세요.');return;}active.entryBlob=file;try{await save(active);showToast('출입구 사진이 추가됐어요.');}catch(error){showToast('출입구 사진 저장에 실패했어요.');}return;}
  const active=activeRecord();if(event.target.id==='libraryInput'&&event.target.dataset.replace==='true'&&active&&!active.photoBlob){active.photoBlob=file;active.ocr={status:state.scanEnabled?'waiting':'disabled'};try{await save(active);showToast('주차 사진을 추가했어요.');if(state.scanEnabled)runOCR(active.id);}catch(error){showToast('사진 저장에 실패했어요.');}event.target.dataset.replace='false';return;}
  await createSession(file);
}

function parseOCR(raw){const flat=raw.replace(/[\u00ad]/g,'').toUpperCase().replace(/\bO(?=\d)/g,'0');let floor='',section='',spot='';
  let match=flat.match(/(?:^|[\s:([\]])(B|P)\s*[- ]?\s*(\d{1,2})(?!\d)/);if(match)floor=match[1]+match[2];
  if(!floor){match=flat.match(/지하\s*(\d{1,2})\s*층/);if(match)floor='B'+match[1];}
  if(!floor){match=flat.match(/(?:^|\s)(\d{1,2})\s*층/);if(match)floor=match[1]+'F';}
  // Prefer distinct section + number tokens, excluding the one identified as floor.
  const codeTokens=[...flat.matchAll(/\b([A-Z])\s*[- ]?\s*(\d{1,3})\b/g)];for(const t of codeTokens){const code=t[1]+t[2];if(code===floor)continue;if(['F','P','B'].includes(t[1])&&!floor)continue;section=t[1];spot=t[2];break;}
  if(!section){match=flat.match(/\b([A-Z])\s*(?:ZONE|AREA|SECTION)\b/);if(match)section=match[1];}
  return {floor,section,spot};
}
function loadOcrLibrary(){return new Promise((resolve,reject)=>{if(window.Tesseract)return resolve(window.Tesseract);if(libraryLoading)return reject(new Error('이미 인식 엔진을 불러오고 있습니다.'));libraryLoading=true;const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';script.async=true;const timeout=setTimeout(()=>{script.onload=null;script.onerror=null;libraryLoading=false;reject(new Error('인식 엔진 연결 시간 초과'));},16000);script.onload=()=>{clearTimeout(timeout);libraryLoading=false;window.Tesseract?resolve(window.Tesseract):reject(new Error('인식 엔진을 실행할 수 없습니다.'));};script.onerror=()=>{clearTimeout(timeout);libraryLoading=false;reject(new Error('인식 엔진을 불러오지 못했습니다.'));};document.head.appendChild(script);});}
async function runOCR(id){if(ocrRunning)return;const record=getRecord(id);if(!record?.photoBlob)return;ocrRunning=true;let worker=null;
  try{record.ocr={...(record.ocr||{}),status:'running'};await save(record);const library=await loadOcrLibrary();worker=await library.createWorker('eng');const result=await worker.recognize(record.photoBlob);const raw=(result.data?.text||'').slice(0,4000);const picked=parseOCR(raw);const current=getRecord(id);if(!current||current.completedAt)return;for(const field of ['floor','section','spot'])if(!current[field]&&picked[field])current[field]=picked[field];current.ocr={status:([picked.floor,picked.section,picked.spot].some(Boolean)?'done':'none'),raw,confidence:Math.round(result.data?.confidence||0),suggested:picked};await save(current);if(current.ocr.status==='done')showToast('사진 속 주차 표기를 읽었어요. 결과를 확인해 주세요.');}
  catch(error){console.warn('OCR unavailable:',error);const current=getRecord(id);if(current){current.ocr={...(current.ocr||{}),status:'failed'};try{await save(current);}catch{}}}
  finally{if(worker)try{await worker.terminate();}catch{}ocrRunning=false;}}

function openPhoto(record,field){const blob=record?.[field];if(!blob){showToast('저장된 사진이 없습니다.');return;}if(modalUrl)URL.revokeObjectURL(modalUrl);modalUrl=URL.createObjectURL(blob);$('#photoPreview').src=modalUrl;$('#photoTitle').textContent=field==='entryBlob'?'출입구 사진':'주차 위치 사진';$('#photoDialog').showModal();}
function closePhoto(){if($('#photoDialog').open)$('#photoDialog').close();if(modalUrl){URL.revokeObjectURL(modalUrl);modalUrl=null;}$('#photoPreview').removeAttribute('src');}
async function shareRecord(record){if(!record)return;const txt=`🚙 주차 위치 기록\n${record.place||'주차 장소 미입력'}\n${position(record)}\n${record.entrance?'출입구: '+record.entrance+'\n':''}기록 시각: ${formatWhen(record.createdAt,true)}\n(차여기에서 저장한 정보)`;try{if(navigator.share){await navigator.share({title:'내 주차 위치',text:txt});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(txt);showToast('주차 위치를 복사했어요.');return;}window.prompt('아래 내용을 복사해 공유하세요.',txt);}catch(err){if(err.name!=='AbortError')showToast('공유하지 못했습니다.');}}
async function complete(){const active=activeRecord();if(!active)return;if(!window.confirm('차를 찾으셨나요? 현재 주차 기록을 완료합니다.'))return;active.completedAt=Date.now();await save(active);navigate('history');showToast('주차 기록을 완료했어요.');}
async function restore(id){const record=getRecord(id);if(!record)return;if(!confirmExisting())return;await closeExisting();record.completedAt=null;await save(record);navigate('home');showToast('현재 주차 기록으로 복구했어요.');}
async function removeRecord(id){const record=getRecord(id);if(!record)return;if(!window.confirm('선택한 주차 기록과 사진을 이 기기에서 삭제할까요? 이 작업은 되돌릴 수 없습니다.'))return;await txPromise('delete',id);state.page='history';await refresh();showToast('기록을 삭제했어요.');}

main.addEventListener('click',async event=>{const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;const id=button.dataset.id;try{switch(action){
  case 'camera':$('#cameraInput').click();break;
  case 'library':$('#libraryInput').dataset.replace=button.dataset.replace||'false';$('#libraryInput').click();break;
  case 'manual':openEditor(null);break;
  case 'demo':await createSession(null,{demo:true});break;
  case 'edit':openEditor(activeRecord()?.id);break;
  case 'find':state.page='find';render();window.scrollTo(0,0);break;
  case 'back':navigate('home');break;
  case 'history':navigate('history');break;
  case 'detail':state.selectedId=id;state.page='detail';render();window.scrollTo(0,0);break;
  case 'photo':openPhoto(getRecord(id),'photoBlob');break;
  case 'entrance-photo':openPhoto(getRecord(id),'entryBlob');break;
  case 'entrance':$('#entranceInput').click();break;
  case 'share':await shareRecord(getRecord(id)||activeRecord());break;
  case 'verify':{const record=activeRecord();if(record){record.verifiedAt=Date.now();await save(record);showToast('확인한 위치로 저장했어요.');}}break;
  case 'rescan':{const active=activeRecord();if(active){if(ocrRunning){showToast('사진을 분석하고 있어요.');break;}runOCR(active.id);}}break;
  case 'complete':await complete();break;
  case 'new':$('#cameraInput').click();break;
  case 'reactivate':await restore(id);break;
  case 'delete':await removeRecord(id);break;
  case 'clear':if(window.confirm('이 기기의 모든 주차 기록과 사진을 삭제할까요? 복구할 수 없습니다.')){await txPromise('clear');navigate('home');await refresh();showToast('모든 기록을 삭제했어요.');}break;
}}catch(err){console.error(err);showToast('처리 중 문제가 발생했습니다. 다시 시도해 주세요.');}});

document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.nav)));
$('#editForm').addEventListener('submit',saveEditor);
$('#closeDialog').addEventListener('click',()=>$('#editDialog').close());
$('#closePhoto').addEventListener('click',closePhoto);
$('#photoDialog').addEventListener('close',()=>{if(modalUrl){URL.revokeObjectURL(modalUrl);modalUrl=null;}});
$('#editDialog').addEventListener('click',e=>{if(e.target===$('#editDialog'))$('#editDialog').close();});
for(const name of ['cameraInput','libraryInput','entranceInput'])$('#'+name).addEventListener('change',handlePhoto);
main.addEventListener('click',e=>{if(e.target.closest('#ocrToggle')){state.scanEnabled=!state.scanEnabled;try{localStorage.setItem('chayeogi-scan',state.scanEnabled?'on':'off');}catch{}render();showToast(state.scanEnabled?'새 사진부터 자동 인식을 시도합니다.':'사진 자동 인식을 껐어요.');}});

async function boot(){injectIcons();try{state.scanEnabled=localStorage.getItem('chayeogi-scan')!=='off';}catch{}try{state.db=await openDB();state.sessions=await loadSessions();render();}catch(error){console.error(error);main.innerHTML=`<div class="empty-history"><div class="empty-symbol">${icon('alert-circle',32)}</div><h2>기록 저장소를 열지 못했어요</h2><p>Safari 또는 Chrome 일반 모드에서<br>다시 열어 주세요.<br><small>${esc(error.message)}</small></p></div>`;}
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  setInterval(()=>{if((state.page==='home'||state.page==='find')&&activeRecord()&&!$('#editDialog').open&&!$('#photoDialog').open)render();},60000);
}
boot();
