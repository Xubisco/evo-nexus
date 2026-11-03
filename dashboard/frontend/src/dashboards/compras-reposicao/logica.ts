// @ts-nocheck
/* Portado do Artifact "compras-reposicao" (claude.ai). A lógica é a da página original;
   os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var S={tab:'cob',fab:{},fabOpen:false,ritmo:'u90',saz:'1',hor:'60',agr:'prod',q:'',sec:'none',sit:{0:1,1:1,2:1,3:1,4:1,6:1},sort:{c:{k:'sit',d:1},p:{k:'val',d:-1}}};
var NAMES=['sub','aviso','f-fab','f-ritmo','f-saz','f-hor','f-agr','f-q','f-sec','c-chk','k-urg','k-urg-d','k-zer','k-zer-d','k-ped','k-ped-d','k-cap','k-cap-d','k-sg','k-sg-d','c-t','c-nota','p-chart','p-t','d-info'];
var $=function(s){return document.querySelector(s);};
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var rf=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function dmy(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';}
function dm(d){return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var q in props){var v=props[q];if(q==='class')e.className=v;else if(q==='text')e.textContent=v;else e.setAttribute(q,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
var IDS=['reposicao_produto','reposicao_fabrica','reposicao_info'];
function ready(){return IDS.every(function(i){return dash.data(i).status==='ok';});}
function D(i){return dash.data(i).data;}
function sum(a,f){return a.reduce(function(s,x){return s+(f(x)||0);},0);}
function showTip(ev,lines){
  var t=$('#cc-tip'),er=$('#cc').getBoundingClientRect();
  t.replaceChildren.apply(t,lines.map(function(l){return h('div',null,l);}));
  t.style.display='block';
  var x=ev.clientX-er.left+14,y=ev.clientY-er.top+14,w=t.offsetWidth;
  if(x+w>er.width)x=Math.max(0,ev.clientX-er.left-w-14);
  t.style.left=x+'px';t.style.top=y+'px';
}
function hideTip(){$('#cc-tip').style.display='none';}
function redraw(){NAMES.forEach(function(n){dash.draw(n);});}
function setText(name,fn){dash.draw(name,function(el){el.textContent=ready()?fn():'—';});}
function info(){return D('reposicao_info')[0];}
var JAN={u30:30,u90:90,u180:180};

/* itens calculados */
var cache=null,ckey='';
function itens(){
  var key=[Object.keys(S.fab).sort().join(','),S.ritmo,S.saz,S.hor,S.agr].join('|');
  if(cache&&ckey===key)return cache;
  var fb={};D('reposicao_fabrica').forEach(function(f){fb[f.fabrica]=f;});
  var P=D('reposicao_produto').filter(function(p){return !Object.keys(S.fab).length||S.fab[p.fab];});
  var base=[];
  if(S.agr==='fam'){
    var m={};
    P.forEach(function(p){
      var k=p.fab+'|'+p.fid,o=m[k];
      if(!o){o=m[k]={nome:p.familia,fab:p.fab,estoque:0,mostruario:0,encalhe:0,a_receber:0,u30:0,u90:0,u180:0,cs:0,cn:0};}
      o.estoque+=p.estoque;o.mostruario+=p.mostruario;o.encalhe+=p.encalhe;o.a_receber+=p.a_receber;o.u30+=p.u30;o.u90+=p.u90;o.u180+=p.u180;
      if(p.custo){o.cs+=p.custo;o.cn++;}
    });
    base=Object.keys(m).map(function(k){var o=m[k];o.custo=o.cn?o.cs/o.cn:0;return o;});
  }else base=P.map(function(p){return {nome:p.nome,fab:p.fab,estoque:p.estoque,mostruario:p.mostruario,encalhe:p.encalhe,a_receber:p.a_receber,u30:p.u30,u90:p.u90,u180:p.u180,custo:p.custo||0};});
  var hoje=new Date(info().hoje+'T12:00:00'),saz=+S.saz,hor=+S.hor;
  base.forEach(function(o){
    var f=fb[o.fab]||{lead:30,seguranca:15};
    o.lead=f.lead;o.seg=f.seguranca;
    o.vd=o[S.ritmo]/JAN[S.ritmo]*saz;
    var tot=o.estoque+o.a_receber;
    o.cob=o.vd>0?Math.ceil(Math.max(0,o.estoque)/o.vd):null;
    o.pedir=o.cob==null?null:new Date(hoje.getTime()+(o.cob-o.lead-o.seg)*86400000);
    o.qtd=o.vd>0?Math.max(0,Math.ceil(o.vd*(o.lead+o.seg+hor)-tot)):0;
    o.val=o.qtd*o.custo;
    var s;
    if(o.vd<=0)s=o.estoque>0?['Sem giro','mut',6]:null;
    else if(o.estoque<=0)s=['Zerado','bad',0];
    else if(o.cob<=30)s=['Rupt 30d','bad',1];
    else if(o.cob<=60)s=['Rupt 60d','warn',2];
    else if(o.cob<=90)s=['Rupt 90d','warn',3];
    else s=['OK','ok',4];
    o.st=s;
  });
  cache=base.filter(function(o){return o.st;});ckey=key;
  return cache;
}
function resetCache(){cache=null;}
var RITMOS=[['u90','Ritmo dos últimos 90 dias'],['u30','Ritmo dos últimos 30 dias'],['u180','Ritmo dos últimos 180 dias']];
var SAZ=[['1','Sazonalidade 1,0×'],['1.2','Sazonalidade 1,2×'],['1.5','Sazonalidade 1,5×']];
var HOR=[['30','Cobrir 30 dias após chegar'],['60','Cobrir 60 dias após chegar'],['120','Cobrir 120 dias após chegar']];
var AGR=[['prod','Por produto'],['fam','Agrupar cores em família']];
function sel(name,opts,key){
  dash.draw(name,function(el){
    if(!ready()){el.replaceChildren();return;}
    el.replaceChildren.apply(el,opts.map(function(o){return new Option(o[1],o[0]);}));
    el.value=S[key];
    el.onchange=function(){S[key]=el.value;resetCache();redraw();};
  });
}
sel('f-ritmo',RITMOS,'ritmo');sel('f-saz',SAZ,'saz');sel('f-hor',HOR,'hor');sel('f-agr',AGR,'agr');
function fabTxt(){
  var k=Object.keys(S.fab).sort();
  return !k.length?'Todas as fábricas':k.length<=2?k.join(', '):k.length+' fábricas';
}
function redrawSemFab(){
  resetCache();
  NAMES.forEach(function(n){if(n!=='f-fab')dash.draw(n);});
  var sm=document.querySelector('#f-fab>summary');if(sm)sm.textContent=fabTxt();
}
dash.draw('f-fab',function(el){
  el.replaceChildren();
  if(!ready())return;
  var cnt={};D('reposicao_produto').forEach(function(p){cnt[p.fab]=(cnt[p.fab]||0)+1;});
  var fs=Object.keys(cnt).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
  var panel=h('div',{class:'mp'});
  panel.append(h('button',{type:'button',text:'Limpar seleção (todas)'}));
  panel.firstChild.onclick=function(){S.fab={};panel.querySelectorAll('input').forEach(function(i){i.checked=false;});redrawSemFab();};
  fs.forEach(function(f){
    var cb=h('input',{type:'checkbox'});cb.checked=!!S.fab[f];
    cb.onchange=function(){if(cb.checked)S.fab[f]=1;else delete S.fab[f];redrawSemFab();};
    panel.append(h('label',null,cb,f,h('span',{text:String(cnt[f])})));
  });
  el.append(h('summary',{text:fabTxt()}),panel);
  el.open=S.fabOpen;
  el.ontoggle=function(){S.fabOpen=el.open;};
});
dash.draw('f-sec',function(el){
  if(!ready()){el.replaceChildren();return;}
  el.replaceChildren.apply(el,SECOPT.map(function(o){return new Option(o[1],o[0]);}));
  el.value=S.sec;
  el.onchange=function(){S.sec=el.value;dash.draw('c-t');};
});
var SITS=[[0,'Zerado'],[1,'Rupt 30d'],[2,'Rupt 60d'],[3,'Rupt 90d'],[4,'OK'],[6,'Sem giro']];
dash.draw('c-chk',function(el){
  el.replaceChildren();
  if(!ready())return;
  var cnt={};itens().forEach(function(o){cnt[o.st[2]]=(cnt[o.st[2]]||0)+1;});
  SITS.forEach(function(p){
    var cb=h('input',{type:'checkbox'});cb.checked=!!S.sit[p[0]];
    cb.onchange=function(){if(cb.checked)S.sit[p[0]]=1;else delete S.sit[p[0]];dash.draw('c-t');dash.draw('c-nota');};
    el.append(h('label',null,cb,p[1]+' ',h('b',{text:'('+nf.format(cnt[p[0]]||0)+')'})));
  });
});
dash.draw('f-q',function(el){
  if(!ready())return;
  el.oninput=function(){S.q=el.value.toLowerCase();dash.draw('c-t');dash.draw('c-nota');};
});

dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var i=info(),I=itens();
  el.textContent='Posição de estoque de '+dmy(i.snapshot_estoque)+' e vendas até '+dmy(i.ultima_venda)+'. '+nf.format(I.length)+' '+(S.agr==='fam'?'famílias':'produtos')+' com estoque ou venda na janela.';
});
dash.draw('aviso',function(el){
  el.replaceChildren();
  if(!ready()){el.hidden=true;return;}
  var i=info(),msgs=[];
  var dias=(new Date(i.hoje)-new Date(i.snapshot_estoque))/86400000;
  if(dias>7)msgs.push('A posição de estoque tem '+nf.format(dias)+' dias ('+dmy(i.snapshot_estoque)+'). Suba o CSV novo para atualizar.');
  var pad=D('reposicao_fabrica').filter(function(f){return /padrão/.test(f.fonte);});
  var ativas={};D('reposicao_produto').forEach(function(p){if(p.estoque>0||p.u90>0)ativas[p.fab]=1;});
  var n=pad.filter(function(f){return ativas[f.fabrica];}).length;
  if(n)msgs.push('Lead time padrão de 30 dias em '+n+' fábricas ainda não confirmadas; ajuste em fabricas_parametros.csv.');
  el.hidden=!msgs.length;
  msgs.forEach(function(m){el.append(h('p',{text:m}));});
});

