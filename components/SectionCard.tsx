
import React from 'react';
import { Section, DragState } from '../types';
import EditableText from './EditableText';
import { ResetIcon, LockIcon, UnlockIcon } from './Icons';
import ItemRow from './ItemRow';

interface SectionCardProps {
  section: Section;
  itemMemos: { [key: string]: string };
  onUpdateSection: (updated: Section) => void;
  onDeleteSection: (id: string) => void;
  onShowItemMemo: (id: string) => void;
  onMoveItem: (itemId: string) => void;
  dragState: DragState;
  setDragState: (state: DragState) => void;
  onSectionDragStart: () => void;
  onSectionDragOver: (e: React.DragEvent) => void;
  onSectionDrop: (e: React.DragEvent) => void;
  onSectionDragEnd: () => void;
  isHighlighted?: boolean;
  isInboxSection?: boolean;
  tabColorText?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  itemMemos,
  onUpdateSection,
  onDeleteSection,
  onShowItemMemo,
  onMoveItem,
  dragState,
  setDragState,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onSectionDragEnd,
  isHighlighted = false,
  isInboxSection = false,
  tabColorText = 'text-slate-800'
}) => {
  const handleTitleChange = (newTitle: string) => {
    onUpdateSection({ ...section, title: newTitle });
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
      className={`bg-white px-4 py-4 rounded-2xl transition-all flex flex-col ${isInboxSection ? 'h-full' : 'h-[350px]'} cursor-default ${
        isHighlighted ? 'border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-300/50' :
        isDraggingSection ? 'opacity-40 border-2 border-slate-600 shadow-sm' :
        isDragOverSection ? 'border-blue-500 border-2 scale-[1.01] shadow-sm' : 'border-2 border-black shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2 cursor-move flex-shrink-0" title="드래그하여 순서 변경">
        <div className="flex-1 min-w-0">
          <EditableText
            value={section.title}
            onChange={handleTitleChange}
            className={`text-sm font-bold ${tabColorText}`}
            placeholder="섹션 이름"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={!hasCompletedItems}
            onClick={handleClearSection}
            className="text-red-500 hover:text-red-700 p-0.5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="전체 해제"
          >
            <ResetIcon />
          </button>
          {!isInboxSection && (
            <button
              onClick={handleToggleLock}
              className="text-red-500 hover:text-red-700 p-0.5 rounded-full transition-colors"
              title={section.isLocked ? "섹션 잠금 해제" : "섹션 잠금"}
            >
              {section.isLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
          )}
          <button
            onClick={handleAddItem}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-800 px-2 py-1 rounded-md transition-colors text-sm font-medium border-2 border-black"
            title="추가"
          >
            추가
          </button>
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

      {/* 구분선 (Divider) - 검정색으로 명확하게 구분 */}
      <div className="border-t border-black mb-3 -mx-4"></div>

      <div className="space-y-0.5 custom-scrollbar overflow-y-auto flex-1 pr-1">
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
