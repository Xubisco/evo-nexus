// @ts-nocheck
/* Portado do Artifact "boletos-fabricas" (claude.ai). A lógica é a da página original;
   os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var S={tab:'janelas',grupo:'top6',medida:'saldo'};
var NAMES=['sub','aviso','f-grupo','k-fat','k-fat-d','k-bol','k-bol-d','k-fre','k-fre-d','k-saldo','k-saldo-d','k-fut','k-fut-d','j-leg','j-chart','j-t','f-medida','m-h','m-t','r-t','d-info','p-t'];
var $=function(s){return document.querySelector(s);};
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var kf=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
function k(v){if(v==null||!isFinite(v))return '—';if(Math.abs(v)<50)return '0';return kf.format(v/1000);}
function dmy(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';}
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var q in props){var v=props[q];if(q==='class')e.className=v;else if(q==='text')e.textContent=v;else e.setAttribute(q,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
var IDS=['boletos_janela','boletos_fabrica','boletos_info','boletos_pendencias'];
function ready(){return IDS.every(function(i){return dash.data(i).status==='ok';});}
function D(i){return dash.data(i).data;}
function sum(a,f){return a.reduce(function(s,x){return s+(f(x)||0);},0);}
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
function info(){return D('boletos_info')[0];}
function linhas(){var g=S.grupo;return D('boletos_janela').filter(function(r){return g==='todas'||r.top6;});}
function janelas(){
  var m={};
  D('boletos_janela').forEach(function(r){m[r.janela]={janela:r.janela,rotulo:r.rotulo,fase:r.fase};});
  return Object.keys(m).sort().map(function(x){return m[x];});
}
function porJanela(){
  var L=linhas();
  return janelas().map(function(j){
    var R=L.filter(function(r){return r.janela===j.janela;});
    var fat=sum(R,function(r){return r.faturamento;}),bol=sum(R,function(r){return r.boleto_mercadoria;}),fre=sum(R,function(r){return r.frete;});
    return {j:j,fat:fat,bol:bol,fre:fre,saldo:fat-bol-fre,minima:bol+fre,queima:R.filter(function(r){return r.saldo<0;}).length,nfab:R.length};
  });
}
function faseTxt(f){return f==='passada'?'Fechada':f==='atual'?'Em andamento':'Futura';}

/* ---- topo ---- */
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var i=info(),P=porJanela(),fut=P.filter(function(p){return p.j.fase!=='passada';});
  var neg=P.filter(function(p){return p.j.fase==='passada'&&p.saldo<0;}).length;
  el.textContent=(S.grupo==='todas'?'Todas as fábricas':'As seis maiores fábricas')+', janelas de 10 dias desde 01/08. Posição em '+dmy(i.hoje)+'. '+neg+' janela'+(neg===1?'':'s')+' fechada'+(neg===1?'':'s')+' com saldo negativo; boletos e frete a vencer somam '+bf.format(sum(fut,function(p){return p.minima;}))+'.';
});
dash.draw('aviso',function(el){
  el.replaceChildren();
  if(!ready()){el.hidden=true;return;}
  var i=info(),msgs=[];
  var dias=(new Date(i.hoje)-new Date(i.ultimo_pagamento_no_csv))/86400000;
  if(dias>3)msgs.push('O export de contas a pagar tem pagamentos só até '+dmy(i.ultimo_pagamento_no_csv)+'. Boletos pagos depois aparecem em aberto até o próximo export.');
  el.hidden=!msgs.length;
  msgs.forEach(function(m){el.append(h('p',{text:m}));});
});
dash.draw('f-grupo',function(sel){
  if(!ready()){sel.replaceChildren();return;}
  sel.replaceChildren(new Option('Seis maiores por faturamento','top6'),new Option('Todas as fábricas','todas'));
  sel.value=S.grupo;
  sel.onchange=function(){S.grupo=sel.value;redraw();};
});

/* ---- aba Janelas ---- */
function tot(){
  var P=porJanela(),pass=P.filter(function(p){return p.j.fase!=='futura';}),fut=P.filter(function(p){return p.j.fase==='futura';});
  return {P:P,pass:pass,fut:fut};
}
setText('k-fat',function(){return bf.format(sum(tot().pass,function(p){return p.fat;}));});
setText('k-fat-d',function(){return 'de 01/08 até a janela atual';});
setText('k-bol',function(){return bf.format(sum(tot().pass,function(p){return p.bol;}));});
setText('k-bol-d',function(){var t=tot().pass,b=sum(t,function(p){return p.bol;});return b?'cobertos '+Math.round(sum(t,function(p){return p.fat;})/b*100)+'% pelo faturamento':'';});
setText('k-fre',function(){return bf.format(sum(tot().pass,function(p){return p.fre;}));});
setText('k-fre-d',function(){return 'pago ou em aberto';});
setText('k-saldo',function(){var s=sum(tot().pass,function(p){return p.saldo;});return (s<0?'−':'')+bf.format(Math.abs(s));});
dash.draw('k-saldo-d',function(el){
  if(!ready()){el.textContent='';el.className='';return;}
  var s=sum(tot().pass,function(p){return p.saldo;});
  setCls(el,s<0?'down':'up',s<0?'faturamento não cobre boletos e frete':'faturamento cobre boletos e frete');
});
setText('k-fut',function(){return bf.format(sum(tot().fut,function(p){return p.minima;}));});
setText('k-fut-d',function(){var f=tot().fut;return f.length?f.length+' janelas futuras, '+bf.format(sum(f,function(p){return p.minima;})/f.length)+' em média':'';});

