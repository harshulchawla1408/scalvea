import { useEffect, useState } from "react";
import slugify from "slugify";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract headings from markdown
    const headingLines = content.split('\n').filter(line => line.match(/^#{2,3}\s/));
    const extractedHeadings = headingLines.map(line => {
      const level = line.startsWith('###') ? 3 : 2;
      const text = line.replace(/^#{2,3}\s/, '').trim();
      return {
        id: slugify(text, { lower: true, strict: true }),
        text,
        level
      };
    });
    setHeadings(extractedHeadings);

    // Setup intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    setTimeout(() => {
      extractedHeadings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) observer.observe(el);
      });
    }, 500);

    return () => observer.disconnect();
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 hidden lg:block border border-neutral-100 rounded-2xl p-6 bg-[#F9F9F7]">
      <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-900 mb-4">
        Table of Contents
      </h4>
      <nav className="flex flex-col gap-3 relative">
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-neutral-200" />
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
              setActiveId(heading.id);
            }}
            className={`text-xs transition-all relative pl-4 ${
              activeId === heading.id 
                ? "text-black font-medium" 
                : "text-neutral-500 hover:text-neutral-900"
            } ${heading.level === 3 ? "ml-3" : ""}`}
          >
            {activeId === heading.id && (
              <span className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-black rounded-r" />
            )}
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
};
