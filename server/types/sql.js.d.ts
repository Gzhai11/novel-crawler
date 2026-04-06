declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string, params?: any[]): QueryExecResult[];
    prepare(sql: string, params?: any[]): Statement;
    iterate(sql: string, params?: any[]): Iterator;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  interface Statement {
    step(): boolean;
    getAsObject(params?: any[]): Record<string, any>;
    get(params?: any[]): any[];
    getColumnNames(): string[];
    bind(params?: any[]): boolean;
    free(): boolean;
    reset(): void;
  }

  interface Iterator {
    next(): IteratorResult;
  }

  interface IteratorResult {
    value: Record<string, any>;
    done: boolean;
  }

  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
  export { Database, QueryExecResult, Statement, SqlJsStatic };
}