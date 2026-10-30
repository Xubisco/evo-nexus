// @ts-nocheck
/* Portado de finance/base_estoque/dashboards/referencia/vendas_e_metas.page.html.
   A lógica é a da referência; os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var MESL=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var S={mes:'',loja:'',tab:'resumo'};
var NAMES=['sub','f-mes','f-loja','k-fat','k-fat-d','k-ped','k-ped-d','k-tic','k-tic-d','k-mg','k-mg-d','k-proj','k-proj-d','k-proj-l','r-acum-sub','r-acum-leg','r-acum','r-dia','r-ult-t','r-ult','r-lojas-sub','r-lojas','v-sub','v-chart','v-nota','v-corpo','e-sub','e-chart','e-cab','e-corpo','rodape'];
var $=function(s){return document.querySelector(s);};
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var cf=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
var pf=function(v){return v==null||!isFinite(v)?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(v*100)+'%';};
var ml=function(m){return MES[+m.slice(5)-1]+'/'+m.slice(2,4);};
var dmy=function(s){return s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(2,4);};
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var k in props){var v=props[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
function ready(){return ['vendas_dia','vendedor_mes','metas'].every(function(i){return dash.data(i).status==='ok';});}
var C=null;
function M(){
  var vd=dash.data('vendas_dia').data,vm=dash.data('vendedor_mes').data,mt=dash.data('metas').data;
  if(C&&C.vd===vd&&C.vm===vm&&C.mt===mt)return C;
  var months=Array.from(new Set(vd.map(function(r){return r.mes;}))).sort();
  var lojas=Array.from(new Set(vd.map(function(r){return r.loja;}))).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
  var LD=vd.reduce(function(a,r){return r.dia>a?r.dia:a;},'');
  C={vd:vd,vm:vm,mt:mt,months:months,lojas:lojas,LD:LD,last:LD.slice(0,7)};
  return C;
}
function curMes(){return S.mes||M().last;}
function addM(mes,n){var y=+mes.slice(0,4),m=+mes.slice(5)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+String(m+1).padStart(2,'0');}
function dim(mes){return new Date(Date.UTC(+mes.slice(0,4),+mes.slice(5),0)).getUTCDate();}
function cutDay(mes){var m=M(),sel=curMes();return (sel===m.last)?(+m.LD.slice(8)):dim(mes);}
function lojaOk(r){return !S.loja||r.loja===S.loja;}
function agg(mes,upTo,loja){
  var o={fat:0,ped:0,custo:0,lcc:0,dias:new Set()};
  M().vd.forEach(function(r){
    if(r.mes!==mes)return;if((loja!==undefined?loja:S.loja)&&r.loja!==(loja!==undefined?loja:S.loja))return;
    if(upTo&&+r.dia.slice(8)>upTo)return;
    o.fat+=r.fat;o.ped+=r.pedidos;o.custo+=r.custo;o.lcc+=r.lcc;o.dias.add(r.dia);
  });
  o.tic=o.ped?o.fat/o.ped:null;o.mg=o.lcc>0?1-o.custo/o.lcc:null;return o;
}
function delta(a,b,ratio){
  if(a==null||b==null||!isFinite(a)||!isFinite(b)||b===0)return null;
  return ratio?(a-b):(a/b-1);
}
function setDelta(el,d,suffix,pp){
  if(d==null){el.textContent='';el.className='';return;}
  var good=d>0.0005,bad=d<-0.0005;
  el.className=good?'up':(bad?'down':'flat');
  el.textContent=(d>0?'+':'')+(pp?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(d*100)+' p.p.':pf(d))+' '+suffix;
}
function periodNames(){var sel=curMes();return {sel:sel,prev:addM(sel,-1),yoy:addM(sel,-12),cut:cutDay(sel)};}
function tip(){return $('#vm-tip');}
function showTip(ev,lines){
  var t=tip(),er=$('#vm').getBoundingClientRect();
  t.replaceChildren.apply(t,lines.map(function(l){return h('div',null,l.c?h('i',{style:'background:'+l.c}):null,l.t);}));
  t.style.display='block';
  var x=ev.clientX-er.left+14,y=ev.clientY-er.top+14,w=t.offsetWidth;
  if(x+w>er.width)x=Math.max(0,ev.clientX-er.left-w-14);
  t.style.left=x+'px';t.style.top=y+'px';
}
function hideTip(){tip().style.display='none';}
function msg(el,t){el.replaceChildren(h('p',{class:'vm-muted',style:'padding:2rem 0;text-align:center'},t));}
function redraw(){NAMES.forEach(function(n){dash.draw(n);});}
function setText(name,fn){dash.draw(name,function(el){el.textContent=ready()?fn():'—';});}
function nomeCurto(n){
  var t=n.split(' '),skip=['DA','DE','DO','DAS','DOS','E'];
  var a=t[0],b=t.slice(1).filter(function(x){return skip.indexOf(x)<0;})[0]||'';
  return (a.charAt(0)+a.slice(1).toLowerCase()+(b?' '+b.charAt(0)+b.slice(1).toLowerCase():''));
}

/* ---- cabeçalho e filtros ---- */
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var m=M();el.textContent=ml(m.months[0])+' a '+ml(m.last)+' · dados até '+dmy(m.LD)+' · '+m.lojas.length+' lojas (sem o Depósito)';
});
dash.draw('f-mes',function(sel){
  if(!ready()){sel.replaceChildren();return;}
  var m=M();
  sel.replaceChildren.apply(sel,m.months.slice().reverse().map(function(k){return new Option(MESL[+k.slice(5)-1]+' de '+k.slice(0,4)+(k===m.last?' (em andamento)':''),k);}));
  sel.value=curMes();sel.onchange=function(){S.mes=sel.value===m.last?'':sel.value;redraw();};
});
dash.draw('f-loja',function(sel){
  if(!ready()){sel.replaceChildren();return;}
  sel.replaceChildren.apply(sel,[new Option('Todas as lojas','')].concat(M().lojas.map(function(l){return new Option(l,l);})));
  sel.value=S.loja;sel.onchange=function(){S.loja=sel.value;redraw();};
});

