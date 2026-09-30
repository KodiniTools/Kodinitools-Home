import type { APIRoute } from 'astro'
import { buildBlogSearchIndex, searchIndexResponse } from '../../content/blogSearchIndex'

// Statischer Volltext-Index der deutschen Blog-Artikel (siehe blogSearchIndex.ts)
export const GET: APIRoute = () => searchIndexResponse(buildBlogSearchIndex('src/pages/blog', '/blog/'))
