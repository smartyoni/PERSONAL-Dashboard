import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';

interface MoveItemModalProps {
  isOpen: boolean;
  itemText: string;
  currentTabId: string;
  currentSectionId: string;
  tabs: Tab[];
  onMove: (targetTabId: string, targetSectionId: string) => void;
  onCancel: () => void;
}

const MoveItemModal: React.FC<MoveItemModalProps> = ({
  isOpen,
  itemText,
  currentTabId,
  currentSectionId,
  tabs,
  onMove,
  onCancel
}) => {
  const [selectedTabId, setSelectedTabId] = useState(currentTabId);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onCancel);

  // 탭 변경 시 첫 번째 잠기지 않은 섹션 자동 선택
  useEffect(() => {
    const selectedTab = tabs.find(t => t.id === selectedTabId);
    if (selectedTab) {
      const firstUnlockedSection = selectedTab.sections.find(s => !s.isLocked);
      setSelectedSectionId(firstUnlockedSection?.id || '');
    }
  }, [selectedTabId, tabs]);

  if (!isOpen) return null;

  const currentTab = tabs.find(t => t.id === currentTabId);
  const currentSection = currentTab?.sections.find(s => s.id === currentSectionId);
  const selectedTab = tabs.find(t => t.id === selectedTabId);

  const canMove =
    selectedSectionId &&
    !(selectedTabId === currentTabId && selectedSectionId === currentSectionId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">📦 항목 이동</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="px-6 py-6 space-y-4">
          {/* 현재 위치 */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">현재 위치</p>
            <p className="text-sm font-semibold text-slate-700">
              {currentTab?.name} &gt; {currentSection?.title}
            </p>
          </div>

          {/* 항목 미리보기 */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">이동할 항목</p>
            <p className="text-sm font-medium text-slate-800 truncate">
              {itemText || '(빈 항목)'}
            </p>
          </div>

          {/* 대상 탭 선택 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              이동할 페이지
            </label>
            <select
              value={selectedTabId}
              onChange={(e) => setSelectedTabId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* 대상 섹션 선택 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              이동할 섹션
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 rounded-lg p-3">
              {selectedTab?.sections.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">
                  이 페이지에는 섹션이 없습니다
                </p>
              ) : (
                selectedTab?.sections.map((section) => (
                  <label
                    key={section.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      section.isLocked
                        ? 'bg-slate-100 cursor-not-allowed'
                        : 'hover:bg-slate-50'
                    } ${
                      selectedSectionId === section.id
                        ? 'bg-blue-50 border border-blue-300'
                        : 'border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetSection"
                      value={section.id}
                      checked={selectedSectionId === section.id}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      disabled={section.isLocked}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed flex-shrink-0"
                    />
                    <span
                      className={`text-sm font-medium flex-1 ${
                        section.isLocked
                          ? 'text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {section.title}
                      {section.isLocked && (
                        <span className="ml-2 text-xs text-slate-400">
                          🔒 잠김
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onMove(selectedTabId, selectedSectionId)}
            disabled={!canMove}
            className="px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
          >
            이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemModal;
