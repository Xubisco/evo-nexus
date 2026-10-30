// @ts-nocheck
/* Portado de finance/base_estoque/dashboards/referencia/estoque_e_vendas.page.html.
   A lógica é a da referência; os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var CLASSE_A=0.8, CLASSE_B=0.95, DIAS_COB=30, DIAS_PARADO=120, DIAS_VENDA=90;
var ALERTAS={
  ruptura:'Em ruptura, com venda recente',
  baixa:'Cobertura baixa',
  parado:'Parados em estoque',
  transito:'Com pedido de fábrica em trânsito',
  semfab:'Sem fábrica definida',
  semcusto:'Sem custo no sistema'
};
var S={gr:'fam',ano:'',tri:'',mes:'',cat:'',fab:'',tab:'visao',sel:null,pm:'un',hg:'cat',hm:'fat',hc:'mes',al:'ruptura',aq:'',pq:'',abcSort:{k:'fat',d:-1}};
var NAMES=['sub','f-cat','f-fab','k-fat','k-un','k-mg','k-prod','k-est','v-meses','v-lojas','v-cats','v-top','abc-sub','abc-regra','abc-chart','abc-resumo','abc-corpo','p-lista','p-nome','p-sub','p-k-estoque','p-k-receber','p-k-venda','p-k-cob','p-k-preco','p-k-custo','p-k-mg','p-chart','p-cores','p-locais','al-n-ruptura','al-n-baixa','al-n-parado','al-n-transito','al-n-semfab','al-n-semcusto','al-titulo','al-regras','al-corpo','h-sub','h-cab','h-corpo','rodape'];
var $=function(s,r){return (r||document).querySelector(s);};
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
var nf1=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var cf=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
var pf=function(v){return v==null||!isFinite(v)?'—':nf1.format(v*100)+'%';};
var ml=function(m){return MES[+m.slice(5)-1]+'/'+m.slice(2,4);};
var dmy=function(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(2,4):'—';};
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var k in props){var v=props[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
function ready(){return ['produtos','mensal_produto','mensal_loja','estoque_local'].every(function(i){return dash.data(i).status==='ok';});}
var C=null;
function M(){
  var pd=dash.data('produtos').data,mp=dash.data('mensal_produto').data,lj=dash.data('mensal_loja').data,el=dash.data('estoque_local').data;
  if(C&&C.pd===pd&&C.mp===mp&&C.lj===lj&&C.el===el)return C;
  var P=new Map(pd.map(function(p){return [p.cod,p];}));
  var REF='';pd.forEach(function(p){if(p.ultima&&p.ultima>REF)REF=p.ultima;});
  var months=Array.from(new Set(mp.map(function(r){return r.mes;}).concat(lj.map(function(r){return r.mes;})))).sort();
  var locs=new Map();el.forEach(function(r){if(!locs.has(r.cod))locs.set(r.cod,[]);locs.get(r.cod).push(r);});
  var cats=Array.from(new Set(pd.map(function(p){return p.cat;}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
  var fabs=Array.from(new Set(pd.map(function(p){return p.fab;}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
  var EN={cor:new Map(),fam:new Map()};
  pd.forEach(function(p){
    [['cor',p.cod],['fam',p.fid]].forEach(function(a){
      var md=a[0],k=a[1],e=EN[md].get(k);
      if(!e){e={key:k,nome:md==='fam'?p.familia:p.nome,fab:p.fab,cat:p.cat,items:[],estoque:0,a_receber:0,un90:0,fat90:0,ultima:null,pS:0,pN:0,cV:0,cW:0,cS:0,cN:0};EN[md].set(k,e);}
      e.items.push(p);e.estoque+=p.estoque;e.a_receber+=p.a_receber;e.un90+=p.un90;e.fat90+=p.fat90;
      if(p.ultima&&(!e.ultima||p.ultima>e.ultima))e.ultima=p.ultima;
      if(p.preco){e.pS+=p.preco;e.pN++;}
      if(p.custo){e.cS+=p.custo;e.cN++;if(p.estoque>0){e.cV+=p.custo*p.estoque;e.cW+=p.estoque;}}
    });
  });
  ['cor','fam'].forEach(function(md){EN[md].forEach(function(e){e.preco=e.pN?e.pS/e.pN:null;e.custo=e.cW>0?e.cV/e.cW:(e.cN?e.cS/e.cN:null);e.cod=e.items[0].cod;e.n=e.items.length;});});
  C={pd:pd,mp:mp,lj:lj,el:el,EN:EN,P:P,REF:REF,months:months,locs:locs,cats:cats,fabs:fabs,last:months[months.length-1]};
  return C;
}
function inPeriod(mes){
  var y=+mes.slice(0,4),m=+mes.slice(5);
  return (!S.ano||y===+S.ano)&&(!S.tri||Math.ceil(m/3)===+S.tri)&&(!S.mes||m===+S.mes);
}
function mode(){return S.gr==='fam'?'fam':'cor';}
function ekey(p){return S.gr==='fam'?p.fid:p.cod;}
function E(key){return M().EN[mode()].get(key);}
function rowKey(cod){return ekey(M().P.get(cod));}
function prodOk(p){return p&&(!S.cat||p.cat===S.cat)&&(!S.fab||p.fab===S.fab);}
function periodAgg(){
  var m=M(),a=new Map();
  m.mp.forEach(function(r){
    if(!inPeriod(r.mes))return;var p=m.P.get(r.cod);if(!prodOk(p))return;
    var k=ekey(p),o=a.get(k);if(!o){o={key:k,un:0,fat:0,custo:0,lcc:0};a.set(k,o);}
    o.un+=r.un;o.fat+=r.fat;o.custo+=r.custo||0;o.lcc+=r.lcc||0;
  });
  return a;
}
function mgOf(o){return o.lcc>0?1-o.custo/o.lcc:null;}
function cobOf(p){return p.estoque>0&&p.un90>0?p.estoque/(p.un90/DIAS_VENDA):null;}
function daysSince(s){return (Date.parse(M().REF)-Date.parse(s))/864e5;}
function periodLabel(){
  var a=[];
  a.push(S.mes?['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][S.mes-1]:(S.tri?S.tri+'º trimestre':'todos os meses'));
  a.push(S.ano||'2025 e 2026');
  return a.join(' de ');
}
function filtLabel(){return periodLabel()+' · '+(S.cat||'todas as categorias')+' · '+(S.fab||'todas as fábricas');}
function tip(){return $('#ee-tip');}
function showTip(ev,lines){
  var t=tip(),er=$('#ee').getBoundingClientRect();
  t.replaceChildren.apply(t,lines.map(function(l){return h('div',null,l.c?h('i',{style:'background:'+l.c}):null,l.t);}));
  t.style.display='block';
  var x=ev.clientX-er.left+14,y=ev.clientY-er.top+14,w=t.offsetWidth;
  if(x+w>er.width)x=Math.max(0,ev.clientX-er.left-w-14);
  t.style.left=x+'px';t.style.top=y+'px';
}
function hideTip(){tip().style.display='none';}
function msg(el,t){el.replaceChildren(h('p',{class:'ee-muted',style:'padding:2rem 0;text-align:center'},t));}
function pickKey(k){S.sel=k;setTab('produto');}
function pickCod(c){var p=M().P.get(c);pickKey(p?ekey(p):null);}
function updVis(){
  var det=$('#p-det'),vz=$('#p-vazio'),cc=$('#p-cores-card'),e=ready()&&S.sel?E(S.sel):null;
  if(det)det.hidden=!(S.tab==='produto'&&S.sel);
  if(vz)vz.hidden=!!S.sel;
  if(cc)cc.hidden=!(S.tab==='produto'&&e&&e.n>1);
}
function chip(cl){return h('span',{class:'ee-chip cl-'+cl},h('span',{class:'ee-dot'}),cl);}
function prodCell(p){return h('td',{class:'l',title:p.nome},p.nome);}
function redraw(){NAMES.forEach(function(n){dash.draw(n);});}

/* ---- gráficos ---- */
function hbars(el,rows,o){
  el.replaceChildren();
  if(!rows.length){msg(el,'Nenhum dado neste filtro.');return;}
  var W=Math.max(300,el.clientWidth),rh=24,m={l:Math.min(150,Math.round(W*.32)),r:92,t:6,b:6};
  var Hh=m.t+m.b+rows.length*rh,max=d3.max(rows,o.v)||1;
  var x=d3.scaleLinear().domain([0,max]).range([m.l,W-m.r]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  var g=svg.append('g').selectAll('g').data(rows).join('g').attr('transform',function(d,i){return 'translate(0,'+(m.t+i*rh)+')';});
  g.append('text').attr('x',m.l-8).attr('y',rh/2+4).attr('text-anchor','end').text(function(d){var s=String(d.k);return s.length>22?s.slice(0,21)+'…':s;});
  g.append('rect').attr('x',x(0)).attr('y',4).attr('height',rh-8).attr('width',function(d){return Math.max(1,x(o.v(d))-x(0));}).attr('rx',4).attr('fill',dash.colors[0]);
  g.append('text').attr('x',function(d){return x(o.v(d))+6;}).attr('y',rh/2+4).text(o.label);
  g.append('rect').attr('x',0).attr('y',0).attr('width',W).attr('height',rh).attr('fill','transparent')
    .on('pointermove',function(ev,d){showTip(ev,o.tip(d));}).on('pointerleave',hideTip);
}

/* ---- cabeçalho e filtros ---- */
function dataEstoque(){var s=dash.manifest.snapshot_estoque;return s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4);}
dash.draw('p-locais-sub',function(el){el.textContent='Posição de '+dataEstoque()+'.';});
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var m=M();
  el.textContent=nf.format(m.pd.length)+' produtos · vendas de '+ml(m.months[0])+' a '+ml(m.last)+' (até '+dmy(m.REF)+') · estoque de '+dataEstoque();
});
function fillSel(name,id,label,vals,key){
  dash.draw(name,function(sel){
    if(!ready()){sel.replaceChildren();return;}
    sel.replaceChildren.apply(sel,[new Option(label,'')].concat(vals().map(function(v){return new Option(v,v);})));
    sel.value=S[key];
    sel.onchange=function(){S[key]=sel.value;redraw();};
  });
}
fillSel('f-cat','f-cat','Todas',function(){return M().cats;},'cat');
fillSel('f-fab','f-fab','Todas',function(){return M().fabs;},'fab');

