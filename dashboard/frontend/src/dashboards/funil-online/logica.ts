// @ts-nocheck
/* Portado do Artifact "funil-online" (claude.ai). A lógica é a da página original;
   os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var ETAPAS_ORD=['NOVO LEAD','EM ATENDIMENTO','EM FOLLOW UP','PEDIDO FATURADO'];
var TOP_CAMP=15;
var S={tab:'funil',mes:null};
var NAMES=['sub','f-mes','k-roas','k-roas-d','k-fat','k-fat-d','k-gasto','k-gasto-d','k-cac','k-cac-d','k-conv','k-conv-d','k-gan','k-gan-d','f-etapas','w-leg','w-chart','w-t','c-obj','c-grp','c-top','a-sem','a-et','f-nota'];
var $=function(s){return document.querySelector(s);};
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var bf2=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
var cf=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
var fx=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
var pf=function(v){return v==null||!isFinite(v)?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(v*100)+'%';};
var ml=function(m){return MES[+m.slice(5)-1]+'/'+m.slice(2,4);};
var dmy=function(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(2,4):'—';};
var ddmm=function(s){return s.slice(8,10)+'/'+s.slice(5,7);};
var nz=function(v,f){return v==null||!isFinite(v)?'—':f.format(v);};
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var k in props){var v=props[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
function linha(textos,nl,cls){return h('tr',cls?{class:cls}:null,textos.map(function(t,i){return h('td',i<nl?{class:'l'}:null,t);}));}
var IDS=['funil_dia','funil_campanha_mes','funil_etapa_semana','funil_info'];
function ready(){return IDS.every(function(i){return dash.data(i).status==='ok';});}
function D(i){return dash.data(i).data;}
function sum(a,f){return a.reduce(function(s,x){return s+(f(x)||0);},0);}
function ratio(a,b){return b?a/b:null;}
function tip(){return $('#cc-tip');}
function showTip(ev,lines){
  var t=tip(),er=$('#cc').getBoundingClientRect();
  t.replaceChildren.apply(t,lines.map(function(l){return h('div',null,l.c?h('i',{style:'background:'+l.c}):null,l.t);}));
  t.style.display='block';
  var x=ev.clientX-er.left+14,y=ev.clientY-er.top+14,w=t.offsetWidth;
  if(x+w>er.width)x=Math.max(0,ev.clientX-er.left-w-14);
  t.style.left=x+'px';t.style.top=y+'px';
}
function hideTip(){tip().style.display='none';}
function redraw(){NAMES.forEach(function(n){dash.draw(n);});}
function setText(name,fn){dash.draw(name,function(el){el.textContent=ready()?fn():'—';});}
function setCls(el,cls,t){el.className=cls||'';el.textContent=t;}

/* ---- dados ---- */
function meses(){return Array.from(new Set(D('funil_dia').map(function(r){return r.mes;}))).sort();}
function ultimoMes(){return meses().slice(-1)[0];}
function parcial(m){var fim=D('funil_info')[0].periodo_fim;if(m!==fim.slice(0,7))return false;var y=+m.slice(0,4),mm=+m.slice(5);return +fim.slice(8)<new Date(y,mm,0).getDate();}
function mesNome(m){return m==='tudo'?'Todo o período':ml(m)+(parcial(m)?' (até '+ddmm(D('funil_info')[0].periodo_fim)+')':'');}
function rowsDia(m){return D('funil_dia').filter(function(r){return !m||m==='tudo'||r.mes===m;});}
function agg(rows){
  var o={gasto:0,gmsg:0,conv:0,cmsg:0,imp:0,clk:0,neg:0,gan:0,val:0,sat:0,ped:0,fat:0,dias:0,diasNeg:0,temNeg:false};
  rows.forEach(function(r){
    o.gasto+=r.gasto;o.gmsg+=r.gasto_msg;o.conv+=r.conversas;o.cmsg+=r.conversas_msg;o.imp+=r.impressoes;o.clk+=r.cliques;o.ped+=r.pedidos_online;o.fat+=r.fat_online;o.dias++;
    if(r.negocios_criados!=null){o.temNeg=true;o.diasNeg++;o.neg+=r.negocios_criados;o.gan+=r.negocios_ganhos||0;o.val+=r.valor_ganhos||0;o.sat+=r.negocios_sem_atendente||0;}
  });
  return o;
}
function anterior(m){var ms=meses(),i=ms.indexOf(m);return i>0?ms[i-1]:null;}
function semanaDe(d){var t=new Date(d+'T00:00:00Z'),dow=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-dow);return t.toISOString().slice(0,10);}
function semanas(){var m={};D('funil_dia').forEach(function(r){var k=semanaDe(r.dia);(m[k]=m[k]||[]).push(r);});return Object.keys(m).sort().map(function(k){return {sem:k,a:agg(m[k])};});}
function campRows(){return D('funil_campanha_mes').filter(function(r){return S.mes==='tudo'||r.mes===S.mes;});}
function porChave(rows,fn){var m={};rows.forEach(function(r){var k=fn(r),o=m[k]||(m[k]={k:k,gasto:0,conv:0,imp:0,clk:0,camps:{},ex:r});o.gasto+=r.gasto;o.conv+=r.conversas;o.imp+=r.impressoes;o.clk+=r.cliques;o.camps[r.campanha_id]=1;});return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return b.gasto-a.gasto;});}

