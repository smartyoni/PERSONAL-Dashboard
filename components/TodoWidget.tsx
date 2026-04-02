import React, { useState, useRef } from 'react';
import { TodoManagementInfo, ListItem, DragState } from '../types';
import EditableText from './EditableText';
import { useClickOutside } from '../hooks/useClickOutside';
import { parseMemoPages } from '../utils/memoEditorUtils';

interface TodoWidgetProps {
    info: TodoManagementInfo;
    onChange: (newInfo: TodoManagementInfo) => void;
    onShowTodoCat1Memo?: (itemId: string) => void;
    onShowTodoCat2Memo?: (itemId: string) => void;
    onShowTodoCat3Memo?: (itemId: string) => void;
    onShowTodoCat4Memo?: (itemId: string) => void;
    onAddToCalendar: (itemText: string) => void;
    mainHeaderClass?: string;
    subHeaderClass?: string;
    todoTagClass?: string;
    onOpenItemMemoAtPage?: (itemId: string, pageIndex: number, highlightText?: string) => void;
    // New props for cross-section movement
    dragState: DragState;
    setDragState: (state: DragState) => void;
    onCrossSectionDrop: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, sourceTabId: string, targetTabId: string) => void;
    onItemTagClick: (itemId: string, sectionId: string, itemText: string) => void;
    dataSectionId?: string;
}

interface SubSectionProps {
    title: string;
    type: 1 | 2 | 3 | 4 | 5;
    items: ListItem[];
    memos: { [key: string]: string };
    onShowMemo?: (id: string) => void;
    sectionId: string;
    colorIndex: number;
    dragState: DragState;
    setDragState: (state: DragState) => void;
    handleReorder: (type: 1 | 2 | 3 | 4 | 5, draggedId: string, targetId: string) => void;
    handleReorderSubSections: (draggedType: number, targetType: number) => void;
    onCrossSectionDrop: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, sourceTabId: string, targetTabId: string) => void;
    handleUpdateTitle: (type: 1 | 2 | 3 | 4 | 5, title: string) => void;
    handleAddItem: (type: 1 | 2 | 3 | 4 | 5) => void;
    handleUpdateText: (type: 1 | 2 | 3 | 4 | 5, itemId: string, text: string) => void;
    handleEditingChange: (itemId: string, isEditing: boolean) => void;
    editingItemIds: Set<string>;
    toggleMenu: (e: React.MouseEvent, itemId: string) => void;
    onItemTagClick: (itemId: string, sectionId: string, itemText: string) => void;
    triggerRefs: React.MutableRefObject<{ [key: string]: HTMLButtonElement | null }>;
    onOpenItemMemoAtPage?: (itemId: string, pageIndex: number) => void;
    subHeaderClass?: string;
}

