/** Requires a local server and Chrome launched with --remote-debugging-port=9222.
 * Run: node tests/browser-smoke.mjs [app-url] [debug-url]
 * Uses only an isolated localhost test origin. */
import assert from 'node:assert/strict';
const appURL=process.argv[2]||'http://127.0.0.1:8765/';
const debugURL=process.argv[3]||'http://127.0.0.1:9222';
assert(['127.0.0.1','localhost'].includes(new URL(appURL).hostname),'Tests must run against a local test instance');
const targets=await(await fetch(debugURL+'/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>socket.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const errors=[];
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let n=0;n<80;n++){if(await evaluate(expression))return;await wait(100);}throw Error('Timed out: '+expression);}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
let passed=0;const check=(value,message)=>{assert(value,message);console.log('PASS '+message);passed++;};
try{
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');
 await cdp('Storage.clearDataForOrigin',{origin:new URL(appURL).origin,storageTypes:'all'});
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cdp('Page.navigate',{url:appURL});await until(`typeof loaded!=='undefined'&&loaded&&!!window.navigateApp`);
 check(await evaluate(`document.body.dataset.view==='diary'&&!document.querySelector('dialog[open]')`),'home starts without blocking onboarding');
 for(const width of [320,375,390,430,768,1280]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:width===320?568:844,deviceScaleFactor:1,mobile:width<850});
  await wait(150);
  for(const view of ['diary','register','menu','label','db']){
   await evaluate(`navigateApp('${view}')`);await wait(50);
   check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`${view} fits ${width}px`);
   if(view==='register'&&width<850)check(await evaluate(`(()=>{const r=$('message').getBoundingClientRect(),n=document.querySelector('.nav').getBoundingClientRect();return r.top>0&&r.bottom<=n.top;})()`),`composer visible at ${width}px`);
  }
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await click('#menunav');check(await evaluate(`document.querySelectorAll('.recipe-card').length===24`),'24 new recipes render');
 check(await evaluate(`recipeBook.every(r=>r.steps.length>=2&&r.items.every(([id,g])=>base.some(f=>f.id===id)&&g>0))`),'all recipe ingredients resolve to existing nutrition data');
 await evaluate(`$('recipeSearch').value='garbanzos';$('recipeSearch').dispatchEvent(new Event('input'))`);
 check(await evaluate(`document.querySelectorAll('.recipe-card').length===3`),'ingredient search returns matching recipes');
 await evaluate(`$('recipeSearch').value='';$('recipeSearch').dispatchEvent(new Event('input'))`);
 await click('[data-favorite="avena-fruta"]');await click('[data-recipe-filter="Favoritas"]');
 check(await evaluate(`document.querySelectorAll('.recipe-card').length===1`),'favorite filter works');
 await click('[data-recipe="avena-fruta"]');
 const one=await evaluate(`document.querySelector('#recipeIngredients li strong').textContent`);await evaluate(`$('recipeServings').value='2';$('recipeServings').dispatchEvent(new Event('change'))`);
 check(one==='40 g'&&await evaluate(`document.querySelector('#recipeIngredients li strong').textContent==='80 g'`),'doubling servings doubles ingredient quantities');
 await click('#closeRecipe');await click('#labelnav');
 await click('[data-portions="2"]');check(await evaluate(`$('portionResult').textContent.includes('200 kcal')&&$('portionResult').textContent.includes('250 g')`),'label example doubles printed calories and amount');
 await click('[data-portions="0.5"]');check(await evaluate(`$('portionResult').textContent.includes('50 kcal')`),'half portion halves printed calories');
 await click('[data-answer="90"]');check(await evaluate(`$('quizFeedback').textContent.includes('Inténtalo')`),'quiz explains incorrect answer');
 await click('[data-answer="180"]');check(await evaluate(`$('quizFeedback').textContent.includes('¡Eso es!')`),'quiz confirms correct answer');
 await click('#regnav');await evaluate(`$('message').value='150 g de pollo cocido';$('chatform').requestSubmit()`);await until(`!!document.querySelector('.cardfood')`);
 check(await evaluate(`state.entries.length===0`),'consulting does not create an entry');
 await evaluate(`[...document.querySelectorAll('.cardfood button')].find(b=>b.textContent.startsWith('Registrar')).click()`);await until(`!busy&&state.entries.length===1`);
 check(await evaluate(`state.entries[0].grams===150`),'food confirmation saves correct quantity');
 await click('#chatnav');await click('[data-edit]');await evaluate(`$('editgrams').value='200';$('editform').requestSubmit()`);await until(`!busy&&!$('editdialog').open`);
 check(await evaluate(`state.entries[0].grams===200`),'entry editing persists new quantity');
 await click('[data-delete]');await until(`!busy&&state.entries.length===0`);await click('#undo');await until(`!busy&&state.entries.length===1`);
 check(await evaluate(`state.entries[0].grams===200`),'delete and undo preserve the record');
 await click('#waterAdd250');await until(`!busy&&state.waterMl===250`);check(true,'water entry saves');
 await click('#editgoal');await evaluate(`$('goalinput').value='2200';$('goalform').requestSubmit()`);await until(`!busy&&state.goal===2200`);check(true,'daily goal saves');
 await click('#nextday');await until(`loaded&&state.entries.length===0`);await click('#prevday');await until(`loaded&&state.entries.length===1`);check(await evaluate(`state.goal===2200&&state.waterMl===250`),'date navigation preserves per-day records');
 await cdp('Page.reload');await until(`typeof loaded!=='undefined'&&loaded&&!!window.navigateApp`);check(await evaluate(`state.entries.length===1&&state.entries[0].grams===200&&state.goal===2200&&state.waterMl===250`),'records, goal and water survive reload');
 await click('#menunav');await click('[data-recipe-filter="Favoritas"]');check(await evaluate(`document.querySelectorAll('.recipe-card').length===1`),'favorites survive reload');
 await until(`!!navigator.serviceWorker.controller`);await evaluate(`navigator.serviceWorker.ready`);
 await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await cdp('Page.reload');await until(`typeof loaded!=='undefined'&&loaded&&!!window.navigateApp`);
 check(await evaluate(`state.entries.length===1&&document.querySelectorAll('.recipe-card').length===24`),'offline reload restores app, data and recipes');
 await click('#chatnav');await click('#waterAdd250');await until(`!busy&&state.waterMl===500`);check(true,'offline hydration write works');
 check(errors.length===0,'no uncaught browser exceptions');
 console.log(`${passed} checks passed`);
}finally{
 await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});socket.close();
}
