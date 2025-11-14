export interface Transcript {
  speaker: 'user' | 'gemini';
  text: string;
}

// FIX: To resolve module augmentation conflicts, the 'aistudio' property on the global
// 'Window' object is now typed with a named interface 'AIStudio', also declared globally.
// This allows TypeScript to correctly merge this definition with any other declarations
// of 'window.aistudio' that also use the 'AIStudio' type.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        // FIX: Removed `readonly` modifier to resolve "All declarations of 'aistudio' must have identical modifiers" error.
        // Another global declaration for 'aistudio' exists without this modifier, so removing it ensures consistency.
        aistudio: AIStudio;
    }
}
