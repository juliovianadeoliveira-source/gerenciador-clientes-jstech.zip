/* Ponte de compatibilidade: as melhorias usam a mesma sessão e a mesma API do app.js. */
(function(){
  'use strict';
  function sync(){
    try{
      if(typeof session!=='undefined') window.session=session;
      if(typeof clients!=='undefined') window.clients=clients;
      if(typeof renewals!=='undefined') window.renewals=renewals;
    }catch(e){}
  }
  sync();
  setInterval(sync,1000);

  const originalFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('yifgptxujimzsjoeghte.supabase.co')){
        const h=new Headers((init&&init.headers)||{});
        const token=typeof session!=='undefined'&&session?.access_token?session.access_token:null;
        if(token){
          h.set('Authorization','Bearer '+token);
          h.set('apikey',typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:'');
        }
        init={...(init||{}),headers:h};
      }
    }catch(e){}
    return originalFetch(input,init);
  };
})();
