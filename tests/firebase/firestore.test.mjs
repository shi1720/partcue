import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,collection,collectionGroup,query,limit,getDocFromServer,getDocsFromServer,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp,Timestamp,setLogLevel} from 'firebase/firestore';
import {createCloudSessionStore,CLOUD_SESSION_LIMIT} from '../../web/firebase-api.js';
import {createSession,applyCommand} from '../../dist/core/index.js';

const projectId=process.env.GCLOUD_PROJECT??'demo-partcue';let env;
const snapshot=(id='repair')=>createSession({id,title:'Mechanical enclosure'},1000);
const record=(uid,id='repair',extra={})=>({ownerId:uid,id,revision:1,snapshotJson:JSON.stringify(snapshot(id)),summary:{title:'Mechanical enclosure',phase:'setup',partCount:0,schemaVersion:1,units:'cm'},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),...extra});
const db=uid=>env.authenticatedContext(uid).firestore();
const path=(uid,id)=>`users/${uid}/sessions/${id}`;
async function rawCreate(database,uid,id,data=record(uid,id)){
  const metadata=await getDocFromServer(doc(database,'users',uid));const batch=writeBatch(database);
  batch.set(doc(database,path(uid,id)),data);batch.update(doc(database,'users',uid),{sessionCount:metadata.data().sessionCount+1,mutationId:id,updatedAt:serverTimestamp()});return batch.commit();
}
before(async()=>{setLogLevel('silent');env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});});
beforeEach(async()=>{await env.clearFirestore();});after(async()=>{await env?.cleanup();});

