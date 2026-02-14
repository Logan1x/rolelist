'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { ExternalLink, EyeOff, CheckCircle2, Plus, Trash2, RotateCcw, Clock, CheckCircle, ListTodo, BarChart3, TrendingUp, Target, Calendar } from 'lucide-react'
import Modal from '@/components/Modal'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type JobStatus = 'todo' | 'applied' | 'hidden'

type Job = {
  id: string
  title: string
  company?: string
  url?: string
  source?: string
  notes?: string
  status: JobStatus
  createdAt: string
  appliedAt?: string | null
  hiddenAt?: string | null
}

async function apiGetJobs(): Promise<Job[]> {
  const res = await fetch('/api/jobs')
  if (!res.ok) throw new Error(`GET /jobs failed (${res.status})`)
  const data = await res.json()
  return data.jobs || []
}

async function apiAddJob(input: {
  url: string
  notes?: string
  title?: string
}): Promise<Job> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : `POST /jobs failed (${res.status})`)
  return data.job as Job
}

async function apiPatchJob(id: string, patch: Partial<Job>): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `PATCH /jobs/:id failed (${res.status})`)
  return data.job as Job
}

async function apiDeleteJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /jobs/:id failed (${res.status})`)
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<JobStatus | 'all'>('todo')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [titleOverride, setTitleOverride] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiGetJobs()
      setJobs(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobs
      .filter((j) => (tab === 'all' ? true : j.status === tab))
      .filter((j) => {
        if (!q) return true
        const blob = `${j.title} ${j.company ?? ''} ${j.source ?? ''} ${j.url ?? ''} ${j.notes ?? ''}`.toLowerCase()
        return blob.includes(q)
      })
  }, [jobs, tab, query])

  const stats = useMemo(() => {
    const total = jobs.length
    const todo = jobs.filter(j => j.status === 'todo').length
    const applied = jobs.filter(j => j.status === 'applied').length
    const hidden = jobs.filter(j => j.status === 'hidden').length
    const needsFollowUp = jobs.filter(j => 
      j.status === 'applied' && j.appliedAt && dayjs().diff(dayjs(j.appliedAt), 'day') > 3
    ).length
    
    // This week's applications
    const thisWeek = jobs.filter(j => 
      dayjs(j.createdAt).isAfter(dayjs().subtract(7, 'day'))
    ).length
    
    // Last week's applications
    const lastWeek = jobs.filter(j => {
      const created = dayjs(j.createdAt)
      return created.isBefore(dayjs().subtract(7, 'day')) && 
             created.isAfter(dayjs().subtract(14, 'day'))
    }).length
    
    return {
      total,
      todo,
      applied,
      hidden,
      needsFollowUp,
      thisWeek,
      lastWeek,
      applicationRate: total > 0 ? Math.round((applied / total) * 100) : 0
    }
  }, [jobs])

  async function refresh() {
    await loadJobs()
  }

  async function onAdd() {
    setError(null)
    try {
      setBusy('add')
      await apiAddJob({
        url,
        notes,
        title: titleOverride.trim() || undefined,
      })
      setUrl('')
      setNotes('')
      setTitleOverride('')
      setAddOpen(false)
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add job')
    } finally {
      setBusy(null)
    }
  }

  async function mutateStatus(id: string, status: JobStatus) {
    setError(null)
    try {
      setBusy(id)
      await apiPatchJob(id, { status })
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update')
    } finally {
      setBusy(null)
    }
  }

  async function onDelete(id: string) {
    setError(null)
    if (!confirm('Delete this job?')) return
    try {
      setBusy(id)
      await apiDeleteJob(id)
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10" style={{ backgroundColor: '#fffffe' }}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <ListTodo className="h-8 w-8" style={{ color: '#2b2c34' }} />
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#2b2c34' }}>RoleList</h1>
          </div>
          <p className="text-sm" style={{ color: '#2b2c34' }}>Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 min-h-screen" style={{ backgroundColor: '#fffffe' }}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ListTodo className="h-8 w-8" style={{ color: '#2b2c34' }} />
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#2b2c34' }}>RoleList</h1>
          </div>
          <p className="text-sm" style={{ color: '#2b2c34' }}>
            Keep a clean list of roles to apply to. Track applications, stay organized.
          </p>
        </div>

        {/* Stats Dashboard */}
        <section className="rounded-xl border p-5" style={{ borderColor: '#d1d1e9', backgroundColor: '#f8f8fc' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5" style={{ color: '#6246ea' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2b2c34' }}>Your Progress</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: '#d1d1e9', backgroundColor: '#fffffe' }}>
              <div className="text-2xl font-bold" style={{ color: '#6246ea' }}>{stats.total}</div>
              <div className="text-xs mt-1" style={{ color: '#2b2c34', opacity: 0.7 }}>Total Roles</div>
            </div>
            
            {/* To Apply */}
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: '#d1d1e9', backgroundColor: '#fffffe' }}>
              <div className="text-2xl font-bold" style={{ color: '#2b2c34' }}>{stats.todo}</div>
              <div className="text-xs mt-1" style={{ color: '#2b2c34', opacity: 0.7 }}>To Apply</div>
            </div>
            
            {/* Applied */}
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: '#d1d1e9', backgroundColor: '#fffffe' }}>
              <div className="text-2xl font-bold" style={{ color: '#6246ea' }}>{stats.applied}</div>
              <div className="text-xs mt-1" style={{ color: '#2b2c34', opacity: 0.7 }}>Applied</div>
            </div>
            
            {/* Application Rate */}
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: '#d1d1e9', backgroundColor: '#fffffe' }}>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold" style={{ color: stats.applicationRate >= 50 ? '#6246ea' : '#e45858' }}>
                  {stats.applicationRate}%
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#2b2c34', opacity: 0.7 }}>Application Rate</div>
            </div>
          </div>
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #d1d1e9' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: stats.thisWeek >= stats.lastWeek ? '#6246ea' : '#e45858' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: '#2b2c34' }}>{stats.thisWeek}</div>
                <div className="text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>This Week</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: '#6246ea' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: '#2b2c34' }}>{stats.lastWeek}</div>
                <div className="text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>Last Week</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: stats.needsFollowUp > 0 ? '#e45858' : '#6246ea' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: stats.needsFollowUp > 0 ? '#e45858' : '#2b2c34' }}>
                  {stats.needsFollowUp}
                </div>
                <div className="text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>Need Follow-up</div>
              </div>
            </div>
          </div>
        </section>

        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a role">
          <div className="space-y-3">
            <div className="text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>
              Paste a job link. Title auto-generates from the hostname (optional override).
            </div>

            <Field label="Job URL *">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ 
                  borderColor: '#d1d1e9', 
                  backgroundColor: '#fffffe', 
                  color: '#2b2c34'
                }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAdd()
                }}
              />
            </Field>

            <Field label="Title override (optional)">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ 
                  borderColor: '#d1d1e9', 
                  backgroundColor: '#fffffe', 
                  color: '#2b2c34'
                }}
                value={titleOverride}
                onChange={(e) => setTitleOverride(e.target.value)}
                placeholder="Leave blank to auto-name"
              />
            </Field>

            <Field label="Notes (optional)">
              <textarea
                className="min-h-[96px] w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ 
                  borderColor: '#d1d1e9', 
                  backgroundColor: '#fffffe', 
                  color: '#2b2c34'
                }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. apply today, referral: …"
              />
            </Field>

            {error ? (
              <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e45858', backgroundColor: '#fff5f5', color: '#2b2c34' }}>
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                style={{ 
                  borderColor: '#d1d1e9', 
                  backgroundColor: '#fffffe', 
                  color: '#2b2c34'
                }}
                type="button"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ 
                  backgroundColor: '#6246ea', 
                  color: '#fffffe'
                }}
                type="button"
                onClick={onAdd}
                disabled={busy === 'add' || url.trim().length === 0}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </Modal>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === 'todo'} onClick={() => setTab('todo')}>
              To apply
            </TabButton>
            <TabButton active={tab === 'applied'} onClick={() => setTab('applied')}>
              Applied
            </TabButton>
            <TabButton active={tab === 'hidden'} onClick={() => setTab('hidden')}>
              Hidden
            </TabButton>
            <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
              All
            </TabButton>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: '#6246ea', 
                color: '#fffffe'
              }}
              onClick={() => {
                setError(null)
                setAddOpen(true)
              }}
              title="Add a job"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>

            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 sm:w-[320px]"
              style={{ 
                borderColor: '#d1d1e9', 
                backgroundColor: '#fffffe', 
                color: '#2b2c34'
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs…"
            />
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              style={{ 
                borderColor: '#d1d1e9', 
                backgroundColor: '#fffffe', 
                color: '#2b2c34'
              }}
              onClick={refresh}
              title="Refresh"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Where to look for new jobs (accordion) */}
        <section className="rounded-xl border" style={{ borderColor: '#d1d1e9', backgroundColor: '#f8f8fc' }}>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-5 text-left"
            onClick={() => setSourcesOpen((v) => !v)}
          >
            <div>
              <div className="text-lg font-semibold" style={{ color: '#2b2c34' }}>Where to look for new jobs</div>
              <div className="mt-1 text-sm" style={{ color: '#2b2c34', opacity: 0.7 }}>
                Shortlist of places to check for fresh roles, founder posts, and portfolio hiring.
              </div>
            </div>
            <div
              className="select-none text-xl"
              style={{ color: '#2b2c34', opacity: 0.6 }}
              aria-hidden
            >
              {sourcesOpen ? '−' : '+'}
            </div>
          </button>

          {sourcesOpen ? (
            <div className="px-5 pb-5">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#2b2c34', opacity: 0.6 }}>
                    Firms / portfolios
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://a16z.com/portfolio/" target="_blank" rel="noreferrer">a16z (Andreessen Horowitz)</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://techcrunch.com/" target="_blank" rel="noreferrer">TechCrunch</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://www.sequoiacap.com/companies/" target="_blank" rel="noreferrer">Sequoia (portfolio)</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://www.tigerglobal.com/" target="_blank" rel="noreferrer">Tiger Global</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://www.ycombinator.com/companies" target="_blank" rel="noreferrer">Y Combinator (companies)</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://nventures.nvidia.com/" target="_blank" rel="noreferrer">NVIDIA Ventures</a></li>
                    <li><a className="underline underline-offset-4" style={{ color: '#2b2c34' }} href="https://gradient.com/" target="_blank" rel="noreferrer">Gradient Ventures (Google)</a></li>
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#2b2c34', opacity: 0.6 }}>
                    Angels / founders to follow
                  </div>
                  <ul className="mt-2 space-y-2 text-sm" style={{ color: '#2b2c34' }}>
                    <li>Elad Gil</li>
                    <li>Arash Ferdowsi (founder/ex-CTO of Dropbox)</li>
                    <li>Paul Copplestone (founder/CEO of Supabase)</li>
                    <li>James Hawkins (founder/CEO of PostHog)</li>
                    <li>Andrew Miklas (founder/ex-CTO of PagerDuty)</li>
                    <li>Diana Hu (GP at Y Combinator)</li>
                  </ul>
                  <p className="mt-3 text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>
                    Tip: when you find a relevant post, click <b>Add</b> and paste the link.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-3">
          {filtered.length === 0 ? (
            <div 
              className="rounded-lg border border-dashed p-10 text-center text-sm"
              style={{ borderColor: '#d1d1e9', color: '#2b2c34', opacity: 0.6 }}
            >
              No jobs here.
            </div>
          ) : (
            filtered.map((j) => (
              <article
                key={j.id}
                className="rounded-lg border p-5 shadow-sm"
                style={{ 
                  borderColor: '#d1d1e9', 
                  backgroundColor: '#fffffe'
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold" style={{ color: '#2b2c34' }}>{j.title}</h3>
                      {j.company ? (
                        <span 
                          className="rounded-lg border px-2 py-0.5 text-xs"
                          style={{ borderColor: '#d1d1e9', backgroundColor: '#f0f0f9', color: '#2b2c34' }}
                        >
                          {j.company}
                        </span>
                      ) : null}
                      <span 
                        className="rounded-lg border px-2 py-0.5 text-xs"
                        style={{ 
                          borderColor: '#d1d1e9', 
                          backgroundColor: j.status === 'applied' ? '#e45858' : j.status === 'hidden' ? '#f8d7da' : '#f0f0f9',
                          color: j.status === 'applied' ? '#fffffe' : j.status === 'hidden' ? '#721c24' : '#2b2c34'
                        }}
                      >
                        {labelForStatus(j.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: '#2b2c34', opacity: 0.6 }}>
                      <span className="inline-flex items-center gap-1" title={new Date(j.createdAt).toLocaleString()}>
                        <Clock className="h-3 w-3" />
                        {dayjs(j.createdAt).fromNow()}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-mono"
                        title="Job ID (share this with Claw)"
                        style={{ opacity: 0.8 }}
                      >
                        ID: {j.id}
                      </span>
                      {j.status === 'applied' && j.appliedAt ? (
                        <span 
                          className="inline-flex items-center gap-1" 
                          title={new Date(j.appliedAt).toLocaleString()}
                          style={{ 
                            color: dayjs().diff(dayjs(j.appliedAt), 'day') > 3 ? '#e45858' : undefined,
                            fontWeight: dayjs().diff(dayjs(j.appliedAt), 'day') > 3 ? '600' : undefined
                          }}
                        >
                          <CheckCircle className="h-3 w-3" style={{ color: dayjs().diff(dayjs(j.appliedAt), 'day') > 3 ? '#e45858' : '#6246ea' }} />
                          {dayjs(j.appliedAt).fromNow()}
                          {dayjs().diff(dayjs(j.appliedAt), 'day') > 3 ? <span className="ml-1">(Follow up!)</span> : null}
                        </span>
                      ) : null}
                      {j.source ? <span>Source: {j.source}</span> : null}
                    </div>
                    {j.notes ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm" style={{ color: '#2b2c34', opacity: 0.8 }}>{j.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {j.url ? (
                      <a
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors border-[#d1d1e9] bg-[#fffffe] text-[#2b2c34] hover:bg-[#f0f0f9] hover:border-[#6246ea]"
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    ) : null}

                    {j.status !== 'applied' ? (
                      <ActionButton
                        disabled={busy === j.id}
                        onClick={() => mutateStatus(j.id, 'applied')}
                        variant="good"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Applied
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={busy === j.id}
                        onClick={() => mutateStatus(j.id, 'todo')}
                        variant="muted"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Undo
                      </ActionButton>
                    )}

                    {j.status !== 'hidden' ? (
                      <ActionButton
                        disabled={busy === j.id}
                        onClick={() => mutateStatus(j.id, 'hidden')}
                        variant="warn"
                      >
                        <EyeOff className="h-4 w-4" />
                        Hide
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={busy === j.id}
                        onClick={() => mutateStatus(j.id, 'todo')}
                        variant="muted"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Unhide
                      </ActionButton>
                    )}

                    <ActionButton disabled={busy === j.id} onClick={() => onDelete(j.id)} variant="bad">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <footer className="pt-2 text-xs" style={{ color: '#2b2c34', opacity: 0.5 }}>
          Data stored locally in data/jobs.db
        </footer>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium" style={{ color: '#2b2c34' }}>{label}</div>
      {children}
    </label>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      style={
        active
          ? { borderColor: '#6246ea', backgroundColor: '#6246ea', color: '#fffffe' }
          : { borderColor: '#d1d1e9', backgroundColor: '#f0f0f9', color: '#2b2c34' }
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant: 'good' | 'warn' | 'bad' | 'muted'
}) {
  const getClassName = () => {
    const baseClasses = "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
    
    switch (variant) {
      case 'good':
        return `${baseClasses} border-[#d1d1e9] bg-[#fffffe] text-[#2b2c34] hover:bg-[#f0f0f9] hover:border-[#6246ea]`
      case 'warn':
        return `${baseClasses} border-[#d1d1e9] bg-[#fffffe] text-[#2b2c34] hover:bg-[#f0f0f9] hover:border-[#6246ea]`
      case 'bad':
        return `${baseClasses} border-[#d1d1e9] bg-[#fffffe] text-[#2b2c34] hover:border-[#e45858] hover:bg-[#fff5f5] hover:text-[#e45858]`
      case 'muted':
      default:
        return `${baseClasses} border-[#d1d1e9] bg-[#fffffe] text-[#2b2c34] hover:bg-[#f0f0f9]`
    }
  }

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

function labelForStatus(s: JobStatus) {
  if (s === 'todo') return 'To apply'
  if (s === 'applied') return 'Applied'
  return 'Hidden'
}
