var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// 数据库文件路径
var dbPath = path.join(__dirname, '..', 'data', 'chat.db');
// 确保 data 目录存在
var dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
var db;
// 初始化数据库
function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var SQL, buffer, tableInfo, columns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initSqlJs()];
                case 1:
                    SQL = _a.sent();
                    // 如果数据库文件存在，加载它
                    if (fs.existsSync(dbPath)) {
                        buffer = fs.readFileSync(dbPath);
                        db = new SQL.Database(buffer);
                    }
                    else {
                        db = new SQL.Database();
                    }
                    // 初始化表
                    db.run("\n    CREATE TABLE IF NOT EXISTS sessions (\n      id TEXT PRIMARY KEY,\n      title TEXT NOT NULL,\n      model TEXT NOT NULL,\n      sdk_session_id TEXT,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    )\n  ");
                    db.run("\n    CREATE TABLE IF NOT EXISTS messages (\n      id TEXT PRIMARY KEY,\n      session_id TEXT NOT NULL,\n      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),\n      content TEXT NOT NULL,\n      model TEXT,\n      created_at TEXT NOT NULL,\n      tool_calls TEXT,\n      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE\n    )\n  ");
                    db.run("CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)");
                    // 检查并添加 sdk_session_id 列
                    try {
                        tableInfo = db.exec("PRAGMA table_info(sessions)");
                        if (tableInfo.length > 0) {
                            columns = tableInfo[0].values.map(function (row) { return row[1]; });
                            if (!columns.includes('sdk_session_id')) {
                                db.run("ALTER TABLE sessions ADD COLUMN sdk_session_id TEXT");
                                console.log("[DB] Added sdk_session_id column to sessions table");
                            }
                        }
                    }
                    catch (e) {
                        // 忽略错误
                    }
                    saveDatabase();
                    return [2 /*return*/, db];
            }
        });
    });
}
// 保存数据库到文件
function saveDatabase() {
    var data = db.export();
    var buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}
// 初始化数据库（导出 Promise）
export var dbReady = initDatabase();
// 辅助函数：执行查询并返回结果
function queryAll(sql, params) {
    if (params === void 0) { params = []; }
    var stmt = db.prepare(sql);
    if (params.length > 0) {
        stmt.bind(params);
    }
    var results = [];
    while (stmt.step()) {
        var row = stmt.getAsObject();
        results.push(row);
    }
    stmt.free();
    return results;
}
function queryOne(sql, params) {
    if (params === void 0) { params = []; }
    var results = queryAll(sql, params);
    return results.length > 0 ? results[0] : undefined;
}
function runSql(sql, params) {
    if (params === void 0) { params = []; }
    db.run(sql, params);
    saveDatabase();
    return { changes: db.getRowsModified() };
}
// ============= 会话操作 =============
export function getAllSessions() {
    return queryAll('SELECT * FROM sessions ORDER BY updated_at DESC');
}
export function getSession(id) {
    return queryOne('SELECT * FROM sessions WHERE id = ?', [id]);
}
export function createSession(session) {
    runSql("\n    INSERT INTO sessions (id, title, model, sdk_session_id, created_at, updated_at)\n    VALUES (?, ?, ?, ?, ?, ?)\n  ", [session.id, session.title, session.model, session.sdk_session_id, session.created_at, session.updated_at]);
    return session;
}
export function updateSession(id, updates) {
    var fields = [];
    var values = [];
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
    if (fields.length === 0)
        return false;
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    var result = runSql("UPDATE sessions SET ".concat(fields.join(', '), " WHERE id = ?"), values);
    return result.changes > 0;
}
export function deleteSession(id) {
    var result = runSql('DELETE FROM sessions WHERE id = ?', [id]);
    return result.changes > 0;
}
// ============= 消息操作 =============
export function getMessagesBySession(sessionId) {
    return queryAll('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC', [sessionId]);
}
export function createMessage(message) {
    runSql("\n    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)\n    VALUES (?, ?, ?, ?, ?, ?, ?)\n  ", [message.id, message.session_id, message.role, message.content, message.model, message.created_at, message.tool_calls]);
    runSql('UPDATE sessions SET updated_at = ? WHERE id = ?', [new Date().toISOString(), message.session_id]);
    return message;
}
export function updateMessage(id, updates) {
    var fields = [];
    var values = [];
    if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
    }
    if (updates.tool_calls !== undefined) {
        fields.push('tool_calls = ?');
        values.push(updates.tool_calls);
    }
    if (fields.length === 0)
        return false;
    values.push(id);
    var result = runSql("UPDATE messages SET ".concat(fields.join(', '), " WHERE id = ?"), values);
    return result.changes > 0;
}
export function deleteMessage(id) {
    var result = runSql('DELETE FROM messages WHERE id = ?', [id]);
    return result.changes > 0;
}
export function createMessages(messages) {
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var msg = messages_1[_i];
        runSql("\n      INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)\n      VALUES (?, ?, ?, ?, ?, ?, ?)\n    ", [msg.id, msg.session_id, msg.role, msg.content, msg.model, msg.created_at, msg.tool_calls]);
    }
}
export function clearAllData() {
    runSql('DELETE FROM messages');
    runSql('DELETE FROM sessions');
}
export default { dbReady: dbReady };
