// @ts-nocheck
/* Portado do Artifact "resultado" (claude.ai). A lógica é a da página original;
   os dados chegam pelo objeto dash (ver ../runtime.ts). */
import * as d3 from 'd3'

export function montar(dash) {
var S={cmes:null,tab:'cx',contas:{cx:false,cp:false},de:null,ate:null,loja:'todas',dim:'fab',q:'',sort:{k:'margem',d:-1}};
var NAMES=['sub','aviso','cx-k','cx-leg','cx-chart','cx-ck','cx-h','cx-t','cp-k','cp-leg','cp-chart','cp-ck','cp-h','cp-t','cp-nota','m-de','m-ate','m-loja','m-dim','m-q','mg-k','mg-tit','mg-chart','mg-t','mg-nota','co-m','co-t','d-info'];
var $=function(s){return document.querySelector(s);};
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var bf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
var nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
function fm(v){if(v==null||!isFinite(v))return '—';if(Math.abs(v)<0.5)return bf.format(0);return (v<0?'−':'')+bf.format(Math.abs(v));}
function pc(v){return v==null||!isFinite(v)?'—':(v*100).toFixed(1).replace('.',',')+'%';}
function ml(m){return MES[+m.slice(5,7)-1]+'/'+m.slice(2,4);}
function dmy(s){return s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';}
function h(tag,props){
  var e=document.createElement(tag);
  if(props)for(var q in props){var v=props[q];if(q==='class')e.className=v;else if(q==='text')e.textContent=v;else e.setAttribute(q,v);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x.nodeType?x:document.createTextNode(String(x)));});else e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
var IDS=['resultado_caixa','resultado_comp','resultado_margem','resultado_conc','resultado_info'];
function ready(){return IDS.every(function(i){return dash.data(i).status==='ok';});}
function D(i){return dash.data(i).data;}
function sum(a,f){return a.reduce(function(s,x){return s+(f(x)||0);},0);}
function info(){return D('resultado_info')[0];}
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
var COR={rec:'#2f6f8f',desp:'#c96a3c',res:'#5a8f4e'};

/* ---- caixa: derivados ---- */
function mesesCx(){var m={};D('resultado_caixa').forEach(function(r){m[r.mes]=r.periodo_fim;});return Object.keys(m).sort().map(function(k){return {mes:k,fim:m[k]};});}
function ultimoDia(mes){var y=+mes.slice(0,4),m=+mes.slice(5,7);var d=new Date(y,m,0).getDate();return mes+'-'+String(d).padStart(2,'0');}
function parcial(x){return x.fim<ultimoDia(x.mes);}
function cxSum(mes,f){return sum(D('resultado_caixa').filter(function(r){return r.mes===mes&&f(r);}),function(r){return r.valor;});}
var isRec=function(r){return r.natureza==='receita';};
var isOp=function(r){return r.tipo==='despesa'&&r.natureza!=='nao_operacional';};
var isNo=function(r){return r.natureza==='nao_operacional';};
function cxRes(mes){
  var rec=cxSum(mes,isRec),op=cxSum(mes,isOp),no=cxSum(mes,isNo);
  return {rec:rec,op:op,no:no,resOp:rec-op,res:rec-op-no};
}
function ultimoFechadoCx(){var M=mesesCx().filter(function(x){return !parcial(x);});return M.length?M[M.length-1].mes:null;}
function prevMes(list,m){var i=list.indexOf(m);return i>0?list[i-1]:null;}

/* ---- tabela DRE genérica ---- */
function dreHead(thead,cols){
  thead.replaceChildren();
  thead.append(h('tr',null,h('th',{class:'l',text:'Linha'}),cols.map(function(c){return h('th',{class:c.par?'par':'',text:ml(c.mes)+(c.par?' (parcial)':'')});})));
}
function addRow(tb,cls,label,vals,fmt){
  tb.append(h('tr',{class:cls||''},h('td',{class:'l',text:label}),vals.map(function(v){return h('td',{class:(typeof v==='number'&&v<0&&cls&&cls.indexOf('res')>=0)?'neg':'',text:(fmt||fm)(v)});})));
}
function contasDe(filtro){
  var m={};
  D('resultado_caixa').filter(filtro).forEach(function(r){var k=r.conta;(m[k]||(m[k]={conta:k,desc:r.desc,tot:0}));m[k].tot+=r.valor;});
  return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return b.tot-a.tot;});
}
function bloco(tb,cols,label,filtro,mostrar,sinal){
  var vals=cols.map(function(c){return cxSum(c.mes,filtro)*(sinal||1);});
  addRow(tb,'sec',label,vals);
  if(mostrar)contasDe(filtro).forEach(function(ct){
    addRow(tb,'sub','  '+ct.desc.toLowerCase().replace(/^./,function(x){return x.toUpperCase();}),cols.map(function(c){return cxSum(c.mes,function(r){return filtro(r)&&r.conta===ct.conta;})*(sinal||1);}));
  });
}
var G=function(raiz){return function(r){return r.raiz===raiz&&isOp(r);};};

/* ---- aba Caixa ---- */
dash.draw('cx-k',function(el){
  el.replaceChildren();
  if(!ready())return;
  var ms=mesesCx().map(function(x){return x.mes;}),u=ultimoFechadoCx();
  if(!u){return;}
  var a=cxRes(u),p=prevMes(ms,u),b=p?cxRes(p):null;
  function kpi(v,rotulo,vp,inv){
    var d='';
    if(vp!=null){var dv=v-vp;d=(dv>=0?'+':'−')+bf.format(Math.abs(dv))+' em relação a '+ml(p);}
    return h('div',{class:'cc-kpi'},h('b',{text:fm(v)}),h('em',{class:vp==null?'':((v-vp)*(inv?-1:1)>=0?'up':'down'),text:d}),h('span',{text:rotulo+' · '+ml(u)}));
  }
  el.append(kpi(a.rec,'Recebido',b&&b.rec),kpi(a.op,'Despesas operacionais',b&&b.op,true),kpi(a.resOp,'Resultado operacional de caixa',b&&b.resOp),kpi(a.no,'Não operacional',b&&b.no,true),kpi(a.res,'Resultado de caixa',b&&b.res));
});
function barrasMes(el,dados,series){
  el.replaceChildren();
  var W=el.clientWidth||600,H=280,m={t:12,r:8,b:30,l:56};
  var x0=d3.scaleBand().domain(dados.map(function(d){return d.mes;})).range([m.l,W-m.r]).paddingInner(0.25);
  var x1=d3.scaleBand().domain(series.map(function(s){return s.k;})).range([0,x0.bandwidth()]).padding(0.08);
  var all=[];dados.forEach(function(d){series.forEach(function(s){all.push(d[s.k]);});});
  var y=d3.scaleLinear().domain([Math.min(0,d3.min(all)*1.1),Math.max(1,d3.max(all)*1.1)]).nice().range([H-m.b,m.t]);
  var svg=d3.create('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+H);
  svg.append('g').selectAll('line').data(y.ticks(5)).join('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y).attr('y2',y).attr('stroke','var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(y.ticks(5)).join('text').attr('x',m.l-6).attr('y',y).attr('dy','0.32em').attr('text-anchor','end').text(function(v){return nf.format(v/1000)+' mil';});
  svg.append('g').selectAll('text').data(dados).join('text').attr('x',function(d){return x0(d.mes)+x0.bandwidth()/2;}).attr('y',H-m.b+18).attr('text-anchor','middle').text(function(d){return ml(d.mes)+(d.par?' (parcial)':'');});
  var g=svg.append('g').selectAll('g').data(dados).join('g').attr('transform',function(d){return 'translate('+x0(d.mes)+',0)';});
  series.forEach(function(s){
    g.append('rect').attr('x',x1(s.k)).attr('width',x1.bandwidth()).attr('y',function(d){return y(Math.max(0,d[s.k]));}).attr('height',function(d){return Math.abs(y(d[s.k])-y(0));}).attr('fill',s.c).attr('rx',2);
  });
  g.append('rect').attr('x',0).attr('width',x0.bandwidth()).attr('y',m.t).attr('height',H-m.t-m.b).attr('fill','transparent')
    .on('mousemove',function(ev,d){showTip(ev,[ml(d.mes)].concat(series.map(function(s){return s.n+': '+fm(d[s.k]);})));}).on('mouseleave',hideTip);
  el.append(svg.node());
}
function legenda(el,series){el.replaceChildren();if(!ready())return;series.forEach(function(s){el.append(h('span',null,h('i',{style:'background:'+s.c}),s.n));});}
var SER_CX=[{k:'rec',n:'Recebido',c:COR.rec},{k:'op',n:'Despesas operacionais',c:COR.desp},{k:'resOp',n:'Resultado operacional',c:COR.res}];
dash.draw('cx-leg',function(el){legenda(el,SER_CX);});
dash.draw('cx-chart',function(el){
  el.replaceChildren();if(!ready())return;
  barrasMes(el,mesesCx().map(function(x){var r=cxRes(x.mes);return {mes:x.mes,par:parcial(x),rec:r.rec,op:r.op,resOp:r.resOp};}),SER_CX);
});
dash.draw('cx-ck',function(el){
  if(!ready())return;
  el.checked=S.contas.cx;el.onchange=function(){S.contas.cx=el.checked;dash.draw('cx-t');};
});
dash.draw('cx-h',function(th){th.replaceChildren();if(!ready())return;dreHead(th,mesesCx().map(function(x){return {mes:x.mes,par:parcial(x)};}));});
dash.draw('cx-t',function(tb){
  tb.replaceChildren();if(!ready())return;
  var cols=mesesCx().map(function(x){return {mes:x.mes,par:parcial(x)};}),mo=S.contas.cx;
  bloco(tb,cols,'Recebido (Contas a Receber)',isRec,mo);
  var vm=cols.map(function(c){return cpSum(c.mes,function(r){return r.fat;});});
  addRow(tb,'pc','   Memo: vendas do mês (competência)',vm.map(function(v){return v||null;}));
  addRow(tb,'pc','   Recebido ÷ vendas do mês',cols.map(function(c,i){return vm[i]?cxSum(c.mes,isRec)/vm[i]:null;}),pc);
  bloco(tb,cols,'(−) Custos de mercadoria e serviços',G('3'),mo);
  bloco(tb,cols,'(−) Despesas',G('2'),mo);
  bloco(tb,cols,'(−) Devolução de vendas',G('4'),mo);
  addRow(tb,'res','= Resultado operacional de caixa',cols.map(function(c){return cxRes(c.mes).resOp;}));
  addRow(tb,'pc','   % da receita',cols.map(function(c){var r=cxRes(c.mes);return r.rec?r.resOp/r.rec:null;}),pc);
  bloco(tb,cols,'(−) Transferências, amortização e bens (não operacional)',isNo,mo);
  addRow(tb,'res','= Resultado de caixa',cols.map(function(c){return cxRes(c.mes).res;}));
});

/* ---- competência ---- */
function mesesCp(){var m={};D('resultado_comp').forEach(function(r){m[r.mes]=1;});return Object.keys(m).sort();}
function cpSum(mes,f){return sum(D('resultado_comp').filter(function(r){return r.mes===mes;}),f);}
function cpRes(mes){
  var liq=cpSum(mes,function(r){return r.liquido;}),srv=cpSum(mes,function(r){return r.serv;}),cmv=cpSum(mes,function(r){return r.cmv;});
  var dev=cxSum(mes,function(r){return r.natureza==='devolucao';});
  var frete=cxSum(mes,function(r){return r.raiz==='3'&&isOp(r)&&r.conta!=='3.001.001';});
  var desp=cxSum(mes,function(r){return r.raiz==='2'&&isOp(r);});
  var rl=liq+srv-dev,mb=rl-cmv,op=mb-frete-desp,no=cxSum(mes,isNo);
  return {liq:liq,srv:srv,dev:dev,rl:rl,cmv:cmv,mb:mb,frete:frete,desp:desp,dd:frete+desp,op:op,no:no,res:op-no,lcc:cpSum(mes,function(r){return r.liquido_com_custo;})};
}
function ultimoCp(){var M=mesesCp();return M.length?M[M.length-1]:null;}
dash.draw('cp-k',function(el){
  el.replaceChildren();if(!ready())return;
  var M=mesesCp(),u=ultimoCp();if(!u)return;
  var a=cpRes(u),p=prevMes(M,u),b=p?cpRes(p):null;
  function kpi(v,rotulo,vp,inv,txt){
    var d=txt||'';
    if(!txt&&vp!=null){var dv=v-vp;d=(dv>=0?'+':'−')+bf.format(Math.abs(dv))+' em relação a '+ml(p);}
    return h('div',{class:'cc-kpi'},h('b',{text:txt?pc(v):fm(v)}),h('em',{class:(!txt&&vp!=null)?((v-vp)*(inv?-1:1)>=0?'up':'down'):'',text:d}),h('span',{text:rotulo+' · '+ml(u)}));
  }
  el.append(kpi(a.rl,'Receita líquida',b&&b.rl),kpi(a.cmv,'Custo da mercadoria vendida',b&&b.cmv,true),
    kpi(a.rl?a.mb/a.rl:null,'Margem bruta',null,false,fm(a.mb)),kpi(a.dd,'Despesas do mês',b&&b.dd,true),kpi(a.op,'Resultado operacional',b&&b.op));
});
var SER_CP=[{k:'rl',n:'Receita líquida',c:COR.rec},{k:'dd',n:'CMV e despesas',c:COR.desp},{k:'op',n:'Resultado operacional',c:COR.res}];
dash.draw('cp-leg',function(el){legenda(el,SER_CP);});
dash.draw('cp-chart',function(el){
  el.replaceChildren();if(!ready())return;
  barrasMes(el,mesesCp().map(function(m){var r=cpRes(m);return {mes:m,rl:r.rl,dd:r.cmv+r.dd,op:r.op};}),SER_CP);
});
dash.draw('cp-ck',function(el){if(!ready())return;el.checked=S.contas.cp;el.onchange=function(){S.contas.cp=el.checked;dash.draw('cp-t');};});
dash.draw('cp-h',function(th){th.replaceChildren();if(!ready())return;dreHead(th,mesesCp().map(function(m){return {mes:m};}));});
dash.draw('cp-t',function(tb){
  tb.replaceChildren();if(!ready())return;
  var M=mesesCp(),cols=M.map(function(m){return {mes:m};}),R=M.map(cpRes),mo=S.contas.cp;
  addRow(tb,'sec','Receita de produtos',R.map(function(r){return r.liq;}));
  addRow(tb,'sec','Serviços cobrados (montagem e frete)',R.map(function(r){return r.srv;}));
  bloco(tb,cols,'(−) Devolução de vendas',G('4'),mo);
  addRow(tb,'res','= Receita líquida',R.map(function(r){return r.rl;}));
  addRow(tb,'sec','(−) Custo da mercadoria vendida (CMV)',R.map(function(r){return r.cmv;}));
  addRow(tb,'res','= Margem bruta',R.map(function(r){return r.mb;}));
  addRow(tb,'pc','   % da receita líquida',R.map(function(r){return r.rl?r.mb/r.rl:null;}),pc);
  bloco(tb,cols,'(−) Frete e ICMS sobre compras',function(r){return r.raiz==='3'&&isOp(r)&&r.conta!=='3.001.001';},mo);
  bloco(tb,cols,'(−) Despesas operacionais',G('2'),mo);
  addRow(tb,'res','= Resultado operacional',R.map(function(r){return r.op;}));
  addRow(tb,'pc','   % da receita líquida',R.map(function(r){return r.rl?r.op/r.rl:null;}),pc);
  bloco(tb,cols,'(−) Transferências, amortização e bens (não operacional)',isNo,mo);
  addRow(tb,'res','= Resultado após não operacional',R.map(function(r){return r.res;}));
});
dash.draw('cp-nota',function(el){
  if(!ready()){el.textContent='';return;}
  var M=mesesCp(),parts=M.map(function(m){var r=cpRes(m);return ml(m)+': custo informado em '+pc(r.liq?r.lcc/r.liq:null)+' das vendas';});
  el.textContent='As despesas são as pagas no mês, não as devidas. '+parts.join('; ')+'.';
});

/* ---- margem ---- */
function meses(){var m={};D('resultado_margem').forEach(function(r){m[r.mes]=1;});return Object.keys(m).sort();}
function lojas(){var m={};D('resultado_margem').forEach(function(r){m[r.loja]=1;});return Object.keys(m).sort();}
var DIMS=[['fab','Por fábrica'],['loja','Por loja'],['cat','Por categoria'],['fam','Por família'],['prod','Por produto']];
function dimKey(r){
  switch(S.dim){
    case 'loja':return [r.loja,r.loja];
    case 'cat':return [r.cat||'Sem categoria',r.cat||'Sem categoria'];
    case 'fam':return [r.fab+'|'+(r.fid||r.cod),(r.familia||r.nome)+' · '+r.fab];
    case 'prod':return [r.cod,r.nome+' ('+r.cod+')'];
    default:return [r.fab,r.fab];
  }
}
function mgLinhas(){
  var m={};
  D('resultado_margem').forEach(function(r){
    if(r.mes<S.de||r.mes>S.ate)return;
    if(S.loja!=='todas'&&r.loja!==S.loja)return;
    var k=dimKey(r),o=m[k[0]]||(m[k[0]]={nome:k[1],un:0,tabela:0,liquido:0,custo:0,lcc:0});
    o.un+=r.un;o.tabela+=r.tabela;o.liquido+=r.liquido;o.custo+=r.custo;o.lcc+=r.lcc;
  });
  var L=Object.keys(m).map(function(k){var o=m[k];o.margem=o.lcc-o.custo;o.mpct=o.lcc>0?o.margem/o.lcc:null;o.desc=o.tabela>0?1-o.liquido/o.tabela:null;return o;});
  var tot=sum(L,function(o){return o.margem;});
  L.forEach(function(o){o.share=tot?o.margem/tot:null;});
  return L;
}
function mgFiltradas(){
  var q=S.q;
  var L=mgLinhas().filter(function(o){return !q||o.nome.toLowerCase().indexOf(q)>=0;});
  var k=S.sort.k,d=S.sort.d;
  return L.sort(function(a,b){
    var x=a[k],y=b[k],nx=x==null,ny=y==null;
    if(nx||ny)return nx&&ny?0:nx?1:-1;
    var r=typeof x==='string'?x.localeCompare(y,'pt-BR'):x-y;
    return r?r*d:a.nome.localeCompare(b.nome,'pt-BR');
  });
}
function selMes(name,key){
  dash.draw(name,function(el){
    if(!ready()){el.replaceChildren();return;}
    var M=meses();
    el.replaceChildren.apply(el,M.map(function(m){return new Option((key==='de'?'De ':'Até ')+ml(m),m);}));
    el.value=S[key];
    el.onchange=function(){S[key]=el.value;if(S.de>S.ate){if(key==='de')S.ate=S.de;else S.de=S.ate;}redraw();};
  });
}
selMes('m-de','de');selMes('m-ate','ate');
dash.draw('m-loja',function(el){
  if(!ready()){el.replaceChildren();return;}
  el.replaceChildren.apply(el,[new Option('Todas as lojas','todas')].concat(lojas().map(function(l){return new Option(l,l);})));
  el.value=S.loja;el.onchange=function(){S.loja=el.value;redraw();};
});
dash.draw('m-dim',function(el){
  if(!ready()){el.replaceChildren();return;}
  el.replaceChildren.apply(el,DIMS.map(function(d){return new Option(d[1],d[0]);}));
  el.value=S.dim;el.onchange=function(){S.dim=el.value;redraw();};
});
dash.draw('m-q',function(el){if(!ready())return;el.oninput=function(){S.q=el.value.toLowerCase();dash.draw('mg-t');dash.draw('mg-nota');};});
dash.draw('mg-k',function(el){
  el.replaceChildren();if(!ready())return;
  var L=mgLinhas(),liq=sum(L,function(o){return o.liquido;}),cu=sum(L,function(o){return o.custo;}),lcc=sum(L,function(o){return o.lcc;}),tab=sum(L,function(o){return o.tabela;});
  function kpi(t,r,s){return h('div',{class:'cc-kpi'},h('b',{text:t}),h('em',{text:s||''}),h('span',{text:r}));}
  el.append(kpi(fm(liq),'Faturamento de produtos',ml(S.de)+' a '+ml(S.ate)),kpi(fm(cu),'Custo',''),kpi(fm(lcc-cu),'Margem bruta',''),kpi(pc(lcc>0?(lcc-cu)/lcc:null),'Margem %',''),kpi(pc(tab>0?1-liq/tab:null),'Desconto médio','sobre o preço de tabela'));
});
dash.draw('mg-tit',function(el){if(!ready()){el.textContent='Margem';return;}el.textContent='Maiores margens '+DIMS.filter(function(d){return d[0]===S.dim;})[0][1].toLowerCase();});
dash.draw('mg-chart',function(el){
  el.replaceChildren();if(!ready())return;
  var L=mgLinhas().sort(function(a,b){return b.margem-a.margem;}).slice(0,12),W=el.clientWidth||600,rh=26,H=L.length*rh+10,m={l:Math.min(230,W*0.4),r:110};
  var x=d3.scaleLinear().domain([0,d3.max(L,function(o){return o.margem;})||1]).range([m.l,W-m.r]);
  var svg=d3.create('svg').attr('width','100%').attr('viewBox','0 0 '+W+' '+H);
  var g=svg.selectAll('g').data(L).join('g').attr('transform',function(_,i){return 'translate(0,'+(i*rh+4)+')';});
  g.append('text').attr('x',m.l-8).attr('y',rh/2).attr('dy','0.32em').attr('text-anchor','end').text(function(o){var n=o.nome;var mx=Math.floor(m.l/6.2);return n.length>mx?n.slice(0,mx-1)+'…':n;});
  g.append('rect').attr('x',m.l).attr('y',3).attr('height',rh-8).attr('rx',2).attr('width',function(o){return Math.max(1,x(Math.max(0,o.margem))-m.l);}).attr('fill','#2f6f8f');
  g.append('text').attr('x',function(o){return x(Math.max(0,o.margem))+6;}).attr('y',rh/2).attr('dy','0.32em').text(function(o){return fm(o.margem)+' · '+pc(o.mpct);});
  g.append('rect').attr('x',0).attr('width',W).attr('height',rh).attr('fill','transparent')
    .on('mousemove',function(ev,o){showTip(ev,[o.nome,'Faturamento '+fm(o.liquido),'Margem '+fm(o.margem)+' ('+pc(o.mpct)+')','Desconto '+pc(o.desc)]);}).on('mouseleave',hideTip);
  el.append(svg.node());
});
dash.draw('mg-t',function(tb){
  tb.replaceChildren();if(!ready())return;
  mgFiltradas().forEach(function(o){
    tb.append(h('tr',null,h('td',{class:'nm',text:o.nome}),h('td',{text:nf.format(o.un)}),h('td',{text:fm(o.liquido)}),h('td',{text:fm(o.custo)}),
      h('td',{class:o.margem<0?'neg':'',text:fm(o.margem)}),h('td',{class:o.mpct!=null&&o.mpct<0.25?'neg':'',text:pc(o.mpct)}),h('td',{text:pc(o.desc)}),h('td',{text:pc(o.share)})));
  });
});
dash.draw('mg-nota',function(el){
  if(!ready()){el.textContent='';return;}
  var L=mgLinhas(),n=mgFiltradas().length,sc=sum(L,function(o){return o.liquido;})-sum(L,function(o){return o.lcc;});
  el.textContent=n+' linhas.'+(sc>1?' '+fm(sc)+' de faturamento sem custo informado ficaram fora da margem.':'');
});
function marca(){
  var th=document.querySelector('thead[data-t=m]');if(!th)return;
  th.querySelectorAll('th[data-sort]').forEach(function(c){
    if(c.dataset.sort===S.sort.k)c.setAttribute('aria-sort',S.sort.d>0?'ascending':'descending');else c.removeAttribute('aria-sort');
  });
}

/* ---- topo ---- */
dash.draw('sub',function(el){
  if(!ready()){el.textContent='—';return;}
  var i=info(),u=ultimoFechadoCx(),ult=mesesCx().slice(-1)[0];
  el.textContent='Global, de '+ml(i.corte)+' em diante. Pagamentos até '+dmy(i.ultimo_dia_dre)+', recebimentos até '+dmy(i.ultimo_recebimento)+'; vendas da base até '+dmy(i.ultima_venda)+'.'+(u?' Último mês fechado: '+ml(u)+'.':'');
});
dash.draw('aviso',function(el){
  el.replaceChildren();if(!ready()){el.hidden=true;return;}
  var msgs=[],ms=mesesCx().filter(parcial),inf=info();
  if(ms.length)msgs.push(ml(ms[ms.length-1].mes)+' está parcial: os pagamentos vão até '+dmy(ms[ms.length-1].fim)+'.');
  if(inf.baixa_receber_out!=null)msgs.push('A baixa do Contas a Receber está incompleta: só '+pc(inf.baixa_receber_set)+' das parcelas que vencem em setembro e '+pc(inf.baixa_receber_out)+' das de outubro estão baixadas. O recebido do mês fica subestimado e o resultado de caixa aparece pior que o real. Use a aba de competência como referência.');
  var u=ultimoFechadoCx();
  if(u){var tr=cxSum(u,function(r){return r.conta==='8.002.001';});if(tr>0)msgs.push('As transferências enviadas ('+fm(tr)+' em '+ml(u)+') ficam fora do resultado operacional. Se parte delas paga despesas de outra empresa, o resultado operacional aparece maior que o real até separar por loja e empresa.');}
  el.hidden=false;msgs.forEach(function(m){el.append(h('p',{text:m}));});
});
dash.draw('d-info',function(el){
  el.replaceChildren();if(!ready())return;
  var i=info();
  [['Gerado em',dmy(i.gerado_em.slice(0,10))],['Contas a Pagar',i.arquivo_pagar+', pagamentos até '+dmy(i.ultimo_dia_dre)],['Contas a Receber',i.arquivo_receber+', recebimentos até '+dmy(i.ultimo_recebimento)],['Recebimentos com data futura (ignorados)',fm(i.recebimentos_data_futura)],['Última venda na base',dmy(i.ultima_venda)],['Margem desde',ml(i.margem_desde)],['Recorte','Global ('+i.loja+')']].forEach(function(p){el.append(h('p',null,h('b',{text:p[0]+': '}),p[1]));});
});

function concMeses(){var m={};D('resultado_conc').forEach(function(r){m[r.mes]=1;});return Object.keys(m).sort();}
dash.draw('co-m',function(el){
  if(!ready()){el.replaceChildren();return;}
  var M=concMeses();if(!S.cmes)S.cmes=M[M.length-1];
  el.replaceChildren.apply(el,M.map(function(m){return new Option(ml(m),m);}));
  el.value=S.cmes;el.onchange=function(){S.cmes=el.value;dash.draw('co-t');};
});
dash.draw('co-t',function(tb){
  tb.replaceChildren();if(!ready())return;
  var R=D('resultado_conc').filter(function(r){return r.mes===S.cmes;}).sort(function(a,b){return Math.abs(b.pagar-b.unique)-Math.abs(a.pagar-a.unique);});
  R.forEach(function(r){
    var d=r.pagar-r.unique,big=Math.abs(d)>1000;
    tb.append(h('tr',null,h('td',{class:'nm',text:r.conta.toLowerCase().replace(/^./,function(x){return x.toUpperCase();})}),h('td',{text:fm(r.unique)}),h('td',{text:fm(r.pagar)}),h('td',{class:big?(d<0?'neg':'pos'):'',text:fm(d)})));
  });
  var u=sum(R,function(r){return r.unique;}),p=sum(R,function(r){return r.pagar;});
  tb.append(h('tr',{class:'tot'},h('td',{class:'l',text:'Total das despesas'}),h('td',{text:fm(u)}),h('td',{text:fm(p)}),h('td',{text:fm(p-u)})));
});
function mostra(){
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===S.tab?'true':'false');});
  document.querySelectorAll('.cc-pane').forEach(function(p){p.hidden=p.id!==S.tab;});
}
dash.onData(function(){
  if(ready()&&!S.de){var M=meses();S.de=(info().corte>M[0]?info().corte:M[0]);if(M.indexOf(S.de)<0)S.de=M[0];S.ate=M[M.length-1];}
  document.querySelectorAll('.cc-tabs button').forEach(function(b){b.onclick=function(){S.tab=b.dataset.tab;mostra();redraw();};});
  document.querySelectorAll('thead[data-t=m] th[data-sort]').forEach(function(c){
    c.tabIndex=0;
    function go(){var k=c.dataset.sort;if(S.sort.k===k)S.sort.d=-S.sort.d;else{S.sort.k=k;S.sort.d=k==='nome'?1:-1;}marca();dash.draw('mg-t');}
    c.onclick=go;c.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
  });
  marca();mostra();
});
}
