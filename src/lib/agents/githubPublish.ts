// Phase 7A — GitHub publish flow.
//
// Takes an approved (and possibly edited) MDX body and commits it to
// `src/posts/<slug>.md` on the master branch via the GitHub Contents API.
// The commit triggers Vercel's git-deployment hook automatically; the
// post goes live as part of that deploy.
//
// Auth: GITHUB_PUBLISH_TOKEN is a fine-grained PAT with Contents: Read+Write
// scoped to the floridaweddingwonders repo. See docs/PHASE_7A_SETUP.md for
// the exact creation steps.

import { Octokit } from '@octokit/rest';

const GITHUB_OWNER = process.env.GITHUB_PUBLISH_OWNER ?? 'manicmerlin';
const GITHUB_REPO = process.env.GITHUB_PUBLISH_REPO ?? 'floridaweddingwonders';
const GITHUB_BRANCH = process.env.GITHUB_PUBLISH_BRANCH ?? 'master';

export interface PublishResult {
  ok: true;
  commitSha: string;
  commitUrl: string;
  fileUrl: string;
}

export interface PublishError {
  ok: false;
  error: string;
  status?: number;
}

export function isGithubPublishConfigured(): boolean {
  return !!process.env.GITHUB_PUBLISH_TOKEN;
}

/**
 * Commit the given MDX file to the repo at src/posts/<slug>.md.
 *
 * Uses the GitHub Contents API (PUT /repos/.../contents/...). Will refuse
 * to overwrite an existing file (returns 422 from GitHub) so a slug
 * collision can't accidentally clobber a published post — caller should
 * surface the error and prompt the user to rename.
 */
export async function publishPostToGithub(args: {
  slug: string;
  bodyMdx: string;
  commitMessage?: string;
  authorName?: string;
  authorEmail?: string;
}): Promise<PublishResult | PublishError> {
  const token = process.env.GITHUB_PUBLISH_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: 'GITHUB_PUBLISH_TOKEN not configured',
    };
  }

  const path = `src/posts/${args.slug}.md`;
  const message =
    args.commitMessage ??
    `content(blog): publish ${args.slug}\n\nApproved via /admin/content-pipeline.`;

  // Base64 encode the MDX content (GitHub Contents API requirement)
  const contentBase64 = Buffer.from(args.bodyMdx, 'utf8').toString('base64');

  const octokit = new Octokit({ auth: token });

  try {
    // First check if the file already exists. If it does, we refuse to
    // overwrite — slug collisions need a manual rename.
    try {
      await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path,
        ref: GITHUB_BRANCH,
      });
      return {
        ok: false,
        error: `A post already exists at ${path}. Rename the slug to publish.`,
        status: 409,
      };
    } catch (err: any) {
      if (err?.status !== 404) {
        // Not a "file doesn't exist" error — propagate
        throw err;
      }
      // 404 = file doesn't exist, proceed with create
    }

    const createRes = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      message,
      content: contentBase64,
      branch: GITHUB_BRANCH,
      committer: {
        name: args.authorName ?? 'Florida Wedding Wonders Bot',
        email: args.authorEmail ?? 'noreply@floridaweddingwonders.com',
      },
    });

    const sha = createRes.data.commit.sha;
    if (!sha) {
      return { ok: false, error: 'GitHub returned no commit sha' };
    }
    return {
      ok: true,
      commitSha: sha,
      commitUrl:
        createRes.data.commit.html_url ??
        `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commit/${sha}`,
      fileUrl:
        createRes.data.content?.html_url ??
        `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${path}`,
    };
  } catch (err: any) {
    console.error('publishPostToGithub failed:', err);
    return {
      ok: false,
      error: err?.message ?? String(err),
      status: err?.status,
    };
  }
}
