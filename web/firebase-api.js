/** Firebase-hosted companion adapter. The Lens and original local server stay independent. */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail, sendEmailVerification, reload, EmailAuthProvider, reauthenticateWithCredential, deleteUser, updatePassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, collection, query, orderBy, limit, getDocFromServer, getDocsFromServer, runTransaction, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { parseSession, serializeSession, LIMITS } from '../dist/core/index.js';

export const CLOUD_SESSION_LIMIT = 50;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const fail = (code, message, status = 400) => { const error = new Error(message); error.code = code; error.status = status; throw error; };
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (body, allowed) => { if (!object(body) || Object.keys(body).some(k => !allowed.includes(k))) fail('INVALID_BODY', 'The request contains unsupported fields.'); };
const emailValue = value => { const email = typeof value === 'string' ? value.trim().toLowerCase() : ''; if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('INVALID_EMAIL', 'Enter a valid email address.'); return email; };
const nameValue = value => { if (typeof value !== 'string' || !value.trim() || value.trim().length > 80 || /[\u0000-\u001f\u007f]/.test(value)) fail('INVALID_NAME', 'Use a name between 1 and 80 printable characters.'); return value.trim(); };
const passwordValue = (password, registering) => { if (typeof password !== 'string' || password.length < (registering ? 12 : 1) || password.length > 128 || new TextEncoder().encode(password).length > 512) fail('INVALID_PASSWORD', registering ? 'Use a password between 12 and 128 characters.' : 'Enter your password.'); return password; };
const publicUser = user => ({ id: user.uid, email: user.email, name: user.displayName || user.email?.split('@')[0] || 'Your bench', emailVerified: user.emailVerified, provider: 'password' });
const checkedId = id => { if (typeof id !== 'string' || !ID.test(id)) fail('INVALID_ID', 'Invalid session id.'); return id; };
const checkedRevision = revision => { if (!Number.isSafeInteger(revision) || revision < 1) fail('INVALID_REVISION', 'A positive integer revision is required.'); return revision; };
function snapshotData(value) {
  let snapshot, snapshotJson;
  try { snapshotJson = serializeSession(value); snapshot = parseSession(snapshotJson); }
  catch { fail('INVALID_SNAPSHOT', 'This session is invalid. Your current work has not been overwritten.'); }
  if (new TextEncoder().encode(snapshotJson).length > LIMITS.snapshotBytes) fail('SNAPSHOT_TOO_LARGE', 'The snapshot exceeds 250 KB.');
  return { snapshot, snapshotJson, summary: { title: snapshot.title, phase: snapshot.phase, partCount: snapshot.parts.length, schemaVersion: snapshot.schemaVersion, units: snapshot.units } };
}
function restored(data) {
  try { return { snapshot: parseSession(data.snapshotJson), revision: checkedRevision(data.revision) }; }
  catch { fail('INVALID_SNAPSHOT', 'This saved session could not be validated. Other sessions and your current bench are unchanged.'); }
}
function mapped(error) {
  if (!error?.code?.startsWith('auth/') && !['permission-denied','unavailable','deadline-exceeded','failed-precondition','resource-exhausted','unauthenticated','aborted'].includes(error?.code)) return error;
  const map = {
    'auth/email-already-in-use': ['ACCOUNT_EXISTS','This email already has an account. Sign in instead.',409],
    'auth/invalid-email': ['INVALID_EMAIL','Enter a valid email address.',400],
    'auth/invalid-credential': ['INVALID_CREDENTIALS','Email or password is incorrect.',401],
    'auth/user-not-found': ['INVALID_CREDENTIALS','Email or password is incorrect.',401],
    'auth/wrong-password': ['INVALID_CREDENTIALS','Email or password is incorrect.',401],
    'auth/weak-password': ['INVALID_PASSWORD','Choose a stronger password with at least 12 characters.',400],
    'auth/too-many-requests': ['RATE_LIMITED','Too many attempts. Wait a few minutes before trying again.',429],
    'auth/network-request-failed': ['NETWORK','The account service could not be reached. Your current work is still in this tab.',503],
    'auth/requires-recent-login': ['REAUTH_REQUIRED','Enter your current password and try again.',401],
    'auth/user-disabled': ['AUTH_REQUIRED','This account is unavailable. Contact support or use a different account.',401],
    'auth/user-token-expired': ['AUTH_REQUIRED','Your sign-in expired. Sign in again; your current bench is still here.',401],
    'auth/operation-not-allowed': ['ACCOUNT_UNAVAILABLE','Email sign-in is temporarily unavailable. Your guest work is still here.',503],
    'permission-denied': ['PERMISSION_DENIED','Cloud access was refused. Check your sign-in before retrying; your current bench is unchanged.',403],
    'unauthenticated': ['AUTH_REQUIRED','Sign in again before accessing saved sessions.',401],
    'resource-exhausted': ['CLOUD_LIMIT','The cloud service is at its quota. Export your current JSON and try again later.',429],
    'unavailable': ['NETWORK','Cloud storage is unavailable. Export your current JSON before closing this tab.',503],
    'deadline-exceeded': ['NETWORK','Cloud storage took too long. Check saved sessions before retrying; the save may have completed.',503],
    'aborted': ['REVISION_CONFLICT','The session changed while saving. Export your current work, then reload the saved session.',409],
  };
  const [code,message,status] = map[error.code] || ['CLOUD_ERROR','The account service could not complete the request. Your current bench is unchanged.',503];
  const result = new Error(message); result.code=code; result.status=status; result.cause=error; return result;
}

