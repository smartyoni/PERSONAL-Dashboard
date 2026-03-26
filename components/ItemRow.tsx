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
  onAddMemo: (e?: React.MouseEvent) => void;
  onTagClick?: (itemId: string, itemText: string) => void;
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
  onTagClick,
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
  const rowRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // fixed positioning으로 절대 위치 계산 (모바일/데스크톱 공통)
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 280; // 메뉴의 예상 높이
      const spaceBelow = window.innerHeight - rect.bottom;
      const isMobile = window.innerWidth < 768;

      if (spaceBelow >= menuHeight || isMobile) {
        // 아래쪽에 충분한 공간이 있거나 모바일이면: 메뉴의 top을 트리거의 bottom에 맞춤
        setMenuPos({
          top: rect.bottom + 4,
          left: isMobile ? Math.max(8, rect.right - 192) : rect.right + 4 // 192는 w-48 (12rem)
        });
      } else {
        // 공간이 부족하면: 메뉴의 bottom을 트리거의 top에 맞춤
        setMenuPos({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.right + 4
        });
      }
    }
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
      ref={rowRef}
      className={`group flex items-start gap-0 py-0 pl-0 pr-1 border-b border-blue-400/25 last:border-0 transition-all cursor-default relative min-h-[28px] ${isDragging ? 'opacity-50 bg-slate-100' :
        isDragOver ? 'bg-blue-400/10 border-l-2 border-blue-400' : 'hover:bg-black/[0.02]'
        }`}
    >
      {/* 1. Checkbox or Bookmark Icon */}
      {!isBookmark ? (
        <div className="h-5 flex items-center justify-center flex-shrink-0 w-[28px]">
          <button
            ref={triggerRef}
            onClick={toggleMenu}
            className="text-3xl leading-none mb-1.5 hover:scale-110 transition-transform focus:outline-none text-red-500/80 hover:text-red-600"
            title="메뉴 열기"
          >
            •
          </button>
        </div>
      ) : (
        <div className="w-[28px] h-5 flex items-center justify-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUrlModalOpen(true);
            }}
            className="w-2.5 h-2.5 rounded-full bg-purple-600/80 hover:scale-125 transition-transform focus:outline-none shadow-sm"
            title="북마크 수정"
          />
        </div>
      )}

      {/* 2. Text Area & Memo Preview */}
      <div className="flex-1 min-w-0 pl-3">
        <div
          className={`leading-[28px] ${isBookmark ? 'text-base font-bold text-slate-800 cursor-pointer hover:underline decoration-cyan-400' : 'text-[15px] font-medium text-slate-700 cursor-pointer hover:text-blue-600'}`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClickItem?.();
          }}
          onClick={(e) => {
            if (isBookmark) {
              if (item.url) {
                window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
              } else {
                alert('이동할 URL이 설정되지 않았습니다. 우클릭하여 URL을 설정해 주세요!');
              }
            } else {
              e.stopPropagation();
              onAddMemo(e);
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

            // 일반 아이템 우클릭 시 메뉴 오픈
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
            className={isBookmark ? "text-base font-bold" : "text-[15px]"}
            compact
            disabled={true}
          />
        </div>
      </div>

      {/* 3. Tag Button (#) */}
      {!isBookmark && onTagClick && (
        <div className="flex-shrink-0 flex items-center h-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTagClick?.(item.id, item.text);
            }}
            className="text-[14px] font-black text-purple-400 hover:text-purple-600 hover:bg-purple-50 w-6 h-6 flex items-center justify-center rounded-full transition-all"
            title="태그(섹션) 이동"
          >
            #
          </button>
        </div>
      )}

      {/* 4. Hidden Menu Logic (Triggered by Bullet) */}
      <div className="relative flex-shrink-0 -mr-3 mt-[1px]">
        {showMenu && (() => {
          const isMobile = window.innerWidth < 768;
          return (
            <div
              ref={menuRef}
              className="fixed bg-white rounded-lg shadow-xl border border-slate-200 z-[3000] py-1.5 w-48 animate-in fade-in slide-in-from-top-1 duration-150"
              style={{
                ...(menuPos.top !== undefined && { top: `${menuPos.top}px` }),
                ...(menuPos.bottom !== undefined && { bottom: `${menuPos.bottom}px` }),
                left: `${menuPos.left}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
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

        {/* Contextual Delete Confirmation Popover */}
        {showDeleteConfirm && (() => {
          const isMobile = window.innerWidth < 768;
          return (
            <div
              ref={menuRef}
              className="fixed bg-white rounded-xl shadow-2xl border-2 border-black z-[3000] p-4 w-52 animate-in zoom-in-95 duration-200"
              style={{
                ...(menuPos.top !== undefined && { top: `${menuPos.top}px` }),
                ...(menuPos.bottom !== undefined && { bottom: `${menuPos.bottom}px` }),
                left: `${menuPos.left}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[13px] font-bold text-slate-800 mb-3 leading-tight">
                {isBookmark ? '북마크를 삭제하시겠습니까?' : '항목을 삭제하시겠습니까?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 text-[11px] font-bold border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-1.5 text-[11px] font-bold bg-red-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })()}
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