/* KPIs */
setText('k-urg',function(){return nf.format(itens().filter(function(o){return o.st[2]===1;}).length);});
setText('k-urg-d',function(){var I=itens();var n=I.filter(function(o){return o.st[2]===1&&o.cob<o.lead;}).length;return n+' abaixo do lead time da fábrica';});
setText('k-zer',function(){return nf.format(itens().filter(function(o){return o.st[2]===0;}).length);});
setText('k-zer-d',function(){var z=itens().filter(function(o){return o.st[2]===0;});return z.length?'venda/dia somada '+rf.format(sum(z,function(o){return o.vd;})):'';});
setText('k-ped',function(){return bf.format(sum(itens(),function(o){return o.val;}));});
setText('k-ped-d',function(){var I=itens();return nf.format(sum(I,function(o){return o.qtd;}))+' unidades em '+I.filter(function(o){return o.qtd>0;}).length+' itens';});
setText('k-cap',function(){return bf.format(sum(itens(),function(o){return o.estoque*o.custo;}));});
setText('k-cap-d',function(){return nf.format(sum(itens(),function(o){return o.estoque;}))+' unidades';});
setText('k-sg',function(){return bf.format(sum(itens().filter(function(o){return o.st[2]===6;}),function(o){return o.estoque*o.custo;}));});
setText('k-sg-d',function(){return itens().filter(function(o){return o.st[2]===6;}).length+' itens sem venda na janela';});