/** Transactional owner-scoped store, exported to exercise the production path against the emulator. */
export function createCloudSessionStore(db, uid, { assertAccount = () => {} } = {}) {
  const owner = doc(db, 'users', uid);
  const sessions = collection(owner, 'sessions');
  const ref = id => doc(sessions, checkedId(id));
  async function countedTransaction(operation) {
    // A rule-enforced counter can turn a commit race into permission-denied
    // before the SDK classifies it as aborted. Retry only an observed counter race.
    for(let attempt=0;attempt<3;attempt++) {
      let observedCount;
      try { return await runTransaction(db,tx=>operation(tx,count=>{observedCount=count;})); }
      catch(error) {
        if(error.code==='permission-denied'&&attempt<2&&observedCount!==undefined) {
          assertAccount();const latest=await getDocFromServer(owner);
          if(latest.exists()&&latest.data().sessionCount!==observedCount)continue;
        }
        throw error;
      }
    }
  }
  async function ensureOwner() {
    assertAccount();
    try { await runTransaction(db, async tx => {
      assertAccount();const current=await tx.get(owner);
      if (!current.exists()) tx.set(owner,{schemaVersion:1,sessionCount:0,mutationId:null,deleting:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      else if(current.data().deleting) fail('ACCOUNT_DELETING','Account deletion is in progress. Retry deletion to finish removing your data.',409);
    }); } catch(error) {
      if(error.code!=='permission-denied')throw error;
      // Two first saves may race to initialize the same private metadata document.
      assertAccount();const current=await getDocFromServer(owner);
      if(!current.exists())throw error;
      if(current.data().deleting)fail('ACCOUNT_DELETING','Account deletion is in progress. Retry deletion to finish removing your data.',409);
    }
    assertAccount();
  }
  async function remove(id, revision, deleting=false) {
    const target=ref(id);if(revision!==undefined)checkedRevision(revision);assertAccount();
    try { await countedTransaction(async(tx,observed)=>{
      assertAccount();const [meta,current]=await Promise.all([tx.get(owner),tx.get(target)]);
      if(meta.exists())observed(meta.data().sessionCount);
      if(!current.exists()){if(deleting)return;fail('NOT_FOUND','Session not found.',404);}
      if(!meta.exists())fail('CLOUD_ERROR','Account metadata is missing. Reload before trying again.',503);
      if(meta.data().deleting&&!deleting)fail('ACCOUNT_DELETING','Account deletion is in progress.',409);
      if(revision!==undefined&&current.data().revision!==revision)fail('REVISION_CONFLICT','This session changed in another tab. Reload it before deleting.',409);
      tx.delete(target);tx.update(owner,{sessionCount:meta.data().sessionCount-1,mutationId:id,updatedAt:serverTimestamp()});
    }); } catch(error) {
      // Rules may reject a stale commit before the SDK reports a retryable conflict.
      if(error.code==='permission-denied'&&revision!==undefined){assertAccount();const latest=await getDocFromServer(target);if(latest.exists()&&latest.data().revision!==revision)fail('REVISION_CONFLICT','This session changed in another tab. Reload it before deleting.',409);}
      throw error;
    }
    assertAccount();return{ok:true};
  }
  return {
    ensureOwner,
    async list() {
      assertAccount();const result=await getDocsFromServer(query(sessions,orderBy('updatedAt','desc'),limit(CLOUD_SESSION_LIMIT)));assertAccount();
      return { sessions:result.docs.map(item=>{const d=item.data();return{id:item.id,title:d.summary.title,phase:d.summary.phase,partCount:d.summary.partCount,updatedAt:d.updatedAt.toMillis(),revision:d.revision};}) };
    },
    async get(id) {assertAccount();const current=await getDocFromServer(ref(id));assertAccount();if(!current.exists())fail('NOT_FOUND','Session not found.',404);return restored(current.data());},
    async create(value) {
      const {snapshot,snapshotJson,summary}=snapshotData(value),target=ref(snapshot.id);await ensureOwner();
      await countedTransaction(async(tx,observed)=>{
        assertAccount();const [meta,current]=await Promise.all([tx.get(owner),tx.get(target)]);
        if(meta.exists())observed(meta.data().sessionCount);
        if(current.exists())fail('ALREADY_EXISTS','A session with this id already exists. Load it or import as a separate session.',409);
        if(!meta.exists()||meta.data().deleting)fail('ACCOUNT_DELETING','Account deletion is in progress.',409);
        if(meta.data().sessionCount>=CLOUD_SESSION_LIMIT)fail('SESSION_LIMIT','Cloud accounts can save 50 sessions. Export and delete an old session before adding another.',409);
        tx.set(target,{ownerId:uid,id:snapshot.id,revision:1,snapshotJson,summary,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
        tx.update(owner,{sessionCount:meta.data().sessionCount+1,mutationId:snapshot.id,updatedAt:serverTimestamp()});
      });assertAccount();return{snapshot,revision:1};
    },
    async update(id,value,revision) {
      checkedRevision(revision);const {snapshot,snapshotJson,summary}=snapshotData(value);if(snapshot.id!==id)fail('ID_MISMATCH','Snapshot id must match the saved session.');const target=ref(id);assertAccount();
      try { await runTransaction(db,async tx=>{
        assertAccount();const [meta,current]=await Promise.all([tx.get(owner),tx.get(target)]);
        if(!current.exists())fail('NOT_FOUND','Session not found.',404);
        if(!meta.exists()||meta.data().deleting)fail('ACCOUNT_DELETING','Account deletion is in progress.',409);
        if(current.data().revision!==revision)fail('REVISION_CONFLICT','This session changed in another tab. Export your current JSON, then reload it before saving.',409);
        tx.update(target,{snapshotJson,summary,revision:revision+1,updatedAt:serverTimestamp()});
      }); } catch(error) {
        if(error.code==='permission-denied'){assertAccount();const latest=await getDocFromServer(target);if(latest.exists()&&latest.data().revision!==revision)fail('REVISION_CONFLICT','This session changed in another tab. Export your current JSON, then reload it before saving.',409);}
        throw error;
      }
      assertAccount();return{snapshot,revision:revision+1};
    },
    remove,
    async eraseAll() {
      assertAccount();
      await runTransaction(db,async tx=>{assertAccount();const meta=await tx.get(owner);if(!meta.exists())tx.set(owner,{schemaVersion:1,sessionCount:0,mutationId:null,deleting:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});else if(!meta.data().deleting)tx.update(owner,{deleting:true,updatedAt:serverTimestamp()});});
      const documents=await getDocsFromServer(query(sessions,limit(CLOUD_SESSION_LIMIT)));assertAccount();
      // Each transaction is two documents, safely below Firestore's per-write/rules limits.
      for(const item of documents.docs)await remove(item.id,undefined,true);
      // Auth deletion does not immediately invalidate every previously issued token.
      // Retain only the irreversible lock, clearing the last job id as well as its JSON.
      await runTransaction(db,async tx=>{assertAccount();const meta=await tx.get(owner);if(!meta.exists()||meta.data().sessionCount!==0)fail('DELETE_INCOMPLETE','Some saved sessions remain. Retry account deletion to finish.',409);tx.update(owner,{mutationId:null,updatedAt:serverTimestamp()});});
      assertAccount();
    },
  };
}

export class FirebaseApiClient {
  mode='cloud';sessionLimit=CLOUD_SESSION_LIMIT;csrfToken=null;accountId=null;authEpoch=0;listeners=new Set();
  constructor(config,{appName='partcue-web',emulators}={}) {
    if(!config?.apiKey||!config?.projectId||!config?.authDomain)fail('CONFIG_REQUIRED','Firebase configuration is missing.',503);
    this.app=getApps().find(a=>a.name===appName)||initializeApp(config,appName);this.auth=getAuth(this.app);this.db=getFirestore(this.app);
    if(emulators){if(!['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname??'localhost'))throw new Error('Emulators may only be enabled on localhost.');if(emulators.auth)connectAuthEmulator(this.auth,emulators.auth,{disableWarnings:true});if(emulators.firestore)connectFirestoreEmulator(this.db,emulators.firestore.host,emulators.firestore.port);}
    this.ready=new Promise((resolve,reject)=>{let settled=false;this.unsubscribe=onAuthStateChanged(this.auth,user=>{if(!settled){settled=true;resolve();}for(const listener of this.listeners)queueMicrotask(()=>listener(user?publicUser(user):null));},reject);});
  }
  async waitUntilReady(){await this.ready;}
  onAuthChange(callback){this.listeners.add(callback);this.ready.then(()=>{if(this.listeners.has(callback))callback(this.auth.currentUser?publicUser(this.auth.currentUser):null);});return()=>this.listeners.delete(callback);}
  async _user({pin=true}={}){await this.ready;const user=this.auth.currentUser;if(!user||(this.accountId&&user.uid!==this.accountId))fail('AUTH_REQUIRED','Your sign-in expired or changed in another tab. Sign in again; your current bench is still here.',401);if(pin)this.accountId=user.uid;return user;}
  _store(user){const uid=user.uid;return createCloudSessionStore(this.db,uid,{assertAccount:()=>{if(this.auth.currentUser?.uid!==uid||this.accountId!==uid)fail('AUTH_REQUIRED','The signed-in account changed. Sign in again before continuing.',401);}});}
  async request(path,method='GET',body) {
    try {
      await this.ready;
      if(path==='/api/auth/register'&&method==='POST') {
        keys(body,['email','password','name']);const email=emailValue(body.email),password=passwordValue(body.password,true),name=nameValue(body.name??email.split('@')[0]);++this.authEpoch;
        const result=await createUserWithEmailAndPassword(this.auth,email,password);this.accountId=result.user.uid;await updateProfile(result.user,{displayName:name});return{user:publicUser(result.user),csrfToken:null};
      }
      if(path==='/api/auth/login'&&method==='POST') {
        keys(body,['email','password']);++this.authEpoch;const result=await signInWithEmailAndPassword(this.auth,emailValue(body.email),passwordValue(body.password,false));this.accountId=result.user.uid;return{user:publicUser(result.user),csrfToken:null};
      }
      if(path==='/api/auth/logout'&&method==='POST'){keys(body,[]);await this._user();++this.authEpoch;await signOut(this.auth);this.accountId=null;return{ok:true};}
      const user=await this._user();
      if(path==='/api/auth/me'&&method==='GET')return{user:publicUser(user),csrfToken:null};
      const store=this._store(user);
      if(path==='/api/sessions'&&method==='GET')return await store.list();
      if(path==='/api/sessions'&&method==='POST'){keys(body,['snapshot']);return await store.create(body.snapshot);}
      const match=/^\/api\/sessions\/([A-Za-z0-9][A-Za-z0-9_-]{0,63})$/.exec(path);
      if(match&&method==='GET')return await store.get(match[1]);
      if(match&&method==='PUT'){keys(body,['snapshot','revision']);return await store.update(match[1],body.snapshot,body.revision);}
      if(match&&method==='DELETE'){keys(body,['revision']);return await store.remove(match[1],checkedRevision(body.revision));}
      fail('NOT_FOUND','Endpoint not found.',404);
    }catch(error){throw mapped(error);}
  }
  async resetPassword(email){try{await this.ready;await sendPasswordResetEmail(this.auth,emailValue(email));return{ok:true};}catch(error){if(error.code==='auth/user-not-found')return{ok:true};throw mapped(error);}}
  async sendVerification(){try{const user=await this._user();if(!user.emailVerified)await sendEmailVerification(user);return{ok:true};}catch(error){throw mapped(error);}}
  async refreshUser(){try{const user=await this._user();await reload(user);await user.getIdToken(true);await this._user();return{user:publicUser(user),csrfToken:null};}catch(error){throw mapped(error);}}
  async updateDisplayName(name){try{const user=await this._user();await updateProfile(user,{displayName:nameValue(name)});return{user:publicUser(user),csrfToken:null};}catch(error){throw mapped(error);}}
  async changePassword(currentPassword,newPassword){try{const user=await this._user();await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,passwordValue(currentPassword,false)));await updatePassword(user,passwordValue(newPassword,true));return{ok:true};}catch(error){throw mapped(error);}}
  async deleteAccount(password){try{const user=await this._user();await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,passwordValue(password,false)));await this._store(user).eraseAll();await deleteUser(user);this.accountId=null;return{ok:true};}catch(error){throw mapped(error);}}
}
