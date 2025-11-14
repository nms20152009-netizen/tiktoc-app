import React from 'react';

interface SuggestionsOverlayProps {
  suggestions: string[];
  isLoading: boolean;
  onClear: () => void;
}

const SuggestionIcon = ({ type }: { type: string }) => {
    // A simple heuristic to assign an icon based on keywords
    if (type.toLowerCase().includes('luz') || type.toLowerCase().includes('composición') || type.toLowerCase().includes('contraste')) return <span className="text-2xl">💡</span>;
    if (type.toLowerCase().includes('tendencia') || type.toLowerCase().includes('audio') || type.toLowerCase().includes('viral')) return <span className="text-2xl">📈</span>;
    if (type.toLowerCase().includes('sonríe') || type.toLowerCase().includes('engagement') || type.toLowerCase().includes('audiencia')) return <span className="text-2xl">😊</span>;
    return <span className="text-2xl">✨</span>;
};


export const SuggestionsOverlay: React.FC<SuggestionsOverlayProps> = ({ suggestions, isLoading, onClear }) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg text-center text-blue-900 flex flex-col items-center">
            <div className="relative h-16 w-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-pink-500 animate-spin" style={{ animationDuration: '1.2s' }}></div>
            </div>
          <p className="font-semibold">Analizando tu escena...</p>
          <p className="text-sm text-gray-500">Gemilive está buscando ideas.</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-4 z-20" onClick={onClear}>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-center text-blue-900 mb-2">Sugerencias de Gemilive</h3>
            {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white">
                        <SuggestionIcon type={suggestion} />
                    </div>
                    <p className="text-gray-800 text-sm pt-1">{suggestion}</p>
                </div>
            ))}
             <p className="text-xs text-center text-gray-500 pt-2">Toca en cualquier lugar para cerrar</p>
        </div>
    </div>
  );
};
