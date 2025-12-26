
import React, { useState, useEffect } from 'react';
import { DESTINATIONS, VIEWS, MOODS } from './constants';
import { VibeOption, UserSelection, GeneratedResult, Step } from './types';
import StepIndicator from './components/StepIndicator';
import SelectionCard from './components/SelectionCard';
import ResultView from './components/ResultView';
import { generateTitles, generateThumbnail, generateColorPalette, testConnection } from './services/geminiService';

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('destination');
  const [selection, setSelection] = useState<UserSelection>({
    destination: null,
    view: null,
    mood: null,
    aspectRatio: "1:1",
  });
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customDestInput, setCustomDestInput] = useState("");
  const [customViewInput, setCustomViewInput] = useState("");
  
  // Security & Key Management State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean, message?: string} | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  const handleOpenKeyPicker = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume success per guidelines
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    const res = await testConnection();
    setTestResult(res);
    setIsTestingConn(false);
  };

  const handleSelection = (option: VibeOption) => {
    const nextSelection = { ...selection, [currentStep]: option };
    setSelection(nextSelection);
    
    if (currentStep === 'destination') {
      setTimeout(() => setCurrentStep('view'), 300);
    } else if (currentStep === 'view') {
      setTimeout(() => setCurrentStep('mood'), 300);
    }
  };

  const handleCustomDestination = () => {
    if (!customDestInput.trim()) return;
    handleSelection({
      id: `custom-dest-${Date.now()}`,
      label: customDestInput,
      keywords: [customDestInput, 'Custom'],
      image: 'https://picsum.photos/200/200?grayscale'
    });
  };

  const handleCustomView = () => {
    if (!customViewInput.trim()) return;
    handleSelection({
      id: `custom-view-${Date.now()}`,
      label: customViewInput,
      keywords: [customViewInput, 'Custom'],
      image: 'https://picsum.photos/200/200?grayscale'
    });
  };

  const handleGenerate = async () => {
    if (!selection.destination || !selection.view || !selection.mood) return;
    
    // Safety check for key
    if (!hasKey && window.aistudio) {
      setIsSettingsOpen(true);
      setError("Please configure your API Key in Settings before generating.");
      return;
    }

    setCurrentStep('generating');
    setError(null);

    try {
      const colors = await generateColorPalette(selection.mood.label);
      const titlesPromise = generateTitles(selection);
      const thumbnailPromise = generateThumbnail(selection, colors);
      
      const [titles, thumbnailData] = await Promise.all([titlesPromise, thumbnailPromise]);

      setResult({
        titles,
        thumbnailUrl: thumbnailData.url,
        colors,
        promptUsed: thumbnailData.prompt
      });
      setCurrentStep('result');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found")) {
         setHasKey(false);
         setIsSettingsOpen(true);
         setError("API Key session expired or invalid. Please re-select your key.");
      } else {
         setError("Interference detected. Please check your connection and try again.");
      }
      setCurrentStep('mood');
    }
  };

  const resetApp = () => {
    setSelection({ ...selection, destination: null, view: null, mood: null });
    setResult(null);
    setCustomDestInput("");
    setCustomViewInput("");
    setCurrentStep('destination');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={resetApp}>
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight serif">
            E-Music<span className="text-amber-500">Vibe</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-full border ${hasKey ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'} text-[10px] font-bold uppercase tracking-widest`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{hasKey ? 'API Connected' : 'Key Required'}</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold serif flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security & Connection
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-tighter">Current Key Status</p>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${hasKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hasKey ? 'Key Provisioned Externally' : 'No Key Selected'}
                  </span>
                  <button 
                    onClick={handleOpenKeyPicker}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                  >
                    Change Key
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleTestConnection}
                  disabled={isTestingConn}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isTestingConn ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'Test Connection'}
                </button>
                
                {testResult && (
                  <div className={`p-3 rounded-lg text-xs border animate-slideDown ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  This application uses the <strong>Gemini 3 Pro Image</strong> model. To ensure privacy and security, API keys are managed externally by the platform and stored encrypted in your secure environment.
                </p>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400 text-xs font-medium underline inline-flex items-center"
                >
                  Visit Billing Documentation
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {currentStep !== 'result' && currentStep !== 'generating' && (
          <StepIndicator currentStep={currentStep === 'destination' ? 1 : currentStep === 'view' ? 2 : 3} />
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 text-center flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {currentStep === 'generating' ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
             <div className="w-20 h-20 rounded-full border-t-2 border-amber-500 animate-spin mb-8"></div>
             <h2 className="text-2xl serif text-amber-100 mb-2 tracking-wide">Synthesizing Artist Profile...</h2>
             <p className="text-slate-500 text-sm">Gemini 3 Pro Rendering • Studio Quality</p>
          </div>
        ) : currentStep === 'result' && result ? (
          <ResultView result={result} onReset={resetApp} />
        ) : (
          <div className="animate-fadeIn pb-24">
            {/* Aspect Ratio Selector */}
            {currentStep === 'destination' && (
               <div className="mb-8 flex flex-col items-center">
                 <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-4 font-bold">Select Canvas Dimensions</label>
                 <div className="flex flex-wrap justify-center gap-3">
                   {ASPECT_RATIOS.map((ratio) => (
                     <button
                       key={ratio}
                       onClick={() => setSelection({ ...selection, aspectRatio: ratio })}
                       className={`w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 border
                         ${selection.aspectRatio === ratio
                           ? 'bg-amber-500 text-black border-amber-500 scale-110 shadow-lg shadow-amber-500/20'
                           : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                         }
                       `}
                     >
                       {ratio}
                     </button>
                   ))}
                 </div>
               </div>
            )}

            <h2 className="text-3xl md:text-5xl text-center serif text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-12">
              {currentStep === 'destination' ? "Where is your mind traveling?" : 
               currentStep === 'view' ? "What do you see?" : "Set the jazz tone."}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {(currentStep === 'destination' ? DESTINATIONS : currentStep === 'view' ? VIEWS : MOODS).map((option) => (
                <SelectionCard
                  key={option.id}
                  option={option}
                  selected={selection[currentStep as keyof UserSelection]?.id === option.id}
                  onClick={() => handleSelection(option)}
                />
              ))}
            </div>

            {/* Custom Inputs */}
            {currentStep === 'destination' && (
               <div className="mt-12 max-w-md mx-auto">
                 <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-1 flex items-center shadow-2xl">
                   <input 
                      type="text"
                      value={customDestInput}
                      onChange={(e) => setCustomDestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomDestination()}
                      placeholder="Type a custom city..."
                      className="flex-grow bg-transparent border-none text-white placeholder-slate-600 px-5 py-4 focus:ring-0 focus:outline-none text-sm"
                   />
                   <button 
                     onClick={handleCustomDestination}
                     disabled={!customDestInput.trim()}
                     className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-20 disabled:grayscale"
                   >
                     GO
                   </button>
                 </div>
               </div>
            )}

            {currentStep === 'view' && (
               <div className="mt-12 max-w-md mx-auto">
                 <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-1 flex items-center shadow-2xl">
                   <input 
                      type="text"
                      value={customViewInput}
                      onChange={(e) => setCustomViewInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomView()}
                      placeholder="Describe a custom scene..."
                      className="flex-grow bg-transparent border-none text-white placeholder-slate-600 px-5 py-4 focus:ring-0 focus:outline-none text-sm"
                   />
                   <button 
                     onClick={handleCustomView}
                     disabled={!customViewInput.trim()}
                     className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-20 disabled:grayscale"
                   >
                     SET
                   </button>
                 </div>
               </div>
            )}

            <div className="mt-16 flex justify-center sticky bottom-8 z-20">
               {selection.destination && selection.view && selection.mood ? (
                 <button
                    onClick={handleGenerate}
                    className="bg-white hover:bg-amber-500 text-black font-black py-5 px-16 rounded-full shadow-2xl transform transition-all active:scale-95 flex items-center space-x-3 group"
                 >
                    <span className="text-lg">Generate Jazz Vibe</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                 </button>
               ) : (
                 <div className="h-20"></div>
               )}
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-slate-700 text-[10px] uppercase tracking-[0.2em]">
        <p>E-MusicVibe Architecture • Pro Developer Mode • Gemini 3.0 Pro</p>
      </footer>
    </div>
  );
};

export default App;
