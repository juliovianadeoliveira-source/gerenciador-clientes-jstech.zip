/* JS Tech — navegacao separada das telas */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const analytics=()=>document.querySelector('.analytics');
  const monthly=()=>document.querySelector('.monthly-report');
  const summary=()=>document.querySelector('.summary-grid');
  const clientPanel=()=>document.querySelector('main > section.panel:not(#resellersSection):not(#androidAppsSection)');
  const resellers=()=>$('resellersSection');
  const apps=()=>$('androidAppsSection');
  const topbar=()=>document.querySelector('.topbar');

  function hideScreens(){
    [analytics(),monthly(),summary(),clientPanel(),resellers(),apps()].forEach(el=>{if(el)el.hidden=true});
  }
  function activate(btn){
    document.querySelectorAll('.sidebar .nav-item').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
  }
  function showDashboard(btn){
    hideScreens();
    if(topbar())topbar().hidden=false;
    if(analytics())analytics().hidden=false;
    if(monthly())monthly().hidden=false;
    if(summary())summary().hidden=false;
    if(clientPanel())clientPanel().hidden=false;
    activate(btn);
    window.activeFilter='todos';
    if(typeof window.render==='function')window.render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showFilter(filter,btn){
    hideScreens();
    if(topbar())topbar().hidden=false;
    if(clientPanel())clientPanel().hidden=false;
    window.activeFilter=filter;
    activate(btn);
    if(typeof window.render==='function')window.render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showView(view,btn){
    hideScreens();
    if(topbar())topbar().hidden=false;
    activate(btn);
    if(view==='resellers' && resellers()){
      resellers().hidden=false;
      if(typeof window.renderResellers==='function')window.renderResellers();
    }
    if(view==='apps' && apps()){
      apps().hidden=false;
      if(typeof window.loadAndroidApps==='function')window.loadAndroidApps();
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function bind(){
    document.querySelectorAll('.sidebar .nav-item').forEach(btn=>{
      if(btn.dataset.uiFixBound==='1')return;
      btn.dataset.uiFixBound='1';
      btn.addEventListener('click',e=>{
        e.preventDefault();
        if(btn.dataset.view){showView(btn.dataset.view,btn);return;}
        const filter=btn.dataset.filter||'todos';
        if(filter==='todos')showDashboard(btn);else showFilter(filter,btn);
      });
    });
  }
  function initial(){
    bind();
    const overview=document.querySelector('.sidebar .nav-item[data-filter="todos"]');
    showDashboard(overview);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initial,0));
  else setTimeout(initial,0);
  window.JSTechUI={showDashboard,showFilter,showView,bind};
})();