/* ---- topo ---- */
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var a=agg(rowsDia(S.mes)),roas=ratio(a.fat,a.gasto),cac=ratio(a.gasto,a.ped);
  el.textContent=mesNome(S.mes)+': o faturamento da loja Online equivale a '+nz(roas,fx)+' vezes o gasto no Meta, com CAC de '+(cac==null?'—':bf.format(cac))+' por pedido.';
});
dash.draw('f-mes',function(sel){
  if(!ready()){sel.replaceChildren();return;}
  sel.replaceChildren.apply(sel,[new Option('Todo o período','tudo')].concat(meses().map(function(m){return new Option(mesNome(m),m);})));
  sel.value=S.mes||'tudo';
  sel.onchange=function(){S.mes=sel.value;redraw();};
});

/* ---- aba Funil ---- */
function cur(){return agg(rowsDia(S.mes));}
function prev(){var p=S.mes==='tudo'?null:anterior(S.mes);return p?agg(rowsDia(p)):null;}
function delta(el,atual,antes,bomSobe,rotulo){
  if(!ready()||atual==null||antes==null||!antes){el.textContent='';el.className='';return;}
  var d=atual/antes-1,bom=bomSobe?d>0.005:d<-0.005,ruim=bomSobe?d<-0.005:d>0.005;
  setCls(el,bom?'up':(ruim?'down':''),(d>0?'+':'')+pf(d)+' vs '+rotulo);
}
function rotuloAnt(){var p=S.mes?anterior(S.mes):null;return p?ml(p):'';}
setText('k-roas',function(){var a=cur();return a.gasto?fx.format(a.fat/a.gasto)+'x':'—';});
dash.draw('k-roas-d',function(el){var a=cur(),p=prev();delta(el,ratio(a.fat,a.gasto),p&&ratio(p.fat,p.gasto),true,rotuloAnt());});
setText('k-fat',function(){return bf.format(cur().fat);});
setText('k-fat-d',function(){var a=cur();return nf.format(a.ped)+' pedidos';});
setText('k-gasto',function(){return bf.format(cur().gasto);});
setText('k-gasto-d',function(){var a=cur();return a.dias?bf.format(a.gasto/a.dias)+' por dia':'';});
setText('k-cac',function(){var a=cur();return a.ped?bf.format(a.gasto/a.ped):'—';});
dash.draw('k-cac-d',function(el){var a=cur(),p=prev();delta(el,ratio(a.gasto,a.ped),p&&ratio(p.gasto,p.ped),false,rotuloAnt());});
setText('k-conv',function(){return nf.format(cur().conv);});
setText('k-conv-d',function(){var a=cur();return a.cmsg?bf2.format(a.gmsg/a.cmsg)+' por conversa de mensagem':'';});
setText('k-gan',function(){var a=cur();return a.temNeg?nf.format(a.gan):'—';});
setText('k-gan-d',function(){var a=cur();return a.temNeg?pf(ratio(a.gan,a.neg))+' dos negócios criados':'DataCrazy só desde '+dmy(D('funil_info')[0].negocios_desde);});

