(() => {
'use strict';
const STORE = 'recruitment-weekly-report-v1';
const numbers = ['weeklyTarget','weeklyInterviews','weeklyHires','nextTarget','nextInterviews','monthlyTarget','monthlyHires'];
const demo = {
 version:1,basic:{reporter:'示例填写人',department:'人力资源部',year:2026,month:11,week:1},
 positions:[
  {department:'销售部',role:'销售专员',weeklyTarget:2,weeklyInterviews:4,weeklyHires:1,nextTarget:2,nextInterviews:5,monthlyTarget:6,monthlyHires:2},
  {department:'市场部',role:'市场专员',weeklyTarget:1,weeklyInterviews:3,weeklyHires:1,nextTarget:1,nextInterviews:2,monthlyTarget:3,monthlyHires:1},
  {department:'运营部',role:'运营主管',weeklyTarget:0,weeklyInterviews:2,weeklyHires:0,nextTarget:1,nextInterviews:3,monthlyTarget:2,monthlyHires:0}
 ],
 channels:[{name:'招聘平台 A',total:120,effective:35},{name:'招聘平台 B',total:80,effective:20},{name:'员工推荐',total:12,effective:5}],
 optimization:'优化岗位描述与筛选条件，针对重点岗位调整沟通方式；跟踪不同渠道的有效反馈情况。',
 interviewNotes:'本周安排重点岗位复试；下周继续跟进面试反馈。',offerNotes:'2 名候选人待确认薪酬和到岗时间。',onboardingNotes:'协同业务部门准备新员工入职资料。',
 tasks:[{project:'重点岗位招聘',status:'进行中',goal:'完成关键岗位候选人筛选及复试安排',progress:'已完成初步筛选，安排下一轮面试。',issue:'部分候选人时间协调尚未完成。'},{project:'招聘渠道优化',status:'进行中',goal:'提升有效沟通比例',progress:'更新岗位发布内容并对比渠道反馈。',issue:''}]
};
const blank=()=>({version:1,basic:{reporter:'',department:'',year:new Date().getFullYear(),month:new Date().getMonth()+1,week:1},positions:[],channels:[],optimization:'',interviewNotes:'',offerNotes:'',onboardingNotes:'',tasks:[]});
const $=s=>document.querySelector(s), $$=(s,p=document)=>Array.from(p.querySelectorAll(s));
const clone=x=>JSON.parse(JSON.stringify(x));
const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>=0?Math.min(999999,Math.floor(n)):0};
const fmt=(n,d)=>d>0?(n/d*100).toFixed(0)+'%':'—';
const safeText=(v,max=5000)=>String(v??'').slice(0,max);
let state=clone(demo), savingTimer;
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2500)}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));$('#save-indicator').textContent='已自动保存至本机';}catch{$('#save-indicator').textContent='本地保存不可用，请导出 JSON';}}
function changed(){clearTimeout(savingTimer);$('#save-indicator').textContent='正在编辑…';savingTimer=setTimeout(persist,250)}
function fillRow(element,data){$$('[data-key]',element).forEach(el=>{el.value=data?.[el.dataset.key]??(el.type==='number'?0:'')})}
function extract(el,fields){const r={};for(const k of fields){const field=el.querySelector(`[data-key="${k}"]`);r[k]=field.type==='number'?num(field.value):safeText(field.value,field.tagName==='TEXTAREA'?5000:120)}return r}
function createPosition(data={}){const row=$('#position-template').content.firstElementChild.cloneNode(true);fillRow(row,data);$('#position-rows').append(row)}
function createChannel(data={}){const row=$('#channel-template').content.firstElementChild.cloneNode(true);fillRow(row,data);$('#channel-rows').append(row)}
function createTask(data={}){const card=$('#task-template').content.firstElementChild.cloneNode(true);fillRow(card,data);if(window.matchMedia('(max-width:620px)').matches)card.classList.add('is-collapsed');refreshTask(card);$('#task-list').append(card)}
function refreshTask(card){const name=card.querySelector('[data-key="project"]').value.trim();const status=card.querySelector('[data-key="status"]').value;card.querySelector('.task-title').textContent=name||'未命名事项';const badge=card.querySelector('.task-status');badge.textContent=status;badge.dataset.status=status;const collapsed=card.classList.contains('is-collapsed');const toggle=card.querySelector('.task-toggle');toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'展开事项详情':'折叠事项详情');toggle.innerHTML=collapsed?'展开 <span aria-hidden="true">⌄</span>':'收起 <span aria-hidden="true">⌃</span>'}
function sync(){state.basic={reporter:$('#reporter').value,department:$('#reportDepartment').value,year:num($('#year').value),month:num($('#month').value),week:num($('#week').value)};state.positions=$$('#position-rows tr').map(tr=>extract(tr,['department','role',...numbers]));state.channels=$$('#channel-rows tr').map(tr=>extract(tr,['name','total','effective']));for(const id of ['optimization','interviewNotes','offerNotes','onboardingNotes'])state[id]=$('#'+id).value;state.tasks=$$('#task-list .task-card').map(card=>extract(card,['project','status','goal','progress','issue']));}
function sum(key,list){return list.reduce((acc,item)=>acc+num(item[key]),0)}
function update(){sync();const p=state.positions,c=state.channels;const totals={};for(const key of numbers)totals[key]=sum(key,p);
  $$('#position-rows tr').forEach((tr,i)=>{tr.querySelector('[data-rate="weekly"]').textContent=fmt(num(p[i].weeklyHires),num(p[i].weeklyTarget));tr.querySelector('[data-rate="monthly"]').textContent=fmt(num(p[i].monthlyHires),num(p[i].monthlyTarget))});
  const vals=['合计','',totals.weeklyTarget,totals.weeklyInterviews,totals.weeklyHires,fmt(totals.weeklyHires,totals.weeklyTarget),totals.nextTarget,totals.nextInterviews,totals.monthlyTarget,totals.monthlyHires,fmt(totals.monthlyHires,totals.monthlyTarget)];
  $('#position-totals').replaceChildren(...vals.map((v,i)=>{const td=document.createElement('td');td.textContent=v;td.dataset.label=['汇总','', '本周目标','本周面试','本周入职','本周完成率','下周目标','下周面试','本月目标','本月入职','本月完成率'][i];return td}));
  $('#kpi-target').textContent=totals.weeklyTarget;$('#kpi-interviews').textContent=totals.weeklyInterviews;$('#kpi-hires').textContent=totals.weeklyHires;$('#kpi-rate').textContent=fmt(totals.weeklyHires,totals.weeklyTarget);$('#kpi-rate-hint').textContent=totals.weeklyTarget?`入职 ${totals.weeklyHires} 人 / 目标 ${totals.weeklyTarget} 人`:'目标为零时显示 —';
  $$('#channel-rows tr').forEach((tr,i)=>tr.querySelector('[data-rate="channel"]').textContent=fmt(num(c[i].effective),num(c[i].total)));
  const ct=sum('total',c),ce=sum('effective',c);$('#channel-totals').replaceChildren(...['合计',ct,ce,fmt(ce,ct)].map((v,i)=>{const td=document.createElement('td');td.textContent=v;td.dataset.label=['汇总','沟通/推荐量','有效/通过量','转化率'][i];return td}));
  $$('#task-list .task-number').forEach((el,i)=>el.textContent=`事项 ${String(i+1).padStart(2,'0')}`);$$('#task-list .task-card').forEach(refreshTask);
  changed();
}
function render(){for(const [k,id] of [['reporter','reporter'],['department','reportDepartment'],['year','year'],['month','month'],['week','week']])$('#'+id).value=state.basic[k]??'';$('#position-rows').replaceChildren();$('#channel-rows').replaceChildren();$('#task-list').replaceChildren();state.positions.forEach(createPosition);state.channels.forEach(createChannel);state.tasks.forEach(createTask);for(const id of ['optimization','interviewNotes','offerNotes','onboardingNotes'])$('#'+id).value=state[id]||'';update()}
function validate(data){if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1||!data.basic||typeof data.basic!=='object'||!Array.isArray(data.positions)||!Array.isArray(data.channels)||!Array.isArray(data.tasks))throw Error('JSON 结构或版本不正确');if(data.positions.length>300||data.channels.length>100||data.tasks.length>200)throw Error('数据行数超出限制');const out=blank();for(const k of ['reporter','department'])out.basic[k]=safeText(data.basic[k],80);for(const k of ['year','month','week'])out.basic[k]=num(data.basic[k]);if(out.basic.year<2000||out.basic.year>2100||out.basic.month<1||out.basic.month>12||out.basic.week<1||out.basic.week>6)throw Error('报表日期不正确');out.positions=data.positions.map(d=>{if(!d||typeof d!=='object')throw Error('岗位数据错误');const v={department:safeText(d.department,80),role:safeText(d.role,80)};for(const k of numbers)v[k]=num(d[k]);return v});out.channels=data.channels.map(d=>{if(!d||typeof d!=='object')throw Error('渠道数据错误');return {name:safeText(d.name,80),total:num(d.total),effective:num(d.effective)}});for(const k of ['optimization','interviewNotes','offerNotes','onboardingNotes'])out[k]=safeText(data[k],5000);const statuses=['未开始','进行中','已完成','存在风险'];out.tasks=data.tasks.map(d=>{if(!d||typeof d!=='object')throw Error('事项数据错误');return {project:safeText(d.project,120),status:statuses.includes(d.status)?d.status:'未开始',goal:safeText(d.goal,5000),progress:safeText(d.progress,5000),issue:safeText(d.issue,5000)}});return out}
for(let m=1;m<=12;m++)$('#month').add(new Option(`${m} 月`,m));for(let w=1;w<=6;w++)$('#week').add(new Option(`第 ${w} 周`,w));
try{const saved=localStorage.getItem(STORE);if(saved){state=validate(JSON.parse(saved));$('#save-indicator').textContent='已恢复本机数据'}}catch{state=clone(demo);$('#save-indicator').textContent='示例数据'}
render();
$('main').addEventListener('input',e=>{if(e.target.matches('input,textarea,select'))update()});$('main').addEventListener('change',e=>{if(e.target.matches('input,textarea,select'))update()});
$('#add-position').addEventListener('click',()=>{createPosition();update();toast('已新增岗位')});
$('#add-channel').addEventListener('click',()=>{createChannel();update();toast('已新增渠道')});
$('#add-task').addEventListener('click',()=>{createTask({status:'未开始'});update();toast('已新增事项')});
$('#position-rows').addEventListener('click',e=>{if(e.target.closest('.delete-row')&&confirm('确定删除该岗位？')){e.target.closest('tr').remove();update()}});
$('#channel-rows').addEventListener('click',e=>{if(e.target.closest('.delete-row')&&confirm('确定删除该渠道？')){e.target.closest('tr').remove();update()}});
$('#task-list').addEventListener('click',e=>{const card=e.target.closest('.task-card');if(!card)return;if(e.target.closest('.task-toggle')){card.classList.toggle('is-collapsed');refreshTask(card);return}if(e.target.closest('.delete-task')&&confirm('确定删除该事项？')){card.remove();update()}});
$('#new-report').addEventListener('click',()=>{if(confirm('新建空白周报将覆盖当前浏览器中自动保存的数据。建议先导出 JSON 备份。确认继续？')){state=blank();render();toast('已创建空白周报')}});
$('#export-btn').addEventListener('click',()=>{sync();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`招聘周报_${state.basic.year}-${String(state.basic.month).padStart(2,'0')}_第${state.basic.week}周.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已生成 JSON 备份')});
$('#import-btn').addEventListener('click',()=>$('#import-file').click());$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2_000_000)throw Error('文件超过 2 MB 限制');const loaded=validate(JSON.parse(await file.text()));if(!confirm('导入后将覆盖当前周报，是否继续？'))return;state=loaded;render();toast('JSON 导入成功')}catch(err){toast(`导入失败：${err.message}`)}finally{e.target.value=''}});
$('#print-btn').addEventListener('click',()=>window.print());
})();
