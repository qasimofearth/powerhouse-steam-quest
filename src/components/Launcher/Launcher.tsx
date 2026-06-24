import React from 'react';
import QuestList from './QuestList';

const Launcher: React.FC = () => {
  return (
    <div className="h-screen w-full bg-[#F1F5F9] flex flex-col">
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Quests Hub</h1>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <QuestList />
        </div>
      </div>
    </div>
  );
};

export default Launcher;