dash.draw('f-etapas',function(el){
  if(!ready()){el.replaceChildren();return;}
  var a=cur();
  var et=[
    {n:'Conversas iniciadas',s:'Meta',v:a.conv,c:dash.colors[0]},
    {n:'Negócios criados',s:'DataCrazy',v:a.temNeg?a.neg:null,c:dash.colors[1]},
    {n:'Negócios ganhos',s:'DataCrazy',v:a.temNeg?a.gan:null,c:dash.colors[2]},
    {n:'Pedidos da loja Online',s:'ERP',v:a.ped,c:dash.colors[3]}
  ];
  var mx=Math.max.apply(null,et.map(function(e){return e.v||0;}))||1,antes=null;
  el.replaceChildren.apply(el,et.map(function(e){
    var rel=e.v!=null&&antes!=null&&antes?pf(e.v/antes)+' da etapa anterior':'';
    if(e.v!=null)antes=e.v;
    var custo=e.v?bf2.format(a.gasto/e.v)+' por unidade':'';
    return h('div',{class:'cc-etapa'},
      h('div',{class:'nome'},e.n,h('small',null,e.s)),
      h('div',{class:'barra'},e.v!=null?h('i',{style:'width:'+(100*e.v/mx).toFixed(2)+'%;background:'+e.c}):null),
      h('div',{class:'num'},e.v!=null?nf.format(e.v):'—',h('small',null,e.v!=null?(rel||custo):'sem dados no período'),(rel&&custo)?h('small',null,custo):null));
  }));
});

/* ---- aba Semana a semana ---- */
dash.draw('w-leg',function(el){
  if(!ready()){el.replaceChildren();return;}
  el.replaceChildren(h('span',null,h('i',{style:'background:'+dash.colors[0]}),'Gasto no Meta'),h('span',null,h('i',{style:'background:'+dash.colors[1]}),'Faturamento da loja Online'));
});
dash.draw('w-chart',function(el){
  el.replaceChildren();
  if(!ready())return;
  var W=semanas();if(!W.length)return;
  var el2=el,Wd=Math.max(300,el.clientWidth),Hh=260,mg={l:54,r:8,t:12,b:28};
  var ks=W.map(function(w){return w.sem;});
  var x=d3.scaleBand().domain(ks).range([mg.l,Wd-mg.r]).padding(.2);
  var xi=d3.scaleBand().domain(['g','f']).range([0,x.bandwidth()]).padding(.08);
  var y=d3.scaleLinear().domain([0,(d3.max(W,function(w){return Math.max(w.a.gasto,w.a.fat);})||1)*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+Wd+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(4)).join('line').attr('x1',mg.l).attr('x2',Wd-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=Wd<520?3:(Wd<900?2:1);
  svg.append('g').selectAll('text').data(ks.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(ddmm);
  var bars=[['g','gasto',0],['f','fat',1]];
  bars.forEach(function(b){
    svg.append('g').selectAll('rect').data(W).join('rect').attr('x',function(w){return x(w.sem)+xi(b[0]);}).attr('width',xi.bandwidth()).attr('y',function(w){return y(w.a[b[1]]);}).attr('height',function(w){return y(0)-y(w.a[b[1]]);}).attr('rx',3).attr('fill',dash.colors[b[2]]);
  });
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',Wd-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*Wd/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(W.length-1,i));var w=W[i];showTip(ev,[{t:'Semana de '+ddmm(w.sem)+' ('+w.a.dias+' dias)'},{c:dash.colors[0],t:bf.format(w.a.gasto)+' de gasto'},{c:dash.colors[1],t:bf.format(w.a.fat)+' de faturamento'},{t:'ROAS '+nz(ratio(w.a.fat,w.a.gasto),fx)+'x'}]);}).on('pointerleave',hideTip);
});
dash.draw('w-t',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var W=semanas().slice().reverse();
  tb.replaceChildren.apply(tb,W.map(function(w){
    var a=w.a;
    return linha([dmy(w.sem),nf.format(a.dias),bf.format(a.gasto),nf.format(a.conv),a.temNeg?nf.format(a.neg):'—',a.temNeg?nf.format(a.gan):'—',nf.format(a.ped),bf.format(a.fat),a.gasto?fx.format(a.fat/a.gasto)+'x':'—',a.ped?bf.format(a.gasto/a.ped):'—'],1);
  }));
});

/* ---- aba Campanhas ---- */
dash.draw('c-obj',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var R=campRows(),G=porChave(R,function(r){return r.objetivo;}),T=sum(G,function(g){return g.gasto;}),C=sum(G,function(g){return g.conv;});
  var rows=G.map(function(g){return linha([g.k,bf.format(g.gasto),pf(ratio(g.gasto,T)),nf.format(g.conv),g.conv?bf2.format(g.gasto/g.conv):'—'],1);});
  rows.push(linha(['Total',bf.format(T),pf(T?1:null),nf.format(C),C?bf2.format(T/C):'—'],1,'tot'));
  tb.replaceChildren.apply(tb,rows);
});
dash.draw('c-grp',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var G=porChave(campRows(),function(r){return r.grupo;});
  tb.replaceChildren.apply(tb,G.map(function(g){return linha([g.k,g.ex.objetivo,nf.format(Object.keys(g.camps).length),bf.format(g.gasto),nf.format(g.conv),g.conv?bf2.format(g.gasto/g.conv):'—'],2);}));
});
dash.draw('c-top',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var G=porChave(campRows(),function(r){return r.campanha_id;}).slice(0,TOP_CAMP);
  tb.replaceChildren.apply(tb,G.map(function(g){return linha([g.ex.campanha,g.ex.grupo,bf.format(g.gasto),nf.format(g.conv),g.conv?bf2.format(g.gasto/g.conv):'—',pf(ratio(g.clk,g.imp))],2);}));
});

