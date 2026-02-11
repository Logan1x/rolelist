import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'jobs.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        url TEXT,
        source TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        appliedAt TEXT,
        hiddenAt TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_createdAt ON jobs(createdAt);
    `)
    
    // Migration: add hiddenAt column if it doesn't exist
    try {
      db.prepare('SELECT hiddenAt FROM jobs LIMIT 1').get()
    } catch (e) {
      db.exec('ALTER TABLE jobs ADD COLUMN hiddenAt TEXT')
      console.log('[db] Added hiddenAt column to jobs table')
    }
  }
  return db
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export type JobStatus = 'todo' | 'applied' | 'hidden'

export interface Job {
  id: string
  title: string
  company: string | null
  url: string | null
  source: string | null
  notes: string | null
  status: JobStatus
  createdAt: string
  appliedAt: string | null
  hiddenAt: string | null
}
