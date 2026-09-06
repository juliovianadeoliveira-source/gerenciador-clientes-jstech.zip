/* JS Tech — navegação separada e home antiga */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const home=()=>$('oldHomeSection');
  const analytics=()=>document.querySelector('.analytics');
  const monthly=()=>document.querySelector('.monthly-report');
  const summary=()=>document.querySelector('.summary-grid');
  const mainClient=()=>document.querySelector('main > section.panel:not(#resellersSection):not(#androidAppsSection)');
  const resellers=()=>$('resellersSection');
  const apps=()=>$('androidAppsSection');
  const topbar=()=>document.querySelector('.topbar');

  function hideAll(){
    [home(),analytics(),monthly(),summary(),mainClient(),resellers(),apps()].forEach(el=>{if(el)el.hidden=true});
  }

  function activate(btn){
    document.querySelectorAll('.sidebar .nav-item').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
  }

  function openOverview(btn){
    hideAll();
    if(home())home().hidden=false;
    if(topbar())topbar().hidden=true;
    activate(btn);
    if(typeof window.renderOldHome==='function')window.renderOldHome();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function openFilter(filter,btn){
    hideAll();
    if(topbar())topbar().hidden=false;
    if(mainClient())mainClient().hidden=false;
    window.activeFilter=filter;
    activate(btn);
    if(typeof window.render==='function')window.render();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function openView(view,btn){
    hideAll();
    if(topbar())topbar().hidden=true;
    activate(btn);
    if(view==='resellers'){
      if(resellers())resellers().hidden=false;
      if(typeof window.renderResellers==='function')window.renderResellers();
    }
    if(view==='apps'){
      if(apps())apps().hidden=false;
      if(typeof window.loadAndroidApps==='function')window.loadAndroidApps();
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function bindNavigation(){
    document.querySelectorAll('.sidebar .nav-item').forEach(btn=>{
      if(btn.dataset.uiFixBound==='1')return;
      btn.dataset.uiFixBound='1';
      btn.addEventListener('click',function(e){
        e.preventDefault();
        if(this.dataset.view){openView(this.dataset.view,this);return}
        openFilter(this.dataset.filter||'todos',this);
      });
    });
  }

  function renderHome(){
    if(typeof window.renderOldHome==='function')window.renderOldHome();
  }

  function patchRender(){
    if(typeof window.render!=='function'||window.render.__uiFix)return;
    const original=window.render;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      renderHome();
      return result;
    };
    wrapped.__uiFix=true;
    window.render=wrapped;
  }

  function patchOldHomeButtons(){
    const bind=(id,fn)=>{const el=$(id);if(!el||el.dataset.uiFixBound==='1')return;el.dataset.uiFixBound='1';el.addEventListener('click',fn)};
    bind('oldSearchBtn',()=>{
      const btn=document.querySelector('.sidebar .nav-item[data-filter="todos"]');
      openFilter('todos',btn);
      setTimeout(()=>$('searchInput')?.focus(),50);
    });
    bind('oldReportBtn',()=>{
      hideAll();
      if(topbar())topbar().hidden=true;
      if(monthly())monthly().hidden=false;
      if(typeof window.renderMonthlyReport==='function')window.renderMonthlyReport();
      window.scrollTo({top:0,behavior:'smooth'});
    });
    bind('oldAppsBtn',()=>document.querySelector('.sidebar .nav-item[data-view="apps"]')?.click());
    bind('oldBackupBtn',()=>$('exportBtn')?.click());
    bind('oldNewClientBtn',()=>$('newClientBtn')?.click());
  }

  function applyInitial(){
    bindNavigation();
    patchRender();
    patchOldHomeButtons();
    const overview=document.querySelector('.sidebar .nav-item[data-filter="todos"]');
    openOverview(overview);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(applyInitial,0));
  else setTimeout(applyInitial,0);

  window.JSTechUI={openOverview,openFilter,openView,bindNavigation,renderHome};
})();
