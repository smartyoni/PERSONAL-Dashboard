import React, { useState, useRef } from 'react';
import { ParkingInfo, ListItem } from '../types';
import EditableText from './EditableText';
import { useClickOutside } from '../hooks/useClickOutside';

interface ParkingWidgetProps {
  info: ParkingInfo;
  onChange: (newInfo: ParkingInfo) => void;
  onShowChecklistMemo: (itemId: string) => void;
  onShowShoppingMemo: (itemId: string) => void;
  onShowRemindersMemo: (itemId: string) => void;
  onShowTodoMemo: (itemId: string) => void;
  onAddToCalendar: (itemText: string) => void;
}

const ParkingWidget: React.FC<ParkingWidgetProps> = ({
  info,
  onChange,
  onShowChecklistMemo,
  onShowShoppingMemo,
  onShowRemindersMemo,
  onShowTodoMemo,
  onAddToCalendar
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemText: string;
    type: 'checklist' | 'shopping' | 'reminders' | 'todo'
  }>({
    isOpen: false,
    itemId: null,
    itemText: '',
    type: 'checklist'
  });
  const [editingItemIds, setEditingItemIds] = useState<Set<string>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useClickOutside(menuRef, () => setOpenMenuId(null));

  const handleEditingChange = (itemId: string, isEditing: boolean) => {
    setEditingItemIds(prev => {
      const newSet = new Set(prev);
      if (isEditing) newSet.add(itemId);
      else newSet.delete(itemId);
      return newSet;
    });
  };

  const toggleMenu = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const isMobile = window.innerWidth < 768;

    if (triggerRefs.current[itemId] && !isMobile) {
      const rect = triggerRefs.current[itemId]!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow >= 240) {
        setMenuPos({ top: rect.top, left: rect.right + 4 });
      } else {
        setMenuPos({ bottom: window.innerHeight - rect.bottom, left: rect.right + 4 });
      }
    }
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  // 공통 헬퍼: 아이템 추가/수정/삭제/정렬
  const updateList = (type: 'checklist' | 'shopping' | 'reminders' | 'todo', newItems: ListItem[]) => {
    const key = type === 'checklist' ? 'checklistItems' :
      type === 'shopping' ? 'shoppingListItems' :
        type === 'reminders' ? 'remindersItems' : 'todoItems';
    onChange({ ...info, [key]: newItems });
  };

  const handleAddItem = (type: 'checklist' | 'shopping' | 'reminders' | 'todo') => {
    const newItem: ListItem = { id: Math.random().toString(36).substr(2, 9), text: '', completed: false };
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : info.todoItems;
    updateList(type, [...currentItems, newItem]);
  };

  const handleDeleteItem = (type: 'checklist' | 'shopping' | 'reminders' | 'todo', itemId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : info.todoItems;
    updateList(type, currentItems.filter(i => i.id !== itemId));
  };

  const handleToggleItem = (type: 'checklist' | 'shopping' | 'reminders' | 'todo', itemId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : info.todoItems;
    updateList(type, currentItems.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i));
  };

  const handleUpdateText = (type: 'checklist' | 'shopping' | 'reminders' | 'todo', itemId: string, text: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : info.todoItems;
    updateList(type, currentItems.map(i => i.id === itemId ? { ...i, text } : i));
  };

  const handleReorder = (type: 'checklist' | 'shopping' | 'reminders' | 'todo', draggedId: string, targetId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : info.todoItems;
    const draggedIdx = currentItems.findIndex(i => i.id === draggedId);
    const targetIdx = currentItems.findIndex(i => i.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const newItems = [...currentItems];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    updateList(type, newItems);
  };

  // 섹션 렌더링 컴포넌트
  const SubSection = ({ title, type, items, memos, onShowMemo }: {
    title: string,
    type: 'checklist' | 'shopping' | 'reminders' | 'todo',
    items: ListItem[],
    memos: { [key: string]: string },
    onShowMemo: (id: string) => void
  }) => {
    const [dragState, setDragState] = useState<{ draggedItemId: string | null; dragOverItemId: string | null }>({
      draggedItemId: null, dragOverItemId: null
    });

    return (
      <div className="flex-1 flex flex-col min-h-0 border-b border-blue-400 last:border-b-0 py-2 first:pt-0">
        <div className="flex items-center justify-between mb-1 px-1">
          <label className="text-sm font-bold text-slate-800">{title}</label>
          <button onClick={() => handleAddItem(type)} className="text-[11px] text-blue-600 hover:text-blue-700 font-bold">+ 추가</button>
        </div>
        <div className="space-y-0 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {[...items].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(item => (
            <div
              key={item.id}
              draggable={!editingItemIds.has(item.id)}
              onDragStart={() => setDragState({ draggedItemId: item.id, dragOverItemId: null })}
              onDragOver={(e) => { e.preventDefault(); if (dragState.dragOverItemId !== item.id) setDragState(p => ({ ...p, dragOverItemId: item.id })); }}
              onDrop={() => { if (dragState.draggedItemId && dragState.draggedItemId !== item.id) handleReorder(type, dragState.draggedItemId, item.id); setDragState({ draggedItemId: null, dragOverItemId: null }); }}
              onDragEnd={() => setDragState({ draggedItemId: null, dragOverItemId: null })}
              className={`flex items-start gap-1 py-1 rounded transition-all group ${dragState.draggedItemId === item.id ? 'opacity-40 bg-slate-50' : dragState.dragOverItemId === item.id ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'}`}
            >
              <button
                ref={el => triggerRefs.current[item.id] = el}
                onClick={(e) => toggleMenu(e, item.id)}
                className="text-2xl leading-none -mt-1 w-4 h-6 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
              >•</button>
              <div className="flex-1 min-w-0" onClick={() => onShowMemo(item.id)}>
                <EditableText
                  value={item.text}
                  onChange={(txt) => handleUpdateText(type, item.id, txt)}
                  onEditingChange={(ed) => handleEditingChange(item.id, ed)}
                  placeholder="항목 입력..."
                  className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}
                  compact
                />
                {memos[item.id] && memos[item.id].trim() !== item.text.trim() && (
                  <div className="text-[10px] text-green-600 truncate opacity-80 pl-0.5">{memos[item.id].substring(item.text.length).trim()}</div>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-2 text-slate-300 text-[10px] italic">항목이 없습니다</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black p-4 shadow-sm overflow-hidden">
      <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">주차 <span className="text-[10px] font-normal text-slate-400 font-mono">PARKING</span></h2>

      {/* 층수 선택 */}
      <div className="mb-4 flex gap-1 items-stretch">
        {['B1', 'B2', 'B3', 'B4', 'B5'].map(floor => (
          <button
            key={floor}
            onClick={() => onChange({ ...info, text: floor })}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg border-2 transition-all ${info.text === floor ? 'bg-blue-500 text-white border-black shadow-[2px_2px_0_0_#000]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-black'}`}
          >
            {floor}
          </button>
        ))}
        <input
          type="text" maxLength={4} placeholder="기타"
          value={['B1', 'B2', 'B3', 'B4', 'B5'].includes(info.text) ? '' : info.text}
          onChange={(e) => onChange({ ...info, text: e.target.value })}
          className={`flex-[1.5] min-w-0 px-2 py-1.5 text-xs font-black rounded-lg border-2 text-center transition-all focus:outline-none ${!['B1', 'B2', 'B3', 'B4', 'B5'].includes(info.text) && info.text !== '' ? 'bg-blue-50 border-black shadow-[2px_2px_0_0_#000]' : 'bg-slate-50 border-slate-200 focus:border-black'}`}
        />
      </div>

      <div className="border-t-2 border-blue-400 mb-2"></div>

      {/* 4분할 섹션 */}
      <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
        <SubSection title="챙길것" type="checklist" items={info.checklistItems} memos={info.checklistMemos} onShowMemo={onShowChecklistMemo} />
        <SubSection title="구매예정" type="shopping" items={info.shoppingListItems} memos={info.shoppingListMemos} onShowMemo={onShowShoppingMemo} />
        <SubSection title="기억해야할 것" type="reminders" items={info.remindersItems} memos={info.remindersMemos} onShowMemo={onShowRemindersMemo} />
        <SubSection title="해야할 일" type="todo" items={info.todoItems} memos={info.todoMemos} onShowMemo={onShowTodoMemo} />
      </div>

      {/* 메뉴 팝업 (포탈 개념의 fixed 유지) */}
      {openMenuId && (() => {
        const item = [...info.checklistItems, ...info.shoppingListItems, ...info.remindersItems, ...info.todoItems].find(i => i.id === openMenuId);
        if (!item) return null;
        const type = info.checklistItems.some(i => i.id === openMenuId) ? 'checklist' :
          info.shoppingListItems.some(i => i.id === openMenuId) ? 'shopping' :
            info.remindersItems.some(i => i.id === openMenuId) ? 'reminders' : 'todo';
        const isMobile = window.innerWidth < 768;
        return (
          <div
            ref={menuRef}
            className={`${isMobile ? 'absolute' : 'fixed'} bg-white rounded-xl shadow-2xl border-2 border-black z-50 py-1 w-40 animate-in zoom-in duration-100`}
            style={isMobile ? { right: '20px', top: '100px' } : {
              ...(menuPos.top !== undefined && { top: `${menuPos.top}px` }),
              ...(menuPos.bottom !== undefined && { bottom: `${menuPos.bottom}px` }),
              left: `${menuPos.left}px`
            }}
          >
            <button onClick={() => { navigator.clipboard.writeText(item.text); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50">📋 복사</button>
            <button onClick={() => { onAddToCalendar(item.text); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50">📅 캘린더</button>
            <button onClick={() => handleToggleItem(type, item.id)} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50">{item.completed ? '⭕ 미완료' : '✅ 완료'}</button>
            <button onClick={() => { setDeleteConfirm({ isOpen: true, itemId: item.id, itemText: item.text, type }); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t-2 border-slate-100">🗑️ 삭제</button>
          </div>
        );
      })()}

      {/* 삭제 확인 모달 */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-[280px] shadow-2xl rounded-2xl animate-in zoom-in duration-200">
            <p className="font-black text-slate-800 mb-4 text-center">"{deleteConfirm.itemText.substring(0, 20)}..."<br />항목을 삭제할까요?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="flex-1 py-3 text-xs font-bold border-2 border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button onClick={() => { handleDeleteItem(deleteConfirm.type, deleteConfirm.itemId!); setDeleteConfirm({ ...deleteConfirm, isOpen: false }); }} className="flex-1 py-3 text-xs font-bold bg-red-500 text-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingWidget;