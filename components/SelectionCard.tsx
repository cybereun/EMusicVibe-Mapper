import React from 'react';
import { VibeOption } from '../types';

interface SelectionCardProps {
  option: VibeOption;
  selected: boolean;
  onClick: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ option, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl aspect-square transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900
        ${selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}
      `}
    >
      <img 
        src={option.image} 
        alt={option.label} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${selected ? 'opacity-90' : 'opacity-70 group-hover:opacity-80'}`} />
      
      <div className="absolute bottom-0 left-0 w-full p-4 text-left">
        <h3 className={`text-lg font-bold serif mb-1 ${selected ? 'text-amber-400' : 'text-white'}`}>
          {option.label}
        </h3>
        <p className="text-xs text-slate-300 opacity-80">
          {option.keywords.slice(0, 2).join(' • ')}
        </p>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg">
          ✓
        </div>
      )}
    </button>
  );
};

export default SelectionCard;
