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
      className={`group relative overflow-hidden rounded-[2rem] aspect-square transition-all duration-500 
        ${selected 
          ? 'ring-4 ring-amber-500 ring-offset-8 ring-offset-slate-950 scale-[1.03] shadow-[0_0_50px_rgba(245,158,11,0.15)] z-10' 
          : 'hover:scale-[1.02] opacity-80 hover:opacity-100'
        }
      `}
    >
      <img 
        src={option.image} 
        alt={option.label} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent transition-opacity duration-300 ${selected ? 'opacity-90' : 'opacity-70 group-hover:opacity-80'}`} />
      
      <div className="absolute bottom-0 left-0 w-full p-8 text-left">
        <h3 className={`text-2xl font-bold serif mb-2 transition-colors duration-300 ${selected ? 'text-amber-400' : 'text-white'}`}>
          {option.label}
        </h3>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
          {option.keywords.slice(0, 2).join(' • ')}
        </p>
      </div>

      {selected && (
        <div className="absolute top-6 right-6 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-xl animate-scaleIn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default SelectionCard;