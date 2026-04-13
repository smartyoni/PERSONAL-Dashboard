import { useState, useCallback, useEffect } from 'react';

export const useNavigationSync = () => {
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

    const navigateToItem = useCallback((itemId: string) => {
        setHighlightedItemId(itemId);

        // Find the item and its parent section for scrolling
        setTimeout(() => {
            const itemEl = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemEl) {
                // Scroll the dashboard container or the item into view
                itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If item not found directly, try to find the segment/section
                // This is a fallback in case the item is in a tab that needs switching,
                // but for now we assume it's in the current view.
                console.warn(`Item with ID ${itemId} not found in DOM`);
            }
        }, 100);

        // Clear highlight after 3 seconds
        setTimeout(() => {
            setHighlightedItemId(null);
        }, 3000);
    }, []);

    return {
        highlightedItemId,
        navigateToItem
    };
};
