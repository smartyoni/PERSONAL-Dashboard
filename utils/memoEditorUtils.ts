/**
 * Converts stored memo string to HTML for contentEditable
 */
export const contentToHtml = (text: string): string => {
    if (!text) return '';
    
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
    
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    let result = '';
    
    const traverse = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName;

            if (tagName === 'HR' && el.getAttribute('data-type') === 'divider') {
                if (result.length > 0 && !result.endsWith('\n')) result += '\n';
                result += '---divider---\n';
            } else if (tagName === 'BR') {
                result += '\n';
            } else if (tagName === 'DIV' || tagName === 'P') {
                const hasContentBefore = result.length > 0 && !result.endsWith('\n');
                if (hasContentBefore) result += '\n';
                
                Array.from(node.childNodes).forEach(traverse);
                
                if (!result.endsWith('\n')) result += '\n';
            } else {
                Array.from(node.childNodes).forEach(traverse);
            }
        }
    };
    
    Array.from(temp.childNodes).forEach(traverse);
    
    // Clean up excessive newlines
    return result
        .replace(/\n\n\n+/g, '\n\n')
        .trim();
};