/* ---- indicadores ---- */
function cmp(){
  var p=periodNames(),a=agg(p.sel,p.cut),b=agg(p.prev,p.cut),y=agg(p.yoy,p.cut);
  return {p:p,a:a,b:b,y:y,hasY:M().months.indexOf(p.yoy)>=0,hasB:M().months.indexOf(p.prev)>=0};
}
setText('k-fat',function(){return bf.format(cmp().a.fat);});
dash.draw('k-fat-d',function(el){if(!ready()){el.textContent='';return;}var c=cmp();setDelta(el,c.hasB?delta(c.a.fat,c.b.fat):null,'vs mês anterior');});
setText('k-ped',function(){return nf.format(cmp().a.ped);});
dash.draw('k-ped-d',function(el){if(!ready()){el.textContent='';return;}var c=cmp();setDelta(el,c.hasB?delta(c.a.ped,c.b.ped):null,'vs mês anterior');});
setText('k-tic',function(){var t=cmp().a.tic;return t==null?'—':bf.format(t);});
dash.draw('k-tic-d',function(el){if(!ready()){el.textContent='';return;}var c=cmp();setDelta(el,c.hasB?delta(c.a.tic,c.b.tic):null,'vs mês anterior');});
setText('k-mg',function(){return pf(cmp().a.mg);});
dash.draw('k-mg-d',function(el){if(!ready()){el.textContent='';return;}var c=cmp();setDelta(el,c.hasB?delta(c.a.mg,c.b.mg,true):null,'vs mês anterior',true);});
function emAnd(){return curMes()===M().last&&+M().LD.slice(8)<dim(M().last);}
dash.draw('k-proj-l',function(el){el.textContent=(ready()&&emAnd())?'Projeção do mês no ritmo atual':'Mês fechado';});
setText('k-proj',function(){var c=cmp();if(!emAnd())return bf.format(c.a.fat);var d=+M().LD.slice(8);return bf.format(c.a.fat/d*dim(curMes()));});
dash.draw('k-proj-d',function(el){
  if(!ready()){el.textContent='';return;}
  var c=cmp();if(!emAnd()){setDelta(el,c.hasY?delta(c.a.fat,c.y.fat):null,'vs mesmo mês de 2025');return;}
  var proj=c.a.fat/(+M().LD.slice(8))*dim(c.p.sel),full=agg(c.p.prev,0);
  setDelta(el,c.hasB?delta(proj,full.fat):null,'vs mês anterior inteiro');
});

