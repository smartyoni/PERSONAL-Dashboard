export const TITLE_SEPARATOR = '===memo-title-sep===';
export const PAGE_BREAK = '\n===page-break===\n';
export const METADATA_SEPARATOR = '\n\n---toc-metadata---\n';

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
 * Splits raw content into text and toc line indices
 */
export const splitMetadata = (raw: string): { text: string; tocLines: number[] } => {
    if (!raw) return { text: '', tocLines: [] };
    if (raw.includes(METADATA_SEPARATOR)) {
        const parts = raw.split(METADATA_SEPARATOR);
        // The last part is the metadata
        const meta = parts[parts.length - 1];
        const text = parts.slice(0, parts.length - 1).join(METADATA_SEPARATOR);
        try {
            const tocLines = JSON.parse(meta);
            return { text, tocLines: Array.isArray(tocLines) ? tocLines : [] };
        } catch (e) {
            return { text: raw, tocLines: [] };
        }
    }
    return { text: raw, tocLines: [] };
};

/**
 * Joins text and toc line indices into a single raw string
 */
export const joinMetadata = (text: string, tocLines: number[]): string => {
    if (!tocLines || tocLines.length === 0) return text;
    return `${text}${METADATA_SEPARATOR}${JSON.stringify(tocLines)}`;
};

/**
 * Extracts ToC markers from content
 */
export const extractTocMarkers = (htmlOrText: string): string[] => {
    if (!htmlOrText) return [];
    
    const { text, tocLines } = splitMetadata(htmlOrText);
    const lines = text.split('\n');

    if (tocLines.length > 0) {
        return tocLines
            .filter(idx => lines[idx] !== undefined)
            .map(idx => lines[idx].trim())
            .filter(item => item.length > 0);
    }

    return [];
};
