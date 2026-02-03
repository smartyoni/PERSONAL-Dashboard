import React from 'react';
import EditableTextArea from './EditableTextArea';

interface HeaderGoalsProps {
  goal1: string;
  goal2: string;
  onGoal1Change: (value: string) => void;
  onGoal2Change: (value: string) => void;
}

const HeaderGoals: React.FC<HeaderGoalsProps> = ({
  goal1,
  goal2,
  onGoal1Change,
  onGoal2Change
}) => {
  return (
    <div className="flex flex-row gap-3 w-full">
      <div className="flex-1">
        <EditableTextArea
          value={goal1}
          onChange={onGoal1Change}
          placeholder="목표 1"
          className="bg-white border-2 border-slate-400 shadow-sm"
          textClassName="text-red-600 font-bold text-lg"
          rows={2}
          maxLength={100}
        />
      </div>
      <div className="flex-1">
        <EditableTextArea
          value={goal2}
          onChange={onGoal2Change}
          placeholder="목표 2"
          className="bg-white border-2 border-slate-400 shadow-sm"
          textClassName="text-blue-600 font-bold text-lg"
          rows={2}
          maxLength={100}
        />
      </div>
    </div>
  );
};

export default HeaderGoals;