/* ---- indicadores ---- */
function setText(name,fn){dash.draw(name,function(el){el.textContent=ready()?fn():'—';});}
setText('k-fat',function(){var t=0;periodAgg().forEach(function(o){t+=o.fat;});return bf.format(t);});
setText('k-un',function(){var t=0;periodAgg().forEach(function(o){t+=o.un;});return nf.format(t);});
setText('k-mg',function(){var c=0,l=0;periodAgg().forEach(function(o){c+=o.custo;l+=o.lcc;});return l>0?pf(1-c/l):'—';});
setText('k-prod',function(){var n=0;periodAgg().forEach(function(o){if(o.fat>0)n++;});return nf.format(n);});
setText('k-est',function(){var t=0;M().pd.forEach(function(p){if(prodOk(p)&&p.custo)t+=p.estoque*p.custo;});return bf.format(t);});

/* ---- visão geral ---- */
dash.draw('v-meses',function(el){
  if(!ready()){el.replaceChildren();return;}
  var m=M(),by=new Map();
  m.mp.forEach(function(r){var p=m.P.get(r.cod);if(!prodOk(p))return;by.set(r.mes,(by.get(r.mes)||0)+r.fat);});
  var ms=m.months;el.replaceChildren();
  var W=Math.max(300,el.clientWidth),Hh=260,mg={l:50,r:8,t:12,b:28};
  var x=d3.scaleBand().domain(ms).range([mg.l,W-mg.r]).padding(.2);
  var ymax=d3.max(ms,function(k){return by.get(k)||0;})||1;
  var y=d3.scaleLinear().domain([0,ymax*1.08]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return cf.format(d);});
  var step=W<520?3:(W<900?2:1);
  svg.append('g').selectAll('text').data(ms.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(ml);
  var any=!!(S.ano||S.tri||S.mes);
  svg.append('g').selectAll('rect').data(ms).join('rect').attr('x',function(d){return x(d);}).attr('width',x.bandwidth()).attr('y',function(d){return y(by.get(d)||0);}).attr('height',function(d){return y(0)-y(by.get(d)||0);}).attr('rx',3)
    .attr('fill',function(d){return (!any||inPeriod(d))?dash.colors[0]:'var(--cds-chart-muted)';}).attr('opacity',function(d){return d===m.last?.55:1;});
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(ms.length-1,i));var k=ms[i];showTip(ev,[{t:ml(k)+(k===m.last?' (em andamento)':'')},{c:dash.colors[0],t:bf.format(by.get(k)||0)}]);})
    .on('pointerleave',hideTip);
});
dash.draw('v-lojas',function(el){
  if(!ready()){el.replaceChildren();return;}
  var m=M(),a=new Map();
  m.lj.forEach(function(r){if(!inPeriod(r.mes))return;var o=a.get(r.loja)||{k:r.loja,fat:0,n:0};o.fat+=r.fat;o.n+=r.vendas;a.set(r.loja,o);});
  var rows=Array.from(a.values()).sort(function(p,q){return q.fat-p.fat;});
  hbars(el,rows,{v:function(d){return d.fat;},label:function(d){return cf.format(d.fat);},tip:function(d){return [{t:d.k},{t:bf.format(d.fat)+' em '+nf.format(d.n)+' vendas'},{t:'Ticket médio '+bf.format(d.n?d.fat/d.n:0)}];}});
});
dash.draw('v-cats',function(el){
  if(!ready()){el.replaceChildren();return;}
  var m=M(),a=new Map();
  periodAgg().forEach(function(o){var p=E(o.key),k=p.cat||'Sem categoria';var q=a.get(k)||{k:k,fat:0,un:0,custo:0,lcc:0};q.fat+=o.fat;q.un+=o.un;q.custo+=o.custo;q.lcc+=o.lcc;a.set(k,q);});
  var rows=Array.from(a.values()).sort(function(p,q){return q.fat-p.fat;});
  hbars(el,rows,{v:function(d){return d.fat;},label:function(d){return cf.format(d.fat);},tip:function(d){return [{t:d.k},{t:bf.format(d.fat)+' · '+nf.format(d.un)+' un'},{t:'Margem '+pf(mgOf(d))}];}});
});
dash.draw('v-top',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var m=M(),rows=Array.from(periodAgg().values()).sort(function(a,b){return b.fat-a.fat;}).slice(0,10);
  tb.replaceChildren.apply(tb,rows.map(function(o){
    var p=E(o.key),tr=h('tr',{class:'pick'},prodCell(p),h('td',{class:'l'},p.fab),h('td',null,bf.format(o.fat)),h('td',null,nf.format(o.un)),h('td',null,pf(mgOf(o))),h('td',null,nf.format(p.estoque)));
    tr.addEventListener('click',function(){pickKey(o.key);});return tr;
  }));
});

