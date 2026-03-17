import React, { useState, useRef } from 'react';
import { TodoManagementInfo, ListItem } from '../types';
import EditableText from './EditableText';
import { useClickOutside } from '../hooks/useClickOutside';

interface TodoWidgetProps {
    info: TodoManagementInfo;
    onChange: (newInfo: TodoManagementInfo) => void;
    onShowTodoCat1Memo: (itemId: string) => void;
    onShowTodoCat2Memo: (itemId: string) => void;
    onShowTodoCat3Memo: (itemId: string) => void;
    onShowTodoCat4Memo: (itemId: string) => void;
    onShowTodoCat5Memo: (itemId: string) => void;
    onAddToCalendar: (itemText: string) => void;
    mainHeaderClass?: string;
    subHeaderClass?: string;
    todoTagClass?: string;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({
    info,
    onChange,
    onShowTodoCat1Memo,
    onShowTodoCat2Memo,
    onShowTodoCat3Memo,
    onShowTodoCat4Memo,
    onShowTodoCat5Memo,
    onAddToCalendar,
    mainHeaderClass,
    subHeaderClass,
    todoTagClass
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
        const currentItems = info[key] as ListItem[];
        updateList(type, [...currentItems, newItem]);

        // 신규 추가 후 즉시 메모 모달 오픈 
        if (type === 1) onShowTodoCat1Memo(newItemId);
        else if (type === 2) onShowTodoCat2Memo(newItemId);
        else if (type === 3) onShowTodoCat3Memo(newItemId);
        else if (type === 4) onShowTodoCat4Memo(newItemId);
        else if (type === 5) onShowTodoCat5Memo(newItemId);
    };

    const handleDeleteItem = (type: 1 | 2 | 3 | 4 | 5, itemId: string) => {
        const key = `category${type}Items` as keyof TodoManagementInfo;
        const currentItems = info[key] as ListItem[];
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
        const currentItems = info[key] as ListItem[];
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

        const tempTitle = info[titleKey1] !== undefined ? info[titleKey1] : '';
        const tempItems = info[itemsKey1] !== undefined ? info[itemsKey1] : [];
        const tempMemos = info[memosKey1] !== undefined ? info[memosKey1] : {};

        (newInfo as any)[titleKey1] = info[titleKey2] !== undefined ? info[titleKey2] : '';
        (newInfo as any)[itemsKey1] = info[itemsKey2] !== undefined ? info[itemsKey2] : [];
        (newInfo as any)[memosKey1] = info[memosKey2] !== undefined ? info[memosKey2] : {};

        (newInfo as any)[titleKey2] = tempTitle;
        (newInfo as any)[itemsKey2] = tempItems;
        (newInfo as any)[memosKey2] = tempMemos;

        onChange(newInfo);
    };

    const SubSection = ({ title, type, items, memos, onShowMemo }: {
        title: string,
        type: 1 | 2 | 3 | 4 | 5,
        items: ListItem[],
        memos: { [key: string]: string },
        onShowMemo: (id: string) => void
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
                className={`flex-1 flex flex-col min-h-0 border-b border-sky-400 last:border-b-0 py-1 first:pt-0 transition-all ${dragState.isDraggingSection ? 'opacity-30 bg-sky-50' : dragState.isDragOverSection ? 'bg-sky-100/50 scale-[1.02] border-l-4 border-l-sky-600' : ''}`}
                draggable={true}
                onDragStart={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.draggable && target.tagName !== 'DIV') return;
                    e.dataTransfer.setData('todoSectionType', type.toString());
                    setDragState(p => ({ ...p, isDraggingSection: true }));
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.types.includes('todoSectionType')) {
                        if (!dragState.isDragOverSection) setDragState(p => ({ ...p, isDragOverSection: true }));
                    }
                }}
                onDragLeave={() => {
                    setDragState(p => ({ ...p, isDragOverSection: false }));
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const draggedTypeStr = e.dataTransfer.getData('todoSectionType');
                    if (draggedTypeStr) {
                        const draggedType = parseInt(draggedTypeStr) as 1 | 2 | 3 | 4 | 5;
                        if (draggedType !== type) {
                            handleReorderSubSections(draggedType, type);
                        }
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
                        onChange={(txt) => handleUpdateTitle(type, txt)}
                        placeholder="제목 입력..."
                        className={subHeaderClass || "text-[17px] font-bold text-green-600"}
                        compact
                    />
                    <button onClick={() => handleAddItem(type)} className="text-[11px] text-sky-600 hover:text-sky-700 font-bold">+ 추가</button>
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
                            className={`flex items-start gap-1 py-1 rounded transition-all group ${dragState.draggedItemId === item.id ? 'opacity-40 bg-slate-50' : dragState.dragOverItemId === item.id ? 'bg-sky-50 border-l-2 border-sky-400' : 'hover:bg-slate-50'}`}
                        >
                            <button
                                ref={el => triggerRefs.current[item.id] = el}
                                onClick={(e) => toggleMenu(e, item.id)}
                                className="text-2xl leading-none -mt-1 w-4 h-6 flex items-center justify-center text-blue-400 hover:text-blue-500 transition-colors"
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
            <h2 className={mainHeaderClass || "text-sm font-black text-sky-900 bg-sky-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"} title={info.title || "할일관리"}>
                <EditableText
                    value={info.title || "할일관리"}
                    onChange={(newTitle) => onChange({ ...info, title: newTitle })}
                    placeholder="제목 입력..."
                    className="flex-1"
                />
                <span className={todoTagClass || "text-[10px] font-normal text-sky-600 font-mono"}>TODO</span>
            </h2>



            <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
                <SubSection title={info.category1Title} type={1} items={info.category1Items || []} memos={info.category1Memos} onShowMemo={onShowTodoCat1Memo} />
                <SubSection title={info.category2Title} type={2} items={info.category2Items || []} memos={info.category2Memos} onShowMemo={onShowTodoCat2Memo} />
                <SubSection title={info.category3Title} type={3} items={info.category3Items || []} memos={info.category3Memos} onShowMemo={onShowTodoCat3Memo} />
                <SubSection title={info.category4Title} type={4} items={info.category4Items || []} memos={info.category4Memos} onShowMemo={onShowTodoCat4Memo} />
                <SubSection title={info.category5Title} type={5} items={info.category5Items || []} memos={info.category5Memos} onShowMemo={onShowTodoCat5Memo} />
            </div>

            {openMenuId && (() => {
                const type1Items = info.category1Items || [];
                const type2Items = info.category2Items || [];
                const type3Items = info.category3Items || [];
                const type4Items = info.category4Items || [];
                const type5Items = info.category5Items || [];
                const allItems = [...type1Items, ...type2Items, ...type3Items, ...type4Items, ...type5Items];
                const item = allItems.find(i => i.id === openMenuId);
                if (!item) return null;

                const type = type1Items.some(i => i.id === openMenuId) ? 1 :
                    type2Items.some(i => i.id === openMenuId) ? 2 :
                        type3Items.some(i => i.id === openMenuId) ? 3 : 
                            type4Items.some(i => i.id === openMenuId) ? 4 : 5;

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

export default TodoWidget;
