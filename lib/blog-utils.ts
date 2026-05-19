/**
 * Utility functions for blog content processing
 * Note: These functions use browser APIs and should only be called on the client side
 */

/**
 * Generate a slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract headings from HTML content and create table of contents
 * This function requires browser APIs (document)
 */
export function extractHeadingsFromHTML(
  html: string
): Array<{ id: string; text: string; level: number; isChild: boolean }> {
  if (typeof document === 'undefined') {
    return [];
  }

  const headings: Array<{
    id: string;
    text: string;
    level: number;
    isChild: boolean;
  }> = [];

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Find all h2, h3, h4 headings
  const headingElements = tempDiv.querySelectorAll('h2, h3, h4');

  let lastLevel = 0;

  headingElements.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1)); // h2 = 2, h3 = 3, h4 = 4
    const text = heading.textContent || '';

    // Get or create ID
    let id = heading.id;
    if (!id) {
      // Generate ID from text
      id = generateSlug(text);
      heading.id = id;
    }

    // Determine if it's a child (h3 or h4 after h2, or h4 after h3)
    const isChild =
      (level === 3 && lastLevel === 2) ||
      (level === 4 && (lastLevel === 2 || lastLevel === 3));

    headings.push({
      id,
      text,
      level,
      isChild,
    });

    lastLevel = level;
  });

  return headings;
}

/**
 * Add IDs to headings in HTML if they don't have them
 * This function requires browser APIs (document)
 */
export function addIdsToHeadings(html: string): string {
  if (typeof document === 'undefined') {
    return html;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const headings = tempDiv.querySelectorAll('h2, h3, h4');

  headings.forEach((heading) => {
    if (!heading.id) {
      const text = heading.textContent || '';
      const id = generateSlug(text);
      heading.id = id;
    }
  });

  return tempDiv.innerHTML;
}

/**
 * Calculate read time based on content
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadTime(html: string): string {
  if (typeof document === 'undefined') {
    return '5 min read';
  }

  // Remove HTML tags and get text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || '';

  // Count words
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const wordCount = words.length;

  // Calculate minutes (using 200 words per minute)
  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return `${minutes} min read`;
}

/**
 * Get plain text from HTML (for excerpt generation, etc.)
 */
export function getPlainTextFromHTML(html: string): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || '';
}