/* ---- curva ABC ---- */
function abcRows(){
  var m=M(),rows=Array.from(periodAgg().values()).filter(function(o){return o.fat>0;}).sort(function(a,b){return b.fat-a.fat;});
  var tot=rows.reduce(function(a,o){return a+o.fat;},0),cum=0;
  rows.forEach(function(o,i){
    var before=cum/tot;cum+=o.fat;o.acum=cum/tot;o.rank=i+1;
    o.cl=before<CLASSE_A?'A':(before<CLASSE_B?'B':'C');
    var p=E(o.key);o.nome=p.nome;o.fab=p.fab;o.estoque=p.estoque;o.p=p;o.mg=mgOf(o);o.cob=cobOf(p);
  });
  return {rows:rows,tot:tot};
}
dash.draw('abc-sub',function(el){if(!ready()){el.textContent='—';return;}el.textContent=filtLabel();});
dash.draw('abc-regra',function(el){el.textContent='A = até '+Math.round(CLASSE_A*100)+'% do faturamento acumulado, B = até '+Math.round(CLASSE_B*100)+'%, C = o restante.';});
dash.draw('abc-chart',function(el){
  if(!ready()){el.replaceChildren();return;}
  var d=abcRows(),rows=d.rows;el.replaceChildren();
  if(!rows.length){msg(el,'Nenhuma venda neste filtro.');return;}
  var W=Math.max(300,el.clientWidth),Hh=270,mg={l:50,r:42,t:12,b:26};
  var x=d3.scaleBand().domain(rows.map(function(r){return r.rank;})).range([mg.l,W-mg.r]).paddingInner(.1);
  var y=d3.scaleLinear().domain([0,d3.max(rows,function(r){return r.fat;})*1.05]).range([Hh-mg.b,mg.t]);
  var y2=d3.scaleLinear().domain([0,1]).range([Hh-mg.b,mg.t]);
  var col={A:dash.colors[0],B:'var(--color-warn)',C:'var(--cds-chart-muted)'};
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data([0,.25,.5,.75,1]).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(v){return y2(v);}).attr('y2',function(v){return y2(v);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data([0,.25,.5,.75,1]).join('text').attr('x',W-mg.r+6).attr('y',function(v){return y2(v)+4;}).text(function(v){return Math.round(v*100)+'%';});
  svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x',mg.l-6).attr('y',function(v){return y(v)+4;}).attr('text-anchor','end').text(function(v){return cf.format(v);});
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x',function(r){return x(r.rank);}).attr('width',Math.max(1,x.bandwidth())).attr('y',function(r){return y(r.fat);}).attr('height',function(r){return y(0)-y(r.fat);}).attr('fill',function(r){return col[r.cl];});
  var line=d3.line().x(function(r){return x(r.rank)+x.bandwidth()/2;}).y(function(r){return y2(r.acum);});
  svg.append('path').attr('d',line(rows)).attr('fill','none').attr('stroke','var(--cds-chart-reference)').attr('stroke-width',2).attr('stroke-linejoin','round');
  svg.append('text').attr('x',mg.l).attr('y',Hh-8).text('Produtos do que mais ao que menos fatura');
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(rows.length-1,i));var o=rows[i];showTip(ev,[{t:'#'+o.rank+' '+o.nome},{c:col[o.cl],t:bf.format(o.fat)+' · classe '+o.cl},{t:pf(o.acum)+' do faturamento acumulado'}]);})
    .on('pointerleave',hideTip).on('click',function(ev){var r=el.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(rows.length-1,i));pickKey(rows[i].key);});
});
dash.draw('abc-resumo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var d=abcRows(),n=d.rows.length;
  var cls=['A','B','C'].map(function(c){var it=d.rows.filter(function(r){return r.cl===c;});return {c:c,n:it.length,fat:it.reduce(function(a,r){return a+r.fat;},0),est:it.reduce(function(a,r){return a+(r.p.custo?r.p.estoque*r.p.custo:0);},0)};});
  tb.replaceChildren.apply(tb,cls.map(function(k){
    return h('tr',null,h('td',{class:'l'},chip(k.c)),h('td',null,nf.format(k.n)),h('td',null,pf(n?k.n/n:null)),h('td',null,bf.format(k.fat)),h('td',null,pf(d.tot?k.fat/d.tot:null)),h('td',null,bf.format(k.est)));
  }));
});
dash.draw('abc-corpo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var rows=abcRows().rows,q=S.aq.trim().toLowerCase();
  if(q)rows=rows.filter(function(r){return (r.nome+' '+r.p.items.map(function(i){return i.cod;}).join(' ')+' '+r.fab).toLowerCase().indexOf(q)>=0;});
  var s=S.abcSort;
  rows=rows.slice().sort(function(a,b){var x=a[s.k],y=b[s.k];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return typeof x==='string'?s.d*x.localeCompare(y,'pt-BR'):s.d*(x-y);});
  document.querySelectorAll('#abc-tab th').forEach(function(th){th.setAttribute('aria-sort',th.getAttribute('data-k')===s.k?(s.d>0?'ascending':'descending'):'none');});
  tb.replaceChildren.apply(tb,rows.map(function(r){
    var tr=h('tr',{class:'pick'},h('td',{class:'l',title:r.nome},r.nome),h('td',{class:'l'},r.fab),h('td',null,bf.format(r.fat)),h('td',null,pf(r.acum)),h('td',null,chip(r.cl)),h('td',null,nf.format(r.un)),h('td',null,pf(r.mg)),h('td',null,nf.format(r.estoque)),h('td',null,r.cob==null?'—':nf.format(r.cob)));
    tr.addEventListener('click',function(){pickKey(r.key);});return tr;
  }));
});

