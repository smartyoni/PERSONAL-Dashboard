/**
 * Converts stored memo string to HTML for contentEditable
 */
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
            .filter(line => line.startsWith('#'))
            .map(line => line.substring(1).trim());
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Get all potential text blocks
        const elements = doc.querySelectorAll('p, h1, h2, h3, li, div');
        const items: string[] = [];
        
        elements.forEach(el => {
            // Only process elements that are direct children of body or a main container
            // to avoid duplicates from nested structures
            if (el.parentElement?.tagName !== 'BODY' && el.parentElement?.tagName !== 'DIV') {
                // Allow li even if nested in ul
                if (el.tagName !== 'LI') return;
            }

            const text = el.textContent?.trim() || '';
            if (text.startsWith('#')) {
                const subText = text.substring(1).trim();
                // Avoid adding the same text multiple times (e.g. from parent/child relationship)
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