/* ---- aba Atendimento ---- */
dash.draw('a-sem',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var W=semanas().filter(function(w){return w.a.temNeg;}).reverse();
  tb.replaceChildren.apply(tb,W.map(function(w){
    var a=w.a;
    return linha([dmy(w.sem),nf.format(a.diasNeg),nf.format(a.neg),nf.format(a.sat),pf(ratio(a.sat,a.neg)),nf.format(a.gan),pf(ratio(a.gan,a.neg)),bf.format(a.val),a.gan?bf.format(a.val/a.gan):'—'],1);
  }));
});
dash.draw('a-et',function(el){
  el.replaceChildren();
  if(!ready())return;
  var R=D('funil_etapa_semana'),sem={},et={};
  R.forEach(function(r){sem[r.semana]=sem[r.semana]||{};sem[r.semana][r.etapa]=(sem[r.semana][r.etapa]||0)+r.negocios;et[r.etapa]=1;});
  var cols=ETAPAS_ORD.filter(function(c){return et[c];}).concat(Object.keys(et).filter(function(c){return ETAPAS_ORD.indexOf(c)<0;}));
  var ks=Object.keys(sem).sort().reverse();
  var tbl=h('table',null,
    h('thead',null,h('tr',null,h('th',{class:'l'},'Semana de criação'),cols.map(function(c){return h('th',null,c.charAt(0)+c.slice(1).toLowerCase());}),h('th',null,'Total'))),
    h('tbody',null,ks.map(function(k){var t=sum(cols,function(c){return sem[k][c];});return linha([dmy(k)].concat(cols.map(function(c){return nf.format(sem[k][c]||0)+' ('+pf(ratio(sem[k][c]||0,t))+')';})).concat([nf.format(t)]),1);})));
  el.append(tbl);
});

dash.draw('f-nota',function(el){
  if(!ready()){el.textContent='—';return;}
  var i=D('funil_info')[0];
  el.textContent='Meta e ERP de '+dmy(i.periodo_ini)+' a '+dmy(i.periodo_fim)+'. O DataCrazy só tem negócios desde '+dmy(i.negocios_desde)+'. Em '+nf.format(i.dias_no_periodo-i.dias_com_venda_online)+' dos '+nf.format(i.dias_no_periodo)+' dias o ERP não registrou pedido na loja Online (a maioria domingos); o gasto desses dias entra no ROAS e no CAC. Ganho é o status atual do negócio, e parte dos negócios criados recentemente ainda vai fechar.';
});

function setTab(t){
  S.tab=t;
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.setAttribute('aria-selected',String(b.getAttribute('data-tab')===t));});
  document.querySelectorAll('.cc-pane[id]').forEach(function(p){p.hidden=p.id!==t;});
  try{dash.setLink(t);}catch(e){}
  redraw();
}
var booted=false;
dash.onData(function(){
  if(S.mes==null&&ready())S.mes=ultimoMes();
  if(booted)return;booted=true;
  $('#cc').style.setProperty('--cc-accent',dash.colors[0]);
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.addEventListener('click',function(){setTab(b.getAttribute('data-tab'));});});
  var named=(location.hash||'').slice(1);
  if(['funil','semanas','campanhas','atendimento'].indexOf(named)>=0)S.tab=named;
  setTab(S.tab);
});
}
