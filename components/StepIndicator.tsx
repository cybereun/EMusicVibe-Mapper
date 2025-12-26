import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = ['Dest', 'View', 'Mood'];
  
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${isActive ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 
                  isCompleted ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-600 text-slate-600'}
              `}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
            <span className={`ml-2 text-xs uppercase tracking-wider ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
              {label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-amber-600' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
