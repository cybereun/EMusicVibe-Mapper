import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = ['Destination', 'Scenery', 'Vibe'];
  
  return (
    <div className="flex items-center justify-center space-x-6 mb-12">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={label} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-500
                ${isActive ? 'border-amber-500 text-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/20' : 
                  isCompleted ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-800 text-slate-600'}
              `}
            >
              {isCompleted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : stepNum}
            </div>
            <span className={`ml-3 text-[11px] uppercase tracking-[0.2em] font-black ${isActive ? 'text-amber-500' : 'text-slate-600'}`}>
              {label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 rounded-full ${isCompleted ? 'bg-amber-500' : 'bg-slate-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;