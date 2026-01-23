
import React, { useState } from 'react';
import { Bookmark } from '../types';
import BookmarkEditModal from './BookmarkEditModal';

interface BookmarkBarProps {
  bookmarks: Bookmark[];
  onUpdateBookmarks: (bookmarks: Bookmark[]) => void;
}

const BookmarkBar: React.FC<BookmarkBarProps> = ({ bookmarks, onUpdateBookmarks }) => {
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const handleBookmarkClick = (url: string) => {
    if (!url) return;
    if (!url.startsWith('http')) {
      window.open(`https://${url}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  const handleRightClick = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    setEditingBookmark(bookmark);
  };

  const handleSave = (updated: Bookmark) => {
    if (!editingBookmark) return;
    const newBookmarks = bookmarks.map(b => b.id === updated.id ? updated : b);
    onUpdateBookmarks(newBookmarks);
    setEditingBookmark(null);
  };

  const getStyleColor = (colorStr: string) => {
    if (colorStr.startsWith('bg-[')) {
      return colorStr.replace('bg-[', '').replace(']', '');
    }
    return colorStr;
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 py-2.5 px-4 overflow-hidden">
      <div 
        className="grid grid-cols-5 md:grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5"
      >
        {bookmarks.slice(0, 15).map((bookmark) => (
          <div key={bookmark.id} className="relative group/btn">
            <button
              onClick={() => handleBookmarkClick(bookmark.url)}
              onContextMenu={(e) => handleRightClick(e, bookmark)}
              className={`w-full h-11 px-2 py-1 rounded-lg border border-slate-200/60 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center hover:brightness-95 hover:shadow-sm text-slate-700 overflow-hidden leading-tight`}
              style={{ backgroundColor: getStyleColor(bookmark.color) }}
            >
              <span className="line-clamp-2 text-center break-all">
                {bookmark.label || 'Empty'}
              </span>
            </button>
          </div>
        ))}
      </div>

      {editingBookmark && (
        <BookmarkEditModal
          isOpen={!!editingBookmark}
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default BookmarkBar;
