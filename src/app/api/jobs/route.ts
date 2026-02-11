import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, newId, Job } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const jobs = db
      .prepare('SELECT * FROM jobs ORDER BY datetime(createdAt) DESC')
      .all() as Job[]
    
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

const AddJobSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
})

function inferSourceFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('x.com') || host.includes('twitter.com')) return 'X'
    if (host.includes('linkedin.com')) return 'LinkedIn'
    if (host.includes('greenhouse.io')) return 'Greenhouse'
    if (host.includes('lever.co')) return 'Lever'
    return host
  } catch {
    return null
  }
}

function titleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return `Job link (${host})`
  } catch {
    return 'Job link'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AddJobSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const inferredSource = inferSourceFromUrl(parsed.data.url)

    const job = {
      id: newId(),
      title: parsed.data.title?.trim() || titleFromUrl(parsed.data.url),
      company: parsed.data.company?.trim() || null,
      url: parsed.data.url,
      source: parsed.data.source?.trim() || inferredSource,
      notes: parsed.data.notes?.trim() || null,
      status: 'todo' as const,
      createdAt: now,
      appliedAt: null,
      hiddenAt: null,
    }

    const db = getDb()
    db.prepare(
      `INSERT INTO jobs (id, title, company, url, source, notes, status, createdAt, appliedAt, hiddenAt)
       VALUES (@id, @title, @company, @url, @source, @notes, @status, @createdAt, @appliedAt, @hiddenAt)`
    ).run(job)

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
