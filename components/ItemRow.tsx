import React, { useState, useRef } from 'react';
import { ListItem, DragState } from '../types';
import { DragHandleIcon, MenuIcon } from './Icons';
import EditableText from './EditableText';
import LinkifiedText from './LinkifiedText';
import { useClickOutside } from '../hooks/useClickOutside';
import UrlInputModal from './UrlInputModal'; // 추가

interface ItemRowProps {
  item: ListItem;
  sectionId: string;
  memo?: string;
  onToggle: () => void;
  onUpdateText: (newText: string) => void;
  onDelete: () => void;
  onAddMemo: () => void;
  onMoveItem: () => void;
  onCopy: () => void;
  onAddToCalendar?: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  isBookmark?: boolean; // 추가
  onUpdateUrl?: (newUrl: string) => void; // 추가
  onDoubleClickItem?: () => void;
  dragState: DragState;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  sectionId,
  memo,
  onToggle,
  onUpdateText,
  onDelete,
  onAddMemo,
  onMoveItem,
  onCopy,
  onAddToCalendar,
  onEditingChange,
  isBookmark = false,
  onUpdateUrl,
  onDoubleClickItem,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false); // 추가
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMobile = window.innerWidth < 768; // Tailwind md breakpoint

    if (triggerRef.current && !isMobile) {
      // 데스크톱: fixed positioning으로 절대 위치 계산
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 280; // 메뉴의 예상 높이 (6개 버튼용)
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow >= menuHeight) {
        // 아래쪽에 충분한 공간이 있으면 아래쪽에 렌더링 (메뉴의 top이 버튼의 bottom과 같음)
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right + 8
        });
      } else {
        // 공간이 부족하면 위쪽에 렌더링 (메뉴의 bottom이 버튼의 top과 같음)
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.right + 8
        });
      }
    }
    // 모바일에서는 menuPos를 업데이트하지 않음 (absolute positioning 사용)
    setShowMenu(!showMenu);
  };

  const isDragging = dragState.draggedItemId === item.id;
  const isDragOver = dragState.dragOverItemId === item.id;

  return (
    <div
      draggable={!isTextEditing}
      onDragStart={(e) => {
        if (isTextEditing) {
          e.preventDefault();
          return;
        }
        onDragStart(e);
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group flex items-start gap-1 py-2 px-1 border-b border-slate-200 last:border-0 transition-all cursor-default relative min-h-0 ${isDragging ? 'opacity-50 bg-slate-100' :
        isDragOver ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'
        }`}
    >
      {/* 1. Checkbox or Bookmark Icon */}
      {!isBookmark ? (
        <div className="h-5 flex items-center justify-center flex-shrink-0 w-5">
          <button
            onClick={(e) => { e.stopPropagation(); onAddMemo(); }}
            className="text-3xl leading-none mb-2 hover:scale-110 transition-transform focus:outline-none text-red-400 hover:text-red-500"
            title="메모 보기"
          >
            •
          </button>
        </div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center text-purple-600 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-current" />
        </div>
      )}

      {/* 2. Text Area & Memo Preview */}
      <div className="flex-1 min-w-0">
        <div
          className={`leading-snug ${isBookmark ? 'text-[15px] font-bold text-slate-800' : 'text-sm font-medium text-slate-700'} ${isBookmark ? 'cursor-pointer hover:underline decoration-cyan-400' : ''}`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClickItem?.();
          }}
          onClick={() => {
            if (isBookmark) {
              if (item.url) {
                window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
              } else {
                alert('이동할 URL이 설정되지 않았습니다. 우클릭하여 URL을 설정해 주세요!');
              }
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // 북마크 모드면 URL 입력 모달 활성화
            if (isBookmark) {
              setIsUrlModalOpen(true);
              return;
            }

            // 데스크톱 우클릭 시 메뉴 오픈 (기본 아이템)
            setMenuPos({
              top: e.clientY,
              left: e.clientX
            });
            setShowMenu(true);
          }}
        >
          <EditableText
            value={item.text}
            onChange={onUpdateText}
            onEditingChange={(isEditing) => {
              setIsTextEditing(isEditing);
              onEditingChange?.(isEditing);
            }}
            placeholder={isBookmark ? "사이트명 입력..." : "항목을 입력하세요..."}
            className={isBookmark ? "text-[15px] font-bold" : "text-sm"}
            compact
            disabled={true}
          />
        </div>
        {isBookmark && item.url && (
          <div className="text-[10px] text-cyan-500 truncate pl-1 mt-0.5 opacity-70">
            {item.url}
          </div>
        )}
        {!isBookmark && memo && memo.trim() !== item.text.trim() && (
          <div
            onClick={(e) => { e.stopPropagation(); onAddMemo(); }}
            className="text-[11px] text-green-600 truncate cursor-pointer hover:text-green-700 transition-colors mt-0.5 pl-1 font-normal opacity-90"
            title={memo}
          >
            {memo.substring(item.text.length).trim()}
          </div>
        )}
      </div>

      {/* 4. Menu Button or Delete Button */}
      <div className="relative flex-shrink-0 -mr-3 mt-[1px]">
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          className="text-slate-500 hover:text-slate-700 transition-colors p-0 rounded"
          title="메모 및 삭제 등 메뉴 열기"
        >
          <MenuIcon />
        </button>

        {showMenu && (() => {
          const isMobile = window.innerWidth < 768;
          return (
            <div
              ref={menuRef}
              className={`${isMobile ? 'absolute' : 'fixed'
                } bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1.5 w-48 animate-in fade-in ${isMobile ? 'slide-in-from-right-2' : 'slide-in-from-left-2'
                } duration-150`}
              style={{
                ...(isMobile ? {
                  right: 0,
                  top: '100%',
                  marginTop: '4px'
                } : {
                  ...(menuPos.top !== undefined && { top: `${menuPos.top}px` }),
                  ...(menuPos.bottom !== undefined && { bottom: `${menuPos.bottom}px` }),
                  left: `${menuPos.left}px`
                })
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onAddMemo(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                📝 메모 수정/추가
              </button>
              <button
                onClick={() => { onMoveItem(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                📦 이동
              </button>
              <button
                onClick={() => { onCopy(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                📋 복사
              </button>
              {onAddToCalendar && (
                <button
                  onClick={() => { onAddToCalendar(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  📅 캘린더 추가
                </button>
              )}
              <button
                onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🗑️ 삭제
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors border-t border-slate-200"
              >
                취소
              </button>
            </div>
          );
        })()}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-in zoom-in duration-200">
              <h2 className="text-lg font-bold text-slate-800 mb-2">항목을 삭제하시겠습니까?</h2>
              <p className="text-sm text-slate-600 mb-6">"<span className="font-medium line-through">{item.text}</span>"이(가) 삭제됩니다.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium border-2 border-black transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* URL Input Modal */}
      {isBookmark && (
        <UrlInputModal
          isOpen={isUrlModalOpen}
          onClose={() => setIsUrlModalOpen(false)}
          onSave={(newLabel, newUrl) => {
            // 1. 주소 보정 및 업데이트
            const formattedUrl = newUrl.trim() === '' ? '' : (newUrl.startsWith('http') ? newUrl : `https://${newUrl}`);
            onUpdateUrl?.(formattedUrl);

            // 2. 이름 업데이트
            if (newLabel.trim() !== '' && newLabel !== item.text) {
              onUpdateText(newLabel);
            }
          }}
          initialUrl={item.url || ''}
          initialLabel={item.text}
        />
      )}
    </div>
  );
};

export default ItemRow;