import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../web/api.js';
const reply = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

test('stored browser fetch retains its global receiver',async()=>{
  const client=new ApiClient({fetchImpl:async function(){
    assert.equal(this,globalThis,'native browser fetch must not receive ApiClient as its receiver');
    return reply({ok:true});
  }});
  assert.deepEqual(await client.request('/api/health'),{ok:true});
});

test('browser API pins reads and writes to the displayed account and clears auth on mismatch',async()=>{
  const calls=[];
  const client=new ApiClient({fetchImpl:async(path,options)=>{calls.push({path,...options});if(path==='/api/auth/login')return reply({user:{id:'alice'},csrfToken:'alice-csrf'});if(path==='/api/sessions')return reply({error:{code:'AUTH_REQUIRED',message:'Account changed.'}},401);return reply({ok:true});}});
  await client.request('/api/auth/login','POST',{email:'alice@example.com',password:'long password'});
  assert.equal(client.accountId,'alice');assert.equal(client.csrfToken,'alice-csrf');
  await assert.rejects(()=>client.request('/api/sessions'),error=>error.code==='AUTH_REQUIRED');
  assert.equal(calls[1].headers['x-partcue-account'],'alice','GET is pinned too');
  assert.equal(client.accountId,null);assert.equal(client.csrfToken,null);
});

test('a late initial auth response cannot replace the identity of a newer completed sign-in',async()=>{
  let finishInitial;
  const client=new ApiClient({fetchImpl:async path=>path==='/api/auth/me'?new Promise(resolve=>{finishInitial=resolve;}):reply({user:{id:'new-account'},csrfToken:'new-csrf'})});
  const initial=client.request('/api/auth/me');
  await client.request('/api/auth/login','POST',{email:'new@example.com',password:'long password'});
  finishInitial(reply({user:{id:'old-account'},csrfToken:'old-csrf'}));await initial;
  assert.equal(client.accountId,'new-account');assert.equal(client.csrfToken,'new-csrf');
});
