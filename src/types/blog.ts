export interface BlogFrontmatter {
  title: string;
  description: string;
  slug: string;
  author: string;
  date: string; // ISO format or YYYY-MM-DD
  updated?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  featuredImage: string;
  readingTime: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
}

export interface BlogPost {
  meta: BlogFrontmatter;
  content: string;
}