/* ---- resumo ---- */
function daily(mes,loja){
  var by=new Map(),n=dim(mes),acc=[],sum=0;
  M().vd.forEach(function(r){if(r.mes!==mes)return;if(loja&&r.loja!==loja)return;by.set(+r.dia.slice(8),(by.get(+r.dia.slice(8))||0)+r.fat);});
  for(var d=1;d<=n;d++){sum+=by.get(d)||0;acc.push({d:d,v:by.get(d)||0,acc:sum});}
  return acc;
}
dash.draw('r-acum-sub',function(el){el.textContent=ready()?(S.loja||'Todas as lojas'):'—';});
dash.draw('r-acum-leg',function(el){
  if(!ready()){el.replaceChildren();return;}
  var p=periodNames(),m=M(),items=[[p.sel,'var(--vm-accent)']];
  if(m.months.indexOf(p.prev)>=0)items.push([p.prev,'var(--cds-chart-muted)']);
  if(m.months.indexOf(p.yoy)>=0)items.push([p.yoy,'var(--cds-chart-axis)']);
  el.replaceChildren.apply(el,items.map(function(i){return h('span',{style:'--c:'+i[1]},h('i'),ml(i[0]));}));
});
dash.draw('r-acum',function(el){
  if(!ready()){el.replaceChildren();return;}
  var p=periodNames(),m=M(),el2=el;el.replaceChildren();
  var ser=[{k:p.sel,col:'var(--vm-accent)',cut:p.cut,w:2.5}];
  if(m.months.indexOf(p.prev)>=0)ser.push({k:p.prev,col:'var(--cds-chart-muted)',cut:dim(p.prev),w:2});
  if(m.months.indexOf(p.yoy)>=0)ser.push({k:p.yoy,col:'var(--cds-chart-axis)',cut:dim(p.yoy),w:2});
  ser.forEach(function(s){s.pts=daily(s.k,S.loja).filter(function(q){return q.d<=s.cut;});});
  var W=Math.max(300,el.clientWidth),Hh=270,mg={l:54,r:12,t:12,b:26};
  var x=d3.scaleLinear().domain([1,31]).range([mg.l,W-mg.r]);
  var ymax=d3.max(ser,function(s){return d3.max(s.pts,function(q){return q.acc;});})||1;
  var y=d3.scaleLinear().domain([0,ymax*1.06]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  svg.append('g').selectAll('text').data([1,5,10,15,20,25,30]).join('text').attr('x',function(d){return x(d);}).attr('y',Hh-8).attr('text-anchor','middle').text(function(d){return d;});
  var line=d3.line().x(function(q){return x(q.d);}).y(function(q){return y(q.acc);});
  ser.slice().reverse().forEach(function(s){
    svg.append('path').attr('d',line(s.pts)).attr('fill','none').attr('stroke',s.col).attr('stroke-width',s.w).attr('stroke-linecap','round').attr('stroke-linejoin','round');
    var last=s.pts[s.pts.length-1];if(last)svg.append('circle').attr('cx',x(last.d)).attr('cy',y(last.acc)).attr('r',3.5).attr('fill',s.col);
  });
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,d=Math.max(1,Math.min(31,Math.round(x.invert(px))));
      showTip(ev,[{t:'Dia '+d}].concat(ser.map(function(s){var q=s.pts[d-1];return {c:s.col,t:ml(s.k)+': '+(q?bf.format(q.acc):'—')};})));}).on('pointerleave',hideTip);
});
dash.draw('r-dia',function(el){
  if(!ready()){el.replaceChildren();return;}
  var mes=curMes(),rows=daily(mes,S.loja),cut=cutDay(mes);rows=rows.filter(function(q){return q.d<=cut;});
  el.replaceChildren();var el2=el;
  var W=Math.max(300,el.clientWidth),Hh=240,mg={l:50,r:8,t:10,b:26};
  var x=d3.scaleBand().domain(rows.map(function(q){return q.d;})).range([mg.l,W-mg.r]).padding(.18);
  var y=d3.scaleLinear().domain([0,(d3.max(rows,function(q){return q.v;})||1)*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(4)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=W<520?5:(W<760?2:1);
  svg.append('g').selectAll('text').data(rows.filter(function(q,i){return i%step===0;})).join('text').attr('x',function(q){return x(q.d)+x.bandwidth()/2;}).attr('y',Hh-8).attr('text-anchor','middle').text(function(q){return q.d;});
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x',function(q){return x(q.d);}).attr('width',x.bandwidth()).attr('y',function(q){return y(q.v);}).attr('height',function(q){return y(0)-y(q.v);}).attr('rx',2).attr('fill',dash.colors[0]);
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(rows.length-1,i));var q=rows[i];showTip(ev,[{t:'Dia '+q.d+' de '+MESL[+mes.slice(5)-1]},{c:dash.colors[0],t:bf.format(q.v)}]);}).on('pointerleave',hideTip);
});
dash.draw('r-ult-t',function(el){el.textContent=ready()?'Vendas de '+dmy(M().LD):'—';});
dash.draw('r-ult',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var m=M(),rows=m.vd.filter(function(r){return r.dia===m.LD;}).sort(function(a,b){return b.fat-a.fat;});
  var tot={ped:0,fat:0};rows.forEach(function(r){tot.ped+=r.pedidos;tot.fat+=r.fat;});
  tb.replaceChildren.apply(tb,rows.map(function(r){return h('tr',null,h('td',{class:'l'},r.loja),h('td',null,nf.format(r.pedidos)),h('td',null,bf.format(r.fat)),h('td',null,bf.format(r.fat/r.pedidos)));}).concat([h('tr',{class:'tot'},h('td',{class:'l'},'Total'),h('td',null,nf.format(tot.ped)),h('td',null,bf.format(tot.fat)),h('td',null,tot.ped?bf.format(tot.fat/tot.ped):'—'))]));
});
dash.draw('r-lojas-sub',function(el){if(!ready()){el.textContent='—';return;}var p=periodNames();el.textContent=MESL[+p.sel.slice(5)-1]+' de '+p.sel.slice(0,4)+(p.cut<dim(p.sel)?', do dia 1 ao dia '+p.cut:'')+'. Comparativos no mesmo período.';});
function dcell(v,pp){var td=h('td',null);if(v==null){td.textContent='—';return td;}td.className=v>0.0005?'up':(v<-0.0005?'down':'flat');td.textContent=(v>0?'+':'')+(pp?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(v*100)+' p.p.':pf(v));return td;}
dash.draw('r-lojas',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var p=periodNames(),m=M(),rows=m.lojas.map(function(l){return {l:l,a:agg(p.sel,p.cut,l),b:agg(p.prev,p.cut,l),y:agg(p.yoy,p.cut,l)};}).filter(function(r){return r.a.ped>0||r.b.ped>0;});
  rows.sort(function(a,b){return b.a.fat-a.a.fat;});
  var tot=rows.reduce(function(a,r){return a+r.a.fat;},0),hb=m.months.indexOf(p.prev)>=0,hy=m.months.indexOf(p.yoy)>=0;
  tb.replaceChildren.apply(tb,rows.map(function(r){
    return h('tr',null,h('td',{class:'l'},r.l),h('td',null,bf.format(r.a.fat)),h('td',null,pf(tot?r.a.fat/tot:null)),h('td',null,nf.format(r.a.ped)),h('td',null,r.a.tic==null?'—':bf.format(r.a.tic)),h('td',null,pf(r.a.mg)),dcell(hb&&r.b.fat>0?delta(r.a.fat,r.b.fat):null),dcell(hy&&r.y.fat>0?delta(r.a.fat,r.y.fat):null));
  }));
});

