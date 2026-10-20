import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
const env = { ...process.env };
const macJava = '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home';
if (!env.JAVA_HOME && process.platform === 'darwin' && existsSync(`${macJava}/bin/java`)) env.JAVA_HOME = macJava;
if (env.JAVA_HOME) env.PATH = `${env.JAVA_HOME}/bin${path.delimiter}${env.PATH}`;
try { execFileSync('java', ['-version'], { env, stdio: 'pipe' }); }
catch { throw new Error('Firebase emulator checks require JDK 21 or later. Install a JDK and set JAVA_HOME, then retry.'); }
const firebase = process.platform === 'win32' ? 'node_modules/.bin/firebase.cmd' : 'node_modules/.bin/firebase';
execFileSync(firebase, ['emulators:exec', '--project', 'demo-partcue', '--only', 'auth,firestore', 'node --test --test-concurrency=1 tests/firebase/*.test.mjs'], { env, stdio: 'inherit' });
