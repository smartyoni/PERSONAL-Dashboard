
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
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
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