/* tabela */
var SEC={fab:{k:'fab',d:1},val:{k:'val',d:-1},qtd:{k:'qtd',d:-1},nome:{k:'nome',d:1},pedir:{k:'pedir',d:1},vd:{k:'vd',d:-1}};
var SECOPT=[['none','Depois ordenar por: nada'],['fab','Depois por fábrica (A→Z)'],['val','Depois por valor sugerido (maior)'],['qtd','Depois por qtd sugerida (maior)'],['vd','Depois por venda/dia (maior)'],['pedir','Depois por pedir até (mais cedo)'],['nome','Depois por produto (A→Z)']];
function gv(o,k){var x=o[k];return x instanceof Date?x.getTime():x;}
function cmp(a,b,k,d){
  var x=gv(a,k),y=gv(b,k),nx=x==null,ny=y==null;
  if(nx||ny)return nx&&ny?0:nx?1:-1;
  return (typeof x==='string'?x.localeCompare(y,'pt-BR'):x-y)*d;
}
function ord(arr,t){
  var k=S.sort[t].k,d=S.sort[t].d;
  function v(o){
    if(k==='sit')return o.st[2];
    var x=o[k];
    if(x instanceof Date)return x.getTime();
    return x;
  }
  return arr.slice().sort(function(a,b){
    var x=v(a),y=v(b),nx=x==null,ny=y==null;
    if(nx||ny)return nx&&ny?0:nx?1:-1;
    var r=typeof x==='string'?x.localeCompare(y,'pt-BR'):x-y;
    if(r!==0)return r*d;
    if(t==='c'){
      var sc=SEC[S.sec];
      if(sc&&sc.k!==k){var rr=cmp(a,b,sc.k,sc.d);if(rr)return rr;}
      if(k==='sit'){var r2=(a.pedir||0)-(b.pedir||0);if(r2)return r2;}
    }
    return String(a.nome||a.fab).localeCompare(String(b.nome||b.fab),'pt-BR');
  });
}
function marca(){
  document.querySelectorAll('thead[data-t]').forEach(function(th){
    var t=th.dataset.t;
    th.querySelectorAll('th[data-sort]').forEach(function(c){
      var on=S.sort[t].k===c.dataset.sort;
      if(on)c.setAttribute('aria-sort',S.sort[t].d>0?'ascending':'descending');else c.removeAttribute('aria-sort');
    });
  });
}
function lista(){
  return ord(itens().filter(function(o){return S.sit[o.st[2]]&&(!S.q||o.nome.toLowerCase().indexOf(S.q)>=0);}),'c');
}
dash.draw('c-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  lista().forEach(function(o){
    tb.append(h('tr',null,
      h('td',{class:'nm',text:o.nome}),h('td',{class:'l',text:o.fab}),
      h('td',{text:nf.format(o.estoque)}),h('td',{text:o.a_receber?nf.format(o.a_receber):'—'}),h('td',{text:o.mostruario?nf.format(o.mostruario):'—'}),h('td',{text:o.encalhe?nf.format(o.encalhe):'—'}),
      h('td',{text:o.vd?rf.format(o.vd):'—'}),
      h('td',{text:o.cob==null?'—':nf.format(o.cob)+' d'}),
      h('td',{class:o.pedir&&o.pedir<new Date(info().hoje+'T12:00:00')?'neg':'',text:o.pedir?dm(o.pedir):'—'}),
      h('td',{text:o.qtd?nf.format(o.qtd):'—'}),h('td',{text:o.val?bf.format(o.val):'—'}),
      h('td',{class:'l'},h('span',{class:'st '+o.st[1],text:o.st[0]}))));
  });
});
dash.draw('c-nota',function(el){
  if(!ready()){el.textContent='';return;}
  var n=lista().length,t=itens().length;
  el.textContent=n===t?n+' itens.':'Mostrando '+n+' de '+t+' itens, conforme as situações marcadas e a busca.';
});