var COR={fat:'#2f6f8f',bol:'#c96a3c'};
dash.draw('j-leg',function(el){
  el.replaceChildren();
  if(!ready())return;
  el.append(h('span',null,h('i',{style:'background:'+COR.fat}),'Faturamento'),h('span',null,h('i',{style:'background:'+COR.bol}),'Boletos e frete'));
});
dash.draw('j-chart',function(el){
  el.replaceChildren();
  if(!ready())return;
  var P=porJanela(),W=el.clientWidth||600,H=300,m={t:12,r:8,b:34,l:44};
  var x0=d3.scaleBand().domain(P.map(function(p){return p.j.janela;})).range([m.l,W-m.r]).paddingInner(0.2);
  var x1=d3.scaleBand().domain(['fat','bol']).range([0,x0.bandwidth()]).padding(0.08);
  var ymax=d3.max(P,function(p){return Math.max(p.fat,p.minima);})||1;
  var y=d3.scaleLinear().domain([0,ymax*1.08]).nice().range([H-m.b,m.t]);
  var svg=d3.create('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+H);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y).attr('y2',y).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',m.l-6).attr('y',y).attr('dy','0.32em').attr('text-anchor','end').text(function(v){return v?nf.format(v/1000)+' mil':'0';});
  var step=Math.ceil(P.length/(W/46));
  svg.append('g').selectAll('text').data(P.filter(function(_,i){return i%step===0;})).join('text').attr('x',function(p){return x0(p.j.janela)+x0.bandwidth()/2;}).attr('y',H-m.b+16).attr('text-anchor','middle').attr('font-style',function(p){return p.j.fase==='futura'?'italic':'normal';}).text(function(p){return p.j.rotulo;});
  var g=svg.append('g').selectAll('g').data(P).join('g').attr('transform',function(p){return 'translate('+x0(p.j.janela)+',0)';});
  [['fat',function(p){return p.fat;}],['bol',function(p){return p.minima;}]].forEach(function(s){
    g.append('rect').attr('x',x1(s[0])).attr('width',x1.bandwidth()).attr('y',function(p){return y(s[1](p));}).attr('height',function(p){return y(0)-y(s[1](p));}).attr('fill',COR[s[0]]).attr('rx',2).attr('opacity',function(p){return p.j.fase==='futura'?0.55:1;});
  });
  g.append('rect').attr('x',0).attr('width',x0.bandwidth()).attr('y',m.t).attr('height',H-m.t-m.b).attr('fill','transparent')
    .on('mousemove',function(ev,p){showTip(ev,[{t:p.j.rotulo+' · '+faseTxt(p.j.fase)},{c:COR.fat,t:'Faturamento '+bf.format(p.fat)},{c:COR.bol,t:'Boletos '+bf.format(p.bol)+' + frete '+bf.format(p.fre)},{t:'Saldo '+(p.saldo<0?'−':'')+bf.format(Math.abs(p.saldo))}]);})
    .on('mouseleave',hideTip);
  el.append(svg.node());
});
dash.draw('j-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  var P=porJanela();
  P.forEach(function(p){
    var fut=p.j.fase==='futura',neg=!fut&&p.saldo<0;
    tb.append(h('tr',null,
      h('td',{class:'l',text:p.j.rotulo}),
      h('td',{text:faseTxt(p.j.fase)}),
      h('td',{text:fut?'—':bf.format(p.fat)}),
      h('td',{text:bf.format(p.bol)}),
      h('td',{text:bf.format(p.fre)}),
      h('td',{class:fut?'':(neg?'neg':'pos'),text:fut?'—':(p.saldo<0?'−':'')+bf.format(Math.abs(p.saldo))}),
      h('td',{text:bf.format(p.minima)}),
      h('td',{text:p.queima?String(p.queima):'—'})));
  });
});

