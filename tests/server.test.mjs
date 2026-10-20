import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from '../server/index.mjs';
import { backupDatabase } from '../server/backup.mjs';
import { createSession, applyCommand } from '../dist/core/index.js';

async function fixture(t, options = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'partcue-server-'));
  const databasePath = path.join(dir, 'data.sqlite');
  let app = createServer({ databasePath, ...options });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  let base = `http://127.0.0.1:${app.address().port}`;
  const close = async () => { await new Promise((resolve, reject) => { app.close(e => e ? reject(e) : resolve()); app.closeIdleConnections(); }); };
  t.after(async () => { await close(); await rm(dir, { recursive: true, force: true }); });
  const request = async (url, { method='GET', body, cookie, csrfToken, headers={} }={}) => {
    const response = await fetch(base + url, { method, headers: { ...(body === undefined ? {} : {'Content-Type':'application/json'}), Origin: base, ...(cookie ? {Cookie:cookie} : {}), ...(csrfToken ? {'X-CSRF-Token':csrfToken} : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    let data; try { data=JSON.parse(text); } catch { data=text; }
    return { status: response.status, headers: response.headers, data };
  };
  const register = async (email='shivam@example.com', password='a very good password 123') => {
    const response = await request('/api/auth/register',{method:'POST',body:{email,password,name:'Shivam Gupta'}});
    assert.equal(response.status,201,JSON.stringify(response.data));
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrfToken:response.data.csrfToken, user:response.data.user, response };
  };
  return { request, register, databasePath, rawRequest: (headers, {method='GET', body=''}={}) => new Promise((resolve,reject) => { const req=http.request(base+'/api/auth/register',{method,headers:{Origin:base,...headers}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);if(body)req.write(body);req.end(); }), restart:async()=>{await close();app=createServer({databasePath,...options});await new Promise(r=>app.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${app.address().port}`;} };
}

test('account authentication hashes passwords, rotates opaque cookies, restores across restart and logs out', async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/api/auth/me')).status,401);
  const account=await f.register();
  assert.match(account.cookie,/^partcue_session=[a-f0-9]{64}$/);
  const setCookie=account.response.headers.get('set-cookie');
  assert.match(setCookie,/HttpOnly/); assert.match(setCookie,/SameSite=Strict/); assert.match(setCookie,/Path=\//);
  const db=new DatabaseSync(f.databasePath);
  const row=db.prepare('SELECT * FROM users').get();
  assert.match(row.password_hash,/^[a-f0-9]{128}$/); assert.notEqual(row.password_salt,row.password_hash);
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM auth_sessions').get()).includes(account.cookie.split('=')[1]),false);
  assert.equal(JSON.stringify(row).includes('a very good password 123'),false); db.close();
  assert.equal((await f.request('/api/auth/me',account)).data.user.email,'shivam@example.com');
  await f.restart();
  assert.equal((await f.request('/api/auth/me',account)).status,200);
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:'shivam@example.com',password:'a wrong password 123'}})).status,401);
  const login=await f.request('/api/auth/login',{method:'POST',cookie:account.cookie,body:{email:'SHIVAM@example.com',password:'a very good password 123'}});
  assert.equal(login.status,200);assert.notEqual(login.headers.get('set-cookie').split(';')[0],account.cookie);
  assert.equal((await f.request('/api/auth/me',account)).status,401);
  const auth={cookie:login.headers.get('set-cookie').split(';')[0],csrfToken:login.data.csrfToken};
  assert.equal((await f.request('/api/auth/logout',{...auth,method:'POST',body:{}})).status,200);
  assert.equal((await f.request('/api/auth/me',auth)).status,401);
});

test('user isolation, optimistic revisions, snapshot validation, delete and persistence',async t=>{
  const f=await fixture(t); const alice=await f.register('alice@example.com');const bob=await f.register('bob@example.com');
  const snapshot=createSession({id:'repair-1',title:'Radio knobs'},1000);
  assert.equal((await f.request('/api/sessions',{...alice,method:'POST',body:{snapshot}})).status,201);
  assert.equal((await f.request('/api/sessions',{...bob,method:'POST',body:{snapshot}})).status,201,'ids are scoped to owner');
  assert.equal((await f.request('/api/sessions/repair-1',bob)).data.snapshot.title,'Radio knobs');
  const updated=applyCommand(snapshot,{type:'start'},1001).state;
  const changes=await Promise.all([f.request('/api/sessions/repair-1',{...alice,method:'PUT',body:{snapshot:updated,revision:1}}),f.request('/api/sessions/repair-1',{...alice,method:'PUT',body:{snapshot:updated,revision:1}})]);
  assert.deepEqual(changes.map(x=>x.status).sort(),[200,409]);
  assert.equal((await f.request('/api/sessions/repair-1',bob)).data.revision,1);
  assert.equal((await f.request('/api/sessions/repair-1',{...alice,method:'PUT',body:{snapshot:{...updated,phase:'hacked'},revision:2}})).status,400);
  assert.equal((await f.request('/api/sessions/repair-1',{...alice,method:'PUT',body:{snapshot:{...updated,id:'wrong-id'},revision:2}})).status,400);
  assert.equal((await f.request('/api/sessions/repair-1',{...alice,method:'DELETE',body:{revision:1}})).status,409);
  await f.restart();
  assert.equal((await f.request('/api/sessions/repair-1',alice)).data.revision,2);
  const list=await f.request('/api/sessions',alice);assert.equal(list.data.sessions.length,1);assert.equal(list.data.sessions[0].partCount,0);
  assert.equal((await f.request('/api/sessions/repair-1',{...alice,method:'DELETE',body:{revision:2}})).status,200);
  assert.equal((await f.request('/api/sessions/repair-1',alice)).status,404);
  assert.equal((await f.request('/api/sessions/repair-1',bob)).status,200);
});

test('cross origin, CSRF, DNS rebinding, content type and traversal defenses',async t=>{
  const f=await fixture(t);const auth=await f.register();const snapshot=createSession({id:'safe'},1);
  assert.equal((await f.request('/api/auth/register',{method:'POST',body:{email:'e@example.com',password:'valid password 123'},headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await f.request('/api/auth/register',{method:'POST',body:{email:'e@example.com',password:'valid password 123'},headers:{Origin:''}})).status,403);
  assert.equal((await f.request('/api/sessions',{cookie:auth.cookie,method:'POST',body:{snapshot}})).status,403);
  assert.equal((await f.request('/api/sessions',{...auth,csrfToken:'0'.repeat(64),method:'POST',body:{snapshot}})).status,403);
  assert.equal((await f.request('/api/sessions',{...auth,method:'POST',body:{snapshot},headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await f.request('/api/sessions',{...auth,method:'POST',body:{snapshot},headers:{'Content-Type':'text/plain'}})).status,415);
  assert.equal(await f.rawRequest({Host:'evil.example',Cookie:auth.cookie}),400);
  for(const url of ['/server/index.mjs','/package.json','/data/partcue.sqlite','/%2e%2e%2fserver%2findex.mjs','/dist/%2e%2e%2fserver%2findex.mjs','/.git/config','/%00']) assert.equal((await f.request(url)).status,404,url);
  const response=await f.request('/dist/core/index.js');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});

test('input bounds, expired sessions, auth rate limiting and no SQL interpolation',async t=>{
  let clock=10_000;const f=await fixture(t,{now:()=>clock,sessionTtlMs:100,authLimit:5});
  assert.equal((await f.request('/api/auth/register',{method:'POST',body:{email:'a@example.com',password:'short'}})).status,400);
  assert.equal((await f.request('/api/auth/register',{method:'POST',body:{email:"x' OR 1=1;--",password:'valid password 123'}})).status,400);
  const account=await f.register();
  assert.equal((await f.request('/api/sessions',{...account,method:'POST',body:{snapshot:'x'.repeat(261_000)}})).status,413);
  assert.equal((await f.request('/api/sessions',{...account,method:'POST',body:{snapshot:null}})).status,400);
  clock+=101;assert.equal((await f.request('/api/auth/me',account)).status,401);
  for(let i=0;i<2;i++)assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:'a@example.com',password:'valid password 123'}})).status,401);
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:'a@example.com',password:'valid password 123'}})).status,429);
  clock+=15*60*1000;assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:'a@example.com',password:'valid password 123'}})).status,401);
});

test('parallel accounts remain isolated even with attacker-controlled snapshot metadata',async t=>{
  const f=await fixture(t);
  const accounts=await Promise.all([f.register('one@example.com'),f.register('two@example.com'),f.register('three@example.com')]);
  const results=await Promise.all(accounts.map((auth,i)=>f.request('/api/sessions',{...auth,method:'POST',body:{snapshot:{...createSession({id:`s${i}`},i+1),owner_id:accounts[(i+1)%3].user.id,hidden:'discard me'}}})));
  for(let i=0;i<accounts.length;i++) {
    assert.equal(results[i].status,400,'unknown snapshot fields are rejected');
    assert.equal((await f.request('/api/sessions',{...accounts[i],method:'POST',body:{snapshot:createSession({id:`s${i}`},i+1)}})).status,201);
    const list=await f.request('/api/sessions',accounts[i]);assert.equal(list.data.sessions.length,1);assert.equal(list.data.sessions[0].id,`s${i}`);
    assert.equal((await f.request(`/api/sessions/s${(i+1)%3}`,accounts[i])).status,404);
  }
});


test('malformed JSON and streamed oversize input fail without breaking service',async t=>{
  const f=await fixture(t); const auth=await f.register();
  // A real chunked request has no Content-Length to trust.
  for (const [body, expected] of [['{broken',400],['[]',400],[JSON.stringify({email:'x'.repeat(270_000)}),413]]) {
    const status=await f.rawRequest({'Content-Type':'application/json'},{method:'POST',body});
    assert.equal(status,expected);
  }
  assert.equal((await f.request('/api/auth/me',auth)).status,200);
});

test('concurrent duplicate registration and normalized login variants do not bypass account or rate rules',async t=>{
  let clock=1000;const f=await fixture(t,{now:()=>clock,authLimit:4});
  const body={email:'same@example.com',password:'a strong password 123'};
  const duplicate=await Promise.all([f.request('/api/auth/register',{method:'POST',body}),f.request('/api/auth/register',{method:'POST',body:{...body,email:' SAME@EXAMPLE.COM '}})]);
  assert.deepEqual(duplicate.map(r=>r.status).sort(),[201,409]);
  for(const email of ['same@example.com',' SAME@EXAMPLE.COM '])assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email,password:'a wrong password 123'}})).status,401);
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:'Same@Example.Com',password:'a wrong password 123'}})).status,429);
  const db=new DatabaseSync(f.databasePath);assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n,1);db.close();
});

test('online backup includes committed WAL writes, restores independently and refuses replacement',async t=>{
  const f=await fixture(t);const auth=await f.register();
  const snapshot=createSession({id:'backup-test'},1);
  await f.request('/api/sessions',{...auth,method:'POST',body:{snapshot}});
  const backupPath=path.join(path.dirname(f.databasePath),'backup.sqlite');
  await backupDatabase(f.databasePath,backupPath);
  const db=new DatabaseSync(backupPath,{readOnly:true});
  assert.equal(db.prepare('PRAGMA quick_check').get().quick_check,'ok');
  assert.equal(db.prepare('SELECT count(*) AS n FROM repair_sessions').get().n,1);db.close();
  await assert.rejects(()=>backupDatabase(f.databasePath,backupPath),/exist/);
  await assert.rejects(()=>backupDatabase(f.databasePath,f.databasePath),/differ/);
  const restored=createServer({databasePath:backupPath});
  await new Promise(r=>restored.listen(0,'127.0.0.1',r));
  try { const response=await fetch(`http://127.0.0.1:${restored.address().port}/api/sessions/backup-test`,{headers:{Cookie:auth.cookie}});assert.equal(response.status,200);assert.equal((await response.json()).snapshot.id,'backup-test'); }
  finally {await new Promise(r=>{restored.close(r);restored.closeIdleConnections();});}
});

test('unavailable persistent storage fails startup instead of silently using volatile memory',async t=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'partcue-unavailable-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  assert.throws(()=>createServer({databasePath:directory}));
});

test('authentication storage failure rolls back new account and token as one operation',async t=>{
  const f=await fixture(t);
  const db=new DatabaseSync(f.databasePath);
  db.exec("CREATE TRIGGER test_storage_failure BEFORE INSERT ON auth_sessions BEGIN SELECT RAISE(ABORT,'simulated storage failure'); END;");
  const response=await f.request('/api/auth/register',{method:'POST',body:{email:'retry@example.com',password:'a strong password 123'}});
  assert.equal(response.status,500);assert.equal(response.data.error.message,'The request could not be completed.');
  assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n,0,'failed token persistence cannot leave a half-created account');
  db.exec('DROP TRIGGER test_storage_failure');db.close();
  assert.equal((await f.register('retry@example.com')).user.email,'retry@example.com');
});

test('session retention remains bounded and expired abandoned sessions are cleaned on startup',async t=>{
  let clock=1000;const f=await fixture(t,{now:()=>clock,sessionTtlMs:100,authLimit:30});
  const account=await f.register();let latest;
  for(let i=0;i<11;i++)latest=await f.request('/api/auth/login',{method:'POST',body:{email:account.user.email,password:'a very good password 123'}});
  assert.equal(latest.status,200);assert.equal((await f.request('/api/auth/me',{cookie:latest.headers.get('set-cookie').split(';')[0]})).status,200);
  const db=new DatabaseSync(f.databasePath);assert.equal(db.prepare('SELECT count(*) AS n FROM auth_sessions').get().n,10);db.close();
  assert.equal((await f.request('/api/auth/me',account)).status,401,'oldest sign in is revoked');
  clock+=101;await f.restart();
  const cleaned=new DatabaseSync(f.databasePath);assert.equal(cleaned.prepare('SELECT count(*) AS n FROM auth_sessions').get().n,0);cleaned.close();
});

test('unknown envelope fields are rejected, not silently used for privilege or ownership changes',async t=>{
  const f=await fixture(t);const auth=await f.register();
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:auth.user.email,password:'a very good password 123',admin:true}})).status,400);
  const snapshot=createSession({id:'unknown-fields'},1);
  assert.equal((await f.request('/api/sessions',{...auth,method:'POST',body:{snapshot,ownerId:'someone-else'}})).status,400);
  assert.equal((await f.request('/api/sessions',{...auth,method:'POST',body:{snapshot}})).status,201);
  assert.equal((await f.request('/api/sessions/unknown-fields',{...auth,method:'PUT',body:{snapshot,revision:1,ownerId:'someone-else'}})).status,400);
  assert.equal((await f.request('/api/sessions/unknown-fields',auth)).data.revision,1);
});

