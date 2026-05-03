'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type {
  PendingPostSummary,
  TopicRow,
  AgentRunRow,
} from '@/lib/agents/contentPipeline';

type Tab = 'pending' | 'topics' | 'runs';

interface Props {
  pendingPosts: PendingPostSummary[];
  topics: TopicRow[];
  runs: AgentRunRow[];
  focusedPost: PendingPostSummary | null;
  initialTab: Tab;
}

export default function ContentPipelineClient({
  pendingPosts,
  topics,
  runs,
  focusedPost,
  initialTab,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [drawerPost, setDrawerPost] = useState<PendingPostSummary | null>(focusedPost);

  const pendingCount = pendingPosts.filter((p) => p.status === 'pending' || p.status === 'edited').length;
  const queueCount = topics.filter((t) => t.status === 'pending').length;

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
            📝 Pending drafts
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
                {pendingCount}
              </span>
            )}
          </TabButton>
          <TabButton active={tab === 'topics'} onClick={() => setTab('topics')}>
            💡 Topic queue ({queueCount})
          </TabButton>
          <TabButton active={tab === 'runs'} onClick={() => setTab('runs')}>
            🤖 Agent runs
          </TabButton>
        </nav>
      </div>

      {tab === 'pending' && (
        <PendingTab posts={pendingPosts} onOpen={setDrawerPost} />
      )}
      {tab === 'topics' && <TopicsTab topics={topics} />}
      {tab === 'runs' && <RunsTab runs={runs} />}

      {drawerPost && (
        <PostDrawer post={drawerPost} onClose={() => setDrawerPost(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending tab
// ---------------------------------------------------------------------------

function PendingTab({
  posts,
  onOpen,
}: {
  posts: PendingPostSummary[];
  onOpen: (p: PendingPostSummary) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-700 font-medium">No drafts in the queue.</p>
        <p className="text-gray-500 text-sm mt-1">
          The next cron run is Monday 09:00 EST. Manually trigger via curl
          (see docs/PHASE_7A_SETUP.md) to test sooner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen(p)}
          className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:border-pink-300 hover:shadow-md transition p-5"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{p.title}</h3>
            <PostStatusBadge status={p.status} />
          </div>
          <p className="text-sm text-gray-600 mb-2">{p.description}</p>
          <p className="text-xs text-gray-500 font-mono">{p.slug}</p>
          <p className="text-xs text-gray-400 mt-2">
            Generated {new Date(p.generatedAt).toLocaleString()}
            {p.publishedAt && (
              <> · Published {new Date(p.publishedAt).toLocaleString()}</>
            )}
            {p.githubCommitSha && (
              <> · <code className="font-mono text-gray-500">{p.githubCommitSha.slice(0, 7)}</code></>
            )}
          </p>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post drawer (read + edit + approve/reject)
// ---------------------------------------------------------------------------

function PostDrawer({
  post: initialPost,
  onClose,
}: {
  post: PendingPostSummary;
  onClose: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [post, setPost] = useState(initialPost);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialPost.bodyMdx ?? '');
  const [title, setTitle] = useState(initialPost.title);
  const [slug, setSlug] = useState(initialPost.slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ reason: string; skipTopic: boolean } | null>(null);

  const isFinal = post.status === 'published' || post.status === 'rejected';

  const saveEdits = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content-pipeline/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyMdx: body, title, slug }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || 'Save failed');
        return;
      }
      setPost({ ...post, status: 'edited', bodyMdx: body, title, slug });
      setEditing(false);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!confirm(`Publish "${title}" to GitHub? This commits to master and triggers a Vercel deploy.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content-pipeline/posts/${post.id}/approve`, {
        method: 'POST',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || 'Approve failed');
        return;
      }
      setPost({
        ...post,
        status: 'published',
        publishedAt: new Date().toISOString(),
        githubCommitSha: j.commitSha ?? null,
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content-pipeline/posts/${post.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectModal.reason || null,
          skipTopic: rejectModal.skipTopic,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || 'Reject failed');
        return;
      }
      setPost({ ...post, status: 'rejected' });
      setRejectModal(null);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-stretch justify-end">
      <div className="w-full max-w-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-pink-300 focus:border-pink-600 focus:outline-none"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
            )}
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {editing ? (
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                  }
                  className="w-full border-b border-gray-300 focus:border-pink-500 focus:outline-none font-mono text-xs"
                  pattern="[a-z0-9-]+"
                />
              ) : (
                post.slug
              )}
            </p>
            <PostStatusBadge status={post.status} className="mt-2" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {error && (
          <div className="m-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Phase 7B: AI-generated images render inline so visual approval
              doesn't require copy-pasting the public URL into a new tab.
              Hidden when no images have been generated yet (older drafts). */}
          {(post.imageUrl || post.pinterestImageUrl) && (
            <section className="grid sm:grid-cols-3 gap-3">
              {post.imageUrl && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Hero (16:9)
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt={`${post.title} — hero`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
              {post.pinterestImageUrl && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Pinterest (9:16)
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.pinterestImageUrl}
                    alt={`${post.title} — Pinterest pin`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </section>
          )}
          {post.imagePrompt && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Image prompt {post.imageCostCents != null && `· $${(post.imageCostCents / 100).toFixed(2)}`}
              </summary>
              <p className="mt-2 text-gray-600 italic bg-gray-50 p-3 rounded">
                {post.imagePrompt}
              </p>
            </details>
          )}

          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={30}
              className="w-full font-mono text-sm bg-gray-50 border border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-pink-500"
              spellCheck={false}
            />
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-md">
              {post.bodyMdx ?? '(body not loaded)'}
            </pre>
          )}
        </div>

        <footer className="bg-white border-t border-gray-200 p-4 flex flex-wrap gap-2 justify-end">
          {!isFinal && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-sm font-medium"
              >
                ✏ Edit
              </button>
              <button
                onClick={() => setRejectModal({ reason: '', skipTopic: false })}
                disabled={busy}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={approve}
                disabled={busy}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-md text-sm font-semibold hover:shadow-md disabled:opacity-50"
              >
                {busy ? 'Publishing…' : 'Approve & publish to GitHub'}
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setBody(post.bodyMdx ?? '');
                  setTitle(post.title);
                  setSlug(post.slug);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel edits
              </button>
              <button
                onClick={saveEdits}
                disabled={busy}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-sm font-medium disabled:bg-pink-300"
              >
                {busy ? 'Saving…' : 'Save edits'}
              </button>
            </>
          )}
          {isFinal && post.githubCommitSha && (
            <a
              href={`https://github.com/manicmerlin/floridaweddingwonders/commit/${post.githubCommitSha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-mono"
            >
              {post.githubCommitSha.slice(0, 7)} ↗
            </a>
          )}
        </footer>

        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject draft</h3>
              <p className="text-sm text-gray-600 mb-4">
                The draft will be marked rejected. By default, the topic returns to the queue
                for another attempt — check the box below if the topic itself is the problem.
              </p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal({ ...rejectModal, reason: e.target.value })
                }
                rows={4}
                placeholder="Reason (optional, internal use)…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-400"
              />
              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={rejectModal.skipTopic}
                  onChange={(e) =>
                    setRejectModal({ ...rejectModal, skipTopic: e.target.checked })
                  }
                />
                Also skip the topic (don't try again)
              </label>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  disabled={busy}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:bg-red-300"
                >
                  {busy ? 'Rejecting…' : 'Reject draft'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topics tab
// ---------------------------------------------------------------------------

function TopicsTab({ topics: initial }: { topics: TopicRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [topics, setTopics] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    topic: '',
    workingTitle: '',
    description: '',
    priority: 5,
  });
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byStatus: Record<string, TopicRow[]> = { pending: [], in_use: [], used: [], skipped: [] };
    for (const t of topics) (byStatus[t.status] ??= []).push(t);
    return byStatus;
  }, [topics]);

  const addTopic = async () => {
    if (!draft.topic.trim()) return;
    setError(null);
    const res = await fetch('/api/admin/content-pipeline/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Add failed');
      return;
    }
    setAdding(false);
    setDraft({ topic: '', workingTitle: '', description: '', priority: 5 });
    startTransition(() => router.refresh());
  };

  const skipTopic = async (id: string) => {
    if (!confirm('Mark this topic as skipped? It won\'t be picked by the cron.')) return;
    await fetch(`/api/admin/content-pipeline/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'skipped' }),
    });
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'skipped' } : t)));
    startTransition(() => router.refresh());
  };

  const reactivate = async (id: string) => {
    await fetch(`/api/admin/content-pipeline/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    });
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'pending' } : t)));
    startTransition(() => router.refresh());
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Delete this topic permanently?')) return;
    const res = await fetch(`/api/admin/content-pipeline/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Delete failed');
      return;
    }
    setTopics((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setAdding((v) => !v)}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-md"
        >
          {adding ? 'Cancel' : '+ Add topic'}
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-pink-200 p-5 space-y-3">
          <input
            placeholder="Topic (slug-friendly)"
            value={draft.topic}
            onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
          <input
            placeholder="Working title"
            value={draft.workingTitle}
            onChange={(e) => setDraft({ ...draft, workingTitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
          <textarea
            placeholder="Brief (1-2 sentences)"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Priority (1-10):</label>
            <input
              type="number"
              min={1}
              max={10}
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: parseInt(e.target.value, 10) || 5 })
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
            />
            <button
              onClick={addTopic}
              className="ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-md"
            >
              Save topic
            </button>
          </div>
        </div>
      )}

      {(['pending', 'in_use', 'used', 'skipped'] as const).map((status) => {
        const list = grouped[status];
        if (!list?.length) return null;
        return (
          <section key={status}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              {status.replace('_', ' ')} ({list.length})
            </h2>
            <div className="space-y-2">
              {list.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-3 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {t.workingTitle || t.topic}
                    </p>
                    {t.description && (
                      <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      priority {t.priority} · {t.season ?? 'any'} ·
                      {' '}<span className={t.source === 'agent' ? 'text-purple-700' : 'text-gray-700'}>{t.source}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    {t.status === 'pending' && (
                      <button
                        onClick={() => skipTopic(t.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Skip
                      </button>
                    )}
                    {t.status === 'skipped' && (
                      <button
                        onClick={() => reactivate(t.id)}
                        className="text-pink-600 hover:text-pink-700"
                      >
                        Reactivate
                      </button>
                    )}
                    {(t.status === 'pending' || t.status === 'skipped') && (
                      <button
                        onClick={() => deleteTopic(t.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Runs tab — audit log
// ---------------------------------------------------------------------------

function RunsTab({ runs }: { runs: AgentRunRow[] }) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-600">
        No agent runs yet. The first cron fires Monday 09:00 EST.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="text-left p-3">Agent</th>
            <th className="text-left p-3">Started</th>
            <th className="text-left p-3">Status</th>
            <th className="text-right p-3">Duration</th>
            <th className="text-right p-3">Tokens</th>
            <th className="text-right p-3">Cost</th>
            <th className="text-left p-3">Output / Error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t border-gray-100">
              <td className="p-3 font-mono text-xs text-gray-700">{r.agentName}</td>
              <td className="p-3 text-gray-600">{new Date(r.startedAt).toLocaleString()}</td>
              <td className="p-3">
                <RunStatusBadge status={r.status} />
              </td>
              <td className="p-3 text-right text-gray-600 font-mono">
                {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—'}
              </td>
              <td className="p-3 text-right text-gray-600 font-mono">
                {r.tokensIn != null ? `${r.tokensIn.toLocaleString()} / ${r.tokensOut?.toLocaleString() ?? 0}` : '—'}
              </td>
              <td className="p-3 text-right text-gray-700 font-mono">
                {r.costCents != null ? `$${(r.costCents / 100).toFixed(2)}` : '—'}
              </td>
              <td className="p-3 text-xs text-gray-600">
                {r.error ? (
                  <span className="text-red-700">{r.error.slice(0, 80)}</span>
                ) : r.output ? (
                  <span className="text-gray-500">
                    {(r.output.post_slug as string) || JSON.stringify(r.output).slice(0, 80)}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition ${
        active
          ? 'border-pink-500 text-pink-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function PostStatusBadge({
  status,
  className = '',
}: {
  status: PendingPostSummary['status'];
  className?: string;
}) {
  const cls = (
    {
      pending: 'bg-amber-100 text-amber-800',
      edited: 'bg-blue-100 text-blue-800',
      approved: 'bg-purple-100 text-purple-800',
      rejected: 'bg-gray-200 text-gray-700',
      published: 'bg-green-100 text-green-800',
    } as Record<string, string>
  )[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${cls} ${className}`}>
      {status}
    </span>
  );
}

function RunStatusBadge({ status }: { status: AgentRunRow['status'] }) {
  const cls = (
    {
      started: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      partial: 'bg-amber-100 text-amber-800',
      failed: 'bg-red-100 text-red-800',
    } as Record<string, string>
  )[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}