/* ---- aba Fábrica × janela ---- */
var MEDIDAS=[['saldo','Saldo (faturamento − boletos − frete)'],['boletos','Boletos e frete'],['fat','Faturamento']];
dash.draw('f-medida',function(sel){
  if(!ready()){sel.replaceChildren();return;}
  sel.replaceChildren.apply(sel,MEDIDAS.map(function(m){return new Option(m[1],m[0]);}));
  sel.value=S.medida;
  sel.onchange=function(){S.medida=sel.value;redraw();};
});
function valor(r){return S.medida==='fat'?r.faturamento:S.medida==='boletos'?r.boleto_mercadoria+r.frete:r.saldo;}
function fabricas(){
  var L=linhas(),m={};
  L.forEach(function(r){m[r.fabrica]=(m[r.fabrica]||0)+r.faturamento;});
  return Object.keys(m).sort(function(a,b){return m[b]-m[a];});
}
dash.draw('m-h',function(th){
  th.replaceChildren();
  if(!ready())return;
  th.append(h('tr',null,h('th',{class:'l',text:'Fábrica'}),janelas().map(function(j){return h('th',{class:j.fase==='futura'?'fut':'',text:j.rotulo});}),h('th',{text:'Total'})));
});
dash.draw('m-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  var L=linhas(),J=janelas(),tj={};
  fabricas().forEach(function(f){
    var tt=0;
    var cells=J.map(function(j){
      var r=L.find(function(x){return x.fabrica===f&&x.janela===j.janela;});
      if(!r)return h('td',{class:j.fase==='futura'?'fut':'',text:'—'});
      var v=valor(r);tt+=v;tj[j.janela]=(tj[j.janela]||0)+v;
      var queima=r.saldo<0&&j.fase!=='futura';
      var cls=(j.fase==='futura'?'fut ':'')+(S.medida==='saldo'&&queima?'neg queima':'');
      return h('td',{class:cls,text:k(v)});
    });
    tb.append(h('tr',null,h('td',{class:'l',text:f}),cells,h('td',{class:S.medida==='saldo'&&tt<0?'neg':'',text:k(tt)})));
  });
  var gt=0;
  tb.append(h('tr',{class:'tot'},h('td',{class:'l',text:'Total'}),J.map(function(j){var v=tj[j.janela]||0;gt+=v;return h('td',{class:S.medida==='saldo'&&v<0?'neg':'',text:k(v)});}),h('td',{text:k(gt)})));
});

/* ---- aba Resumo ---- */
dash.draw('r-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  var R=D('boletos_fabrica').filter(function(r){return S.grupo==='todas'||r.top6;});
  R.forEach(function(r){
    tb.append(h('tr',null,h('td',{class:'l',text:r.fabrica}),h('td',{text:bf.format(r.faturamento)}),h('td',{text:bf.format(r.boleto_pago)}),h('td',{text:bf.format(r.boleto_aberto)}),h('td',{text:bf.format(r.frete)}),
      h('td',{class:r.saldo<0?'neg':'pos',text:(r.saldo<0?'−':'')+bf.format(Math.abs(r.saldo))}),h('td',{text:String(r.janelas_a_queimar)})));
  });
  var s=function(f){return sum(R,f);};
  var sd=s(function(r){return r.saldo;});
  tb.append(h('tr',{class:'tot'},h('td',{class:'l',text:'Total'}),h('td',{text:bf.format(s(function(r){return r.faturamento;}))}),h('td',{text:bf.format(s(function(r){return r.boleto_pago;}))}),h('td',{text:bf.format(s(function(r){return r.boleto_aberto;}))}),h('td',{text:bf.format(s(function(r){return r.frete;}))}),h('td',{class:sd<0?'neg':'pos',text:(sd<0?'−':'')+bf.format(Math.abs(sd))}),h('td',{text:''})));
});

/* ---- aba Dados ---- */
dash.draw('d-info',function(el){
  el.replaceChildren();
  if(!ready())return;
  var i=info();
  [['Posição calculada em',dmy(i.hoje)],['Arquivo de contas a pagar',i.arquivo_pagar+' ('+nf.format(i.titulos_lidos)+' parcelas)'],['Último pagamento no export',dmy(i.ultimo_pagamento_no_csv)],['Última venda na base',dmy(i.ultima_venda)],['Última compra Gerais Mobili / Ponto Caza (só compra quando vende)',dmy(i.gerais_pontocaza_ate)],['Compras Gerais/Ponto Caza de eletros (fora do estudo)',bf.format(i.gerais_eletro_excluido)],['Vendas sem fábrica',bf.format(i.vendas_sem_fabrica_total)],['Boletos de fábrica sem fábrica',bf.format(i.boleto_sem_fabrica_total)]].forEach(function(p){
    el.append(h('p',null,h('b',{text:p[0]+': '}),p[1]));
  });
});
dash.draw('p-t',function(tb){
  tb.replaceChildren();
  if(!ready())return;
  var P=D('boletos_pendencias');
  if(!P.length){tb.append(h('tr',null,h('td',{class:'l',text:'Nenhuma pendência'}),h('td'),h('td')));return;}
  P.forEach(function(p){tb.append(h('tr',null,h('td',{class:'l',text:p.tipo}),h('td',{class:'l wrap',text:p.item}),h('td',{text:bf.format(p.valor)})));});
});

/* ---- abas ---- */
function mostra(){
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===S.tab?'true':'false');});
  document.querySelectorAll('.cc-pane').forEach(function(p){p.hidden=p.id!==S.tab;});
}
dash.onData(function(){
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.onclick=function(){S.tab=b.dataset.tab;mostra();redraw();};});
  mostra();
});
}
