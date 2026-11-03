// @ts-nocheck
/* Portado do Artifact "caixa-contas" (claude.ai). A lógica é a da página original;
   os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var COBRANCA=['Pagamento na entrega','Crediário da casa','Vale'];
var CLASSES=['Cartão de crédito','PIX','Dinheiro','Cartão de débito','Financeira','Link de pagamento','Pagamento na entrega','Crediário da casa','Vale','Outros / sistema antigo'];
var DESDE='2026-09';
var S={tab:'caixa'};
var NAMES=['sub','k-din','k-din-d','k-vend','k-pend','k-pend-d','k-tit','k-sang','k-sang-d','c-sub','c-lojas','c-formas','c-outras','c-mov','f-leg','f-chart','f-regra','f-cobr','p-total','p-total-d','p-op','p-op-d','p-banc','p-banc-d','p-conc','p-banc-t','p-bt-t','p-sem-leg','p-sem','p-mes-t','p-cat-t','p-regra','p-lan','p-lan-d','p-lan-l','p-lan-t','p-nota','r-cobr','r-cobr-d','r-cobr-l','r-aberto','r-venc','r-chart','rodape'];
var $=function(s){return document.querySelector(s);};
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var bf2=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
var cf=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
var pf=function(v){return v==null||!isFinite(v)?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(v*100)+'%';};
var ml=function(m){return MES[+m.slice(5)-1]+'/'+m.slice(2,4);};
var dmy=function(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(2,4):'—';};
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var k in props){var v=props[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
var IDS=['caixa_lojas','caixa_formas','caixa_movimentos','pagamento_mes','lancamentos_mes','posicao_financeira'];
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
function msg(el,t){el.replaceChildren(h('p',{class:'cc-muted',style:'padding:2rem 0;text-align:center'},t));}
function redraw(){NAMES.forEach(function(n){dash.draw(n);});}
function setText(name,fn){dash.draw(name,function(el){el.textContent=ready()?fn():'—';});}
function setCls(el,cls,t){el.className=cls||'';el.textContent=t;}
function color(i){return CLASSES[i]==='Outros / sistema antigo'?'var(--cds-chart-muted)':dash.colors[i%8];}
function months(){return Array.from(new Set(D('pagamento_mes').map(function(r){return r.mes;}))).sort();}
function mesTotal(mes){return sum(D('pagamento_mes').filter(function(r){return r.mes===mes;}),function(r){return r.valor;});}
function mesCobr(mes){return sum(D('pagamento_mes').filter(function(r){return r.mes===mes&&COBRANCA.indexOf(r.classe)>=0;}),function(r){return r.valor;});}
function lastMes(){var m=months();return m[m.length-1];}

/* ---- topo ---- */
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var cl=D('caixa_lojas');el.textContent='Caixa de '+dmy(cl[0].dia)+' · posição financeira de '+dmy(D('posicao_financeira')[0].data)+' · empresa inteira';
});
setText('k-din',function(){return bf2.format(sum(D('caixa_lojas'),function(r){return r.saldo;}));});
dash.draw('k-din-d',function(el){
  if(!ready()){el.textContent='';return;}
  var ab=D('caixa_lojas').filter(function(r){return r.status==='Aberto';}).length;
  el.textContent=ab?ab+' caixa ainda aberto':'Todos os caixas fechados';
});
setText('k-vend',function(){return bf2.format(sum(D('caixa_formas').filter(function(r){return r.origem==='Vendas do dia';}),function(r){return r.valor;}));});
function pendencia(){return sum(D('caixa_formas').filter(function(r){return r.origem==='Vendas do dia'&&r.forma.indexOf('Pendência')===0;}),function(r){return r.valor;});}
function vendDia(){return sum(D('caixa_formas').filter(function(r){return r.origem==='Vendas do dia';}),function(r){return r.valor;});}
setText('k-pend',function(){return bf2.format(pendencia());});
dash.draw('k-pend-d',function(el){if(!ready()){el.textContent='';return;}var v=vendDia();el.textContent=v?pf(pendencia()/v)+' das vendas do dia':'';});
setText('k-tit',function(){return bf2.format(sum(D('caixa_formas').filter(function(r){return r.origem==='Recebimento de títulos';}),function(r){return r.valor;}));});
function sangrias(){return D('caixa_movimentos').filter(function(r){return r.tipo==='Sangria';});}
setText('k-sang',function(){return bf2.format(sum(sangrias(),function(r){return r.valor;}));});
dash.draw('k-sang-d',function(el){if(!ready()){el.textContent='';return;}var n=sangrias().length;el.textContent=n+(n===1?' retirada':' retiradas');});

