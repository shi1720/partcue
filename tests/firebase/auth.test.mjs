import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {deleteApp} from 'firebase/app';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,collection,query,limit,getDocFromServer,getDocsFromServer} from 'firebase/firestore';
import {FirebaseApiClient} from '../../web/firebase-api.js';
import {createSession} from '../../dist/core/index.js';
const projectId=process.env.GCLOUD_PROJECT??'demo-partcue';
const clients=[];
const make=()=>{const client=new FirebaseApiClient({apiKey:'demo-key',authDomain:`${projectId}.firebaseapp.com`,projectId},{appName:`auth-test-${Date.now()}-${Math.random()}`,emulators:{auth:'http://127.0.0.1:9098',firestore:{host:'127.0.0.1',port:8088}}});clients.push(client);return client;};
after(async()=>{for(const client of clients){client.unsubscribe();await deleteApp(client.app);}});
const password='Strong test password 123';

test('real Auth emulator registration/login/reset/profile/deletion preserves the existing API contract',async()=>{
  const client=make(),email=`real-${Date.now()}@example.test`;await client.waitUntilReady();
  await assert.rejects(()=>client.request('/api/auth/me'),e=>e.code==='AUTH_REQUIRED');
  const account=await client.request('/api/auth/register','POST',{email,password,name:'Cloud Builder'});
  assert.equal(account.user.name,'Cloud Builder');assert.equal(account.user.emailVerified,false);assert.equal(account.csrfToken,null);
  assert.equal((await client.request('/api/auth/me')).user.id,account.user.id);
  const seen=[];const unsubscribe=client.onAuthChange(user=>seen.push(user?.id??null));await new Promise(r=>setTimeout(r,20));assert.equal(seen.at(-1),account.user.id);unsubscribe();
  assert.equal((await client.updateDisplayName('New name')).user.name,'New name');
  assert.equal((await client.refreshUser()).user.name,'New name');
  assert.equal((await client.sendVerification()).ok,true,'emulator records a verification action without sending real mail');
  assert.equal((await client.resetPassword(email)).ok,true);
  await client.request('/api/sessions','POST',{snapshot:createSession({id:'saved-cloud-job'},1)});
  assert.equal((await client.request('/api/sessions')).sessions.length,1);
  await assert.rejects(()=>client.deleteAccount('wrong-password-123'),e=>e.code==='INVALID_CREDENTIALS');
  assert.equal((await client.request('/api/sessions')).sessions.length,1,'failed reauth cannot delete data');
  await client.changePassword(password,'Replacement strong password 456');
  await client.request('/api/auth/logout','POST',{});
  await assert.rejects(()=>client.request('/api/auth/me'),e=>e.code==='AUTH_REQUIRED');
  await assert.rejects(()=>client.request('/api/auth/login','POST',{email,password}),e=>e.code==='INVALID_CREDENTIALS');
  await client.request('/api/auth/login','POST',{email,password:'Replacement strong password 456'});
  const uid=client.accountId;
  await client.deleteAccount('Replacement strong password 456');
  assert.equal(client.auth.currentUser,null);assert.equal(client.accountId,null);
  const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
  try {
    const stale=env.authenticatedContext(uid).firestore(),marker=(await getDocFromServer(doc(stale,'users',uid))).data();
    assert.deepEqual(Object.keys(marker).sort(),['schemaVersion','sessionCount','mutationId','deleting','createdAt','updatedAt'].sort());
    assert.equal(marker.deleting,true);assert.equal(marker.sessionCount,0);assert.equal(marker.mutationId,null);
    assert.equal((await getDocsFromServer(query(collection(stale,'users',uid,'sessions'),limit(50)))).empty,true);
  } finally {await env.cleanup();}
  await assert.rejects(()=>client.request('/api/auth/login','POST',{email,password:'Replacement strong password 456'}),e=>e.code==='INVALID_CREDENTIALS');
});

test('stale account identity blocks logout after another sign-in instead of signing out the new account',async()=>{
  const client=make();const a=await client.request('/api/auth/register','POST',{email:`alice-${Date.now()}@example.test`,password,name:'Alice'});
  const b=await client.request('/api/auth/register','POST',{email:`bob-${Date.now()}@example.test`,password,name:'Bob'});
  client.accountId=a.user.id; // An old tab still labels itself Alice while shared Auth state is Bob.
  await assert.rejects(()=>client.request('/api/auth/logout','POST',{}),e=>e.code==='AUTH_REQUIRED');
  assert.equal(client.auth.currentUser.uid,b.user.id);
  await assert.rejects(()=>client.request('/api/sessions'),e=>e.code==='AUTH_REQUIRED');
});
