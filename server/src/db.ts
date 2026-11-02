import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { config } from './config'

mkdirSync(dirname(config.dbPath), { recursive: true })

export const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export interface UserRow {
  id: number
  phone: string
  password_hash: string
  name: string
  role: string // 'user' | 'admin'
  status: string // 'active' | 'banned'
  membership_expires_at: number | null
  password_changed_at: number
  created_at: number
  last_login_at: number | null
}

/**
 * 简易迁移：按 PRAGMA user_version 顺序执行。
 * 只追加、不修改历史条目，保证老库可平滑升级。
 */
const MIGRATIONS: string[] = [
  // v1：用户、短信验证码、学习数据
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    membership_expires_at INTEGER,
    password_changed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  );

  CREATE TABLE sms_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    ip TEXT
  );
  CREATE INDEX idx_sms_codes_phone_created ON sms_codes(phone, created_at);

  CREATE TABLE user_data (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  `,
]

const version = db.pragma('user_version', { simple: true }) as number
for (let v = version; v < MIGRATIONS.length; v++) {
  db.transaction(() => {
    db.exec(MIGRATIONS[v])
    db.pragma(`user_version = ${v + 1}`)
  })()
  console.log(`[db] 迁移到 v${v + 1}`)
}

export function publicUser(u: UserRow) {
  return {
    phone: u.phone,
    name: u.name,
    role: u.role,
    status: u.status,
    membershipExpiresAt: u.membership_expires_at,
    createdAt: u.created_at,
  }
}

export function findUserByPhone(phone: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as UserRow | undefined
}

export function findUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}
