import { BlogPost, BlogFrontmatter } from "@/types/blog";

// Import all mdx files as raw strings
const mdxModules = import.meta.glob('/src/content/blogs/*.{md,mdx}', { query: '?raw', import: 'default', eager: true });

function parseFrontmatter(fileContent: string) {
  const match = fileContent.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return { data: {}, content: fileContent };
  
  const yamlContent = match[1];
  const content = fileContent.slice(match[0].length).trim();
  
  const data: Record<string, any> = {};
  const lines = yamlContent.split('\n');
  
  for (const line of lines) {
    const splitIndex = line.indexOf(':');
    if (splitIndex === -1) continue;
    
    const key = line.slice(0, splitIndex).trim();
    let value = line.slice(splitIndex + 1).trim();
    
    // Parse array like ["tag1", "tag2"] or [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      data[key] = arrayContent.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    
    // Remove wrapping quotes
    value = value.replace(/^['"]|['"]$/g, '');
    
    // Parse boolean
    if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else {
      data[key] = value;
    }
  }
  
  return { data, content };
}

export function getAllBlogs(): BlogPost[] {
  const blogs: BlogPost[] = [];
  
  for (const path in mdxModules) {
    const fileContent = mdxModules[path] as string;
    const { data, content } = parseFrontmatter(fileContent);
    
    // Default fallback if some fields are missing
    const meta: BlogFrontmatter = {
      title: data.title || "Untitled Blog",
      description: data.description || "",
      slug: data.slug || path.split('/').pop()?.replace(/\.mdx?$/, '') || "",
      author: data.author || "Scalvea Editorial",
      date: data.date || new Date().toISOString(),
      updated: data.updated,
      category: data.category || "General",
      tags: data.tags || [],
      featured: data.featured || false,
      featuredImage: data.featuredImage || "/placeholder.svg",
      readingTime: data.readingTime || "5 min read",
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      focusKeyword: data.focusKeyword
    };
    
    blogs.push({ meta, content });
  }

  // Sort by date descending
  return blogs.sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
  const blogs = getAllBlogs();
  return blogs.find((b) => b.meta.slug === slug);
}

export function getCategories(): string[] {
  const blogs = getAllBlogs();
  const categories = new Set(blogs.map((b) => b.meta.category));
  return Array.from(categories).sort();
}

export function getRelatedBlogs(slug: string, category: string, limit: number = 3): BlogPost[] {
  const blogs = getAllBlogs();
  return blogs
    .filter((b) => b.meta.slug !== slug && b.meta.category === category)
    .slice(0, limit);
}
