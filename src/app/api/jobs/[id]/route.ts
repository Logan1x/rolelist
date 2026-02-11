import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, JobStatus } from '@/lib/db'

const JobStatusEnum = z.enum(['todo', 'applied', 'hidden'])

const PatchJobSchema = z.object({
  status: JobStatusEnum.optional(),
  title: z.string().min(1).optional(),
  company: z.string().optional(),
  url: z.string().url().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = PatchJobSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const db = getDb()
    const prev = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as {
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
    } | undefined
    
    if (!prev) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      )
    }

    const next = {
      ...prev,
      ...parsed.data,
    }

    if (parsed.data.status === 'applied' && prev.status !== 'applied') {
      next.appliedAt = new Date().toISOString()
    }

    if (parsed.data.status === 'hidden' && prev.status !== 'hidden') {
      next.hiddenAt = new Date().toISOString()
    }

    db.prepare(
      `UPDATE jobs SET
        title = @title,
        company = @company,
        url = @url,
        source = @source,
        notes = @notes,
        status = @status,
        createdAt = @createdAt,
        appliedAt = @appliedAt,
        hiddenAt = @hiddenAt
       WHERE id = @id`
    ).run({
      id,
      title: next.title,
      company: next.company ?? null,
      url: next.url ?? null,
      source: next.source ?? null,
      notes: next.notes ?? null,
      status: next.status,
      createdAt: next.createdAt,
      appliedAt: next.appliedAt ?? null,
      hiddenAt: next.hiddenAt ?? null,
    })

    const out = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
    return NextResponse.json({ job: out })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    db.prepare('DELETE FROM jobs WHERE id = ?').run(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}