/* ---- caixa de hoje ---- */
dash.draw('c-sub',function(el){el.textContent=ready()?'Posição de '+dmy(D('caixa_lojas')[0].dia):'—';});
dash.draw('c-lojas',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var rows=D('caixa_lojas');
  tb.replaceChildren.apply(tb,rows.map(function(r){
    return h('tr',null,h('td',{class:'l'},r.loja),h('td',{class:'l'},r.operador),h('td',{class:'l'},h('span',{class:'cc-flag'},r.status)),h('td',null,r.abertura||'—'),h('td',null,r.fechamento||'—'),h('td',null,r.saldo==null?'—':bf2.format(r.saldo)));
  }).concat([h('tr',{class:'tot'},h('td',{class:'l'},'Total'),h('td'),h('td'),h('td'),h('td'),h('td',null,bf2.format(sum(rows,function(r){return r.saldo;}))))]));
});
dash.draw('c-formas',function(el){
  if(!ready()){el.replaceChildren();return;}
  var rows=D('caixa_formas').filter(function(r){return r.origem==='Vendas do dia';}).sort(function(a,b){return b.valor-a.valor;});
  el.replaceChildren();var el2=el;
  if(!rows.length){msg(el,'Sem vendas no dia.');return;}
  var W=Math.max(300,el.clientWidth),rh=28,mg={l:Math.min(150,Math.round(W*.34)),r:84,t:6,b:6},Hh=mg.t+mg.b+rows.length*rh;
  var x=d3.scaleLinear().domain([0,d3.max(rows,function(r){return r.valor;})||1]).range([mg.l,W-mg.r]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  var g=svg.append('g').selectAll('g').data(rows).join('g').attr('transform',function(r,i){return 'translate(0,'+(mg.t+i*rh)+')';});
  g.append('text').attr('x',mg.l-8).attr('y',rh/2+4).attr('text-anchor','end').text(function(r){return r.forma;});
  g.append('rect').attr('x',x(0)).attr('y',5).attr('height',rh-10).attr('width',function(r){return Math.max(1,x(r.valor)-x(0));}).attr('rx',4).attr('fill',function(r){return r.forma.indexOf('Pendência')===0?'var(--color-warn)':dash.colors[0];});
  g.append('text').attr('x',function(r){return x(r.valor)+6;}).attr('y',rh/2+4).text(function(r){return bf.format(r.valor);});
  g.append('rect').attr('x',0).attr('y',0).attr('width',W).attr('height',rh).attr('fill','transparent').on('pointermove',function(ev,r){showTip(ev,[{t:r.forma},{t:bf2.format(r.valor)},{t:pf(r.valor/vendDia())+' das vendas do dia'}]);}).on('pointerleave',hideTip);
});
dash.draw('c-outras',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var rows=D('caixa_formas').filter(function(r){return r.origem!=='Vendas do dia';});
  tb.replaceChildren.apply(tb,rows.map(function(r){return h('tr',null,h('td',{class:'l'},r.origem),h('td',{class:'l'},r.forma),h('td',null,bf2.format(r.valor)));}));
});
dash.draw('c-mov',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var rows=D('caixa_movimentos');
  tb.replaceChildren.apply(tb,rows.map(function(r){return h('tr',null,h('td',{class:'l'},r.hora),h('td',{class:'l'},r.loja),h('td',{class:'l'},r.tipo),h('td',{class:'l wrap'},r.motivo),h('td',null,bf2.format(r.valor)));}));
});

