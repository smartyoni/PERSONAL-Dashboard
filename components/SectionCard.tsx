
import React, { useState } from 'react';
import { Section, DragState, ListItem } from '../types';
import EditableText from './EditableText';
import { LockIcon, UnlockIcon } from './Icons';
import ItemRow from './ItemRow';

interface SectionCardProps {
  section: Section;
  itemMemos: { [key: string]: string };
  onUpdateSection: (updated: Section) => void;
  onDeleteSection: (id: string) => void;
  onShowItemMemo: (id: string) => void;
  onMoveItem: (itemId: string) => void;
  onAddToCalendar?: (itemText: string) => void;
  dragState: DragState;
  setDragState: (state: DragState) => void;
  onSectionDragStart: () => void;
  onSectionDragOver: (e: React.DragEvent) => void;
  onSectionDrop: (e: React.DragEvent) => void;
  onSectionDragEnd: () => void;
  isHighlighted?: boolean;
  isInboxSection?: boolean;
  isFullHeight?: boolean;
  tabColorText?: string;
  tabColorBg?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  itemMemos,
  onUpdateSection,
  onDeleteSection,
  onShowItemMemo,
  onMoveItem,
  onAddToCalendar,
  dragState,
  setDragState,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onSectionDragEnd,
  isHighlighted = false,
  isInboxSection = false,
  isFullHeight = false,
  tabColorText = 'text-slate-800',
  tabColorBg = ''
}) => {
  const [quickAddValue, setQuickAddValue] = useState('');

  const handleTitleChange = (newTitle: string) => {
    onUpdateSection({ ...section, title: newTitle });
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedValue = quickAddValue.trim();
      if (trimmedValue === '') return;

      const newItem: ListItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: trimmedValue,
        completed: false
      };
      onUpdateSection({ ...section, items: [newItem, ...section.items] });
      setQuickAddValue('');
    }
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

  const handleDeleteItem = (itemId: string) => {
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
    if (!dragState.draggedItemId || dragState.sourceSectionId !== section.id) return;

    const draggedIdx = section.items.findIndex(i => i.id === dragState.draggedItemId);
    const targetIdx = section.items.findIndex(i => i.id === targetItemId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...section.items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    onUpdateSection({ ...section, items: newItems });
  };

  const onItemDragEnd = () => {
    setDragState({ ...dragState, draggedItemId: null, dragOverItemId: null, sourceSectionId: null });
  };

  const isDraggingSection = dragState.draggedSectionId === section.id;
  const isDragOverSection = dragState.dragOverSectionId === section.id;

  return (
    <section
      data-section-id={section.id}
      draggable
      onDragStart={onSectionDragStart}
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      onDragEnd={onSectionDragEnd}
      className={`bg-white px-4 py-4 transition-all flex flex-col ${isInboxSection || isFullHeight ? 'h-full' : 'h-[350px]'} cursor-default ${
        isHighlighted ? 'border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-300/50' :
        isDraggingSection ? 'opacity-40 border-2 border-slate-600 shadow-sm' :
        isDragOverSection ? 'border-blue-500 border-2 scale-[1.01] shadow-sm' : 'border-2 border-black shadow-sm'
      }`}
    >
      <div className={`flex items-center justify-between mb-3 gap-2 cursor-move flex-shrink-0 px-4 py-3 -mx-4 -mt-4 mb-3 border-b-2 border-black ${tabColorBg}`} title="드래그하여 순서 변경">
        <div className="flex-1 min-w-0">
          <EditableText
            value={section.title}
            onChange={handleTitleChange}
            className="text-xl font-bold text-black"
            placeholder="섹션 이름"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {!isInboxSection && (
            <button
              onClick={handleToggleLock}
              className="text-red-500 hover:text-red-700 p-0.5 rounded-full transition-colors"
              title={section.isLocked ? "섹션 잠금 해제" : "섹션 잠금"}
            >
              {section.isLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
          )}
          {!isInboxSection && (
            <button
              disabled={section.isLocked}
              onClick={() => onDeleteSection(section.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md transition-colors text-sm font-medium border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed"
              title={section.isLocked ? "잠긴 섹션은 삭제할 수 없습니다" : "섹션 삭제"}
            >
              섹션삭제
            </button>
          )}
        </div>
      </div>

      {/* 빠른 추가 입력창 */}
      <div className="mb-3 flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onKeyDown={handleQuickAdd}
          placeholder="새 항목 입력 후 Enter..."
          className="flex-1 px-3 py-2 text-sm border-2 border-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
        />
        <button
          onClick={() => {
            const trimmedValue = quickAddValue.trim();
            if (trimmedValue === '') return;

            const newItem: ListItem = {
              id: Math.random().toString(36).substr(2, 9),
              text: trimmedValue,
              completed: false
            };
            onUpdateSection({ ...section, items: [newItem, ...section.items] });
            setQuickAddValue('');
          }}
          className="px-3 py-2 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-lg transition-colors whitespace-nowrap"
          title="추가"
        >
          +
        </button>
      </div>

      <div className="space-y-0.5 overflow-y-auto overflow-x-hidden flex-1 pr-1">
        {[...section.items].sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        }).map(item => (
          <ItemRow
            key={item.id}
            item={item}
            sectionId={section.id}
            memo={itemMemos[item.id]}
            onToggle={() => handleToggleItem(item.id)}
            onUpdateText={(txt) => handleUpdateItemText(item.id, txt)}
            onDelete={() => handleDeleteItem(item.id)}
            onAddMemo={() => onShowItemMemo(item.id)}
            onMoveItem={() => onMoveItem(item.id)}
            onCopy={() => handleCopyItem(item.id)}
            onAddToCalendar={onAddToCalendar ? () => onAddToCalendar(item.text) : undefined}
            dragState={dragState}
            onDragStart={(e) => onItemDragStart(e, item.id)}
            onDragOver={(e) => onItemDragOver(e, item.id)}
            onDrop={(e) => onItemDrop(e, item.id)}
            onDragEnd={onItemDragEnd}
          />
        ))}
        {section.items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <p className="text-[11px] italic">추가된 항목이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SectionCard;
