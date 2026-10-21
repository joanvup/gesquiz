/**
 * Declaraciones minimas de better-sqlite3.
 *
 * El paquete oficial (@types/better-sqlite3) no se puede instalar en este
 * entorno porque su postinstall intenta recompilar el modulo nativo y falla
 * con node-gyp. Solo se necesitan estas firmas para el uso basico en los
 * tests E2E.
 */
declare module 'better-sqlite3' {
  interface Statement {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  }

  interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
  }

  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
  }

  export default Database;
}
