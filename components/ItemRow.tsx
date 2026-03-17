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
  const [previewPos, setPreviewPos] = useState<'top' | 'bottom'>('bottom');
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
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
        // 아래쪽에 충분한 공간이 있으면: 메뉴의 top을 불렛의 top에 맞춤
        setMenuPos({
          top: rect.top,
          left: rect.right + 4
        });
      } else {
        // 공간이 부족하면: 메뉴의 bottom을 불렛의 bottom에 맞춤 (우측 위로 올라가는 형태)
        setMenuPos({
          bottom: window.innerHeight - rect.bottom,
          left: rect.right + 4
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
      ref={rowRef}
      onMouseEnter={() => {
        if (rowRef.current) {
          const rect = rowRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          // 하단 40% 영역에 있으면 위로 표시
          if (rect.bottom > windowHeight * 0.6) {
            setPreviewPos('top');
          } else {
            setPreviewPos('bottom');
          }
        }
      }}
      className={`group flex items-start gap-1 py-1.5 px-1 border-b border-slate-200 last:border-0 transition-all cursor-default relative min-h-0 ${isDragging ? 'opacity-50 bg-slate-100' :
        isDragOver ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'
        }`}
    >
      {/* 1. Checkbox or Bookmark Icon */}
      {!isBookmark ? (
        <div className="h-5 flex items-center justify-center flex-shrink-0 w-5">
          <button
            ref={triggerRef}
            onClick={toggleMenu}
            className="text-3xl leading-none mb-2 hover:scale-110 transition-transform focus:outline-none text-red-400 hover:text-red-500"
            title="메뉴 열기"
          >
            •
          </button>
        </div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUrlModalOpen(true);
            }}
            className="w-3 h-3 rounded-full bg-purple-600 hover:scale-125 transition-transform focus:outline-none shadow-sm"
            title="북마크 수정"
          />
        </div>
      )}

      {/* 2. Text Area & Memo Preview */}
      <div className="flex-1 min-w-0">
        <div
          className={`leading-snug ${isBookmark ? 'text-base font-bold text-slate-800 cursor-pointer hover:underline decoration-cyan-400' : 'text-[15px] font-medium text-slate-700 cursor-pointer hover:text-blue-600'}`}
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
              onAddMemo();
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

          {/* 메모 미리보기 (사각 테두리, 작은 글씨) */}
          {!isBookmark && memo && !isTextEditing && (
            <div className={`hidden group-hover:block absolute right-0 ${previewPos === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} z-50 bg-white border-[1.5px] border-slate-300 rounded shadow-lg p-2 max-w-xs w-64 animate-in fade-in zoom-in duration-150`}>
              <p className="text-[11px] leading-tight text-slate-600 whitespace-pre-wrap">
                {memo.length > 200 ? memo.substring(0, 200) + '...' : memo}
              </p>
            </div>
          )}
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