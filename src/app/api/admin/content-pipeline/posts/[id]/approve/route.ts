import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/authServer';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { publishPostToGithub, isGithubPublishConfigured } from '@/lib/agents/githubPublish';

// POST /api/admin/content-pipeline/posts/[id]/approve
//
// Atomic approve + publish flow:
//   1. Verify the row is still in a pending/edited state
//   2. Commit the (possibly edited) MDX to GitHub at src/posts/<slug>.md
//   3. Mark the row as 'published' with the commit SHA recorded
//   4. Mark the source topic as 'used' so it's not picked again
// GitHub commit on master triggers Vercel auto-deploy → post goes live.

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAppSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isGithubPublishConfigured()) {
    return NextResponse.json(
      {
        error:
          'GITHUB_PUBLISH_TOKEN not configured. Add the env var in Vercel before approving posts.',
      },
      { status: 503 }
    );
  }

  const { id } = await ctx.params;
  const admin = createSupabaseAdminClient();

  // Load the post; refuse if it's already published or rejected
  const { data: post, error: getErr } = await admin
    .from('pending_posts')
    .select('id, slug, body_mdx, status, topic_id')
    .eq('id', id)
    .maybeSingle();
  if (getErr || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  if (!['pending', 'edited', 'approved'].includes(post.status)) {
    return NextResponse.json(
      { error: `Cannot approve a post in status '${post.status}'` },
      { status: 409 }
    );
  }

  // Publish to GitHub
  const result = await publishPostToGithub({
    slug: post.slug,
    bodyMdx: post.body_mdx,
    commitMessage: `content(blog): publish ${post.slug}\n\nApproved via /admin/content-pipeline by ${session.user.email}.`,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  // Mark published
  const now = new Date().toISOString();
  await admin
    .from('pending_posts')
    .update({
      status: 'published',
      reviewed_at: now,
      reviewed_by: session.user.id,
      published_at: now,
      github_commit_sha: result.commitSha,
    })
    .eq('id', id);

  // Mark the source topic as used (if any)
  if (post.topic_id) {
    await admin
      .from('blog_topic_queue')
      .update({ status: 'used' })
      .eq('id', post.topic_id);
  }

  return NextResponse.json({
    success: true,
    commitSha: result.commitSha,
    commitUrl: result.commitUrl,
    fileUrl: result.fileUrl,
  });
}
