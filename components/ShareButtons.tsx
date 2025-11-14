import React from 'react';

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.28-1.1-.68-1.6-1.02-.34-.24-.68-.5-1.02-.77-.2-.16-.4-.33-.6-.51v3.74c.26.1.52.2.78.3.9.33 1.82.5 2.75.52v4.03c-1.14-.02-2.28-.2-3.36-.51-1.03-.3-2.02-.75-2.9-1.32-.43-.28-.85-.6-1.25-.95-.36-.31-.7-.66-1.02-1.03-.18-.2-.34-.42-.5-.63v6.02c-1.66-.02-3.32-.02-4.98 0 .02-1.56.52-3.15 1.6-4.27 1.07-1.1 2.6-1.6 4.1-1.77V8.4c-.26-.1-.52-.2-.78-.3-.9-.32-1.82-.5-2.75-.51V4.03c1.14.02 2.28.2 3.36.51 1.03.3 2.02.75 2.9 1.32.43.28.85.6 1.25.95.36.31.7.66 1.02 1.03.18.2.34.42.5.63V.02z"></path></svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z"></path></svg>
);


export const ShareButtons: React.FC = () => {
    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const redirectToTikTok = () => { openInNewTab("https://www.tiktok.com/upload"); };
    // FIX: Updated the URL to point to a more specific page for creating a video post on Facebook,
    // which is more user-friendly and less likely to cause connection issues.
    const redirectToFacebook = () => { openInNewTab("https://www.facebook.com/add-video/"); };

    const buttons = [
        { name: 'TikTok', icon: <TikTokIcon />, action: redirectToTikTok, color: 'bg-black text-white' },
        { name: 'Facebook', icon: <FacebookIcon />, action: redirectToFacebook, color: 'bg-blue-600 text-white' },
    ];

    return (
        <div>
            <h4 className="text-sm font-semibold text-center text-gray-600 mb-3">
                ¡Listo para compartir!
            </h4>
            <div className="flex justify-center items-center space-x-3">
                {buttons.map((button) => (
                    <button
                        key={button.name}
                        onClick={button.action}
                        aria-label={`Compartir en ${button.name}`}
                        className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full font-semibold shadow-md transform transition-transform active:scale-95 hover:shadow-lg ${button.color}`}
                    >
                        {button.icon}
                        <span className="text-sm">{button.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};