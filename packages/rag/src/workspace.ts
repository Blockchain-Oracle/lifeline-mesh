import { readFileSync, writeFileSync } from "node:fs";
import sqlite3Init from "@sqliteai/sqlite-wasm";
import type { RagHit } from "@lifeline/core";
import type { Chunk } from "./ingest/manifest.js";

// Self-managed sqlite-wasm vector store (ADR-006). Metadata columns travel with
// each vector so search results resolve directly to citations. sqlite-wasm is
// architecture-independent, so a DB built on x86 opens unchanged on the Pi's arm64.

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

interface SqliteDb {
  exec(opts: unknown): unknown;
  close(): void;
  pointer: number;
}
interface Sqlite3 {
  oo1: { DB: new (name: string, mode: string) => SqliteDb };
  wasm: { allocFromTypedArray(bytes: Uint8Array): number };
  capi: {
    sqlite3_js_db_export(db: unknown): Uint8Array;
    sqlite3_deserialize(
      db: number,
      schema: string,
      data: number,
      szDb: number,
      szBuf: number,
      flags: number,
    ): number;
    SQLITE_DESERIALIZE_FREEONCLOSE: number;
    SQLITE_DESERIALIZE_RESIZEABLE: number;
  };
}

const VEC_TYPE = "FLOAT32";

export class Workspace {
  private constructor(
    private readonly db: SqliteDb,
    private readonly sqlite3: Sqlite3,
    readonly dim: number,
  ) {}

  static async create(dim: number, fromFile?: string): Promise<Workspace> {
    const sqlite3 = (await sqlite3Init()) as unknown as Sqlite3;
    const db = new sqlite3.oo1.DB(":memory:", "c");
    const ws = new Workspace(db, sqlite3, dim);
    if (fromFile) {
      ws.importBytes(readFileSync(fromFile));
      ws.preload();
    } else {
      ws.initSchema();
    }
    return ws;
  }

  // Rebuild the in-memory vector-quantize context after loading a persisted DB
  // (the quantized shadow tables persist, but the runtime scan context does not).
  // vector_init re-registers the context; preload loads the quantized vectors.
  private preload(): void {
    this.db.exec({ sql: `SELECT vector_init('chunks','embedding','type=${VEC_TYPE},dimension=${this.dim}')` });
    this.db.exec({ sql: `SELECT vector_quantize_preload('chunks','embedding')` });
  }

  private initSchema(): void {
    this.db.exec({
      sql: `CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY, content TEXT NOT NULL, source_id TEXT NOT NULL,
        section TEXT NOT NULL, page INTEGER NOT NULL, type TEXT NOT NULL,
        embedding BLOB NOT NULL)`,
    });
  }

  private importBytes(bytes: Uint8Array): void {
    // Reload a persisted DB: copy bytes into wasm heap and deserialize into "main".
    // Verified round-trip on @sqliteai/sqlite-wasm (2026-06-13). Coerce to a plain
    // Uint8Array — a Node Buffer trips allocFromTypedArray's heapForSize check.
    const { wasm, capi } = this.sqlite3;
    const u8 = bytes.constructor === Uint8Array ? bytes : new Uint8Array(bytes);
    const ptr = wasm.allocFromTypedArray(u8);
    const flags = capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_RESIZEABLE;
    const rc = capi.sqlite3_deserialize(this.db.pointer, "main", ptr, u8.length, u8.length, flags);
    if (rc !== 0) throw new Error(`sqlite3_deserialize failed rc=${rc}`);
  }

  upsert(rows: EmbeddedChunk[]): void {
    for (const r of rows) {
      if (r.embedding.length !== this.dim) {
        throw new Error(`embedding dim ${r.embedding.length} != workspace dim ${this.dim} for ${r.id}`);
      }
      this.db.exec({
        sql: `INSERT OR REPLACE INTO chunks VALUES (?,?,?,?,?,?,vector_as_f32(?))`,
        bind: [r.id, r.content, r.sourceId, r.section, r.page, r.type, JSON.stringify(r.embedding)],
      });
    }
  }

  index(): void {
    this.db.exec({ sql: `SELECT vector_init('chunks','embedding','type=${VEC_TYPE},dimension=${this.dim}')` });
    this.db.exec({ sql: `SELECT vector_quantize('chunks','embedding')` });
  }

  search(queryVec: number[], topK: number): RagHit[] {
    // vector_quantize_scan's k arg must be a SQL literal, not a bind param.
    const k = Math.max(1, Math.floor(topK));
    const out: RagHit[] = [];
    this.db.exec({
      sql: `SELECT c.id, c.content, c.source_id AS sourceId, c.section, c.page, c.type, s.distance AS score
            FROM chunks c JOIN vector_quantize_scan('chunks','embedding',vector_as_f32(?),${k}) s ON c.rowid = s.rowid
            ORDER BY s.distance ASC`,
      bind: [JSON.stringify(queryVec)],
      rowMode: "object",
      callback: (row: unknown) => out.push(row as RagHit),
    });
    return out;
  }

  saveTo(file: string): void {
    const bytes = this.sqlite3.capi.sqlite3_js_db_export(this.db as unknown);
    writeFileSync(file, bytes);
  }

  close(): void {
    this.db.close();
  }
}
