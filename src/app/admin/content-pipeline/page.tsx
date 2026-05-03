import { requireSuperAdmin } from '@/lib/authServer';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ContentPipelineClient from '@/components/admin/ContentPipelineClient';
import {
  listPendingPosts,
  listTopics,
  listAgentRuns,
  getPendingPost,
} from '@/lib/agents/contentPipeline';

// Phase 7A — admin content pipeline. Three tabs:
//   1. Pending drafts — review/edit/approve/reject queue
//   2. Topic queue — managed list of topic ideas
//   3. Agent runs — audit log of weekly cron + future agents
//
// The cron-email deep links here as ?post=<id>; if that param is present
// we open the post detail viewer pre-loaded.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Content Pipeline | Admin',
  robots: { index: false, follow: false },
};

export default async function ContentPipelinePage({
  searchParams,
}: {
  searchParams: { post?: string; tab?: string };
}) {
  await requireSuperAdmin();

  const [pendingPosts, topics, runs] = await Promise.all([
    listPendingPosts(),
    listTopics(),
    listAgentRuns(50),
  ]);

  // If the URL has ?post=<id> (from the cron email), preload the full body.
  const focusedPost = searchParams.post
    ? await getPendingPost(searchParams.post)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Content Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Review weekly drafts, manage the topic queue, and audit agent runs.
          </p>
        </header>
        <ContentPipelineClient
          pendingPosts={pendingPosts}
          topics={topics}
          runs={runs}
          focusedPost={focusedPost}
          initialTab={
            searchParams.tab === 'topics'
              ? 'topics'
              : searchParams.tab === 'runs'
              ? 'runs'
              : 'pending'
          }
        />
      </main>
      <Footer />
    </div>
  );
}
