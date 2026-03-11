
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 삭제 버튼에 포커스
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      // 엔터 및 스페이스 키 숏컷 추가 (캡처링 단계에서 최우선으로 처리)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // 입력 필드가 포커스된 경우 단축키 무시 (모달 내부/외부 텍스트 편집 중일 수 있음)
          const activeTag = document.activeElement?.tagName;
          const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable;
          if (activeTag === 'TEXTAREA' || activeTag === 'INPUT' || isContentEditable) {
            return;
          }
          e.preventDefault();
          e.stopPropagation(); // 버튼에 포커스 되어 있을 때 네이티브 클릭과 중복 실행 방지
          onConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      };

      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-bold text-slate-800">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors"
          >
            취소
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 focus:ring-4 focus:ring-red-300 outline-none"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
