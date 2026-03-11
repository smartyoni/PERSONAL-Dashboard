import React, { useState } from 'react';

interface AddToCalendarModalProps {
  isOpen: boolean;
  itemText: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string, isAllDay: boolean) => void;
}

const AddToCalendarModal: React.FC<AddToCalendarModalProps> = ({
  isOpen,
  itemText,
  onClose,
  onConfirm,
}) => {
  // 기본값: 오늘 날짜
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [isAllDay, setIsAllDay] = useState(true); // 기본값: 종일
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isAllDay) {
      // 종일 이벤트: date 형식 사용
      onConfirm(startDate, startDate, true);
    } else {
      // 시간 지정 이벤트: dateTime 형식 사용
      const start = `${startDate}T${startTime}:00`;
      const end = `${startDate}T${endTime}:00`;
      onConfirm(start, end, false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          📅 캘린더에 추가
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            일정 제목
          </label>
          <input
            type="text"
            value={itemText}
            disabled
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">종일</span>
          </label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!startDate}
            className="px-8 py-2.5 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCalendarModal;