/* ---- produto ---- */
dash.draw('p-lista',function(el){
  if(!ready()){el.replaceChildren();return;}
  var m=M(),q=S.pq.trim().toLowerCase(),list=Array.from(m.EN[mode()].values()).filter(function(e){return e.items.some(prodOk);});
  if(q)list=list.filter(function(e){return (e.nome+' '+e.items.map(function(i){return i.cod;}).join(' ')+' '+e.fab).toLowerCase().indexOf(q)>=0;});
  else list=list.slice().sort(function(a,b){return b.fat90-a.fat90;});
  list=list.slice(0,12);
  if(!list.length){msg(el,'Nenhum produto encontrado.');return;}
  el.replaceChildren.apply(el,list.map(function(p){var b=h('button',{type:'button',title:p.nome},p.nome+(p.n>1&&S.gr==='fam'?' ('+p.n+' cores)':''));b.addEventListener('click',function(){pickKey(p.key);});return b;}));
});
function selP(){return ready()&&S.sel?E(S.sel):null;}
setText('p-nome',function(){var p=selP();return p?p.nome:'—';});
setText('p-sub',function(){var p=selP();return p?(p.n>1?p.n+' cores':'Código '+p.cod)+' · '+p.fab+' · '+(p.cat||'sem categoria'):'—';});
setText('p-k-estoque',function(){var p=selP();return p?nf.format(p.estoque):'—';});
setText('p-k-receber',function(){var p=selP();return p?nf.format(p.a_receber):'—';});
setText('p-k-venda',function(){var p=selP();return p?nf.format(p.un90)+' un':'—';});
setText('p-k-cob',function(){var p=selP();if(!p)return '—';var c=cobOf(p);return c==null?'—':nf.format(c)+' dias';});
setText('p-k-preco',function(){var p=selP();return p&&p.preco?bf.format(p.preco):'—';});
setText('p-k-custo',function(){var p=selP();return p&&p.custo?bf.format(p.custo):'sem custo';});
setText('p-k-mg',function(){var p=selP();if(!p)return '—';var o={custo:0,lcc:0};M().mp.forEach(function(r){if(rowKey(r.cod)===p.key){o.custo+=r.custo||0;o.lcc+=r.lcc||0;}});return pf(mgOf(o));});
dash.draw('p-chart',function(el){
  var p=selP();el.replaceChildren();if(!p)return;
  var m=M(),by=new Map();
  m.mp.forEach(function(r){if(rowKey(r.cod)!==p.key)return;var o=by.get(r.mes)||{un:0,fat:0,custo:0,lcc:0};o.un+=r.un;o.fat+=r.fat;o.custo+=r.custo||0;o.lcc+=r.lcc||0;by.set(r.mes,o);});
  var ms=m.months,val=function(k){var r=by.get(k);return r?(S.pm==='un'?r.un:r.fat):0;};
  var fm=S.pm==='un'?nf:bf,tk=S.pm==='un'?nf:cf;
  var W=Math.max(300,el.clientWidth),Hh=250,mg={l:50,r:8,t:12,b:28};
  var x=d3.scaleBand().domain(ms).range([mg.l,W-mg.r]).padding(.2);
  var y=d3.scaleLinear().domain([0,(d3.max(ms,val)||1)*1.1]).nice().range([Hh-mg.b,mg.t]);
  var svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+Hh).attr('height',Hh);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',mg.l).attr('x2',W-mg.r).attr('y1',function(d){return y(d);}).attr('y2',function(d){return y(d);}).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',mg.l-6).attr('y',function(d){return y(d)+4;}).attr('text-anchor','end').text(function(d){return tk.format(d);});
  var step=W<520?3:(W<900?2:1);
  svg.append('g').selectAll('text').data(ms.filter(function(k,i){return i%step===0;})).join('text').attr('x',function(d){return x(d)+x.bandwidth()/2;}).attr('y',Hh-9).attr('text-anchor','middle').text(ml);
  svg.append('g').selectAll('rect').data(ms).join('rect').attr('x',function(d){return x(d);}).attr('width',x.bandwidth()).attr('y',function(d){return y(val(d));}).attr('height',function(d){return y(0)-y(val(d));}).attr('rx',3).attr('fill',dash.colors[0]).attr('opacity',function(d){return d===m.last?.55:1;});
  svg.append('rect').attr('x',mg.l).attr('y',mg.t).attr('width',W-mg.l-mg.r).attr('height',Hh-mg.t-mg.b).attr('fill','transparent')
    .on('pointermove',function(ev){var r=el.getBoundingClientRect(),px=(ev.clientX-r.left)*W/r.width,i=Math.floor((px-mg.l)/x.step());i=Math.max(0,Math.min(ms.length-1,i));var k=ms[i],row=by.get(k);showTip(ev,[{t:ml(k)+(k===m.last?' (em andamento)':'')},{c:dash.colors[0],t:fm.format(val(k))+(S.pm==='un'?' un':'')},{t:row&&row.lcc>0?'Margem '+pf(1-(row.custo||0)/row.lcc):''}].filter(function(l){return l.t;}));})
    .on('pointerleave',hideTip);
});
dash.draw('p-locais',function(tb){
  var p=selP();if(!p){tb.replaceChildren();return;}
  var lm=new Map();
  p.items.forEach(function(it){(M().locs.get(it.cod)||[]).forEach(function(r){var o=lm.get(r.local)||{local:r.local,qtd:0,a_receber:0};o.qtd+=r.qtd;o.a_receber+=r.a_receber;lm.set(r.local,o);});});
  var rows=Array.from(lm.values()).sort(function(a,b){return b.qtd-a.qtd;});
  if(!rows.length){tb.replaceChildren(h('tr',null,h('td',{class:'l',colspan:'3'},'Sem estoque em nenhum local.')));return;}
  tb.replaceChildren.apply(tb,rows.map(function(r){return h('tr',null,h('td',{class:'l'},r.local),h('td',null,nf.format(r.qtd)),h('td',null,r.a_receber?nf.format(r.a_receber):'—'));}));
});

