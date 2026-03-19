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
  onShowCategory5Memo: (itemId: string) => void;
  onAddToCalendar: (itemText: string) => void;
}

const ParkingWidget: React.FC<ParkingWidgetProps> = ({
  info,
  onChange,
  onShowChecklistMemo,
  onShowShoppingMemo,
  onShowRemindersMemo,
  onShowTodoMemo,
  onShowCategory5Memo,
  onAddToCalendar
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemText: string;
    type: 'checklist' | 'shopping' | 'reminders' | 'todo' | 'category5'
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
  const updateList = (type: string, newItems: ListItem[]) => {
    const key = type === 'checklist' ? 'checklistItems' :
      type === 'shopping' ? 'shoppingListItems' :
        type === 'reminders' ? 'remindersItems' : 
          type === 'todo' ? 'todoItems' : 'category5Items';
    onChange({ ...info, [key]: newItems });
  };

  const handleAddItem = (type: string) => {
    const newItemId = Math.random().toString(36).substr(2, 9);
    const newItem: ListItem = { id: newItemId, text: '', completed: false };
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : 
          type === 'todo' ? info.todoItems : info.category5Items;
    updateList(type, [...currentItems, newItem]);

    // 신규 추가 후 즉시 메모 모달 오픈
    if (type === 'checklist') onShowChecklistMemo(newItemId);
    else if (type === 'shopping') onShowShoppingMemo(newItemId);
    else if (type === 'reminders') onShowRemindersMemo(newItemId);
    else if (type === 'todo') onShowTodoMemo(newItemId);
    else if (type === 'parkingCat5') onShowCategory5Memo(newItemId);
  };

  const handleDeleteItem = (type: string, itemId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : 
          type === 'todo' ? info.todoItems : info.category5Items;
    updateList(type, currentItems.filter(i => i.id !== itemId));
  };

  const handleToggleItem = (type: string, itemId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : 
          type === 'todo' ? info.todoItems : info.category5Items;
    updateList(type, currentItems.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i));
  };

  const handleUpdateText = (type: string, itemId: string, text: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : 
          type === 'todo' ? info.todoItems : info.category5Items;
    updateList(type, currentItems.map(i => i.id === itemId ? { ...i, text } : i));
  };

  const handleReorder = (type: string, draggedId: string, targetId: string) => {
    const currentItems = type === 'checklist' ? info.checklistItems :
      type === 'shopping' ? info.shoppingListItems :
        type === 'reminders' ? info.remindersItems : 
          type === 'todo' ? info.todoItems : info.category5Items;
    const draggedIdx = currentItems.findIndex(i => i.id === draggedId);
    const targetIdx = currentItems.findIndex(i => i.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const newItems = [...currentItems];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    updateList(type, newItems);
  };

  const handleReorderSubSections = (draggedType: string, targetType: string) => {
    if (draggedType === targetType) return;
    
    // Helper to get data for a type
    const getData = (type: string) => {
      const itemKey = type === 'checklist' ? 'checklistItems' :
                     type === 'shopping' ? 'shoppingListItems' :
                     type === 'reminders' ? 'remindersItems' :
                     type === 'todo' ? 'todoItems' : 'category5Items';
      const titleKey = type === 'parkingCat5' ? 'category5Title' : `${type}Title` as keyof ParkingInfo;
      const memoKey = type === 'checklist' ? 'checklistMemos' :
                     type === 'shopping' ? 'shoppingListMemos' :
                     type === 'reminders' ? 'remindersMemos' :
                     type === 'todo' ? 'todoMemos' : 'category5Memos';
      
      return {
        items: (info as any)[itemKey] || [],
        title: (info as any)[titleKey] || '',
        memos: (info as any)[memoKey] || {}
      };
    };

    const sourceData = getData(draggedType);
    const targetData = getData(targetType);

    const newInfo = { ...info };

    const setData = (obj: any, type: string, data: any) => {
      const itemKey = type === 'checklist' ? 'checklistItems' :
                     type === 'shopping' ? 'shoppingListItems' :
                     type === 'reminders' ? 'remindersItems' :
                     type === 'todo' ? 'todoItems' : 'category5Items';
      const titleKey = type === 'parkingCat5' ? 'category5Title' : `${type}Title` as keyof ParkingInfo;
      const memoKey = type === 'checklist' ? 'checklistMemos' :
                     type === 'shopping' ? 'shoppingListMemos' :
                     type === 'reminders' ? 'remindersMemos' :
                     type === 'todo' ? 'todoMemos' : 'category5Memos';
      
      obj[itemKey] = data.items;
      obj[titleKey] = data.title;
      obj[memoKey] = data.memos;
    };

    setData(newInfo, draggedType, targetData);
    setData(newInfo, targetType, sourceData);

    onChange(newInfo);
  };

  const handleUpdateSubTitle = (type: string, title: string) => {
    const titleKey = type === 'parkingCat5' ? 'category5Title' : `${type}Title` as keyof ParkingInfo;
    onChange({ ...info, [titleKey]: title });
  };

  // 섹션 렌더링 컴포넌트
  const SubSection = ({ title, type, items, memos, onShowMemo, onTitleChange }: {
    title: string,
    type: 'checklist' | 'shopping' | 'reminders' | 'todo' | 'parkingCat5',
    items: ListItem[],
    memos: { [key: string]: string },
    onShowMemo: (id: string) => void,
    onTitleChange: (newTitle: string) => void
  }) => {
    const [dragState, setDragState] = useState<{ 
      draggedItemId: string | null; 
      dragOverItemId: string | null;
      isDraggingSection: boolean;
      isDragOverSection: boolean;
    }>({
      draggedItemId: null, dragOverItemId: null, isDraggingSection: false, isDragOverSection: false
    });

    return (
      <div 
        className={`flex-1 flex flex-col min-h-0 border-b border-green-400 last:border-b-0 py-1 first:pt-0 transition-all ${dragState.isDraggingSection ? 'opacity-30 bg-green-50' : dragState.isDragOverSection ? 'bg-green-100/50 scale-[1.02] border-l-4 border-l-green-600' : ''}`}
        draggable={true}
        onDragStart={(e) => {
          // 아이템 드래그 중인 경우는 무시
          if ((e.target as HTMLElement).draggable && (e.target as HTMLElement).tagName !== 'DIV') return;
          e.dataTransfer.setData('sectionType', type);
          setDragState(p => ({ ...p, isDraggingSection: true }));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes('sectionType')) {
            if (!dragState.isDragOverSection) setDragState(p => ({ ...p, isDragOverSection: true }));
          }
        }}
        onDragLeave={() => {
          setDragState(p => ({ ...p, isDragOverSection: false }));
        }}
        onDrop={(e) => {
          e.preventDefault();
          const draggedType = e.dataTransfer.getData('sectionType');
          if (draggedType && draggedType !== type) {
            handleReorderSubSections(draggedType, type);
          }
          setDragState(p => ({ ...p, isDraggingSection: false, isDragOverSection: false }));
        }}
        onDragEnd={() => {
          setDragState(p => ({ ...p, isDraggingSection: false, isDragOverSection: false }));
        }}
      >
        <div className="flex items-center justify-between mb-1 px-1 cursor-grab active:cursor-grabbing">
          <EditableText
            value={title}
            onChange={onTitleChange}
            placeholder="제목 입력..."
            className="text-[17px] font-bold text-red-600 pointer-events-auto"
            compact
          />
          <button onClick={() => handleAddItem(type)} className="text-[11px] text-green-600 hover:text-green-700 font-bold pointer-events-auto">+ 추가</button>
        </div>
        <div className="space-y-0 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {[...(items || [])].map(item => (
            <div
              key={item.id}
              draggable={!editingItemIds.has(item.id)}
              onDragStart={(e) => {
                e.stopPropagation();
                setDragState(p => ({ ...p, draggedItemId: item.id, dragOverItemId: null }));
              }}
              onDragOver={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                if (dragState.dragOverItemId !== item.id) setDragState(p => ({ ...p, dragOverItemId: item.id })); 
              }}
              onDrop={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                if (dragState.draggedItemId && dragState.draggedItemId !== item.id) handleReorder(type, dragState.draggedItemId, item.id); 
                setDragState(p => ({ ...p, draggedItemId: null, dragOverItemId: null })); 
              }}
              onDragEnd={() => setDragState(p => ({ ...p, draggedItemId: null, dragOverItemId: null }))}
              className={`flex items-start gap-1 py-1 rounded transition-all group ${dragState.draggedItemId === item.id ? 'opacity-40 bg-slate-50' : dragState.dragOverItemId === item.id ? 'bg-green-50 border-l-2 border-green-400' : 'hover:bg-slate-50'}`}
            >
              <button
                ref={el => triggerRefs.current[item.id] = el}
                onClick={(e) => toggleMenu(e, item.id)}
                className="text-2xl leading-none -mt-1 w-4 h-6 flex items-center justify-center text-green-400 hover:text-green-500 transition-colors"
                title="메뉴 열기"
              >
                •
              </button>
              <div className="flex-1 min-w-0" onClick={() => onShowMemo(item.id)}>
                <EditableText
                  value={item.text}
                  onChange={(txt) => handleUpdateText(type, item.id, txt)}
                  onEditingChange={(ed) => handleEditingChange(item.id, ed)}
                  placeholder="항목 입력..."
                  className={`text-[15px] ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}
                  compact
                />
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-2 text-slate-300 text-[10px] italic">항목이 없습니다</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black p-2 shadow-sm overflow-hidden">
      <h2 className="text-sm font-black text-green-900 bg-green-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black" title={info.title || "주차"}>
        <EditableText
          value={info.title || "주차"}
          onChange={(newTitle) => onChange({ ...info, title: newTitle })}
          placeholder="제목 입력..."
          className="flex-1"
        />
        <span className="text-[10px] font-normal text-green-600 font-mono">PARKING</span>
      </h2>

      {/* 4분할 섹션 */}
      <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
        <SubSection title={info.checklistTitle || "업무루틴"} type="checklist" items={info.checklistItems || []} memos={info.checklistMemos} onShowMemo={onShowChecklistMemo} onTitleChange={(t) => handleUpdateSubTitle('checklist', t)} />
        <SubSection title={info.shoppingTitle || "구매예정"} type="shopping" items={info.shoppingListItems || []} memos={info.shoppingListMemos} onShowMemo={onShowShoppingMemo} onTitleChange={(t) => handleUpdateSubTitle('shopping', t)} />
        <SubSection title={info.remindersTitle || "기억하고 확인할것"} type="reminders" items={info.remindersItems || []} memos={info.remindersMemos} onShowMemo={onShowRemindersMemo} onTitleChange={(t) => handleUpdateSubTitle('reminders', t)} />
        <SubSection title={info.todoTitle || "잊지말고 할일"} type="todo" items={info.todoItems || []} memos={info.todoMemos} onShowMemo={onShowTodoMemo} onTitleChange={(t) => handleUpdateSubTitle('todo', t)} />
        <SubSection title={info.category5Title || "항목 5"} type="parkingCat5" items={info.category5Items || []} memos={info.category5Memos} onShowMemo={onShowCategory5Memo} onTitleChange={(t) => handleUpdateSubTitle('parkingCat5', t)} />
      </div>

      {/* 메뉴 팝업 (포탈 개념의 fixed 유지) */}
      {openMenuId && (() => {
        const item = [...(info.checklistItems || []), ...(info.shoppingListItems || []), ...(info.remindersItems || []), ...(info.todoItems || []), ...(info.category5Items || [])].find(i => i.id === openMenuId);
        if (!item) return null;
        const type = info.checklistItems.some(i => i.id === openMenuId) ? 'checklist' as const :
          info.shoppingListItems.some(i => i.id === openMenuId) ? 'shopping' as const :
            info.remindersItems.some(i => i.id === openMenuId) ? 'reminders' as const : 
              info.todoItems.some(i => i.id === openMenuId) ? 'todo' as const : 'parkingCat5' as const;
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

      {/* Contextual Delete Confirmation Popover */}
      {deleteConfirm.isOpen && (() => {
        const isMobile = window.innerWidth < 768;
        return (
          <div
            ref={menuRef}
            className={`${isMobile ? 'absolute' : 'fixed'} bg-white rounded-xl shadow-2xl border-2 border-black z-[100] p-4 w-52 animate-in zoom-in-95 duration-200`}
            style={{
              ...(isMobile ? {
                right: '20px',
                top: '100px'
              } : {
                ...(menuPos.top !== undefined && { top: `${menuPos.top}px` }),
                ...(menuPos.bottom !== undefined && { bottom: `${menuPos.bottom}px` }),
                left: `${menuPos.left}px`
              })
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[13px] font-bold text-slate-800 mb-3 leading-tight text-center">
              항목을 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                className="flex-1 py-1.5 text-[11px] font-bold border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  handleDeleteItem(deleteConfirm.type, deleteConfirm.itemId!);
                  setDeleteConfirm({ ...deleteConfirm, isOpen: false });
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
  );
};

export default ParkingWidget;