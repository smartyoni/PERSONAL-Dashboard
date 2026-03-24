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
