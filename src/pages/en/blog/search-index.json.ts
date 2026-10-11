import type { APIRoute } from 'astro';
import { buildBlogSearchIndex, searchIndexResponse } from '../../../content/blogSearchIndex';

// Static full-text index of the English blog articles (see blogSearchIndex.ts)
export const GET: APIRoute = async () => searchIndexResponse(await buildBlogSearchIndex('en'));
