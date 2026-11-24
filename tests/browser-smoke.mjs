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
 await cdp('Page.navigate',{url:'about:blank'});await wait(100);errors.length=0;
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
 // Model Safari's independent visual viewport while the layout viewport stays full-height.
 check(await evaluate(`[...document.querySelectorAll('a[href="https://wa.me/56957528873"]')].length===2`),'WhatsApp contact links use the requested number');
 await click('#regnav');await wait(100);await evaluate(`$('message').focus({preventScroll:true});window.__testHeight=844;window.__testTop=0;Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>window.__testHeight});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>window.__testTop});`);
 for(const [height,top] of [[500,0],[390,80],[320,120]]){
  await evaluate(`window.__testHeight=${height};window.__testTop=${top};visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));`);await wait(80);
  check(await evaluate(`(()=>{const input=$('message').getBoundingClientRect(),send=$('send').getBoundingClientRect(),nav=document.querySelector('.nav').getBoundingClientRect();return input.top>=${top}&&input.bottom<=nav.top&&send.bottom<=${top+height}&&nav.bottom<=${top+height+1};})()`),`input and navigation stay in Safari viewport ${height}px with offset ${top}px`);
 }
 const beforeTyping=await evaluate(`$('message').getBoundingClientRect().bottom`);
 await cdp('Input.insertText',{text:'150 g de pollo'});await wait(80);
 check(await evaluate(`Math.abs($('message').getBoundingClientRect().bottom-${beforeTyping})<1&&$('suggestions').children.length>0`),'suggestions do not move the typing field');
 const suggestion=await evaluate(`(()=>{const r=$('suggestions').querySelector('button').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[suggestion]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(80);
 check(await evaluate(`document.activeElement===$('message')&&$('message').value.startsWith('150 g de ')&&$('suggestions').children.length===0`),'tapping a suggestion preserves focus and quantity');
 await evaluate(`$('message').value='';$('message').blur();delete visualViewport.height;delete visualViewport.offsetTop;visualViewport.dispatchEvent(new Event('resize'));`);await wait(100);
 check(await evaluate(`!document.body.classList.contains('keyboard-open')`),'layout recovers when the keyboard closes');
 await click('#chatnav');check(await evaluate(`!document.documentElement.classList.contains('register-screen')&&getComputedStyle(document.documentElement).overflow!=='hidden'`),'leaving registration restores page scrolling');
 await click('#menunav');check(await evaluate(`document.querySelectorAll('.recipe-card').length===24`),'24 new recipes render');
 await evaluate(`Promise.all([...document.querySelectorAll('.recipe-photo')].map(img=>{img.loading='eager';return img.decode();}))`);
 check(await evaluate(`document.querySelectorAll('.recipe-photo').length===24&&[...document.querySelectorAll('.recipe-photo')].every(img=>img.naturalWidth>0)`),'24 recipe photos load');
 check(await evaluate(`recipeBook.every(r=>r.steps.length>=2&&r.items.every(([id,g])=>base.some(f=>f.id===id)&&g>0))`),'all recipe ingredients resolve to existing nutrition data');
 await evaluate(`$('recipeSearch').value='garbanzos';$('recipeSearch').dispatchEvent(new Event('input'))`);
 check(await evaluate(`document.querySelectorAll('.recipe-card').length===3`),'ingredient search returns matching recipes');
 await evaluate(`$('recipeSearch').value='';$('recipeSearch').dispatchEvent(new Event('input'))`);
 await click('[data-favorite="avena-fruta"]');await click('[data-recipe-filter="Favoritas"]');
 check(await evaluate(`document.querySelectorAll('.recipe-card').length===1`),'favorite filter works');
 await click('[data-recipe="avena-fruta"]');
 await evaluate(`document.querySelector('.recipe-detail-photo img').decode()`);
 check(await evaluate(`document.querySelector('.recipe-detail-photo img').naturalWidth>0`),'recipe detail photo loads');
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
 await evaluate(`Promise.all(recipeBook.map(r=>fetch('assets/recipes/'+r.id+'.jpg').then(response=>{if(!response.ok)throw Error('Offline photo missing');return response.blob();})))`);
 check(true,'all 24 recipe photos available offline');
 await click('#chatnav');await click('#waterAdd250');await until(`!busy&&state.waterMl===500`);check(true,'offline hydration write works');
 check(errors.length===0,'no uncaught browser exceptions');
 console.log(`${passed} checks passed`);
}finally{
 await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});socket.close();
}