dash.draw('p-cores',function(tb){
  var p=selP();if(!p||p.n<2){tb.replaceChildren();return;}
  var rows=p.items.slice().sort(function(a,b){return b.un90-a.un90;});
  tb.replaceChildren.apply(tb,rows.map(function(i){
    var c=cobOf(i);
    return h('tr',null,h('td',{class:'l',title:i.nome},i.cor||'(sem cor)'),h('td',null,i.cod),h('td',null,nf.format(i.estoque)),h('td',null,i.a_receber?nf.format(i.a_receber):'—'),h('td',null,nf.format(i.un90)),h('td',null,c==null?'—':nf.format(c)),h('td',null,dmy(i.ultima)));
  }));
});

/* ---- alertas ---- */
function alertList(k){
  var m=M(),list=m.pd.filter(prodOk).filter(function(p){
    if(k==='ruptura')return p.un90>0&&p.estoque<=0;
    if(k==='baixa'){var c=cobOf(p);return c!=null&&c<DIAS_COB;}
    if(k==='parado')return p.estoque>0&&(!p.ultima||daysSince(p.ultima)>DIAS_PARADO);
    if(k==='transito')return p.a_receber>0;
    if(k==='semfab')return p.fab==='Sem fábrica'&&(p.estoque>0||p.ultima);
    if(k==='semcusto')return !p.custo&&(p.estoque>0||p.a_receber>0);
    return false;
  });
  var key={ruptura:function(p){return -p.fat90;},baixa:function(p){return cobOf(p);},parado:function(p){return -p.estoque*(p.custo||0);},transito:function(p){return -p.a_receber;},semfab:function(p){return -p.fat90;},semcusto:function(p){return -p.fat90;}}[k];
  return list.sort(function(a,b){return key(a)-key(b);});
}
Object.keys(ALERTAS).forEach(function(k){setText('al-n-'+k,function(){return nf.format(alertList(k).length);});});
dash.draw('al-titulo',function(el){el.textContent=ALERTAS[S.al];});
dash.draw('al-regras',function(el){
  var t={ruptura:'Vendeu nos últimos '+DIAS_VENDA+' dias e o estoque está zerado. Ordem: maior faturamento recente.',
    baixa:'Estoque dura menos de '+DIAS_COB+' dias no ritmo dos últimos '+DIAS_VENDA+' dias. Ordem: menor cobertura.',
    parado:'Tem estoque e não vende há mais de '+DIAS_PARADO+' dias. Ordem: maior valor a custo.',
    transito:'Pedido de fábrica já feito e ainda não recebido (estoque negativo no Unique).',
    semfab:'Produto com estoque ou venda e sem fábrica definida na tabela fornecedor × fábrica.',
    semcusto:'Produto em estoque ou com pedido em trânsito e sem custo no sistema. Todo produto precisa ter custo; o ideal é esta lista ficar vazia.'}[S.al];
  el.textContent=t+' Respeita categoria e fábrica. Os alertas são sempre por cor.';
});
dash.draw('al-corpo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var rows=alertList(S.al);
  if(!rows.length){tb.replaceChildren(h('tr',null,h('td',{class:'l',colspan:'8'},'Nenhum produto neste alerta.')));return;}
  tb.replaceChildren.apply(tb,rows.map(function(p){
    var c=cobOf(p),tr=h('tr',{class:'pick'},prodCell(p),h('td',{class:'l'},p.fab),h('td',null,nf.format(p.estoque)),h('td',null,p.a_receber?nf.format(p.a_receber):'—'),h('td',null,nf.format(p.un90)),h('td',null,c==null?'—':nf.format(c)),h('td',null,dmy(p.ultima)),h('td',null,p.custo?bf.format(p.estoque*p.custo):'—'));
    tr.addEventListener('click',function(){pickCod(p.cod);});return tr;
  }));
});