/* ---- formas de pagamento ---- */
dash.draw('f-leg',function(el){
  if(!ready()){el.replaceChildren();return;}
  el.replaceChildren.apply(el,CLASSES.map(function(c,i){return h('span',{style:'--c:'+color(i)},h('i'),c);}));
});
dash.draw('f-chart',function(el){
  if(!ready()){el.replaceChildren();return;}
  var ms=months(),el2=el;el.replaceChildren();
  var by=new Map();D('pagamento_mes').forEach(function(r){by.set(r.mes+'|'+r.classe,r.valor);});
  var W=Math.max(300,el.clientWidth),Hh=300,mg={l:54,r:8,t:12,b:28};
  var x=d3.scaleBand().domain(ms).range([mg.l,W-mg.r]).padding(.2);
  var tots=ms.map(mesTotal),y=d3.scaleLinear().domain([0,(d3.max(tots)||1)*1.05]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=W<520?3:(W<900?2:1);
  svg.append('g').selectAll('text').data(ms.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(ml);
  ms.forEach(function(k){
    var acc=0;
    CLASSES.forEach(function(c,i){
      var v=by.get(k+'|'+c)||0;if(!v)return;
      svg.append('rect').attr('x',x(k)).attr('width',x.bandwidth()).attr('y',y(acc+v)).attr('height',y(acc)-y(acc+v)).attr('fill',color(i));
      acc+=v;
    });
  });
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(ms.length-1,i));var k=ms[i];
      var lines=[{t:ml(k)+' · '+bf.format(mesTotal(k))}];CLASSES.forEach(function(c,j){var v=by.get(k+'|'+c)||0;if(v)lines.push({c:color(j),t:c+': '+bf.format(v)+' ('+pf(v/mesTotal(k))+')'});});showTip(ev,lines);}).on('pointerleave',hideTip);
});
dash.draw('f-regra',function(el){el.textContent='Em cobrança: '+COBRANCA.join(', ').toLowerCase()+'. A tabela vai de '+ml(DESDE)+' em diante.';});
dash.draw('f-cobr',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var ms=months().filter(function(k){return k>=DESDE;}).reverse(),by=new Map();
  D('pagamento_mes').forEach(function(r){by.set(r.mes+'|'+r.classe,r.valor);});
  tb.replaceChildren.apply(tb,ms.map(function(k){
    var t=mesTotal(k),c=mesCobr(k);
    return h('tr',null,h('td',{class:'l'},ml(k)),h('td',null,bf.format(t)),h('td',null,bf.format(c)),h('td',null,pf(t?c/t:null)),h('td',null,bf.format(by.get(k+'|Pagamento na entrega')||0)),h('td',null,bf.format(by.get(k+'|Crediário da casa')||0)),h('td',null,bf.format(by.get(k+'|Vale')||0)));
  }));
});

/* ---- a pagar ---- */
function lanMeses(){return Array.from(new Set(D('lancamentos_mes').map(function(r){return r.mes;}))).sort();}
function lanMes(k,campo){return sum(D('lancamentos_mes').filter(function(r){return r.mes===k;}),function(r){return r[campo];});}
dash.draw('p-lan-l',function(el){el.textContent=ready()?'Lançado em '+ml(lanMeses().slice(-1)[0]):'Lançado no mês';});
setText('p-lan',function(){return bf.format(lanMes(lanMeses().slice(-1)[0],'pagar'));});
dash.draw('p-lan-d',function(el){
  if(!ready()){el.textContent='';return;}
  var m=lanMeses();if(m.length<2){el.textContent='';return;}
  var a=lanMes(m[m.length-1],'pagar'),b=lanMes(m[m.length-2],'pagar'),d=b?a/b-1:null;
  setCls(el,d==null?'':(d>0.005?'down':(d<-0.005?'up':'')),d==null?'':((d>0?'+':'')+pf(d)+' vs '+ml(m[m.length-2])));
});
dash.draw('p-lan-t',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  tb.replaceChildren.apply(tb,lanMeses().slice().reverse().map(function(k){return h('tr',null,h('td',{class:'l'},ml(k)),h('td',null,bf.format(lanMes(k,'pagar'))),h('td',null,bf.format(lanMes(k,'receber'))));}));
});