/* ---- vendedores e metas ---- */
function vendRows(){
  var m=M(),mes=curMes(),by=new Map();
  m.vm.forEach(function(r){
    if(r.mes!==mes)return;
    var o=by.get(r.vendedor);if(!o){o={nome:r.vendedor,ped:0,fat:0,lojas:new Map()};by.set(r.vendedor,o);}
    o.ped+=r.pedidos;o.fat+=r.fat;o.lojas.set(r.loja,(o.lojas.get(r.loja)||0)+r.fat);
  });
  var hasMeta=false;
  m.mt.forEach(function(t){
    if(t.mes!==mes)return;hasMeta=true;
    var o=by.get(t.vendedor);if(!o){o={nome:t.vendedor,ped:0,fat:0,lojas:new Map()};by.set(t.vendedor,o);}
    o.meta=t.meta;o.fat=t.total;
  });
  var rows=Array.from(by.values());
  rows.forEach(function(o){
    var best=null,bv=-1;o.lojas.forEach(function(v,k){if(v>bv){bv=v;best=k;}});o.loja=best||'—';
    o.tic=o.ped?o.fat/o.ped:null;o.pct=o.meta?o.fat/o.meta:null;o.falta=o.meta?Math.max(0,o.meta-o.fat):null;
  });
  rows.sort(function(a,b){return b.fat-a.fat;});
  return {rows:rows,hasMeta:hasMeta};
}
dash.draw('v-sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var d=vendRows(),mes=curMes();
  el.textContent=d.hasMeta?'Meta de '+bf.format(M().mt[0].meta)+' por vendedor em '+MESL[+mes.slice(5)-1]+'. A linha marca 100%.':'Não há meta registrada para '+MESL[+mes.slice(5)-1]+'. O Unique só informa a meta do mês atual.';
});
dash.draw('v-chart',function(el){
  if(!ready()){el.replaceChildren();return;}
  var d=vendRows(),rows=d.rows.filter(function(r){return r.fat>0;});el.replaceChildren();var el2=el;
  if(!rows.length){msg(el,'Nenhuma venda neste mês.');return;}
  var useMeta=d.hasMeta,val=function(r){return useMeta?(r.pct||0):r.fat;};
  var W=Math.max(300,el.clientWidth),rh=24,mg={l:Math.min(150,Math.round(W*.3)),r:70,t:8,b:20};
  var Hh=mg.t+mg.b+rows.length*rh,max=Math.max(useMeta?1.05:0,d3.max(rows,val)||1);
  var x=d3.scaleLinear().domain([0,max]).range([mg.l,W-mg.r]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  var ticks=useMeta?[0,.5,1,1.5,2].filter(function(t){return t<=max*1.02;}):x.ticks(4);
  svg.append('g').selectAll('line').data(ticks).join('line').attr('x1',function(t){return x(t);}).attr('x2',function(t){return x(t);}).attr('y1',mg.t).attr('y2',Hh-mg.b).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(ticks).join('text').attr('x',function(t){return x(t);}).attr('y',Hh-5).attr('text-anchor','middle').text(function(t){return useMeta?Math.round(t*100)+'%':cf.format(t);});
  if(useMeta)svg.append('line').attr('x1',x(1)).attr('x2',x(1)).attr('y1',mg.t).attr('y2',Hh-mg.b).attr('stroke','var(--cds-chart-reference)').attr('stroke-width',2).attr('stroke-dasharray','4 3');
  var g=svg.append('g').selectAll('g').data(rows).join('g').attr('transform',function(r,i){return 'translate(0,'+(mg.t+i*rh)+')';});
  g.append('text').attr('x',mg.l-8).attr('y',rh/2+4).attr('text-anchor','end').text(function(r){return nomeCurto(r.nome);});
  g.append('rect').attr('x',x(0)).attr('y',4).attr('height',rh-8).attr('width',function(r){return Math.max(1,x(val(r))-x(0));}).attr('rx',4).attr('fill',function(r){return useMeta&&r.pct>=1?dash.colors[0]:(useMeta?'var(--cds-chart-muted)':dash.colors[0]);});
  g.append('text').attr('x',function(r){return x(val(r))+6;}).attr('y',rh/2+4).text(function(r){return useMeta?pf(r.pct):cf.format(r.fat);});
  g.append('rect').attr('x',0).attr('y',0).attr('width',W).attr('height',rh).attr('fill','transparent')
    .on('pointermove',function(ev,r){showTip(ev,[{t:r.nome},{t:bf.format(r.fat)+(r.meta?' de '+bf.format(r.meta):'')},{t:nf.format(r.ped)+' pedidos'}]);}).on('pointerleave',hideTip);
});
dash.draw('v-nota',function(el){
  if(!ready()){el.textContent='—';return;}
  var mes=curMes(),d=vendRows();
  el.textContent=(d.hasMeta?'Faturamento e meta como vêm do Unique. ':'Faturamento da base de vendas. ')+'Esta aba ignora o filtro de loja. Vendedor com mais de uma loja aparece na loja onde mais vendeu.'+(d.hasMeta&&mes===M().last?' "Precisa por dia" divide o que falta pelos dias que restam no mês.':'');
});
dash.draw('v-corpo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var d=vendRows(),rows=d.rows,mes=curMes(),restam=Math.max(1,dim(mes)-(+M().LD.slice(8)));
  var inProg=mes===M().last&&+M().LD.slice(8)<dim(mes);
  if(!rows.length){tb.replaceChildren(h('tr',null,h('td',{class:'l',colspan:'9'},'Nenhuma venda neste mês.')));return;}
  tb.replaceChildren.apply(tb,rows.map(function(r){
    return h('tr',null,h('td',{class:'l',title:r.nome},nomeCurto(r.nome)),h('td',{class:'l'},r.loja),h('td',null,r.ped?nf.format(r.ped):'—'),h('td',null,bf.format(r.fat)),h('td',null,r.tic==null?'—':bf.format(r.tic)),h('td',null,r.meta?bf.format(r.meta):'—'),h('td',null,pf(r.pct)),h('td',null,r.falta==null?'—':(r.falta>0?bf.format(r.falta):'Meta batida')),h('td',null,r.falta&&inProg?bf.format(r.falta/restam):'—'));
  }));
});

/* ---- evolução ---- */
dash.draw('e-sub',function(el){el.textContent=ready()?(S.loja||'Todas as lojas'):'—';});
dash.draw('e-chart',function(el){
  if(!ready()){el.replaceChildren();return;}
  var m=M(),by=new Map();el.replaceChildren();var el2=el;
  m.vd.forEach(function(r){if(!lojaOk(r))return;by.set(r.mes,(by.get(r.mes)||0)+r.fat);});
  var get=function(y,i){var k=y+'-'+String(i+1).padStart(2,'0');return by.has(k)?by.get(k):null;};
  var W=Math.max(300,el.clientWidth),Hh=260,mg={l:54,r:12,t:12,b:26};
  var x=d3.scalePoint().domain(MES).range([mg.l,W-mg.r]).padding(.3);
  var ymax=d3.max(MES.flatMap(function(_,i){return [get(2025,i),get(2026,i)];}).filter(function(v){return v!=null;}))||1;
  var y=d3.scaleLinear().domain([0,ymax*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  svg.append('g').selectAll('text').data(MES).join('text').attr('x',function(d){return x(d);}).attr('y',Hh-8).attr('text-anchor','middle').text(function(d){return d;});
  var line=d3.line().defined(function(q){return q[1]!=null;}).x(function(q){return q[0];}).y(function(q){return y(q[1]);});
  [[2025,'var(--cds-chart-muted)'],[2026,dash.colors[0]]].forEach(function(s){
    var pts=MES.map(function(mm,i){return [x(mm),get(s[0],i)];});
    svg.append('path').attr('d',line(pts)).attr('fill','none').attr('stroke',s[1]).attr('stroke-width',2).attr('stroke-linecap','round').attr('stroke-linejoin','round');
    svg.append('g').selectAll('circle').data(pts.filter(function(q){return q[1]!=null;})).join('circle').attr('cx',function(q){return q[0];}).attr('cy',function(q){return y(q[1]);}).attr('r',3).attr('fill',s[1]);
  });
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el2.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,bi=0,bd=1e9;MES.forEach(function(mm,i){var dd=Math.abs(x(mm)-px);if(dd<bd){bd=dd;bi=i;}});
      var a=get(2025,bi),b=get(2026,bi);showTip(ev,[{t:MES[bi]},{c:'var(--cds-chart-muted)',t:'2025: '+(a==null?'—':bf.format(a))},{c:dash.colors[0],t:'2026: '+(b==null?'—':bf.format(b))+(('2026-'+String(bi+1).padStart(2,'0'))===m.last?' (em andamento)':'')}]);}).on('pointerleave',hideTip);
});
dash.draw('e-cab',function(th){
  if(!ready()){th.replaceChildren();return;}
  th.replaceChildren(h('tr',null,[h('th',{class:'l'},'Mês'),h('th',null,'Faturamento'),h('th',null,'vs mesmo mês de 2025'),h('th',null,'Pedidos'),h('th',null,'Ticket'),h('th',null,'Margem')].concat(M().lojas.map(function(l){return h('th',null,l);}))));
});
dash.draw('e-corpo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var m=M(),hold=m.months.slice().reverse();
  tb.replaceChildren.apply(tb,hold.map(function(k){
    var a=agg(k,0),y=addM(k,-12),hy=m.months.indexOf(y)>=0,full=!(k===m.last&&+m.LD.slice(8)<dim(k));
    var yv=hy&&full?agg(y,0):(hy?agg(y,+m.LD.slice(8)):null),av=full?a:agg(k,+m.LD.slice(8));
    var tr=h('tr',null,h('td',{class:'l'},ml(k)+(full?'':' *')),h('td',null,bf.format(a.fat)),dcell(yv&&yv.fat>0?delta(av.fat,yv.fat):null),h('td',null,nf.format(a.ped)),h('td',null,a.tic==null?'—':bf.format(a.tic)),h('td',null,pf(a.mg)));
    m.lojas.forEach(function(l){var v=agg(k,0,l).fat;tr.append(h('td',null,v>0?bf.format(v):'·'));});
    return tr;
  }));
});
dash.draw('rodape',function(el){
  if(!ready()){el.textContent='—';return;}
  var m=M(),mt=m.mt[0];
  el.textContent='Vendas da base de 15/01/2025 a '+dmy(m.LD)+'. O Depósito não entra. Metas lidas do Unique em '+(mt?dmy(mt.ate):'—')+'. Meses marcados com * estão em andamento e a comparação com 2025 usa o mesmo período.';
});

/* ---- controles ---- */
function setTab(t){
  S.tab=t;
  document.querySelectorAll('.vm-tabs button').forEach(function(b){b.setAttribute('aria-selected',String(b.getAttribute('data-tab')===t));});
  document.querySelectorAll('.vm-pane[id]').forEach(function(p){p.hidden=p.id!==t;});
  try{dash.setLink(t);}catch(e){}
  redraw();
}
var booted=false;
dash.onData(function(){
  if(booted)return;booted=true;
  $('#vm').style.setProperty('--vm-accent',dash.colors[0]);
  document.querySelectorAll('.vm-tabs button').forEach(function(b){b.addEventListener('click',function(){setTab(b.getAttribute('data-tab'));});});
  $('#f-reset').addEventListener('click',function(){S.mes='';S.loja='';redraw();});
  var named=(location.hash||'').slice(1);
  if(['resumo','vendedores','evolucao'].indexOf(named)>=0)S.tab=named;
  setTab(S.tab);
});
}