/* ---- histórico ---- */
function hCols(){
  var ms=M().months.filter(inPeriod);
  if(S.hc==='mes')return ms.map(function(k){return {k:k,t:ml(k),ms:[k]};});
  var out=[],seen=new Map();
  ms.forEach(function(k){var q=k.slice(0,4)+'-T'+Math.ceil(+k.slice(5)/3);if(!seen.has(q)){var o={k:q,t:Math.ceil(+k.slice(5)/3)+'T/'+k.slice(2,4),ms:[]};seen.set(q,o);out.push(o);}seen.get(q).ms.push(k);});
  return out;
}
dash.draw('h-sub',function(el){el.textContent=filtLabel();});
dash.draw('h-cab',function(th){
  if(!ready()){th.replaceChildren();return;}
  var cols=hCols(),first={cat:'Categoria',fab:'Fábrica',prod:'Produto'}[S.hg];
  th.replaceChildren(h('tr',null,[h('th',{class:'nosort l'},first)].concat(cols.map(function(c){return h('th',{class:'nosort'},c.t);}),[h('th',{class:'nosort'},'Total')])));
});
dash.draw('h-corpo',function(tb){
  if(!ready()){tb.replaceChildren();return;}
  var m=M(),cols=hCols(),colOf=new Map();
  cols.forEach(function(c,i){c.ms.forEach(function(k){colOf.set(k,i);});});
  var rows=new Map(),all={k:'Todos',v:cols.map(function(){return {un:0,fat:0,custo:0,lcc:0};}),t:{un:0,fat:0,custo:0,lcc:0}};
  function add(o,i,r){var c=o.v[i];c.un+=r.un;c.fat+=r.fat;c.custo+=r.custo||0;c.lcc+=r.lcc||0;o.t.un+=r.un;o.t.fat+=r.fat;o.t.custo+=r.custo||0;o.t.lcc+=r.lcc||0;}
  m.mp.forEach(function(r){
    if(!colOf.has(r.mes))return;var p=m.P.get(r.cod);if(!prodOk(p))return;
    var k=S.hg==='cat'?(p.cat||'Sem categoria'):(S.hg==='fab'?p.fab:(S.gr==='fam'?p.familia:p.nome));
    var o=rows.get(k);if(!o){o={k:k,v:cols.map(function(){return {un:0,fat:0,custo:0,lcc:0};}),t:{un:0,fat:0,custo:0,lcc:0}};rows.set(k,o);}
    var i=colOf.get(r.mes);add(o,i,r);add(all,i,r);
  });
  var list=Array.from(rows.values()).sort(function(a,b){return b.t.fat-a.t.fat;});
  var val=function(c){return S.hm==='un'?c.un:(S.hm==='fat'?c.fat:(c.lcc>0?1-c.custo/c.lcc:null));};
  var fmt=function(v){return v==null?'·':(S.hm==='un'?nf.format(v):(S.hm==='fat'?cf.format(v):pf(v)));};
  function line(o,isTot){
    var vals=o.v.map(val),mx=Math.max.apply(null,vals.map(function(v){return v==null?0:v;}))||1;
    var tds=o.v.map(function(c,i){var v=vals[i];var s=h('span',{class:'hm',style:isTot?'':'background:color-mix(in srgb,'+dash.colors[0]+' '+Math.round(6+64*Math.max(0,v||0)/mx)+'%,transparent)'},fmt(v&&v!==0?v:(S.hm==='mg'?v:null)));return h('td',null,s);});
    var tot=val(o.t);
    return h('tr',{class:isTot?'tot':''},[h('td',{class:'l',title:o.k},o.k)].concat(tds,[h('td',null,S.hm==='fat'?bf.format(tot):fmt(tot))]));
  }
  tb.replaceChildren.apply(tb,[line(all,true)].concat(list.map(function(o){return line(o,false);})));
});