var PIDS=['pagar_resumo','pagar_semana','pagar_mes','pagar_categoria','pagar_bancos','pagar_bancos_titulos','pagar_qualidade'];
var BANCOS='Débitos bancários',SEM_N=13,MES_N=16,BANCO_ANO='2026';
function readyP(){return PIDS.every(function(i){return dash.data(i).status==='ok';});}
function setP(name,fn){dash.draw(name,function(el){el.textContent=readyP()?fn():'—';});}
function rs(grupo,bloco){var r=D('pagar_resumo').filter(function(x){return x.grupo===grupo&&x.bloco===bloco;})[0];return r?r.valor:0;}
function linha(textos,nl,cls){return h('tr',cls?{class:cls}:null,textos.map(function(t,i){return h('td',i<nl?{class:'l'}:null,t);}));}

setP('p-total',function(){return bf.format(rs('todos','total'));});
setP('p-total-d',function(){return 'vencido '+bf.format(rs('todos','vencido'))+' · a vencer '+bf.format(rs('todos','a_vencer'));});
setP('p-op',function(){return bf.format(rs('operacional','total'));});
setP('p-op-d',function(){return 'vencido '+bf.format(rs('operacional','vencido'));});
setP('p-banc',function(){return bf.format(rs('bancos','total'));});
dash.draw('p-banc-d',function(el){
  if(!readyP()){el.textContent='';return;}
  var t=rs('bancos','total'),v=rs('bancos','vencido');
  setCls(el,v>0?'down':'',v>0?bf.format(v)+' vencido ('+pf(t?v/t:null)+')':'nada vencido');
});
setP('p-conc',function(){return bf.format(rs('todos','a_conciliar'));});

dash.draw('p-banc-t',function(tb){
  if(!readyP()){tb.replaceChildren();return;}
  var R=D('pagar_bancos').slice().sort(function(a,b){return b.restante-a.restante;});
  var rows=R.map(function(r){return linha([r.banco,r.situacao,bf.format(r.restante),bf.format(r.vencido),bf.format(r.a_vencer),nf.format(r.parcelas_abertas),dmy(r.proxima_parcela),dmy(r.ultima_parcela)],2);});
  rows.push(linha(['Total','',bf.format(sum(R,function(r){return r.restante;})),bf.format(sum(R,function(r){return r.vencido;})),bf.format(sum(R,function(r){return r.a_vencer;})),nf.format(sum(R,function(r){return r.parcelas_abertas;})),'',''],2,'tot'));
  tb.replaceChildren.apply(tb,rows);
});
dash.draw('p-bt-t',function(tb){
  if(!readyP()){tb.replaceChildren();return;}
  var R=D('pagar_bancos_titulos').slice().sort(function(a,b){return b.restante-a.restante;});
  tb.replaceChildren.apply(tb,R.map(function(r){return linha([r.banco,r.descricao+(r.valor_estimado?' (valor estimado)':''),bf.format(r.restante),nf.format(r.parcelas_abertas),dmy(r.proximo_vencimento)],2);}));
});

