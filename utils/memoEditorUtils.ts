export const TITLE_SEPARATOR = '===memo-title-sep===';
export const PAGE_BREAK = '\n===page-break===\n';

/**
 * Parses a raw memo string into allTitles and allValues arrays
 */
export const parseMemoPages = (raw: string): { allTitles: string[]; allValues: string[] } => {
  if (!raw) return { allTitles: [''], allValues: [''] };
  const pages = raw.split(PAGE_BREAK);
  const allTitles: string[] = [];
  const allValues: string[] = [];
  for (const pageText of pages) {
    if (pageText.includes(TITLE_SEPARATOR)) {
      const parts = pageText.split(TITLE_SEPARATOR);
      allTitles.push(parts[0]);
      allValues.push(parts.slice(1).join(TITLE_SEPARATOR));
    } else {
      allTitles.push('');
      allValues.push(pageText);
    }
  }
  return { allTitles, allValues };
};

export const contentToHtml = (text: string): string => {
    if (!text) return '';
    
    // If it already looks like HTML (contains tags), return it
    if (/<[a-z][\s\S]*>/i.test(text)) {
        return text;
    }

    // Legacy support: convert plain text to HTML
    return text
        .split('\n')
        .map(line => {
            if (line.trim() === '---divider---') {
                return '<hr class="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" contenteditable="false" data-type="divider">';
            }
            return line;
        })
        .join('<br>');
};

/**
 * Converts contentEditable HTML back to stored memo string
 */
export const htmlToContent = (html: string): string => {
    if (!html) return '';
    return html; // Return full HTML to preserve rich text formatting
};

/**
 * Extracts ToC markers (#) from HTML or plain text
 */
export const extractTocMarkers = (html: string): string[] => {
    if (!html) return [];
    
    // Legacy support: if it's not HTML, check plain text
    if (!/<[a-z][\s\S]*>/i.test(html)) {
        return html.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('#') || line.startsWith('※'))
            .map(line => line.substring(1).trim());
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Only target block-level content elements, avoid generic containers like div
        const elements = doc.querySelectorAll('p, h1, h2, h3, li');
        const items: string[] = [];
        
        elements.forEach(el => {
            const text = el.textContent?.trim() || '';
            if (text.startsWith('#') || text.startsWith('※')) {
                const subText = text.substring(1).trim();
                // De-duplicate by content to avoid issues with potential nested tags
                if (subText && !items.includes(subText)) {
                    items.push(subText);
                }
            }
        });
        return items;
    } catch (e) {
        console.error('ToC parsing error:', e);
        return [];
    }
};