setText('rodape',function(){
  var m=M(),sem=m.pd.filter(function(p){return !p.custo&&(p.estoque>0||p.a_receber>0);}).length;
  return 'Estoque, vendas e custos de '+dmy(m.REF)+'. '+nf.format(sem)+' produtos em estoque estão sem custo no sistema (aba Alertas).';
});

/* ---- controles ---- */
function setTab(t){
  S.tab=t;
  document.querySelectorAll('.ee-tabs button').forEach(function(b){b.setAttribute('aria-selected',String(b.getAttribute('data-tab')===t));});
  document.querySelectorAll('.ee-pane[id]').forEach(function(p){if(p.id==='p-det')return;p.hidden=p.id!==t;});
  updVis();
  syncPressed();
  try{dash.setLink(t);}catch(e){}
  redraw();
}
function syncPressed(){
  document.querySelectorAll('.ee-seg button[data-f]').forEach(function(b){b.setAttribute('aria-pressed',String(String(S[b.getAttribute('data-f')])===b.getAttribute('data-v')));});
  document.querySelectorAll('#al-btns button').forEach(function(b){b.setAttribute('aria-pressed',String(S.al===b.getAttribute('data-a')));});
  var fm=$('#f-mes');if(fm)fm.value=S.mes;
}
function boot(){
  var root=$('#ee');root.style.setProperty('--ee-accent',dash.colors[0]);
  document.querySelectorAll('.ee-seg button[data-f]').forEach(function(b){b.addEventListener('click',function(){
    var f=b.getAttribute('data-f'),v=b.getAttribute('data-v');
    if(f==='gr'&&S.sel&&ready()){var cur=E(S.sel);S[f]=v;S.sel=cur&&cur.items.length?ekey(cur.items[0]):null;}else S[f]=v;
    if(f==='tri'&&v)S.mes='';
    if(f==='ano'||f==='tri'){}
    updVis();syncPressed();redraw();
  });});
  $('#f-mes').addEventListener('change',function(ev){S.mes=ev.target.value;if(S.mes)S.tri='';syncPressed();redraw();});
  $('#f-reset').addEventListener('click',function(){S.ano='';S.tri='';S.mes='';S.cat='';S.fab='';syncPressed();redraw();});
  $('#abc-q').addEventListener('input',function(ev){S.aq=ev.target.value;dash.draw('abc-corpo');});
  $('#p-q').addEventListener('input',function(ev){S.pq=ev.target.value;dash.draw('p-lista');});
  document.querySelectorAll('#abc-tab th[data-k]').forEach(function(th){th.addEventListener('click',function(){var k=th.getAttribute('data-k');S.abcSort={k:k,d:S.abcSort.k===k?-S.abcSort.d:(k==='nome'||k==='fab'||k==='cl'?1:-1)};dash.draw('abc-corpo');});});
  document.querySelectorAll('#al-btns button').forEach(function(b){b.addEventListener('click',function(){S.al=b.getAttribute('data-a');syncPressed();dash.draw('al-titulo');dash.draw('al-regras');dash.draw('al-corpo');});});
  document.querySelectorAll('.ee-tabs button').forEach(function(b){b.addEventListener('click',function(){setTab(b.getAttribute('data-tab'));});});
  var named=(location.hash||'').slice(1);
  if(['visao','abc','produto','alertas','historico'].indexOf(named)>=0)S.tab=named;
  setTab(S.tab);
}
var booted=false;
dash.onData(function(){
  if(!booted){booted=true;boot();}
  updVis();
});
}