test('rules deny anonymous access, cross-owner reads/writes and collection-group enumeration',async()=>{
  const alice=db('alice'),bob=db('bob'),guest=env.unauthenticatedContext().firestore();const store=createCloudSessionStore(alice,'alice');await store.create(snapshot());
  await assertFails(getDocFromServer(doc(guest,path('alice','repair'))));
  await assertFails(getDocFromServer(doc(bob,path('alice','repair'))));
  await assertFails(getDocsFromServer(query(collection(bob,'users','alice','sessions'),limit(50))));
  await assertFails(setDoc(doc(bob,'users','alice'),{schemaVersion:1,sessionCount:0,mutationId:null,deleting:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
  await assertFails(getDocsFromServer(query(collectionGroup(alice,'sessions'),limit(50))));
  await assertSucceeds(getDocFromServer(doc(alice,path('alice','repair'))));
  await assertFails(getDocsFromServer(collection(alice,'users','alice','sessions')));
});

test('rules reject malformed envelopes, schema summaries, owner spoofing and UTF-8 oversize payloads',async()=>{
  const alice=db('alice');await createCloudSessionStore(alice,'alice').ensureOwner();
  const invalid=[{ownerId:'bob'},{id:'different'},{revision:2},{extra:true},{snapshotJson:{}},{snapshotJson:'🙂'.repeat(70_000)},{createdAt:Timestamp.fromMillis(0)},{updatedAt:Timestamp.fromMillis(0)},{summary:{...record('alice').summary,phase:'invented'}},{summary:{...record('alice').summary,schemaVersion:2}},{summary:{...record('alice').summary,units:'metres'}},{summary:{...record('alice').summary,partCount:101}},{summary:{...record('alice').summary,hidden:'payload'}}];
  for(let i=0;i<invalid.length;i++)await assertFails(rawCreate(alice,'alice',`bad-${i}`,record('alice',`bad-${i}`,invalid[i])));
  assert.equal((await getDocFromServer(doc(alice,'users','alice'))).data().sessionCount,0,'failed child writes cannot increment quota');
});

test('production transactions detect concurrent stale revisions and preserve the winning snapshot',async()=>{
  const alice=db('alice'),store=createCloudSessionStore(alice,'alice');const initial=snapshot();await store.create(initial);
  const changed=applyCommand(initial,{type:'start'},1001).state;
  const outcomes=await Promise.allSettled([store.update(initial.id,changed,1),store.update(initial.id,changed,1)]);
  assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(outcomes.find(r=>r.status==='rejected').reason.code,'REVISION_CONFLICT');
  const saved=await store.get(initial.id);assert.equal(saved.revision,2);assert.equal(saved.snapshot.phase,'recording');
  await assertFails(updateDoc(doc(alice,path('alice','repair')),{revision:4,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,path('alice','repair')),{revision:2,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,path('alice','repair')),{ownerId:'bob',revision:3,updatedAt:serverTimestamp()}));
  await assert.rejects(()=>store.remove(initial.id,1),error=>error.code==='REVISION_CONFLICT');
  assert.equal((await store.get(initial.id)).revision,2);
});

test('quota cannot be forged or bypassed with multi-session batches',async()=>{
  const alice=db('alice');await createCloudSessionStore(alice,'alice').ensureOwner();
  await assertFails(updateDoc(doc(alice,'users','alice'),{sessionCount:49,mutationId:'invented',updatedAt:serverTimestamp()}));
  await assertFails(setDoc(doc(alice,path('alice','uncounted')),record('alice','uncounted')));
  const batch=writeBatch(alice);batch.set(doc(alice,path('alice','one')),record('alice','one'));batch.set(doc(alice,path('alice','two')),record('alice','two'));batch.update(doc(alice,'users','alice'),{sessionCount:1,mutationId:'one',updatedAt:serverTimestamp()});await assertFails(batch.commit());
  assert.equal((await getDocFromServer(doc(alice,'users','alice'))).data().sessionCount,0);
});

test('50-session cap is rule-enforced and deletion atomically frees one slot',async()=>{
  const uid='limit-user',alice=db(uid),store=createCloudSessionStore(alice,uid);await store.ensureOwner();
  await env.withSecurityRulesDisabled(async context=>{const admin=context.firestore(),batch=writeBatch(admin);for(let i=0;i<49;i++)batch.set(doc(admin,path(uid,`seed-${i}`)),record(uid,`seed-${i}`));batch.update(doc(admin,'users',uid),{sessionCount:49,mutationId:'seed-48',updatedAt:serverTimestamp()});await batch.commit();});
  await store.create(snapshot('fiftieth'));
  assert.equal((await getDocFromServer(doc(alice,'users',uid))).data().sessionCount,CLOUD_SESSION_LIMIT);
  await assert.rejects(()=>store.create(snapshot('too-many')),error=>error.code==='SESSION_LIMIT');
  await assertFails(rawCreate(alice,uid,'raw-overflow'));
  await store.remove('fiftieth',1);await store.create(snapshot('replacement'));
  assert.equal((await store.list()).sessions.length,50);
});

test('account deletion locks new writes, is retryable, and removes all saved documents and metadata',async()=>{
  const alice=db('alice'),store=createCloudSessionStore(alice,'alice');await store.create(snapshot('one'));await store.create(snapshot('two'));
  await updateDoc(doc(alice,'users','alice'),{deleting:true,updatedAt:serverTimestamp()});
  await assert.rejects(()=>store.create(snapshot('new')),error=>error.code==='ACCOUNT_DELETING');
  await assertFails(updateDoc(doc(alice,path('alice','one')),{revision:2,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'users','alice'),{deleting:false,updatedAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(alice,'users','alice')));
  await store.remove('one',undefined,true);await store.eraseAll();
  assert.equal((await getDocFromServer(doc(alice,'users','alice'))).exists(),false);
  assert.equal((await getDocsFromServer(query(collection(alice,'users','alice','sessions'),limit(50)))).empty,true);
});

test('opaque JSON is bounded by rules and full domain validation rejects a private corrupted snapshot on restore',async()=>{
  const alice=db('alice'),store=createCloudSessionStore(alice,'alice');await store.ensureOwner();
  // Firestore rules cannot execute TypeScript or parse JSON. This is an explicit boundary,
  // not a claim that the rules fully enforce the domain state machine.
  await assertSucceeds(rawCreate(alice,'alice','private-corruption',record('alice','private-corruption',{snapshotJson:'{"invalidDomain":true}'})));
  await assert.rejects(()=>store.get('private-corruption'),error=>error.code==='INVALID_SNAPSHOT');
  await assertFails(getDocFromServer(doc(db('bob'),path('alice','private-corruption'))));
  await store.remove('private-corruption',1);assert.equal((await store.list()).sessions.length,0);
});

test('production store rejects invalid domain snapshots before issuing writes and pins identity around async work',async()=>{
  const alice=db('alice');let current='alice';const store=createCloudSessionStore(alice,'alice',{assertAccount:()=>{if(current!=='alice'){const e=new Error('Account changed');e.code='AUTH_REQUIRED';throw e;}}});
  await assert.rejects(()=>store.create({...snapshot(),phase:'fabricated'}),error=>error.code==='INVALID_SNAPSHOT');
  current='bob';await assert.rejects(()=>store.create(snapshot()),error=>error.code==='AUTH_REQUIRED');
});


test('concurrent creates and deletes preserve the exact owner counter across independent tabs',async()=>{
  const alice=db('alice'),one=createCloudSessionStore(alice,'alice'),two=createCloudSessionStore(alice,'alice');
  await Promise.all([one.create(snapshot('tab-one')),two.create(snapshot('tab-two'))]);
  assert.equal((await getDocFromServer(doc(alice,'users','alice'))).data().sessionCount,2);
  await Promise.all([one.remove('tab-one',1),two.remove('tab-two',1)]);
  assert.equal((await getDocFromServer(doc(alice,'users','alice'))).data().sessionCount,0);
  assert.equal((await one.list()).sessions.length,0);
});
