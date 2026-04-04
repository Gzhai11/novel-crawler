import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'chat.db');

// 确保 data 目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database;

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // 初始化表
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model TEXT NOT NULL,
      sdk_session_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      model TEXT,
      created_at TEXT NOT NULL,
      tool_calls TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`);
  
  // 检查并添加 sdk_session_id 列
  try {
    const tableInfo = db.exec("PRAGMA table_info(sessions)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1]);
      if (!columns.includes('sdk_session_id')) {
        db.run("ALTER TABLE sessions ADD COLUMN sdk_session_id TEXT");
        console.log("[DB] Added sdk_session_id column to sessions table");
      }
    }
  } catch (e) {
    // 忽略错误
  }
  
  saveDatabase();
  return db;
}

// 保存数据库到文件
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 初始化数据库（导出 Promise）
export const dbReady = initDatabase();

// 类型定义
export interface DbSession {
  id: string;
  title: string;
  model: string;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
  tool_calls: string | null;
}

// 辅助函数：执行查询并返回结果
function queryAll<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  const results = queryAll<T>(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

function runSql(sql: string, params: any[] = []): { changes: number } {
  db.run(sql, params);
  saveDatabase();
  return { changes: db.getRowsModified() };
}

// ============= 会话操作 =============

export function getAllSessions(): DbSession[] {
  return queryAll<DbSession>('SELECT * FROM sessions ORDER BY updated_at DESC');
}

export function getSession(id: string): DbSession | undefined {
  return queryOne<DbSession>('SELECT * FROM sessions WHERE id = ?', [id]);
}

export function createSession(session: DbSession): DbSession {
  runSql(`
    INSERT INTO sessions (id, title, model, sdk_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [session.id, session.title, session.model, session.sdk_session_id, session.created_at, session.updated_at]);
  return session;
}

export function updateSession(id: string, updates: Partial<Pick<DbSession, 'title' | 'model' | 'sdk_session_id'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model);
  }
  if (updates.sdk_session_id !== undefined) {
    fields.push('sdk_session_id = ?');
    values.push(updates.sdk_session_id);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  
  const result = runSql(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.changes > 0;
}

export function deleteSession(id: string): boolean {
  const result = runSql('DELETE FROM sessions WHERE id = ?', [id]);
  return result.changes > 0;
}

// ============= 消息操作 =============

export function getMessagesBySession(sessionId: string): DbMessage[] {
  return queryAll<DbMessage>('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC', [sessionId]);
}

export function createMessage(message: DbMessage): DbMessage {
  runSql(`
    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [message.id, message.session_id, message.role, message.content, message.model, message.created_at, message.tool_calls]);
  
  runSql('UPDATE sessions SET updated_at = ? WHERE id = ?', [new Date().toISOString(), message.session_id]);
  
  return message;
}

export function updateMessage(id: string, updates: Partial<Pick<DbMessage, 'content' | 'tool_calls'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.tool_calls !== undefined) {
    fields.push('tool_calls = ?');
    values.push(updates.tool_calls);
  }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  
  const result = runSql(`UPDATE messages SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.changes > 0;
}

export function deleteMessage(id: string): boolean {
  const result = runSql('DELETE FROM messages WHERE id = ?', [id]);
  return result.changes > 0;
}

export function createMessages(messages: DbMessage[]): void {
  for (const msg of messages) {
    runSql(`
      INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [msg.id, msg.session_id, msg.role, msg.content, msg.model, msg.created_at, msg.tool_calls]);
  }
}

export function clearAllData(): void {
  runSql('DELETE FROM messages');
  runSql('DELETE FROM sessions');
}

export default { dbReady };