function semRows(){return D('pagar_semana').filter(function(r){return r.semana!=='vencido';}).sort(function(a,b){return a.semana<b.semana?-1:1;}).slice(0,SEM_N);}
dash.draw('p-sem-leg',function(el){
  if(!readyP()){el.replaceChildren();return;}
  el.replaceChildren(h('span',null,h('i',{style:'background:'+dash.colors[0]}),'Operacional'),h('span',null,h('i',{style:'background:'+dash.colors[1]}),BANCOS));
});
dash.draw('p-sem',function(el){
  el.replaceChildren();
  if(!readyP())return;
  var rows=semRows();if(!rows.length)return;
  var el2=el,W=Math.max(300,el.clientWidth),Hh=240,mg={l:54,r:8,t:12,b:28};
  var ks=rows.map(function(r){return r.semana;});
  var x=d3.scaleBand().domain(ks).range([mg.l,W-mg.r]).padding(.2);
  var y=d3.scaleLinear().domain([0,(d3.max(rows,function(r){return r.valor;})||1)*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(4)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=W<520?3:(W<900?2:1);
  svg.append('g').selectAll('text').data(ks.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(function(d){return d.slice(8,10)+'/'+d.slice(5,7);});
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x',function(d){return x(d.semana);}).attr('width',x.bandwidth()).attr('y',function(d){return y(d.valor_operacional);}).attr('height',function(d){return y(0)-y(d.valor_operacional);}).attr('fill',dash.colors[0]);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x',function(d){return x(d.semana);}).attr('width',x.bandwidth()).attr('y',function(d){return y(d.valor);}).attr('height',function(d){return y(d.valor_operacional)-y(d.valor);}).attr('fill',dash.colors[1]);
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(rows.length-1,i));var d=rows[i];showTip(ev,[{t:'Semana de '+d.semana.slice(8,10)+'/'+d.semana.slice(5,7)},{c:dash.colors[0],t:bf.format(d.valor_operacional)+' operacional'},{c:dash.colors[1],t:bf.format(d.valor_bancos)+' '+BANCOS.toLowerCase()},{t:bf.format(d.valor)+' no total · '+nf.format(d.parcelas)+' parcelas'}]);}).on('pointerleave',hideTip);
});

dash.draw('p-mes-t',function(tb){
  if(!readyP()){tb.replaceChildren();return;}
  var by={};
  D('pagar_mes').forEach(function(r){var o=by[r.mes]||(by[r.mes]={op:0,bk:0});if(r.categoria===BANCOS)o.bk+=r.valor;else o.op+=r.valor;});
  var ms=Object.keys(by).sort(),show=ms.slice(0,MES_N),rest=ms.slice(MES_N);
  var rows=show.map(function(m){return linha([ml(m),bf.format(by[m].op),bf.format(by[m].bk),bf.format(by[m].op+by[m].bk)],1);});
  if(rest.length){var o=rest.reduce(function(s,m){return {op:s.op+by[m].op,bk:s.bk+by[m].bk};},{op:0,bk:0});rows.push(linha(['Depois, até '+ml(rest[rest.length-1]),bf.format(o.op),bf.format(o.bk),bf.format(o.op+o.bk)],1));}
  var T=ms.reduce(function(s,m){return {op:s.op+by[m].op,bk:s.bk+by[m].bk};},{op:0,bk:0});
  rows.push(linha(['Total',bf.format(T.op),bf.format(T.bk),bf.format(T.op+T.bk)],1,'tot'));
  tb.replaceChildren.apply(tb,rows);
});
dash.draw('p-cat-t',function(tb){
  if(!readyP()){tb.replaceChildren();return;}
  var R=D('pagar_categoria').slice().sort(function(a,b){return b.restante-a.restante;});
  var rows=R.map(function(r){return linha([r.categoria,nf.format(r.titulos),bf.format(r.restante),bf.format(r.a_conciliar)],1);});
  rows.push(linha(['Total',nf.format(sum(R,function(r){return r.titulos;})),bf.format(sum(R,function(r){return r.restante;})),bf.format(sum(R,function(r){return r.a_conciliar;}))],1,'tot'));
  tb.replaceChildren.apply(tb,rows);
});
dash.draw('p-regra',function(el){
  if(!readyP()){el.textContent='—';return;}
  var c=D('pagar_resumo')[0].corte;
  el.textContent='Valem os títulos em aberto que vencem a partir de '+dmy(c)+', mais os empréstimos bancários de '+BANCO_ANO+' em diante, mesmo vencidos antes. O que vencia antes fica em "a conciliar", fora dos totais. Dívida em aberto é dívida real.';
});
dash.draw('p-nota',function(el){
  if(!readyP()){el.textContent='—';return;}
  var q=D('pagar_qualidade')[0];
  el.textContent='Leitura do Unique em '+dmy(q.data)+'. '+q.valor_estimado_titulos+' títulos ('+bf.format(q.valor_estimado_soma)+') vieram sem valor restante e usam o valor total. Parcelas vencidas: '+q.parcelas_vencidas_projetadas+' projetadas contra '+q.parcelas_vencidas_informadas_unique+' informadas pelo Unique. '+q.sem_credor_real_titulos+' títulos ('+bf.format(q.sem_credor_real_valor)+') têm a própria empresa ou o sócio como credor no cadastro (guias, pró-labore), por isso não aparecem por credor.';
});


