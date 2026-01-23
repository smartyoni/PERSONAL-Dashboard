
import React from 'react';
import { Section, DragState } from '../types';
import EditableText from './EditableText';
import { ResetIcon, PlusIcon, TrashIcon, MemoIcon } from './Icons';
import ItemRow from './ItemRow';

interface SectionCardProps {
  section: Section;
  memos: { [key: string]: string };
  onUpdateSection: (updated: Section) => void;
  onDeleteSection: (id: string) => void;
  onShowMemo: (id: string) => void;
  dragState: DragState;
  setDragState: (state: DragState) => void;
  onSectionDragStart: () => void;
  onSectionDragOver: (e: React.DragEvent) => void;
  onSectionDrop: (e: React.DragEvent) => void;
  onSectionDragEnd: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  memos,
  onUpdateSection,
  onDeleteSection,
  onShowMemo,
  dragState,
  setDragState,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onSectionDragEnd
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
    onUpdateSection({ ...section, items: [...section.items, newItem] });
  };

  const handleClearSection = () => {
    const clearedItems = section.items.map(item => ({ ...item, completed: false }));
    onUpdateSection({ ...section, items: clearedItems });
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
      draggable
      onDragStart={onSectionDragStart}
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      onDragEnd={onSectionDragEnd}
      className={`bg-white px-4 py-4 rounded-2xl shadow-sm border transition-all flex flex-col h-[350px] cursor-default ${
        isDraggingSection ? 'opacity-40 border-slate-500' : 
        isDragOverSection ? 'border-blue-500 border-2 scale-[1.01]' : 'border-slate-400'
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2 cursor-move flex-shrink-0" title="드래그하여 순서 변경">
        <div className="flex-1 min-w-0">
          <EditableText
            value={section.title}
            onChange={handleTitleChange}
            className="text-sm font-bold text-slate-800"
            placeholder="섹션 이름"
          />
          {memos[section.id] && (
            <div 
              onClick={(e) => { e.stopPropagation(); onShowMemo(section.id); }}
              className="text-[10px] text-green-600 truncate cursor-pointer pl-1 mt-0 font-medium"
            >
              {memos[section.id]}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onShowMemo(section.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            title="섹션 메모"
          >
            <MemoIcon />
          </button>
          <button
            disabled={!hasCompletedItems}
            onClick={handleClearSection}
            className="text-slate-500 hover:text-slate-800 p-0.5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="전체 해제"
          >
            <ResetIcon />
          </button>
          <button
            onClick={handleAddItem}
            className="text-slate-500 hover:text-slate-800 p-0.5 rounded-full transition-colors"
            title="추가"
          >
            <PlusIcon />
          </button>
          <button
            onClick={() => onDeleteSection(section.id)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            title="섹션 삭제"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* 구분선 (Divider) - 색상을 더 짙게 하여 명확하게 구분 */}
      <div className="border-t border-slate-200 mb-3 -mx-4"></div>

      <div className="space-y-0.5 custom-scrollbar overflow-y-auto flex-1 pr-1">
        {section.items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            sectionId={section.id}
            memo={memos[item.id]}
            onToggle={() => handleToggleItem(item.id)}
            onUpdateText={(txt) => handleUpdateItemText(item.id, txt)}
            onDelete={() => handleDeleteItem(item.id)}
            onAddMemo={() => onShowMemo(item.id)}
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
