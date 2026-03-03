
import React, { useState, useEffect, useRef } from 'react';

interface UrlInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
    initialUrl: string;
    title: string;
}

const UrlInputModal: React.FC<UrlInputModalProps> = ({ isOpen, onClose, onSave, initialUrl, title }) => {
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
            // 포커스 지연 (모달 애니메이션 끝난 후)
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, initialUrl]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(url);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-cyan-600">🔗</span> {title} URL 설정
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">웹사이트 주소</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                                    <span className="text-sm font-medium">https://</span>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={url.replace(/^https?:\/\//, '')}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="example.com"
                                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-cyan-400 focus:bg-white transition-all text-slate-700 font-medium placeholder:text-slate-300 shadow-inner"
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 italic">
                                * 도메인 주소만 입력해도 자동으로 연결됩니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all active:scale-95"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm shadow-lg shadow-cyan-200 hover:bg-cyan-700 hover:shadow-cyan-300 transition-all active:scale-95 border-b-4 border-cyan-800"
                    >
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UrlInputModal;
