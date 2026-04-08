
import React, { useState, useEffect, useRef } from 'react';
import { Section, DragState, ListItem } from '../types';
import EditableText from './EditableText';
import LinkifiedText from './LinkifiedText';
import { LockIcon, UnlockIcon } from './Icons';
import ItemRow from './ItemRow';
import { parseMemoPages } from '../utils/memoEditorUtils';
import { useClickOutside } from '../hooks/useClickOutside';

interface SectionCardProps {
  section: Section;
  itemMemos: { [key: string]: string };
  onUpdateSection: (updated: Section, newMemos?: { [key: string]: string }) => void;
  onDeleteSection: (id: string) => void;
  onShowItemMemo: (id: string, initialValue?: string) => void;
  onMoveItem: (itemId: string) => void;
  onAddToCalendar?: (itemText: string) => void;
  dragState: DragState;
  setDragState: (state: DragState) => void;
  onSectionDragStart: () => void;
  onSectionDragOver: (e: React.DragEvent) => void;
  onSectionDrop: (e: React.DragEvent) => void;
  onSectionDragEnd: () => void;
  isHighlighted?: boolean;
  highlightedItemId?: string | null;
  isInboxSection?: boolean;
  isFullHeight?: boolean;
  tabColorText?: string;
  tabColorBg?: string;
  initialQuickAddValue?: string;
  onQuickAddValuePopulated?: () => void;
  onCrossSectionDrop?: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, targetItemId?: string | null) => void;
  onGoToInbox?: () => void;
  onReturnFromInbox?: () => void;
  isReturnVisible?: boolean;
  isBookmarkTab?: boolean;
  onItemDoubleClick?: (itemId: string) => void;
  onItemTagClick?: (itemId: string, itemText: string) => void;
  autoFocusQuickAdd?: boolean;
  onClearFocus?: () => void;
  isMobileLayout?: boolean;
  onOpenItemMemoAtPage?: (itemId: string, pageIndex: number, highlightText?: string) => void;
  bgIndex?: number;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  itemMemos,
  onUpdateSection,
  onDeleteSection,
  onShowItemMemo,
  onAddToCalendar,
  dragState,
  setDragState,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onSectionDragEnd,
  isHighlighted = false,
  highlightedItemId = null,
  isInboxSection = false,
  isFullHeight = false,
  tabColorText = 'text-slate-800',
  tabColorBg = '',
  initialQuickAddValue,
  onQuickAddValuePopulated,
  onCrossSectionDrop,
  onGoToInbox,
  onReturnFromInbox,
  isReturnVisible = false,
  isBookmarkTab = false,
  onItemDoubleClick,
  onItemTagClick,
  autoFocusQuickAdd,
  onClearFocus,
  isMobileLayout = false,
  onOpenItemMemoAtPage,
  bgIndex = 0,
}) => {
  const [quickAddValue, setQuickAddValue] = useState('');
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [editingItemIds, setEditingItemIds] = useState<Set<string>>(new Set());
  const [isInboxEditing, setIsInboxEditing] = useState(false);
  const [inboxDraftText, setInboxDraftText] = useState('');
  const quickInputRef = useRef<HTMLTextAreaElement>(null);
  const inboxInputRef = useRef<HTMLTextAreaElement>(null);

  const LINE_HEIGHT = 20;
  const MAX_LINES = 3;

  const handleItemEditingChange = (itemId: string, isEditing: boolean) => {
    setEditingItemIds(prev => {
      const newSet = new Set(prev);
      if (isEditing) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (autoFocusQuickAdd && quickInputRef.current) {
      quickInputRef.current.focus();
      onClearFocus?.();
    }
  }, [autoFocusQuickAdd, onClearFocus]);

  // Populate quick input when shared text is received
  useEffect(() => {
    if (initialQuickAddValue && initialQuickAddValue.trim() !== '') {
      setQuickAddValue(initialQuickAddValue);
      onQuickAddValuePopulated?.();

      // Focus and select text after scroll animation completes
      setTimeout(() => {
        quickInputRef.current?.focus();
        quickInputRef.current?.select();
      }, 400);
    }
  }, [initialQuickAddValue, onQuickAddValuePopulated]);

  // Sync inboxDraftText with section items
  useEffect(() => {
    if (isInboxSection && !isInboxEditing) {
      const text = section.items.map(i => i.text).join('\n');
      setInboxDraftText(text);
    }
  }, [section.items, isInboxSection, isInboxEditing]);

  const handleTitleChange = (newTitle: string) => {
    onUpdateSection({ ...section, title: newTitle });
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedValue = quickAddValue.trim();
      if (trimmedValue === '') return;

      // Smart Parsing Logic
      const lines = trimmedValue.split('\n');
      const firstLine = lines[0].trim();
      const itemId = Math.random().toString(36).substr(2, 9);
      const newItem: ListItem = {
        id: itemId,
        text: trimmedValue,
        completed: false
      };

      onUpdateSection({ ...section, items: [newItem, ...section.items] });
      setQuickAddValue('');
      if (quickInputRef.current) {
        quickInputRef.current.style.height = 'auto';
      }
      onShowItemMemo(itemId, "");
    }
  };

  const handleQuickAddChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuickAddValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_LINES + 16; // padding 포함
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      completed: false
    };
    onUpdateSection({ ...section, items: [newItem, ...section.items] });
  };

  const handleClearSection = () => {
    const clearedItems = section.items.map(item => ({ ...item, completed: false }));
    onUpdateSection({ ...section, items: clearedItems });
  };

  const handleToggleLock = () => {
    onUpdateSection({ ...section, isLocked: !section.isLocked });
  };

  const handleTogglePin = () => {
    onUpdateSection({ ...section, isPinned: !section.isPinned });
  };

  const handleToggleItem = (itemId: string) => {
    const newItems = section.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateSection({ ...section, items: newItems });
  };

  const handleUpdateItemText = (itemId: string, newText: string) => {
    const newItems = section.items.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    );
    onUpdateSection({ ...section, items: newItems });
  };

  const handleUpdateItemUrl = (itemId: string, newUrl: string) => {
    const newItems = section.items.map(item =>
      item.id === itemId ? { ...item, url: newUrl } : item
    );
    onUpdateSection({ ...section, items: newItems });
  };

  const handleToggleItemLock = (itemId: string) => {
    const newItems = section.items.map(item =>
      item.id === itemId ? { ...item, isLocked: !item.isLocked } : item
    );
    onUpdateSection({ ...section, items: newItems });
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = section.items.find(i => i.id === itemId);
    if (itemToDelete?.isLocked) {
      alert('잠겨있는 항목은 삭제할 수 없습니다. 잠금을 해제해 주세요.');
      return;
    }
    const newItems = section.items.filter(item => item.id !== itemId);
    onUpdateSection({ ...section, items: newItems });
  };

  const handleCopyItem = (itemId: string) => {
    const itemToCopy = section.items.find(item => item.id === itemId);
    if (!itemToCopy) return;

    navigator.clipboard.writeText(itemToCopy.text).then(() => {
      console.log('클립보드에 복사됨:', itemToCopy.text);
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
  };

  const handleInboxSave = () => {
    const trimmed = inboxDraftText.trim();
    const itemId = section.items[0]?.id || Math.random().toString(36).substr(2, 9);
    const newItem: ListItem = {
      id: itemId,
      text: trimmed,
      completed: false
    };
    onUpdateSection({ ...section, items: [newItem] });
    setIsInboxEditing(false);
  };

  const hasCompletedItems = section.items.some(item => item.completed);

  // Item Drag Handlers
  const onItemDragStart = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation(); // 섹션 드래그 방지
    setDragState({ ...dragState, draggedItemId: itemId, sourceSectionId: section.id });
  };

  const onItemDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (dragState.dragOverItemId !== itemId) {
      setDragState({ ...dragState, dragOverItemId: itemId });
    }
  };

  const onItemDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState.draggedItemId) return;

    // 섹션 간 이동 (Cross-section)
    if (dragState.sourceSectionId !== section.id) {
      onCrossSectionDrop?.(dragState.draggedItemId, dragState.sourceSectionId!, section.id, targetItemId);
      setDragState({ ...dragState, draggedItemId: null, dragOverItemId: null, sourceSectionId: null });
      return;
    }

    // 같은 섹션 내 재정렬
    const draggedIdx = section.items.findIndex(i => i.id === dragState.draggedItemId);
    const targetIdx = section.items.findIndex(i => i.id === targetItemId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...section.items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    onUpdateSection({ ...section, items: newItems });
  };

  // 빈 섹션 영역으로 드롭 (아이템 위가 아닌 섹션 자체로)
  const onEmptyAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState.draggedItemId || !dragState.sourceSectionId) return;
    if (dragState.sourceSectionId === section.id) return;
    onCrossSectionDrop?.(dragState.draggedItemId, dragState.sourceSectionId, section.id, null);
    setDragState({ ...dragState, draggedItemId: null, dragOverItemId: null, sourceSectionId: null });
  };

  const onEmptyAreaDragOver = (e: React.DragEvent) => {
    if (dragState.draggedItemId && dragState.sourceSectionId !== section.id) {
      e.preventDefault();
    }
  };

  const onItemDragEnd = () => {
    setDragState({ ...dragState, draggedItemId: null, dragOverItemId: null, sourceSectionId: null });
  };

  const isDraggingSection = dragState.draggedSectionId === section.id;
  const isDragOverSection = dragState.dragOverSectionId === section.id;

  return (
    <>
      <section
      data-section-id={section.id}
      draggable={!isTitleEditing && editingItemIds.size === 0}
      onDragStart={(e) => {
        // 입력 필드나 텍스트 영역에서 드래그 시작 시 섹션 드래그 방지
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (editingItemIds.size > 0) {
          e.preventDefault();
          return;
        }
        onSectionDragStart();
      }}
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      onDragEnd={onSectionDragEnd}
      className={`bg-white px-2 py-2 transition-all flex flex-col cursor-default rounded-2xl overflow-hidden h-full ${isHighlighted ? 'border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-300/50' :
        isDraggingSection ? 'opacity-40 border-2 border-slate-600 shadow-sm' :
          isDragOverSection ? 'border-blue-500 border-2 scale-[1.01] shadow-sm' : 'border-2 border-black shadow-sm'
        }`}
    >
      <div className={`flex items-center justify-between gap-2 cursor-move flex-shrink-0 pl-2 pr-1 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black ${tabColorBg}`} title="드래그하여 순서 변경">
        <div className="flex-1 min-w-0">
          <EditableText
            value={section.title}
            onChange={handleTitleChange}
            onEditingChange={setIsTitleEditing}
            className={`text-sm font-bold ${isInboxSection ? 'text-emerald-800' : 'text-black'}`}
            placeholder="섹션 이름"
          />
        </div>

        <div className="flex items-center border-[1.5px] border-black rounded-md overflow-hidden bg-white/50 backdrop-blur-sm self-center">
          {isInboxSection && (
            <>
              {isReturnVisible && (
                <button
                  onClick={onReturnFromInbox}
                  className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 hover:bg-slate-200/50 transition-all active:scale-95 text-xs md:text-sm"
                  title="이전 섹션으로 되돌아가기"
                >
                  ↩️
                </button>
              )}
              <button
                onClick={handleTogglePin}
                className={`flex items-center justify-center px-1 md:px-1.5 h-6 md:h-7 border-l-[1.5px] border-black transition-all active:scale-95 text-[10px] font-bold ${section.isPinned ? 'bg-blue-500 text-white' : 'hover:bg-slate-200/50 text-blue-600'}`}
                title={section.isPinned ? "고정 해제" : "모바일 하단 고정"}
              >
                {section.isPinned ? '고정됨' : '고정'}
              </button>
            </>
          )}

          {!isInboxSection && (
            <>
              <button
                onClick={onGoToInbox}
                className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 hover:bg-slate-200/50 transition-all active:scale-95 text-xs md:text-sm"
                title="인박스로 바로가기"
              >
                📥
              </button>
              <button
                onClick={handleTogglePin}
                className={`flex items-center justify-center px-1 md:px-1.5 h-6 md:h-7 border-l-[1.5px] border-black transition-all active:scale-95 text-[10px] font-bold ${section.isPinned ? 'bg-blue-500 text-white' : 'hover:bg-slate-200/50 text-blue-600'}`}
                title={section.isPinned ? "고정 해제" : "모바일 하단 고정"}
              >
                {section.isPinned ? '고정됨' : '고정'}
              </button>
              <button
                onClick={handleToggleLock}
                className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 border-l-[1.5px] border-black hover:bg-slate-200/50 transition-all active:scale-95 text-red-500 scale-75"
                title={section.isLocked ? "섹션 잠금 해제" : "섹션 잠금"}
              >
                {section.isLocked ? <LockIcon /> : <UnlockIcon />}
              </button>
              <button
                disabled={section.isLocked}
                onClick={() => onDeleteSection(section.id)}
                className="flex items-center justify-center px-1 md:px-1.5 h-6 md:h-7 border-l-[1.5px] border-black hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold text-red-600 whitespace-nowrap"
                title={section.isLocked ? "잠긴 섹션은 삭제할 수 없습니다" : "섹션 삭제"}
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 빠른 추가 입력창 (인박스 제외) */}
      {!isInboxSection && (
        <div className="mb-2 flex-shrink-0 flex items-stretch gap-0 -mx-1.5">
          <textarea
            ref={quickInputRef}
            value={quickAddValue}
            onChange={handleQuickAddChange}
            onKeyDown={handleQuickAdd}
            rows={1}
            className="flex-1 px-3 py-2 text-sm border-2 border-black border-r-0 rounded-l-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all resize-none overflow-hidden leading-5"
            style={{ minHeight: isMobileLayout ? '42px' : '36px' }}
          />
          <button
            onClick={() => {
              const trimmedValue = quickAddValue.trim();
              const itemId = Math.random().toString(36).substr(2, 9);
              const newItem: ListItem = {
                id: itemId,
                text: trimmedValue,
                completed: false
              };

              onUpdateSection({ ...section, items: [newItem, ...section.items] });
              setQuickAddValue('');
              if (quickInputRef.current) {
                quickInputRef.current.style.height = 'auto';
              }
              // 즉시 빈 메모 모달 오픈
              onShowItemMemo(itemId, "");
            }}
            className="px-3 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black border-l-0 rounded-r-lg transition-colors whitespace-nowrap flex flex-col items-center justify-center"
            title="추가"
          >
            +
          </button>
        </div>
      )}

      <div
        className={`relative overflow-y-auto custom-scrollbar overflow-x-hidden pr-0 transition-colors flex-1 ${dragState.draggedItemId && dragState.sourceSectionId !== section.id ? 'bg-blue-50/60' : ''}`}
        style={{
          backgroundColor: isInboxSection ? '#ecfdf5' : (bgIndex % 2 === 0 ? '#fffbeb' : '#f0fdf4'),
          backgroundImage: isInboxSection ? 'none' : `
            linear-gradient(90deg, transparent 28px, rgba(239, 68, 68, 0.4) 28px, rgba(239, 68, 68, 0.4) 29px, transparent 29px)
          `,
          backgroundSize: '100% 100%',
          backgroundAttachment: 'local'
        }}
        onDragOver={onEmptyAreaDragOver}
        onDrop={onEmptyAreaDrop}
        onDoubleClick={() => {
          if (isInboxSection && !isInboxEditing) {
            setIsInboxEditing(true);
            setTimeout(() => inboxInputRef.current?.focus(), 50);
          }
        }}
      >
        {isInboxSection ? (
          <div className="h-full p-4 font-serif">
            {isInboxEditing ? (
              <div className="relative w-full h-full text-[15px] leading-[1.5]">
                {/* Mirror Layer for real-time formatting feedback */}
                <div 
                  className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-hidden"
                  aria-hidden="true"
                  style={{ padding: '0px' }}
                >
                  {(inboxDraftText || '').split('\n').map((line, idx) => {
                    const isBullet = line.trim().startsWith('●') || line.trim().startsWith('•');
                    const isHeader = line.trim().startsWith('#');
                    return (
                      <div 
                        key={idx} 
                        className={`min-h-[1.5em] ${isHeader ? 'font-black text-emerald-950/40' : isBullet ? 'font-bold text-emerald-950' : ''}`}
                      >
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
                <textarea
                  ref={inboxInputRef}
                  value={inboxDraftText}
                  onChange={(e) => setInboxDraftText(e.target.value)}
                  onBlur={handleInboxSave}
                  className="absolute inset-0 w-full h-full bg-transparent border-none focus:outline-none resize-none text-emerald-900/90 caret-emerald-600 z-10 font-serif text-[15px] leading-[1.5] p-0 m-0 overflow-y-auto custom-scrollbar"
                  placeholder="내용을 입력하세요 (더블클릭으로 편집)..."
                  onKeyDown={(e) => {
                    // Hyphen + Space shortcut for bullet (•)
                    if (e.key === ' ' && !e.nativeEvent.isComposing) {
                        const textarea = e.currentTarget;
                        const start = textarea.selectionStart;
                        const value = textarea.value;
                        const lastNewLine = value.lastIndexOf('\n', start - 1);
                        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
                        const currentLinePrefix = value.substring(lineStart, start);
                        
                        if (currentLinePrefix === '-') {
                            e.preventDefault();
                            const newValue = value.substring(0, start - 1) + '• ' + value.substring(start);
                            setInboxDraftText(newValue);
                            requestAnimationFrame(() => {
                                textarea.selectionStart = textarea.selectionEnd = start + 1;
                            });
                        }
                    }
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-full h-full cursor-text overflow-x-hidden"
                title="더블클릭하여 편집"
              >
                {section.items.length > 0 ? (
                  <LinkifiedText 
                    text={section.items.map(i => i.text).join('\n')} 
                    textColorClass="text-emerald-900"
                    className="leading-relaxed font-serif text-[15px]"
                  />
                ) : (
                  <p className="text-emerald-300 italic font-serif">내용이 없습니다. 더블클릭하여 작성하세요.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Red line is now in the background gradient above for better performance and consistency */}
            
            {[...section.items].sort((a, b) => {
              if (a.completed === b.completed) return 0;
              return a.completed ? 1 : -1;
            }).map(item => (
              <div
                key={item.id}
                className="relative"
              >
                <ItemRow
                  item={item}
                  sectionId={section.id}
                  highlightedItemId={highlightedItemId}
                  memo={itemMemos[item.id]}
                  onToggle={() => handleToggleItem(item.id)}
                  onUpdateText={(txt) => handleUpdateItemText(item.id, txt)}
                  onDelete={() => handleDeleteItem(item.id)}
                  onAddMemo={() => onShowItemMemo(item.id)}
                  onCopy={() => handleCopyItem(item.id)}
                  onAddToCalendar={onAddToCalendar ? () => onAddToCalendar(item.text) : undefined}
                  onEditingChange={(isEditing) => handleItemEditingChange(item.id, isEditing)}
                  onToggleLock={() => handleToggleItemLock(item.id)}
                  isBookmark={isBookmarkTab}
                  onUpdateUrl={(url) => handleUpdateItemUrl(item.id, url)}
                  dragState={dragState}
                  onDragStart={(e) => onItemDragStart(e, item.id)}
                  onDragOver={(e) => onItemDragOver(e, item.id)}
                  onDrop={(e) => onItemDrop(e, item.id)}
                  onDragEnd={onItemDragEnd}
                  onDoubleClickItem={() => onItemDoubleClick?.(item.id)}
                  onTagClick={() => onItemTagClick?.(item.id, item.text)}
                />
              </div>
            ))}
            {section.items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                <p className="text-[11px] italic">추가된 항목이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>

    </>
  );
};

export default SectionCard;