const SubSection: React.FC<SubSectionProps> = ({ 
    title, type, items, memos, onShowMemo, sectionId, colorIndex, 
    dragState, setDragState, handleReorder, handleReorderSubSections, onCrossSectionDrop,
    handleUpdateTitle, handleAddItem, handleUpdateText, handleEditingChange, editingItemIds,
    toggleMenu, onItemTagClick, triggerRefs, onOpenItemMemoAtPage, subHeaderClass
}) => {
    const [localDragState, setLocalDragState] = useState<{ 
        isDraggingSection: boolean;
        isDragOverSection: boolean;
    }>({
        isDraggingSection: false, isDragOverSection: false
    });

    const isOverThisSection = dragState.dragOverSectionId === sectionId;

    const pastelColors = [
        { bg: 'bg-red-50/50', border: 'border-red-200', header: 'bg-red-100/60', sep: 'border-red-200' },
        { bg: 'bg-orange-50/50', border: 'border-orange-200', header: 'bg-orange-100/60', sep: 'border-orange-200' },
        { bg: 'bg-yellow-50/50', border: 'border-yellow-200', header: 'bg-yellow-100/60', sep: 'border-yellow-200' },
        { bg: 'bg-green-50/50', border: 'border-green-200', header: 'bg-green-100/60', sep: 'border-green-200' },
        { bg: 'bg-blue-50/50', border: 'border-blue-200', header: 'bg-blue-100/60', sep: 'border-blue-200' },
    ];
    const color = pastelColors[colorIndex % pastelColors.length];

    return (
        <div 
            className={`flex-1 flex flex-col min-h-0 border ${color.border} rounded-lg overflow-hidden ${color.bg} shadow-sm transition-all ${localDragState.isDraggingSection ? 'opacity-30 bg-sky-50' : isOverThisSection ? 'bg-sky-50 scale-[1.02] border-sky-400 border-2' : ''}`}
            draggable={true}
            onDragStart={(e) => {
                const target = e.target as HTMLElement;
                if (target.draggable && target.tagName !== 'DIV') return;
                e.dataTransfer.setData('todoSectionType', type.toString());
                setLocalDragState(p => ({ ...p, isDraggingSection: true }));
            }}
            onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes('todoSectionType')) {
                    if (!localDragState.isDragOverSection) setLocalDragState(p => ({ ...p, isDragOverSection: true }));
                } else {
                    if (!isOverThisSection) {
                        setDragState({ ...dragState, dragOverSectionId: sectionId, dragOverTabId: 'main' });
                    }
                }
            }}
            onDragLeave={() => {
                setLocalDragState(p => ({ ...p, isDragOverSection: false }));
                if (isOverThisSection) {
                    setDragState({ ...dragState, dragOverSectionId: null, dragOverTabId: null });
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                const draggedTypeStr = e.dataTransfer.getData('todoSectionType');
                if (draggedTypeStr) {
                    const draggedType = parseInt(draggedTypeStr);
                    if (draggedType !== type) {
                        handleReorderSubSections(draggedType, type);
                    }
                } else if (dragState.draggedItemId && dragState.sourceSectionId) {
                    onCrossSectionDrop(
                        dragState.draggedItemId,
                        dragState.sourceSectionId,
                        sectionId,
                        dragState.sourceTabId || 'main',
                        'main'
                    );
                }
                setLocalDragState(p => ({ ...p, isDraggingSection: false, isDragOverSection: false }));
                setDragState({ ...dragState, draggedItemId: null, sourceSectionId: null, sourceTabId: null, dragOverSectionId: null, dragOverTabId: null, dragOverItemId: null });
            }}
            onDragEnd={() => {
                setLocalDragState(p => ({ ...p, isDraggingSection: false, isDragOverSection: false }));
                setDragState({ ...dragState, draggedItemId: null, sourceSectionId: null, sourceTabId: null, dragOverSectionId: null, dragOverTabId: null, dragOverItemId: null });
            }}
        >
            <div className={`flex items-center justify-between px-2 py-1 ${color.header} border-b ${color.sep} cursor-grab active:cursor-grabbing`}>
                <EditableText
                    value={title}
                    onChange={(txt) => handleUpdateTitle(type, txt)}
                    placeholder="제목 입력..."
                    className={subHeaderClass || "text-[13px] font-bold text-slate-700 w-full"}
                    compact
                />
                <button onClick={() => handleAddItem(type)} className="flex-shrink-0 ml-2 text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-slate-100 font-bold transition-colors">+ 추가</button>
            </div>
            <div className="space-y-0 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {[...(items || [])].map(item => {
                    const isDraggingThis = dragState.draggedItemId === item.id;
                    const isOverThis = dragState.dragOverItemId === item.id;
                    
                    return (
                        <div
                            key={item.id}
                            draggable={!editingItemIds.has(item.id)}
                            onDragStart={(e) => {
                                e.stopPropagation();
                                setDragState({
                                    draggedItemId: item.id,
                                    sourceSectionId: sectionId,
                                    sourceTabId: 'main',
                                    dragOverItemId: null,
                                    dragOverSectionId: null,
                                    dragOverTabId: null
                                });
                            }}
                            onDragOver={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation();
                                if (dragState.dragOverItemId !== item.id) {
                                    setDragState({ ...dragState, dragOverItemId: item.id });
                                }
                            }}
                            onDrop={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation();
                                if (dragState.draggedItemId && dragState.sourceSectionId === sectionId) {
                                    if (dragState.draggedItemId !== item.id) {
                                        handleReorder(type, dragState.draggedItemId, item.id);
                                    }
                                } else if (dragState.draggedItemId && dragState.sourceSectionId) {
                                    onCrossSectionDrop(
                                        dragState.draggedItemId,
                                        dragState.sourceSectionId,
                                        sectionId,
                                        dragState.sourceTabId || 'main',
                                        'main'
                                    );
                                }
                                setDragState({ ...dragState, draggedItemId: null, sourceSectionId: null, sourceTabId: null, dragOverItemId: null, dragOverSectionId: null, dragOverTabId: null });
                            }}
                            className={`flex items-center gap-1 py-0.5 px-1 rounded transition-all group cursor-grab active:cursor-grabbing ${isDraggingThis ? 'opacity-40 bg-slate-50' : isOverThis ? 'bg-sky-50 border-l-2 border-sky-400' : 'hover:bg-black/5'}`}
                        >
                            <button
                                ref={el => { triggerRefs.current[item.id] = el; }}
                                onClick={(e) => toggleMenu(e, item.id)}
                                className="leading-none w-3 h-6 flex items-center justify-center text-blue-400 hover:text-blue-500 transition-colors font-bold text-xl flex-shrink-0"
                                title="메뉴 열기"
                            >
                                •
                            </button>
                            <div 
                                className="flex-1 min-w-0" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onShowMemo) onShowMemo(item.id);
                                    else if (onOpenItemMemoAtPage) onOpenItemMemoAtPage(item.id, 0);
                                }}
                            >
                                <EditableText
                                    value={item.text}
                                    onChange={(txt) => handleUpdateText(type, item.id, txt)}
                                    onEditingChange={(ed) => handleEditingChange(item.id, ed)}
                                    placeholder="항목 입력..."
                                    className={`text-[14px] leading-tight py-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}
                                    compact
                                />
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onItemTagClick(item.id, sectionId, item.text);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                title="태그 (이동)"
                            >
                                <span className="text-xs font-bold font-mono">#</span>
                            </button>
                        </div>
                    );
                })}
                {items.length === 0 && <div className="text-center py-2 text-slate-300 text-[10px] italic">항목이 없습니다</div>}
            </div>
        </div>
    );
};


const TodoWidget: React.FC<TodoWidgetProps> = ({
    info,
    onChange,
    onShowTodoCat1Memo,
    onShowTodoCat2Memo,
    onShowTodoCat3Memo,
    onShowTodoCat4Memo,
    onAddToCalendar,
    mainHeaderClass,
    subHeaderClass,
    todoTagClass,
    onOpenItemMemoAtPage,
    dragState,
    setDragState,
    onCrossSectionDrop,
    onItemTagClick,
    dataSectionId
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        itemId: string | null;
        itemText: string;
        type: 1 | 2 | 3 | 4 | 5
    }>({
        isOpen: false,
        itemId: null,
        itemText: '',
        type: 1
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

    const updateList = (type: 1 | 2 | 3 | 4 | 5, newItems: ListItem[]) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        onChange({ ...info, [key]: newItems });
    };

    const handleAddItem = (type: 1 | 2 | 3 | 4 | 5) => {
        const newItemId = Math.random().toString(36).substr(2, 9);
        const newItem: ListItem = { id: newItemId, text: '', completed: false };
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = (info[key] as ListItem[]) || [];
        updateList(type, [...currentItems, newItem]);

        // 신규 추가 후 즉시 메모 모달 오픈 
        const showMemo = [onShowTodoCat1Memo, onShowTodoCat2Memo, onShowTodoCat3Memo, onShowTodoCat4Memo][type - 1];
        if (showMemo) showMemo(newItemId);
    };

    const handleDeleteItem = (type: 1 | 2 | 3 | 4 | 5, itemId: string) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = (info[key] as ListItem[]) || [];
        updateList(type, currentItems.filter(i => i.id !== itemId));
    };

    const handleToggleItem = (type: 1 | 2 | 3 | 4 | 5, itemId: string) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = (info[key] as ListItem[]) || [];
        updateList(type, currentItems.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i));
    };

    const handleUpdateText = (type: 1 | 2 | 3 | 4 | 5, itemId: string, text: string) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = (info[key] as ListItem[]) || [];
        updateList(type, currentItems.map(i => i.id === itemId ? { ...i, text } : i));
    };

    const handleUpdateTitle = (type: 1 | 2 | 3 | 4 | 5, title: string) => {
        const key = `category${type}Title` as keyof TodoManagementInfo;
        onChange({ ...info, [key]: title });
    };

    const handleReorder = (type: 1 | 2 | 3 | 4 | 5, draggedId: string, targetId: string) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = (info[key] as ListItem[]) || [];
        const draggedIdx = currentItems.findIndex(i => i.id === draggedId);
        const targetIdx = currentItems.findIndex(i => i.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return;
        const newItems = [...currentItems];
        const [draggedItem] = newItems.splice(draggedIdx, 1);
        newItems.splice(targetIdx, 0, draggedItem);
        updateList(type, newItems);
    };

    const handleReorderSubSections = (draggedType: number, targetType: number) => {
        if (draggedType === targetType) return;

        const newInfo = { ...info };
        
        const titleKey1 = `category${draggedType}Title` as keyof TodoManagementInfo;
        const itemsKey1 = `category${draggedType}Items` as keyof TodoManagementInfo;
        const memosKey1 = `category${draggedType}Memos` as keyof TodoManagementInfo;
        
        const titleKey2 = `category${targetType}Title` as keyof TodoManagementInfo;
        const itemsKey2 = `category${targetType}Items` as keyof TodoManagementInfo;
        const memosKey2 = `category${targetType}Memos` as keyof TodoManagementInfo;

        const tempTitle = (info as any)[titleKey1] ?? '';
        const tempItems = (info as any)[itemsKey1] ?? [];
        const tempMemos = (info as any)[memosKey1] ?? {};

        (newInfo as any)[titleKey1] = (info as any)[titleKey2] ?? '';
        (newInfo as any)[itemsKey1] = (info as any)[itemsKey2] ?? [];
        (newInfo as any)[memosKey1] = (info as any)[memosKey2] ?? {};

        (newInfo as any)[titleKey2] = tempTitle;
        (newInfo as any)[itemsKey2] = tempItems;
        (newInfo as any)[memosKey2] = tempMemos;

        onChange(newInfo);
    };


    return (
        <div className="flex flex-col h-full bg-white border-2 border-black p-2 shadow-sm overflow-hidden rounded-2xl" data-section-id={dataSectionId}>
            <h2 className={mainHeaderClass || "text-sm font-black text-sky-900 bg-sky-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"} title={info.title || "업무"}>
                <EditableText
                    value={info.title || "업무"}
                    onChange={(newTitle) => onChange({ ...info, title: newTitle })}
                    placeholder="제목 입력..."
                    className="flex-1"
                />
                <div className="flex items-center border-[1.5px] border-black rounded-md overflow-hidden bg-white/50 backdrop-blur-sm self-center mr-1">
                    <button
                        onClick={() => onChange({ ...info, isPinned: !info.isPinned })}
                        className={`flex items-center justify-center px-1.5 h-7 transition-all active:scale-95 text-[10px] font-bold ${info.isPinned ? 'bg-blue-500 text-white' : 'hover:bg-slate-200/50 text-blue-600'}`}
                        title={info.isPinned ? "고정 해제" : "모바일 하단 고정"}
                    >
                        {info.isPinned ? '고정됨' : '고정'}
                    </button>
                </div>
                <span className={todoTagClass || "text-[10px] font-normal text-sky-600 font-mono"}>TODO</span>
            </h2>

            <div className="flex-1 flex flex-col min-h-0 gap-1.5 overflow-hidden">
                <SubSection 
                    sectionId="todoCat1" title={info.category1Title} type={1} items={info.category1Items || []} memos={info.category1Memos} 
                    onShowMemo={onShowTodoCat1Memo} colorIndex={0} 
                    dragState={dragState} setDragState={setDragState} handleReorder={handleReorder} 
                    handleReorderSubSections={handleReorderSubSections} onCrossSectionDrop={onCrossSectionDrop}
                    handleUpdateTitle={handleUpdateTitle} handleAddItem={handleAddItem} handleUpdateText={handleUpdateText}
                    handleEditingChange={handleEditingChange} editingItemIds={editingItemIds} toggleMenu={toggleMenu}
                    onItemTagClick={onItemTagClick} triggerRefs={triggerRefs} onOpenItemMemoAtPage={onOpenItemMemoAtPage} subHeaderClass={subHeaderClass}
                />
                <SubSection 
                    sectionId="todoCat2" title={info.category2Title} type={2} items={info.category2Items || []} memos={info.category2Memos} 
                    onShowMemo={onShowTodoCat2Memo} colorIndex={1} 
                    dragState={dragState} setDragState={setDragState} handleReorder={handleReorder} 
                    handleReorderSubSections={handleReorderSubSections} onCrossSectionDrop={onCrossSectionDrop}
                    handleUpdateTitle={handleUpdateTitle} handleAddItem={handleAddItem} handleUpdateText={handleUpdateText}
                    handleEditingChange={handleEditingChange} editingItemIds={editingItemIds} toggleMenu={toggleMenu}
                    onItemTagClick={onItemTagClick} triggerRefs={triggerRefs} onOpenItemMemoAtPage={onOpenItemMemoAtPage} subHeaderClass={subHeaderClass}
                />
                <SubSection 
                    sectionId="todoCat3" title={info.category3Title} type={3} items={info.category3Items || []} memos={info.category3Memos} 
                    onShowMemo={onShowTodoCat3Memo} colorIndex={2} 
                    dragState={dragState} setDragState={setDragState} handleReorder={handleReorder} 
                    handleReorderSubSections={handleReorderSubSections} onCrossSectionDrop={onCrossSectionDrop}
                    handleUpdateTitle={handleUpdateTitle} handleAddItem={handleAddItem} handleUpdateText={handleUpdateText}
                    handleEditingChange={handleEditingChange} editingItemIds={editingItemIds} toggleMenu={toggleMenu}
                    onItemTagClick={onItemTagClick} triggerRefs={triggerRefs} onOpenItemMemoAtPage={onOpenItemMemoAtPage} subHeaderClass={subHeaderClass}
                />
                <SubSection 
                    sectionId="todoCat4" title={info.category4Title} type={4} items={info.category4Items || []} memos={info.category4Memos} 
                    onShowMemo={onShowTodoCat4Memo} colorIndex={3} 
                    dragState={dragState} setDragState={setDragState} handleReorder={handleReorder} 
                    handleReorderSubSections={handleReorderSubSections} onCrossSectionDrop={onCrossSectionDrop}
                    handleUpdateTitle={handleUpdateTitle} handleAddItem={handleAddItem} handleUpdateText={handleUpdateText}
                    handleEditingChange={handleEditingChange} editingItemIds={editingItemIds} toggleMenu={toggleMenu}
                    onItemTagClick={onItemTagClick} triggerRefs={triggerRefs} onOpenItemMemoAtPage={onOpenItemMemoAtPage} subHeaderClass={subHeaderClass}
                />
            </div>

            {openMenuId && (() => {
                const type1Items = info.category1Items || [];
                const type2Items = info.category2Items || [];
                const type3Items = info.category3Items || [];
                const type4Items = info.category4Items || [];
                const allItems = [...type1Items, ...type2Items, ...type3Items, ...type4Items];
                const item = allItems.find(i => i.id === openMenuId);
                if (!item) return null;

                const type = type1Items.some(i => i.id === openMenuId) ? 1 :
                    type2Items.some(i => i.id === openMenuId) ? 2 :
                        type3Items.some(i => i.id === openMenuId) ? 3 : 4;

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

export default TodoWidget;
