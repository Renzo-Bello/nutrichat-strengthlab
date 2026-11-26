/* A compact daily overview; the existing storage and registration flows remain the source of truth. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const glyph=name=>'<svg class="nc-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#nc-'+name+'"></use></svg>';
const summary=document.querySelector('.summary');
const intro=document.createElement('div');intro.className='daily-intro';intro.innerHTML='<span class="section-kicker">Tu diario de nutrición</span><h1>Tu día, en balance.</h1><p>Cada registro cuenta. Avanza a tu ritmo.</p>';document.querySelector('#diary').prepend(intro);
const editGoal=$('editgoal');editGoal.textContent='Metas';editGoal.removeAttribute('style');editGoal.className='dashboard-goals';editGoal.setAttribute('aria-label','Configurar metas de calorías y macros');
const diary=$('diary'),journal=document.querySelector('.journal');
// Keep the existing live water controls and handlers inside a compact sheet.
const waterPanel=document.querySelector('.daily-nutrient-panel');
const waterBlock=document.querySelector('.hydration-block');
const waterTargets=$('openNutrientGoals');
const waterDialog=document.createElement('dialog');waterDialog.id='waterDialog';waterDialog.className='water-dialog';waterDialog.setAttribute('aria-labelledby','waterDialogTitle');
waterDialog.innerHTML='<div class="dialog-top"><h2 id="waterDialogTitle">Registrar agua</h2><button id="closeWater" type="button" aria-label="Cerrar registro de agua">×</button></div><p class="small">Agrega lo que tomaste en la fecha seleccionada.</p><div id="waterDialogContent"></div>';
waterDialog.querySelector('#waterDialogContent').append(waterBlock,waterTargets);document.body.append(waterDialog);
$('closeWater').onclick=()=>waterDialog.close();waterTargets.textContent='Configurar meta de agua';waterTargets.onclick=()=>{waterDialog.close();openNutrientGoals();};
waterDialog.addEventListener('click',e=>{if(e.target===waterDialog)waterDialog.close();});
const extras=document.createElement('details');extras.className='dashboard-extras';extras.innerHTML='<summary>Más detalles de mi día</summary>';
const micro=document.querySelector('.micro-details');const dataDetails=document.querySelector('.summarycol details:not(.micro-details)');
if(micro)extras.append(micro);if(dataDetails)extras.append(dataDetails);extras.append($('savestate'));
journal.after(extras);waterPanel.remove();document.querySelector('.guidebox').remove();document.querySelector('.view-cta').remove();
summary.className='daily-overview';
summary.innerHTML='<button type="button" class="calorie-card metric-help" data-metric="calories" aria-label="Calorías: ver explicación" aria-haspopup="dialog"><div><div class="calorie-numbers"><strong id="dailyCalories">0</strong><span id="dailyCalorieGoal">Sin meta</span></div><span class="metric-label">Calorías</span></div><div class="metric-ring calorie-ring" id="calorieRing"><span>'+glyph('flame')+'</span></div></button><div class="macro-overview">'+[['protein','Proteínas','protein'],['carbs','Carbos','carbs'],['fat','Grasas','fat']].map(([key,label,icon])=>'<button type="button" class="macro-card metric-help '+key+'" data-metric="'+key+'" aria-label="'+label+': ver explicación" aria-haspopup="dialog"><div class="metric-ring" id="'+key+'Ring"><span>'+glyph(icon)+'</span></div><div class="macro-numbers"><strong id="daily-'+key+'">0</strong><span id="goal-'+key+'">Sin meta</span></div><span class="metric-label">'+label+'</span></button>').join('')+'</div><section class="water-overview" aria-label="Agua registrada"><span class="water-symbol">'+glyph('fat')+'</span><div class="water-info"><div class="water-numbers"><strong id="dailyWater">0</strong><span id="dailyWaterGoal">ml</span></div><span class="metric-label">Hidratación</span></div><button id="registerWater" type="button">Registrar agua</button></section><p id="dailyBalance" class="daily-balance"></p><button id="configureDailyGoals" class="configure-daily-goals" type="button">Configurar metas de calorías y macros</button>';
$('registerWater').onclick=()=>waterDialog.showModal();
// Short explanations are available by touch, mouse and keyboard.
const metricInfo={
 calories:{title:'Calorías',text:'Miden la energía que aportan los alimentos y que tu cuerpo usa para funcionar y moverse. Se expresan en kcal.',input:'goalinput'},
 protein:{title:'Proteínas',text:'Ayudan a construir y reparar tejidos, incluidos los músculos. Están en alimentos como huevos, pollo, lácteos y legumbres.',input:'goalprotein'},
 carbs:{title:'Carbohidratos',text:'Son una fuente de energía para tu cuerpo. Están en alimentos como arroz, avena, pan, frutas y legumbres.',input:'goalcarbs'},
 fat:{title:'Grasas',text:'Aportan energía y ayudan a absorber algunas vitaminas. Las encuentras en aceite de oliva, palta, frutos secos y otros alimentos.',input:'goalfat'}
};
const metricDialog=document.createElement('dialog');metricDialog.id='metricDialog';metricDialog.className='metric-dialog';metricDialog.setAttribute('aria-labelledby','metricTitle');metricDialog.setAttribute('aria-describedby','metricExplanation');
metricDialog.innerHTML='<div class="dialog-top"><h2 id="metricTitle"></h2><button id="closeMetric" type="button" aria-label="Cerrar explicación">×</button></div><p id="metricExplanation"></p><p id="metricTracking" class="metric-tracking"></p><button id="metricSetGoal" class="primary" type="button">Configurar mi meta</button><a class="metric-source" href="https://espanol.kaiserpermanente.org/es/health-wellness/health-encyclopedia/he.principales-nutrientes-en-los-alimentos.aa162807" target="_blank" rel="noopener noreferrer">Sobre estos nutrientes</a>';
document.body.append(metricDialog);
$('closeMetric').onclick=()=>metricDialog.close();metricDialog.addEventListener('click',e=>{if(e.target===metricDialog)metricDialog.close();});
$('configureDailyGoals').onclick=()=>{if(!busy)editGoal.click();};
summary.addEventListener('click',e=>{
 const card=e.target.closest('[data-metric]');if(!card)return;
 const key=card.dataset.metric,info=metricInfo[key],value=key==='calories'?total().kcal:total()[key],goal=key==='calories'?state.goal:state.macroGoal?.[key],unit=key==='calories'?'kcal':'g';
 $('metricTitle').textContent=info.title;$('metricExplanation').textContent=info.text;
 $('metricTracking').textContent='Registrado: '+fmt(value)+' '+unit+(goal==null?' · Aún no defines una meta.':' · Meta: '+fmt(goal)+' '+unit+'.');
 $('metricSetGoal').textContent=goal==null?'Configurar mi meta':'Editar mi meta';
 $('metricSetGoal').onclick=()=>{if(busy)return;metricDialog.close();editGoal.click();$(info.input).focus({preventScroll:true});};
 metricDialog.showModal();
});

const calendar=document.createElement('section');calendar.className='week-calendar';calendar.setAttribute('aria-label','Fecha del diario');calendar.innerHTML='<div class="week-toolbar"><label class="month-picker"><span id="dailyMonth"></span>'+glyph('calendar')+'<input type="date" id="dashboardDate" aria-label="Elegir fecha del diario"></label><div class="week-tools"><button type="button" id="dashboardToday">Hoy</button></div></div><div class="week-navigation"><button type="button" id="previousWeek" aria-label="Semana anterior">‹</button><div id="weekDays" class="week-days"></div><button type="button" id="nextWeek" aria-label="Semana siguiente">›</button></div>';
calendar.querySelector('.week-tools').append(editGoal);diary.prepend(calendar);calendar.before(intro);
function pickDay(value){if(busy||!value)return;$('day').value=value;$('day').onchange();}
$('dashboardDate').onchange=e=>{if(busy){e.target.value=$('day').value;return;}pickDay(e.target.value);};
$('dashboardToday').onclick=()=>{if(!busy)$('today').click();};$('previousWeek').onclick=()=>moveDay(-7);$('nextWeek').onclick=()=>moveDay(7);
$('weekDays').onclick=e=>{const button=e.target.closest('[data-day]');if(button)pickDay(button.dataset.day);};
function updateCalendar(){
 const selected=$('day').value,date=new Date(selected+'T12:00:00Z');if(!Number.isFinite(date.getTime()))return;
 $('dailyMonth').textContent=new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
 $('dashboardDate').value=selected;
 const monday=new Date(date);monday.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
 const days=['L','M','M','J','V','S','D'];
 $('weekDays').innerHTML=days.map((name,i)=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()+i);const value=d.toISOString().slice(0,10),label=new Intl.DateTimeFormat('es-CL',{dateStyle:'full',timeZone:'UTC'}).format(d);return '<button type="button" data-day="'+value+'" aria-label="'+label+'" aria-pressed="'+(value===selected)+'"><span>'+name+'</span><strong>'+d.getUTCDate()+'</strong></button>';}).join('');
}
function progress(id,value,goal,label){const el=$(id);const ratio=goal>0?Math.min(1,Math.max(0,value/goal)):0;el.style.setProperty('--progress',ratio*360+'deg');el.setAttribute('role','img');el.setAttribute('aria-label',label+': '+fmt(value)+(goal>0?' de '+fmt(goal):', sin meta definida'));}
window.renderDailyOverview=t=>{
 $('dailyCalories').textContent=fmt(t.kcal);$('dailyCalorieGoal').textContent=state.goal?'/ '+fmt(state.goal):'Sin meta';
 progress('calorieRing',t.kcal,state.goal,'Calorías');
 for(const key of ['protein','carbs','fat']){const goal=state.macroGoal?.[key];$('daily-'+key).textContent=fmt(t[key]);$('goal-'+key).textContent=goal==null?'g · sin meta':'/ '+fmt(goal)+' g';progress(key+'Ring',t[key],goal,key==='protein'?'Proteínas':key==='carbs'?'Carbohidratos':'Grasas');}
 $('dailyWater').textContent=fmt(state.waterMl||0);$('dailyWaterGoal').textContent=state.waterGoal?'/ '+fmt(state.waterGoal)+' ml':'ml · sin meta';
 const left=state.goal==null?null:state.goal-t.kcal;$('dailyBalance').textContent=left===null?'Configura tus metas para ver tu avance.':left>=0?fmt(left)+' kcal disponibles para tu meta.':fmt(-left)+' kcal sobre tu meta.';
 $('configureDailyGoals').textContent=state.goal==null?'Configurar metas de calorías y macros':'Editar metas de calorías y macros';
 updateCalendar();
};
journal.querySelector('h2').textContent='Comidas del día';
const add=document.createElement('button');add.id='addDailyFood';add.type='button';add.className='add-daily-food';add.innerHTML=glyph('plus')+'<span>Registrar</span>';add.onclick=()=>window.navigateApp('register');journal.querySelector('.row').append(add);
if(loaded)window.renderDailyOverview(total());
})();