/* ---- a receber ---- */
dash.draw('r-cobr-l',function(el){el.textContent=ready()?'Vendido em cobrança em '+ml(lastMes()):'Vendido em cobrança no mês';});
setText('r-cobr',function(){return bf.format(mesCobr(lastMes()));});
dash.draw('r-cobr-d',function(el){if(!ready()){el.textContent='';return;}var k=lastMes(),t=mesTotal(k);el.textContent=t?pf(mesCobr(k)/t)+' do faturamento do mês':'';});
setText('r-aberto',function(){return bf.format(sum(D('posicao_financeira'),function(r){return r.aberto_receber;}));});
setText('r-venc',function(){return bf.format(sum(D('posicao_financeira'),function(r){return r.vencido_receber;}));});
dash.draw('r-chart',function(el){
  if(!ready()){el.replaceChildren();return;}
  var ms=months(),el2=el;el.replaceChildren();
  var W=Math.max(300,el.clientWidth),Hh=240,mg={l:54,r:8,t:12,b:28};
  var x=d3.scaleBand().domain(ms).range([mg.l,W-mg.r]).padding(.2);
  var y=d3.scaleLinear().domain([0,(d3.max(ms,mesCobr)||1)*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(4)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=W<520?3:(W<900?2:1);
  svg.append('g').selectAll('text').data(ms.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(ml);
  svg.append('g').selectAll('rect').data(ms).join('rect').attr('x',function(d){return x(d);}).attr('width',x.bandwidth()).attr('y',function(d){return y(mesCobr(d));}).attr('height',function(d){return y(0)-y(mesCobr(d));}).attr('rx',3).attr('fill',function(d){return d>=DESDE?dash.colors[0]:'var(--cds-chart-muted)';});
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(ms.length-1,i));var k=ms[i];showTip(ev,[{t:ml(k)},{c:dash.colors[0],t:bf.format(mesCobr(k))+' em cobrança'},{t:pf(mesTotal(k)?mesCobr(k)/mesTotal(k):null)+' do faturamento'}]);}).on('pointerleave',hideTip);
});

dash.draw('rodape',function(el){
  if(!ready()){el.textContent='—';return;}
  el.textContent='Formas de pagamento da base de vendas até '+ml(lastMes())+' (último mês em andamento). Caixa e posição financeira lidos do Unique em '+dmy(D('posicao_financeira')[0].data)+'. O Depósito não entra nas formas de pagamento.';
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
  if(booted)return;booted=true;
  $('#cc').style.setProperty('--cc-accent',dash.colors[0]);
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.addEventListener('click',function(){setTab(b.getAttribute('data-tab'));});});
  var named=(location.hash||'').slice(1);
  if(['caixa','formas','pagar','receber'].indexOf(named)>=0)S.tab=named;
  setTab(S.tab);
});
}
