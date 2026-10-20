import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isManualJob, manualReferences, partDisplayName } from '../web/manual-job.js';
import { createSession, applyCommand, nextPart } from '../dist/core/index.js';

// Execute the shipped browser transition function, not a duplicate adapter implementation.
// DOM/render stubs isolate this correctness boundary without loading Three.js or a browser.
test('actual browser wrong-pickup handler clears stale confirmation and requires fresh correct selection',async()=>{
  const source=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
  const begin=source.indexOf('function transition('),end=source.indexOf('\nfunction selectedRecord(',begin);
  assert.ok(begin>=0&&end>begin,'the production transition handler is available');
  let clock=1000,state=createSession({id:'browser-regression'},clock++);
  for(const command of [{type:'start'},...['a','b'].map(id=>({type:'recordPart',part:{id,label:`Part ${id}`,count:1,originCm:{x:0,y:0,z:0},trayCm:{x:10,y:0,z:0}}})),{type:'beginReturn'}])state=applyCommand(state,command,clock++).state;
  const countInput={value:'1'},commands=[],notices=[];
  const context=vm.createContext({isManualJob,manualReferences,partDisplayName,state,applyCommand:(s,c,t)=>{commands.push(c.type);return applyCommand(s,c,t);},nextPart,now:()=>clock++,notice:(text,kind)=>notices.push({text,kind}),trayName:()=> 'B',render:()=>{},clearNotice:()=>{},$:id=>{assert.equal(id,'confirm-count');return countInput;}});
  vm.runInContext(source.slice(begin,end),context);
  assert.equal(context.transition({type:'selectReturn',partId:'b'}),true);
  assert.equal(context.state.pendingReturnId,'b');
  assert.equal(context.transition({type:'selectReturn',partId:'a'}),false);
  assert.deepEqual(commands.slice(-2),['selectReturn','deselectReturn']);
  assert.equal(context.state.pendingReturnId,null);assert.equal(context.state.returnedCount,0);assert.equal(countInput.value,'');
  assert.match(notices.at(-1).text,/Select it again/);
  assert.equal(context.transition({type:'confirmReturn',partId:'b',count:1}),false);assert.equal(context.state.returnedCount,0);
  assert.equal(context.transition({type:'selectReturn',partId:'b'}),true);
  assert.equal(context.transition({type:'confirmReturn',partId:'b',count:1}),true);assert.equal(context.state.returnedCount,1);
  assert.equal(context.transition({type:'confirmReturn',partId:'b',count:1}),false);assert.equal(context.state.returnedCount,1);
});
