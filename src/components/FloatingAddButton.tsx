import { Plus } from 'lucide-react';
import React from 'react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-indigo-500/50 transition-all active:scale-90 z-30 group animate-bounce"
    >
      <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300"></div>
    </button>
  );
};

export default FloatingAddButton;
