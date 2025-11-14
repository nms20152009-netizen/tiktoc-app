
import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { GemiliveAssistant } from './components/GemiliveAssistant';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';

type View = 'camera' | 'assistant' | 'imageEditor' | 'videoGenerator';

// SVG Icon components for navigation
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const MagicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const FilmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;


const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClasses = 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-md';
    const inactiveClasses = 'text-gray-600 hover:bg-gray-200';
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center sm:space-x-2 px-2 sm:px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}
            aria-label={label}
        >
            {icon}
            <span className="mt-1 sm:mt-0 text-xs sm:text-sm">{label}</span>
        </button>
    );
};


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('camera');
    const [imageForGenerator, setImageForGenerator] = useState<string | null>(null);

    const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
        { view: 'camera', label: 'Cámara', icon: <CameraIcon /> },
        { view: 'imageEditor', label: 'Editor', icon: <MagicIcon /> },
        { view: 'videoGenerator', label: 'Video', icon: <FilmIcon /> },
        { view: 'assistant', label: 'Asistente', icon: <MicIcon /> },
    ];
    
    const handleNavigateToGenerator = (imageDataUrl: string) => {
        setImageForGenerator(imageDataUrl);
        setCurrentView('videoGenerator');
    };

    const handleViewChange = (view: View) => {
        // Clear the passed-in image when navigating away from the generator
        if (currentView === 'videoGenerator') {
            setImageForGenerator(null);
        }
        setCurrentView(view);
    };


    return (
        <div className="h-screen w-screen bg-gray-900 font-sans flex flex-col antialiased">
            <header className="flex-shrink-0 bg-white shadow-md z-30">
                <div className="container mx-auto px-2 sm:px-4 py-2 flex justify-between items-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">
                        TikFsceS
                        <span className="ml-2 text-xs sm:text-sm font-light text-gray-500 hidden sm:inline">by Delia</span>
                    </h1>
                    <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-full w-full max-w-sm sm:max-w-md">
                        {navItems.map(item => (
                            <NavButton
                                key={item.view}
                                label={item.label}
                                icon={item.icon}
                                isActive={currentView === item.view}
                                onClick={() => handleViewChange(item.view)}
                            />
                        ))}
                    </nav>
                </div>
            </header>
            
            <main className="flex-grow relative overflow-hidden bg-white">
                {currentView === 'camera' && <CameraView onNavigateToGenerator={handleNavigateToGenerator} />}
                {currentView === 'assistant' && <GemiliveAssistant />}
                {currentView === 'imageEditor' && <ImageEditor onNavigateToGenerator={handleNavigateToGenerator} />}
                {currentView === 'videoGenerator' && <VideoGenerator initialImageDataUrl={imageForGenerator} />}
            </main>
        </div>
    );
};

export default App;