test('a browser tab pinned to its displayed account cannot read or write after another tab switches cookies',async t=>{
  const f=await fixture(t);const alice=await f.register('alice-tabs@example.com');const bob=await f.register('bob-tabs@example.com');
  const snapshot=createSession({id:'bob-private',title:'Private Bob repair'},1);
  assert.equal((await f.request('/api/sessions',{...bob,method:'POST',body:{snapshot}})).status,201);
  // The browser now sends Bob's shared cookie, while Alice's tab still displays Alice.
  const staleTab={...bob,headers:{'X-PartCue-Account':alice.user.id}};
  for(const url of ['/api/sessions','/api/sessions/bob-private','/api/auth/me']) {
    const response=await f.request(url,staleTab);assert.equal(response.status,401);assert.equal(response.data.error.code,'AUTH_REQUIRED');assert.equal(JSON.stringify(response.data).includes('Private Bob repair'),false);
  }
  assert.equal((await f.request('/api/sessions',{...staleTab,method:'POST',body:{snapshot:createSession({id:'wrong-account'},2)}})).status,401);
  assert.equal((await f.request('/api/sessions',{...bob,headers:{'X-PartCue-Account':bob.user.id}})).status,200);
  assert.equal((await f.request('/api/sessions/wrong-account',bob)).status,404);
});
