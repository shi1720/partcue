import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir, open, link, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

/** Consistent SQLite online backup; never overwrites an existing destination. */
export async function backupDatabase(source, destination) {
  const sourcePath = path.resolve(source);
  const targetPath = path.resolve(destination);
  if (sourcePath === targetPath) throw new Error('Backup destination must differ from the live database.');
  await mkdir(path.dirname(targetPath), { recursive: true, mode: 0o700 });
  const temporary = `${targetPath}.${randomBytes(8).toString('hex')}.tmp`;
  const file = await open(temporary, 'wx', 0o600);
  await file.close();
  let database;
  try {
    database = new DatabaseSync(sourcePath, { readOnly: true });
    const check = database.prepare('PRAGMA quick_check').get();
    if (check.quick_check !== 'ok') throw new Error('Source database failed its integrity check.');
    await backup(database, temporary);
    const copied = new DatabaseSync(temporary, { readOnly: true });
    try { if (copied.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Backup failed its integrity check.'); }
    finally { copied.close(); }
    // Hard-link publication is atomic and refuses to replace an existing backup.
    await link(temporary, targetPath);
    return targetPath;
  } finally {
    database?.close();
    await unlink(temporary).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [, , source, destination] = process.argv;
  if (!source || !destination) throw new Error('Usage: node server/backup.mjs <database.sqlite> <new-backup.sqlite>');
  console.log(`Verified backup saved to ${await backupDatabase(source, destination)}`);
}