/* fábricas */
function fbm(){var m={};D('reposicao_fabrica').forEach(function(f){m[f.fabrica]=f;});return m;}
function porFab(){
  var m={};
  itens().forEach(function(o){
    var r=m[o.fab]||(m[o.fab]={fab:o.fab,lead:o.lead,seg:o.seg,n:0,qtd:0,val:0,pedir:null,fonte:(fbm()[o.fab]||{}).fonte||''});
    if(o.qtd>0){r.n++;r.qtd+=o.qtd;r.val+=o.val;if(o.pedir&&(!r.pedir||o.pedir<r.pedir))r.pedir=o.pedir;}
  });
  return Object.keys(m).map(function(k){return m[k];}).filter(function(r){return r.n>0;}).sort(function(a,b){return b.val-a.val;});
}
dash.draw('p-chart',function(el){
  el.replaceChildren();
  if(!ready())return;
  var R=porFab().slice(0,15),W=el.clientWidth||600,rh=26,H=R.length*rh+16,m={l:150,r:70};
  var x=d3.scaleLinear().domain([0,d3.max(R,function(r){return r.val;})||1]).range([m.l,W-m.r]);
  var svg=d3.create('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+H);
  var g=svg.selectAll('g').data(R).join('g').attr('transform',function(_,i){return 'translate(0,'+(i*rh+4)+')';});
  g.append('text').attr('x',m.l-8).attr('y',rh/2).attr('dy','0.32em').attr('text-anchor','end').text(function(r){return r.fab.length>22?r.fab.slice(0,21)+'…':r.fab;});
  g.append('rect').attr('x',m.l).attr('y',3).attr('height',rh-8).attr('rx',2).attr('width',function(r){return Math.max(1,x(r.val)-m.l);}).attr('fill','#2f6f8f');
  g.append('text').attr('x',function(r){return x(r.val)+6;}).attr('y',rh/2).attr('dy','0.32em').text(function(r){return bf.format(r.val);});
  g.append('rect').attr('x',0).attr('width',W).attr('height',rh).attr('fill','transparent')
    .on('mousemove',function(ev,r){showTip(ev,[r.fab,nf.format(r.qtd)+' unidades em '+r.n+' itens',bf.format(r.val)]);}).on('mouseleave',hideTip);
  el.append(svg.node());
});
dash.draw('p-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  var fb={};D('reposicao_fabrica').forEach(function(f){fb[f.fabrica]=f;});
  var R=ord(porFab(),'p');
  R.forEach(function(r){
    tb.append(h('tr',null,h('td',{class:'l',text:r.fab}),h('td',{text:r.lead+' d'}),h('td',{text:r.seg+' d'}),h('td',{text:nf.format(r.n)}),h('td',{text:nf.format(r.qtd)}),h('td',{text:bf.format(r.val)}),
      h('td',{class:r.pedir&&r.pedir<new Date(info().hoje+'T12:00:00')?'neg':'',text:r.pedir?dm(r.pedir):'—'}),h('td',{class:'l wrap',text:(fb[r.fab]||{}).fonte||''})));
  });
  tb.append(h('tr',{class:'tot'},h('td',{class:'l',text:'Total'}),h('td'),h('td'),h('td',{text:nf.format(sum(R,function(r){return r.n;}))}),h('td',{text:nf.format(sum(R,function(r){return r.qtd;}))}),h('td',{text:bf.format(sum(R,function(r){return r.val;}))}),h('td'),h('td')));
});

dash.draw('d-info',function(el){
  el.replaceChildren();
  if(!ready())return;
  var i=info();
  [['Calculado em',dmy(i.hoje)],['Posição de estoque',dmy(i.snapshot_estoque)],['Última venda na base',dmy(i.ultima_venda)],['Produtos na análise',nf.format(i.produtos)],['Com estoque',nf.format(i.com_estoque)],['Com unidades a receber',nf.format(i.com_a_receber)],['Com estoque e sem custo',nf.format(i.sem_custo)]].forEach(function(p){el.append(h('p',null,h('b',{text:p[0]+': '}),p[1]));});
});

function mostra(){
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===S.tab?'true':'false');});
  document.querySelectorAll('.cc-pane').forEach(function(p){p.hidden=p.id!==S.tab;});
}
dash.onData(function(){
  resetCache();
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.onclick=function(){S.tab=b.dataset.tab;mostra();redraw();};});
  document.querySelectorAll('thead[data-t] th[data-sort]').forEach(function(c){
    c.tabIndex=0;
    function go(){
      var t=c.parentNode.parentNode.dataset.t,k=c.dataset.sort,s=S.sort[t];
      var txt=(k==='nome'||k==='fab'||k==='fonte'||k==='sit');
      if(s.k===k)s.d=-s.d;else{s.k=k;s.d=(txt||k==='pedir'||k==='cob')?1:-1;}
      marca();dash.draw(t==='c'?'c-t':'p-t');
    }
    c.onclick=go;c.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
  });
  marca();
  mostra();
});
}
