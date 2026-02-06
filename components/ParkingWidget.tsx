import React, { useState, useRef } from 'react';
import { ParkingInfo, ListItem } from '../types';
import EditableText from './EditableText';
import LinkifiedText from './LinkifiedText';
import { MenuIcon } from './Icons';
import { useClickOutside } from '../hooks/useClickOutside';

interface ParkingWidgetProps {
  info: ParkingInfo;
  onChange: (newInfo: ParkingInfo) => void;
  onShowChecklistMemo: (itemId: string) => void;
  onShowShoppingMemo: (itemId: string) => void;
}

const ParkingWidget: React.FC<ParkingWidgetProps> = ({
  info,
  onChange,
  onShowChecklistMemo,
  onShowShoppingMemo
}) => {
  const checklistItems = info.checklistItems || [];
  const shoppingListItems = info.shoppingListItems || [];
  const [dragState, setDragState] = useState<{
    draggedItemId: string | null;
    dragOverItemId: string | null;
  }>({
    draggedItemId: null,
    dragOverItemId: null
  });
  const [shoppingDragState, setShoppingDragState] = useState<{
    draggedItemId: string | null;
    dragOverItemId: string | null;
  }>({
    draggedItemId: null,
    dragOverItemId: null
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useClickOutside(menuRef, () => setOpenMenuId(null));

  const toggleMenu = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const isMobile = window.innerWidth < 768;

    if (triggerRefs.current[itemId] && !isMobile) {
      const rect = triggerRefs.current[itemId]!.getBoundingClientRect();
      const menuHeight = 140;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow >= menuHeight) {
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right + 8
        });
      } else {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.right + 8
        });
      }
    }
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  const handleAddChecklistItem = () => {
    const newItem: ListItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      completed: false
    };
    onChange({
      ...info,
      checklistItems: [...checklistItems, newItem]
    });
  };

  const handleToggleItem = (itemId: string) => {
    const updatedItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onChange({ ...info, checklistItems: updatedItems });
  };

  const handleUpdateItemText = (itemId: string, newText: string) => {
    const updatedItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    );
    onChange({ ...info, checklistItems: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = checklistItems.filter(item => item.id !== itemId);
    onChange({ ...info, checklistItems: updatedItems });
  };

  const handleCopyChecklistItem = (itemId: string) => {
    const itemToCopy = checklistItems.find(item => item.id === itemId);
    if (!itemToCopy) return;
    const newItem: ListItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: itemToCopy.text,
      completed: false
    };
    onChange({
      ...info,
      checklistItems: [...checklistItems, newItem]
    });
  };

  const handleItemDragStart = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation();
    setDragState({ draggedItemId: itemId, dragOverItemId: null });
  };

  const handleItemDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (dragState.dragOverItemId !== itemId) {
      setDragState(prev => ({ ...prev, dragOverItemId: itemId }));
    }
  };

  const handleItemDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState.draggedItemId || dragState.draggedItemId === targetItemId) return;

    const draggedIdx = checklistItems.findIndex(i => i.id === dragState.draggedItemId);
    const targetIdx = checklistItems.findIndex(i => i.id === targetItemId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...checklistItems];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    onChange({ ...info, checklistItems: newItems });
    setDragState({ draggedItemId: null, dragOverItemId: null });
  };

  const handleItemDragEnd = () => {
    setDragState({ draggedItemId: null, dragOverItemId: null });
  };

  // Shopping List Handlers
  const handleAddShoppingItem = () => {
    const newItem: ListItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      completed: false
    };
    onChange({
      ...info,
      shoppingListItems: [...shoppingListItems, newItem]
    });
  };

  const handleToggleShoppingItem = (itemId: string) => {
    const updatedItems = shoppingListItems.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onChange({ ...info, shoppingListItems: updatedItems });
  };

  const handleUpdateShoppingItemText = (itemId: string, newText: string) => {
    const updatedItems = shoppingListItems.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    );
    onChange({ ...info, shoppingListItems: updatedItems });
  };

  const handleDeleteShoppingItem = (itemId: string) => {
    const updatedItems = shoppingListItems.filter(item => item.id !== itemId);
    onChange({ ...info, shoppingListItems: updatedItems });
  };

  const handleCopyShoppingItem = (itemId: string) => {
    const itemToCopy = shoppingListItems.find(item => item.id === itemId);
    if (!itemToCopy) return;
    const newItem: ListItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: itemToCopy.text,
      completed: false
    };
    onChange({
      ...info,
      shoppingListItems: [...shoppingListItems, newItem]
    });
  };

  const handleShoppingItemDragStart = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation();
    setShoppingDragState({ draggedItemId: itemId, dragOverItemId: null });
  };

  const handleShoppingItemDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (shoppingDragState.dragOverItemId !== itemId) {
      setShoppingDragState(prev => ({ ...prev, dragOverItemId: itemId }));
    }
  };

  const handleShoppingItemDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shoppingDragState.draggedItemId || shoppingDragState.draggedItemId === targetItemId) return;

    const draggedIdx = shoppingListItems.findIndex(i => i.id === shoppingDragState.draggedItemId);
    const targetIdx = shoppingListItems.findIndex(i => i.id === targetItemId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newItems = [...shoppingListItems];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    onChange({ ...info, shoppingListItems: newItems });
    setShoppingDragState({ draggedItemId: null, dragOverItemId: null });
  };

  const handleShoppingItemDragEnd = () => {
    setShoppingDragState({ draggedItemId: null, dragOverItemId: null });
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-slate-800">
          주차
        </h2>
      </div>

      {/* 텍스트 입력 */}
      <div className="mb-4">
        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">
          Location Info
        </label>
        <input
          type="text"
          value={info.text}
          onChange={(e) => onChange({ text: e.target.value, checklistItems })}
          placeholder="예: B2 14C"
          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 text-xs text-slate-700 font-medium placeholder:text-slate-300"
        />
      </div>

      <div className="border-t-2 border-blue-400 mb-4"></div>

      {/* 챙길것 섹션 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-slate-800">
            챙길것
          </label>
          <button
            onClick={handleAddChecklistItem}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + 추가
          </button>
        </div>

        <div className="border-t border-slate-200 mb-3"></div>

        <div className="space-y-0 overflow-y-auto overflow-x-hidden flex-1">
          {[...checklistItems]
            .sort((a, b) => {
              if (a.completed === b.completed) return 0;
              return a.completed ? 1 : -1;
            })
            .map(item => {
              const isDragging = dragState.draggedItemId === item.id;
              const isDragOver = dragState.dragOverItemId === item.id;
              return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleItemDragStart(e, item.id)}
                onDragOver={(e) => handleItemDragOver(e, item.id)}
                onDrop={(e) => handleItemDrop(e, item.id)}
                onDragEnd={handleItemDragEnd}
                className={`flex items-center gap-1 py-1.5 px-0 rounded transition-all cursor-move relative min-h-0 ${
                  isDragging ? 'opacity-50 bg-slate-100' :
                  isDragOver ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleItem(item.id)}
                  className="w-5 h-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-snug font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    <EditableText
                      value={item.text}
                      onChange={(newText) => handleUpdateItemText(item.id, newText)}
                      placeholder="항목을 입력하세요..."
                      className="text-sm"
                      compact
                    />
                  </div>
                  {info.checklistMemos?.[item.id] && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowChecklistMemo(item.id);
                      }}
                      className="text-xs text-green-600 truncate cursor-pointer hover:text-green-700 transition-colors mt-0.5 pl-1 font-medium"
                      title={info.checklistMemos[item.id]}
                    >
                      <LinkifiedText text={info.checklistMemos[item.id]} />
                    </div>
                  )}
                </div>
                <div className="relative flex-shrink-0 -mr-3">
                  <button
                    ref={(el) => {
                      if (el) triggerRefs.current[item.id] = el;
                    }}
                    onClick={(e) => toggleMenu(e, item.id)}
                    className="text-slate-600 hover:text-slate-800 transition-colors p-1.5 rounded"
                    title="메뉴"
                    style={{ transform: 'scale(1.2)' }}
                  >
                    <MenuIcon />
                  </button>

                  {openMenuId === item.id && (() => {
                    const isMobile = window.innerWidth < 768;
                    return (
                      <div
                        ref={menuRef}
                        className={`${
                          isMobile ? 'absolute' : 'fixed'
                        } bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1.5 w-48 animate-in fade-in ${
                          isMobile ? 'slide-in-from-right-2' : 'slide-in-from-left-2'
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
                          onClick={() => {
                            onShowChecklistMemo(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          📝 메모 수정/추가
                        </button>
                        <button
                          onClick={() => {
                            handleCopyChecklistItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          📋 복사
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
            })}
          {checklistItems.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs italic">
              항목이 없습니다
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-blue-400 my-4"></div>

      {/* 구매예정 섹션 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-slate-800">
            구매예정
          </label>
          <button
            onClick={handleAddShoppingItem}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + 추가
          </button>
        </div>

        <div className="border-t border-slate-200 mb-3"></div>

        <div className="space-y-0 overflow-y-auto overflow-x-hidden flex-1">
          {[...shoppingListItems]
            .sort((a, b) => {
              if (a.completed === b.completed) return 0;
              return a.completed ? 1 : -1;
            })
            .map(item => {
              const isDragging = shoppingDragState.draggedItemId === item.id;
              const isDragOver = shoppingDragState.dragOverItemId === item.id;
              return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleShoppingItemDragStart(e, item.id)}
                onDragOver={(e) => handleShoppingItemDragOver(e, item.id)}
                onDrop={(e) => handleShoppingItemDrop(e, item.id)}
                onDragEnd={handleShoppingItemDragEnd}
                className={`flex items-center gap-1 py-1.5 px-0 rounded transition-all cursor-move relative min-h-0 ${
                  isDragging ? 'opacity-50 bg-slate-100' :
                  isDragOver ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleShoppingItem(item.id)}
                  className="w-5 h-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-snug font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    <EditableText
                      value={item.text}
                      onChange={(newText) => handleUpdateShoppingItemText(item.id, newText)}
                      placeholder="항목을 입력하세요..."
                      className="text-sm"
                      compact
                    />
                  </div>
                  {info.shoppingListMemos?.[item.id] && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowShoppingMemo(item.id);
                      }}
                      className="text-xs text-green-600 truncate cursor-pointer hover:text-green-700 transition-colors mt-0.5 pl-1 font-medium"
                      title={info.shoppingListMemos[item.id]}
                    >
                      <LinkifiedText text={info.shoppingListMemos[item.id]} />
                    </div>
                  )}
                </div>
                <div className="relative flex-shrink-0 -mr-3">
                  <button
                    ref={(el) => {
                      if (el) triggerRefs.current[item.id] = el;
                    }}
                    onClick={(e) => toggleMenu(e, item.id)}
                    className="text-slate-600 hover:text-slate-800 transition-colors p-1.5 rounded"
                    title="메뉴"
                    style={{ transform: 'scale(1.2)' }}
                  >
                    <MenuIcon />
                  </button>

                  {openMenuId === item.id && (() => {
                    const isMobile = window.innerWidth < 768;
                    return (
                      <div
                        ref={menuRef}
                        className={`${
                          isMobile ? 'absolute' : 'fixed'
                        } bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1.5 w-48 animate-in fade-in ${
                          isMobile ? 'slide-in-from-right-2' : 'slide-in-from-left-2'
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
                          onClick={() => {
                            onShowShoppingMemo(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          📝 메모 수정/추가
                        </button>
                        <button
                          onClick={() => {
                            handleCopyShoppingItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          📋 복사
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteShoppingItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
            })}
          {shoppingListItems.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs italic">
              항목이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParkingWidget;