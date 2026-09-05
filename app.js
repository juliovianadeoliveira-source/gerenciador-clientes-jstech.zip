const SUPABASE_URL='https://yifgptxujimzsjoeghte.supabase.co';
const SUPABASE_KEY='sb_publishable_TGA26mIiNQ686GJrvQI3aw_PmfP8V1-';
const SESSION_KEY='jstech_supabase_session';
let session=null,clients=[],activeFilter='todos',messageClientId=null,androidApps=[];
const DEVICE_MARKER='__JSTECH_DEVICES__';
const DIRECT_RESELLER='Cliente direto';
const ANDROID_APPS_DEFAULT=["Magic Player","Brasil IPTV","Box Player","Vizzion Play","Powerplay","Epicplay","Assist+","Playsim","Mult Apps","JJ Player","Duo TV","Mult Box","Sync21 Player","UP Play","Max21","XCIPTV Player","Smarters Play","Duna XTP","Touro Box MOD","Touro Box T7 V5","WP Entretenimento","XPlus 7.0","YouCine MOD","Touro Box V2","Uni Revenda","GPC Pro","Blessed Player","Fun Play","Lazer Play","Power Play","Super Play","XCloud TV"];
const $=id=>document.getElementById(id);
const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);
const dateBR=date=>date?new Intl.DateTimeFormat('pt-BR').format(parseDate(date)):'—';
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const isoToday=()=>formatISO(today());
function parseDate(value){if(!value)return today();const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d)}
function formatISO(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function diffDays(date){if(!date)return 999999;return Math.round((parseDate(date)-today())/86400000)}
function planLabel(plan,lifetime=false){return lifetime?'Vitalício':({'30d':'30 dias','3m':'3 meses','6m':'6 meses','1y':'1 ano'})[plan]||plan}
function addMonths(date,months){const day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+months);const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();date.setDate(Math.min(day,last))}
function calculateDue(start,plan){const d=parseDate(start);if(plan==='30d')d.setDate(d.getDate()+30);if(plan==='3m')addMonths(d,3);if(plan==='6m')addMonths(d,6);if(plan==='1y')addMonths(d,12);return formatISO(d)}
function statusOf(c){if(c.cancelled)return{key:'cancelados',label:'Cancelado',color:'gray'};if(c.lifetime)return{key:'ativos',label:'Vitalício',color:'green'};const days=diffDays(c.dueDate);if(days<0)return{key:'vencidos',label:'Vencido',color:'red'};if(days===0)return{key:'hoje',label:'Vence hoje',color:'amber'};if(days<=5)return{key:'proximos',label:`Vence em ${days} dia${days>1?'s':''}`,color:'amber'};return{key:'ativos',label:'Ativo',color:'green'}}
function escapeHTML(text=''){return String(text).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function parseStoredNotes(value,row){
  try{
    if(typeof value==='string'&&value.indexOf(DEVICE_MARKER)===0){
      const parsed=JSON.parse(value.slice(DEVICE_MARKER.length));
      return {notes:parsed.notes||'',devices:Array.isArray(parsed.devices)?parsed.devices:[],resellerName:parsed.resellerName||'',resellerPhone:parsed.resellerPhone||'',cost:Number(parsed.cost)||0};
    }
  }catch{}
  return {notes:value||'',devices:[{device:'TV 1',appName:row.app_name||'',mac:'',key:'',screens:Number(row.screens)||1}],resellerName:'',resellerPhone:'',cost:0};
}
function toClient(row){const stored=parseStoredNotes(row.notes,row);return{id:row.id,name:row.name,phone:row.phone,appName:row.app_name,startDate:row.start_date,plan:row.plan,value:Number(row.amount),payment:row.payment_method,notes:stored.notes,resellerName:stored.resellerName||'',resellerPhone:stored.resellerPhone||'',cost:Number(stored.cost)||0,devices:stored.devices.length?stored.devices:[{device:'TV 1',appName:row.app_name||'',mac:'',key:'',screens:Number(row.screens)||1}],dueDate:row.due_date,cancelled:row.cancelled,lifetime:!!row.lifetime,screens:Number(row.screens)||1,createdAt:row.created_at}}
function fromClient(data){return{name:data.name,phone:data.phone,app_name:(data.devices&&data.devices[0]?data.devices[0].appName:data.appName)||'',start_date:data.startDate,plan:data.plan,amount:data.value,payment_method:data.payment,notes:DEVICE_MARKER+JSON.stringify({notes:data.notes||'',devices:data.devices||[],resellerName:data.resellerName||'',resellerPhone:data.resellerPhone||'',cost:Number(data.cost)||0}),due_date:data.dueDate,cancelled:!!data.cancelled,lifetime:!!data.lifetime,screens:Number(data.screens)||1}}
function authHeaders(extra={}){return{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${session?.access_token||SUPABASE_KEY}`,'Content-Type':'application/json',...extra}}
async function api(path,options={}){const res=await fetch(`${SUPABASE_URL}${path}`,{...options,headers:authHeaders(options.headers||{})});const text=await res.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!res.ok)throw new Error(data.msg||data.message||data.error_description||'Não foi possível concluir.');return data}
function storeSession(data){session=data;localStorage.setItem(SESSION_KEY,JSON.stringify(data))}
function clearSession(){session=null;localStorage.removeItem(SESSION_KEY)}
async function restoreSession(){try{const saved=JSON.parse(localStorage.getItem(SESSION_KEY));if(!saved?.refresh_token)return false;if(saved.expires_at&&saved.expires_at*1000>Date.now()+60000){session=saved;return true}const fresh=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:saved.refresh_token})});fresh.expires_at=Math.floor(Date.now()/1000)+fresh.expires_in;storeSession(fresh);return true}catch{clearSession();return false}}
async function loadClients(){const rows=await api('/rest/v1/clients?select=*&order=due_date.asc');clients=rows.map(toClient);render()}
async function enterApp(){$('loginScreen').hidden=true;$('appShell').hidden=false;$('connectedEmail').textContent=`Conectado: ${session.user?.email||'conta protegida'}`;try{await loadClients()}catch(e){clearSession();showLogin();$('loginError').textContent=e.message}}
function showLogin(){$('loginScreen').hidden=false;$('appShell').hidden=true}
function setBusy(busy){document.body.classList.toggle('loading',busy)}
function showToast(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function render(){renderSummary();renderResellerDatalist();let list=clients.filter(matchesFilter).filter(c=>`${c.name} ${c.phone} ${c.appName}`.toLowerCase().includes($('searchInput').value.toLowerCase().trim()));const sort=$('sortSelect').value;list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'pt-BR'):sort==='recent'?b.createdAt.localeCompare(a.createdAt):((a.dueDate||'9999-12-31').localeCompare(b.dueDate||'9999-12-31')));$('clientRows').innerHTML=list.map(clientRow).join('');$('emptyState').hidden=list.length!==0;document.querySelector('table').hidden=list.length===0;const titles={todos:'Todos os clientes',hoje:'Vencem hoje',amanha:'Vencem amanhã',proximos:'Próximos 5 dias',vencidos:'Clientes vencidos',ativos:'Clientes ativos',cancelados:'Clientes cancelados'};$('listTitle').textContent=titles[activeFilter];$('listSubtitle').textContent=`${list.length} cliente${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}.`}
function matchesFilter(c){const s=statusOf(c),days=diffDays(c.dueDate);if(activeFilter==='todos')return true;if(activeFilter==='amanha')return !c.cancelled&&!c.lifetime&&days===1;if(activeFilter==='proximos')return !c.cancelled&&!c.lifetime&&days>=1&&days<=5;return s.key===activeFilter}
function renderSummary(){const valid=clients.filter(c=>!c.cancelled),now=today(),todayList=valid.filter(c=>!c.lifetime&&diffDays(c.dueDate)===0),soon=valid.filter(c=>!c.lifetime&&diffDays(c.dueDate)>=1&&diffDays(c.dueDate)<=5),overdue=valid.filter(c=>!c.lifetime&&diffDays(c.dueDate)<0),active=valid.filter(c=>c.lifetime||diffDays(c.dueDate)>=0),monthSales=clients.filter(c=>{const d=parseDate(c.startDate);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()});$('countToday').textContent=todayList.length;$('valueToday').textContent=sum(todayList);$('countSoon').textContent=soon.length;$('valueSoon').textContent=sum(soon);$('countOverdue').textContent=overdue.length;$('valueOverdue').textContent=sum(overdue);$('countActive').textContent=active.length;$('monthRevenue').textContent=`${sum(monthSales)} no mês`}
function sum(list){return money(list.reduce((total,c)=>total+Number(c.value),0))}
function renderResellerDatalist(){const names=[...new Set(clients.map(c=>c.resellerName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));const list=$('resellerNames');if(list)list.innerHTML=names.map(n=>'<option value="'+escapeHTML(n)+'"></option>').join('')}
function clientProfit(c){return Number(c.value||0)-Number(c.cost||0)}
function resellerStatusClients(group){return group.filter(c=>!c.cancelled&&!c.lifetime&&diffDays(c.dueDate)<=5)}
function resellerMessage(name,group){const pending=resellerStatusClients(group);let text='Olá, '+name+'! Segue o resumo dos seus clientes na JS Tech.\n\n';if(!pending.length)text+='Nenhum cliente vence nos próximos 5 dias.\n';else pending.forEach(c=>{text+='Cliente: '+c.name+'\nAplicativos: '+((c.devices||[]).map(d=>(d.device||'Dispositivo')+' - '+(d.appName||'Sem aplicativo')+' ('+(d.screens||1)+' tela'+(Number(d.screens)>1?'s':'')+')').join(', ')||c.appName)+'\nCadastro: '+dateBR(c.startDate)+'\nVencimento: '+dateBR(c.dueDate)+'\nSituação: '+statusOf(c).label+'\n\n'});return text+'JS Tech — conectado com você.'}
function renderResellers(){
  const tree=$('resellersTree');if(!tree)return;
  const q=($('resellerSearch')?.value||'').toLowerCase().trim();
  const grouped={};clients.forEach(c=>{const name=(c.resellerName||DIRECT_RESELLER).trim();(grouped[name]||(grouped[name]=[])).push(c)});
  const entries=Object.entries(grouped).filter(([name,group])=>!q||name.toLowerCase().includes(q)||group.some(c=>c.name.toLowerCase().includes(q)));
  const all=clients.filter(c=>!c.cancelled),revenue=all.reduce((t,c)=>t+Number(c.value||0),0),cost=all.reduce((t,c)=>t+Number(c.cost||0),0);
  $('generalRevenue').textContent=money(revenue);$('generalCost').textContent=money(cost);$('generalProfit').textContent=money(revenue-cost);$('generalResellers').textContent=Object.keys(grouped).filter(n=>n!==DIRECT_RESELLER).length;
  $('resellersEmpty').hidden=entries.length>0;
  tree.innerHTML=entries.sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([name,group])=>{
    const valid=group.filter(c=>!c.cancelled),rev=valid.reduce((t,c)=>t+Number(c.value||0),0),ct=valid.reduce((t,c)=>t+Number(c.cost||0),0),profit=rev-ct,phone=group.find(c=>c.resellerPhone)?.resellerPhone||'',encoded=encodeURIComponent(resellerMessage(name,group));
    const rows=group.map(c=>{const p=clientProfit(c),apps=(c.devices||[]).map(d=>escapeHTML(d.device||'Dispositivo')+': '+escapeHTML(d.appName||'Sem app')+' · '+(d.screens||1)+' tela'+(Number(d.screens)>1?'s':'')).join('<br>')||escapeHTML(c.appName);return '<div class="reseller-client"><div><strong>'+escapeHTML(c.name)+'</strong><small>'+escapeHTML(c.phone)+'</small></div><div>'+apps+'<small>'+dateBR(c.startDate)+' → '+(c.lifetime?'Vitalício':dateBR(c.dueDate))+'</small></div><div><small>Venda</small>'+money(c.value)+'</div><div><small>Custo</small>'+money(c.cost)+'</div><div class="profit-value '+(p<0?'loss':'')+'"><small>Lucro</small>'+money(p)+'</div><span class="badge '+statusOf(c).color+'">'+statusOf(c).label+'</span></div>'}).join('');
    const action=name===DIRECT_RESELLER?'':phone?'<a class="action-btn reseller-whatsapp" target="_blank" rel="noopener" href="https://wa.me/'+whatsappNumber(phone)+'?text='+encoded+'">Avisar no WhatsApp</a>':'<span class="badge gray">Sem WhatsApp</span>';
    return '<section class="reseller-card"><div class="reseller-head"><div><h3>'+escapeHTML(name)+'</h3><p>'+group.length+' cliente'+(group.length===1?'':'s')+(phone?' · '+escapeHTML(phone):'')+'</p></div><div class="reseller-totals"><div><span>Faturamento</span><strong>'+money(rev)+'</strong></div><div><span>Custo</span><strong>'+money(ct)+'</strong></div><div><span>Lucro</span><strong class="'+(profit>=0?'positive':'loss')+'">'+money(profit)+'</strong></div>'+action+'</div></div><div class="reseller-clients">'+rows+'</div></section>'
  }).join('');
}
function deviceSummary(c){return(c.devices||[]).map(function(d){return(d.device||'Dispositivo')+': '+(d.appName||'Sem aplicativo')+(d.mac?' · '+d.mac:'')}).join(' | ')}
function newDevice(name){return{device:name||'TV 1',appName:'',mac:'',key:'',screens:1}}
function renderDevices(devices){
  const list=$('devicesList');if(!list)return;
  const rows=devices&&devices.length?devices:[newDevice('TV 1')];
  list.innerHTML=rows.map(function(d,i){return '<div class="device-entry">'+
    '<label>Dispositivo<input data-device="device" value="'+escapeHTML(d.device||('TV '+(i+1)))+'" placeholder="TV 1"></label>'+
    '<label>Aplicativo<input data-device="appName" list="apps" value="'+escapeHTML(d.appName||'')+'" placeholder="XCloud TV"></label>'+
    '<label>MAC<input data-device="mac" value="'+escapeHTML(d.mac||'')+'" placeholder="AA:BB:CC:11:22:33"></label>'+
    '<label>Key<input data-device="key" value="'+escapeHTML(d.key||'')+'" placeholder="123456789"></label>'+
    '<label>Telas<select data-device="screens"><option value="1" '+(Number(d.screens||1)===1?'selected':'')+'>1</option><option value="2" '+(Number(d.screens)===2?'selected':'')+'>2</option><option value="3" '+(Number(d.screens)===3?'selected':'')+'>3</option><option value="4" '+(Number(d.screens)===4?'selected':'')+'>4</option><option value="5" '+(Number(d.screens)===5?'selected':'')+'>5</option></select></label>'+
    '<button type="button" class="remove-device" title="Remover dispositivo">×</button></div>';}).join('');
  list.querySelectorAll('.remove-device').forEach(function(btn){btn.addEventListener('click',function(){if(list.children.length>1)btn.parentElement.remove()})});
}
function getDevices(){return Array.from(document.querySelectorAll('.device-entry')).map(function(row){function get(k){const el=row.querySelector('[data-device="'+k+'"]');return el?el.value.trim():''}return{device:get('device'),appName:get('appName'),mac:get('mac'),key:get('key'),screens:Number((row.querySelector('[data-device="screens"]')||{}).value)||1}}).filter(function(d){return d.appName||d.mac||d.key})}
function renderAndroidApps(){
  const grid=$('androidAppsGrid');
  if(!grid)return;
  grid.innerHTML=androidApps.map(name=>`<article class="android-app-card"><strong>${escapeHTML(name)}</strong><span>Aplicativo Android</span></article>`).join('');
  const list=$('apps');
  if(list)list.innerHTML=androidApps.map(name=>`<option>${escapeHTML(name)}</option>`).join('');
}
async function loadAndroidApps(){
  try{
    const rows=await api('/rest/v1/android_apps?select=name&active=eq.true&order=name.asc');
    androidApps=rows.map(row=>row.name).filter(Boolean);
    if(!androidApps.length)throw new Error('empty');
  }catch{
    androidApps=[...ANDROID_APPS_DEFAULT];
  }
  renderAndroidApps();
}
function setPanelView(view){
  const apps=view==='apps',resellers=view==='resellers',special=apps||resellers;
  document.querySelector('.topbar').hidden=special;
  document.querySelector('.summary-grid').hidden=special;
  document.querySelector('.panel:not(#androidAppsSection):not(#resellersSection)').hidden=special;
  $('androidAppsSection').hidden=!apps;
  $('resellersSection').hidden=!resellers;
  if(apps)loadAndroidApps();
  if(resellers)renderResellers();
}
function clientRow(c){const s=statusOf(c);let dueText='—',hint='';if(c.lifetime){dueText='Vitalício';hint='Sem vencimento'}else{const days=diffDays(c.dueDate);dueText=dateBR(c.dueDate);hint=days<0?`${Math.abs(days)} dia${Math.abs(days)>1?'s':''} atrasado`:days===0?'É hoje':days===1?'Amanhã':`Faltam ${days} dias`};if(c.cancelled)hint='Sem renovação';const screens=c.screens>1?` · ${c.screens} telas`:'';return `<tr><td class="client-name"><strong>${escapeHTML(c.name)}</strong><span>${escapeHTML(c.phone)}</span></td><td>${escapeHTML((c.devices||[]).map(function(d){return d.appName}).filter(Boolean).join(', ')||c.appName)}</td><td>${planLabel(c.plan,c.lifetime)}${c.lifetime||c.screens>1?`<span class="app-meta">${c.lifetime?'Vitalício':''}${c.lifetime&&c.screens>1?' · ':''}${c.screens>1?c.screens+' telas':''}</span>`:''}</td><td class="date-cell"><strong>${dueText}</strong><span>${hint}</span></td><td><strong>${money(c.value)}</strong></td><td><span class="badge ${s.color}">${s.label}</span></td><td><div class="actions">${c.lifetime?'':`<button class="action-btn renew" onclick="renewClient('${c.id}')">Renovar</button>`}<button class="action-btn" onclick="sendCharge('${c.id}')">WhatsApp</button><details class="more"><summary class="action-btn">•••</summary><div class="more-menu"><button onclick="editClient('${c.id}')">Editar</button><button onclick="showHistory('${c.id}')">Histórico</button><button onclick="toggleCancel('${c.id}')">${c.cancelled?'Reativar':'Cancelar'}</button><button class="danger" onclick="deleteClient('${c.id}')">Excluir</button></div></details></div></td></tr>`}
function openForm(client=null){renderDevices(client&&client.devices);$('clientForm').reset();$('clientId').value=client?.id||'';$('formTitle').textContent=client?'Editar cliente':'Novo cliente';$('startDate').value=client?.startDate||isoToday();$('plan').value=client?.plan||'30d';$('screens').value=String(client?.screens||1);$('lifetime').checked=!!client?.lifetime;toggleLifetimeFields();if(client){$('name').value=client.name;$('phone').value=client.phone;renderDevices(client.devices);$('value').value=client.value;$('cost').value=client.cost||0;$('resellerName').value=client.resellerName||'';$('resellerPhone').value=client.resellerPhone||'';$('payment').value=client.payment;$('notes').value=client.notes||''}else{$('cost').value=0}updatePreview();$('clientDialog').showModal()}
function toggleLifetimeFields(){const lifetime=$('lifetime').checked;$('plan').disabled=lifetime;$('datePreview').textContent=lifetime?'Vitalício — sem vencimento':($('startDate').value?dateBR(calculateDue($('startDate').value,$('plan').value)):'—')}
function updatePreview(){toggleLifetimeFields()}
function editClient(id){openForm(clients.find(c=>c.id===id))}
async function addHistory(c,type,oldDue,newDue,description,amount=0){await api('/rest/v1/renewals',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({client_id:c.id,event_type:type,plan:c.plan,amount,previous_due_date:oldDue,new_due_date:newDue,description})})}
async function renewClient(id){const c=clients.find(c=>c.id===id);if(!c||c.lifetime)return;const base=diffDays(c.dueDate)>=0?c.dueDate:isoToday(),oldDue=c.dueDate,newDue=calculateDue(base,c.plan);try{setBusy(true);await api(`/rest/v1/clients?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({due_date:newDue,cancelled:false})});await addHistory(c,'renewal',oldDue,newDue,`Renovado por ${planLabel(c.plan)}`,c.value);c.dueDate=newDue;c.cancelled=false;c.lastRenewedAt=isoToday();render();showToast(`Renovação de ${c.name} registrada.`);showMessage(c,'renewal')}catch(e){alert(e.message)}finally{setBusy(false)}}
async function toggleCancel(id){const c=clients.find(c=>c.id===id);if(!c)return;try{setBusy(true);const cancelled=!c.cancelled;await api(`/rest/v1/clients?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({cancelled})});await addHistory(c,cancelled?'cancel':'reactivate',c.dueDate,c.dueDate,cancelled?'Cliente cancelado':'Cliente reativado');c.cancelled=cancelled;render()}catch(e){alert(e.message)}finally{setBusy(false)}}
async function deleteClient(id){const c=clients.find(c=>c.id===id);if(!c||!confirm(`Excluir definitivamente o cadastro de ${c.name}?`))return;try{setBusy(true);await api(`/rest/v1/clients?id=eq.${id}`,{method:'DELETE'});clients=clients.filter(x=>x.id!==id);render();showToast('Cliente excluído.')}catch(e){alert(e.message)}finally{setBusy(false)}}
async function showHistory(id){const c=clients.find(c=>c.id===id);if(!c)return;try{const rows=await api(`/rest/v1/renewals?client_id=eq.${id}&select=*&order=created_at.desc`);$('historyTitle').textContent=c.name;$('historyContent').innerHTML=rows.map(h=>`<div class="history-item"><strong>${escapeHTML(h.description)}</strong><span>${dateBR(h.created_at.slice(0,10))}${Number(h.amount)?` · ${money(h.amount)}`:''}</span></div>`).join('')||'<p>Nenhum registro encontrado.</p>';$('historyDialog').showModal()}catch(e){alert(e.message)}}
function activationMessage(c,renewal=false){return `Olá, ${c.name}! Foi um prazer ter você como nosso cliente. Seu pacote de ${planLabel(c.plan,c.lifetime)}${c.screens>1?` com ${c.screens} telas`:''} foi ${renewal?'renovado':'ativado'} com sucesso. Agora é só desfrutar de toda a programação disponível em nosso serviço.\n\nAplicativo: ${c.appName}\nPlano: ${planLabel(c.plan,c.lifetime)}${c.screens>1?`\nTelas: ${c.screens}`:''}\nData da ${renewal?'renovação':'contratação'}: ${dateBR(renewal?(c.lastRenewedAt||isoToday()):c.startDate)}\nData de vencimento: ${c.lifetime?'Vitalício / sem vencimento':dateBR(c.dueDate)}\n\nAgradecemos pela preferência!\nJS Tech — conectado com você.`}
function chargeMessage(c){if(c.lifetime)return `Olá, ${c.name}! Seu plano é vitalício${c.screens>1?` e está registrado com ${c.screens} telas`:''}. Não há vencimento cadastrado para este plano.\n\nAplicativo: ${c.appName}\nJS Tech — conectado com você.`;return `Olá, ${c.name}! Tudo bem? Passando para avisar que seu plano de ${planLabel(c.plan)}${c.screens>1?` (${c.screens} telas)`:''} ${diffDays(c.dueDate)<0?`venceu em ${dateBR(c.dueDate)}`:`vence em ${dateBR(c.dueDate)}`}. O valor para renovação é ${money(c.value)}.\n\nSe desejar continuar, fale comigo por aqui.\nJS Tech — conectado com você.`}
function showMessage(c,type){messageClientId=c.id;$('messageTitle').textContent=type==='charge'?'Aviso de vencimento':type==='renewal'?'Renovação realizada':'Ativação realizada';$('messageText').value=type==='charge'?chargeMessage(c):activationMessage(c,type==='renewal');$('messageDialog').showModal()}
function sendCharge(id){const c=clients.find(c=>c.id===id);if(c)showMessage(c,'charge')}
function whatsappNumber(phone){let n=phone.replace(/\D/g,'');if(n.length===10||n.length===11)n='55'+n;return n}

$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').style.color='';$('loginError').textContent='';try{setBusy(true);const data=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('loginEmail').value.trim(),password:$('loginPassword').value})});data.expires_at=Math.floor(Date.now()/1000)+data.expires_in;storeSession(data);await enterApp()}catch(e){$('loginError').textContent='E-mail ou senha incorretos.'}finally{setBusy(false)}});
$('showSignupBtn').addEventListener('click',async()=>{const email=$('loginEmail').value.trim(),password=$('loginPassword').value;if(!email||password.length<6){$('loginError').textContent='Informe seu e-mail e uma senha com pelo menos 6 caracteres.';return}try{setBusy(true);const data=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});if(data.access_token){data.expires_at=Math.floor(Date.now()/1000)+data.expires_in;storeSession(data);await enterApp()}else{$('loginError').style.color='#43d99c';$('loginError').textContent='Cadastro criado. Confira seu e-mail para confirmar e depois entre.'}}catch(e){$('loginError').textContent=e.message}finally{setBusy(false)}});
$('logoutBtn').addEventListener('click',async()=>{try{await api('/auth/v1/logout',{method:'POST'})}catch{}clearSession();clients=[];showLogin()});
$('clientForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('clientId').value,existing=clients.find(c=>c.id===id),oldDue=existing?.dueDate||null,lifetime=$('lifetime').checked,devices=getDevices(),screens=Math.max(1,Math.min(99,Number($('screens').value)||1)),data={name:$('name').value.trim(),phone:$('phone').value.trim(),appName:(devices[0]&&devices[0].appName)||'',devices,startDate:$('startDate').value,plan:$('plan').value,value:Number($('value').value),cost:Number($('cost').value)||0,resellerName:$('resellerName').value.trim(),resellerPhone:$('resellerPhone').value.trim(),payment:$('payment').value,notes:$('notes').value.trim(),cancelled:existing?.cancelled||false,lifetime,screens};data.dueDate=lifetime?(existing?.dueDate||calculateDue(data.startDate,data.plan)):calculateDue(data.startDate,data.plan);try{setBusy(true);if(existing){await api(`/rest/v1/clients?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(fromClient(data))});Object.assign(existing,data);await addHistory(existing,'update',oldDue,data.dueDate,`Cadastro atualizado${lifetime?' · plano vitalício':''}${screens>1?` · ${screens} telas`:''}`);$('clientDialog').close();render();showToast('Cadastro atualizado.')}else{const rows=await api('/rest/v1/clients',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(fromClient(data))});const c=toClient(rows[0]);clients.push(c);await addHistory(c,'sale',null,c.dueDate,`Venda cadastrada: ${planLabel(c.plan,c.lifetime)}${screens>1?` · ${screens} telas`:''}`,c.value);$('clientDialog').close();render();showMessage(c,'activation')}}catch(e){alert(e.message)}finally{setBusy(false)}});
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>$('clientDialog').close()));document.querySelectorAll('.close-message').forEach(b=>b.addEventListener('click',()=>$('messageDialog').close()));document.querySelectorAll('.close-history').forEach(b=>b.addEventListener('click',()=>$('historyDialog').close()));
$('newClientBtn').addEventListener('click',()=>openForm());$('addDeviceBtn').addEventListener('click',()=>{const d=getDevices();d.push(newDevice('TV '+(d.length+1)));renderDevices(d)});$('emptyAddBtn').addEventListener('click',()=>openForm());$('startDate').addEventListener('change',updatePreview);$('plan').addEventListener('change',updatePreview);$('lifetime').addEventListener('change',updatePreview);$('screens').addEventListener('change',()=>{if(Number($('screens').value)<1)$('screens').value=1});$('searchInput').addEventListener('input',render);$('sortSelect').addEventListener('change',render);
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  if(b.dataset.view==='apps'){setPanelView('apps');return}
  if(b.dataset.view==='resellers'){setPanelView('resellers');return}
  setPanelView('clients');
  activeFilter=b.dataset.filter;
  render();
}));
$('refreshAppsBtn').addEventListener('click',loadAndroidApps);
$('resellerSearch').addEventListener('input',renderResellers);
$('resellerName').addEventListener('change',()=>{const match=clients.find(c=>c.resellerName&&c.resellerName.toLowerCase()===$('resellerName').value.trim().toLowerCase());if(match&&!$('resellerPhone').value)$('resellerPhone').value=match.resellerPhone||''});
$('copyMessageBtn').addEventListener('click',async()=>{await navigator.clipboard.writeText($('messageText').value);showToast('Mensagem copiada.')});$('openWhatsappBtn').addEventListener('click',()=>{const c=clients.find(c=>c.id===messageClientId);if(c)window.open(`https://wa.me/${whatsappNumber(c.phone)}?text=${encodeURIComponent($('messageText').value)}`,'_blank','noopener')});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:3,exportedAt:new Date().toISOString(),clients},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`backup-js-tech-${isoToday()}.json`;a.click();URL.revokeObjectURL(a.href);showToast('Backup baixado.')});
$('importInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.clients))throw new Error();if(confirm(`Importar ${data.clients.length} cliente(s) para o banco?`)){setBusy(true);for(const item of data.clients)await api('/rest/v1/clients',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(fromClient(item))});await loadClients();showToast('Backup importado.')}}catch{alert('Este arquivo de backup não é válido ou não pôde ser importado.')}finally{setBusy(false);e.target.value=''}});
async function init(){renderAndroidApps();if(await restoreSession())await enterApp();else showLogin()}
init();
