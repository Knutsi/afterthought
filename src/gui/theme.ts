export interface Theme {
    name: string
    colors: {
        primary: string
        secondary: string
        background: string
        text: string
    }
}


export function getTheme(): Theme {
    // Check for dark mode preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
        return {
            name: "dark",
            colors: {
                primary: "#3b82f6",      // Modern blue accent
                secondary: "#64748b",    // Slate gray
                background: "#1e293b",   // Dark slate background
                text: "#f1f5f9"          // Light text
            }
        }
    }
    
    return {
        name: "default",
        colors: {
            primary: "#2563eb",          // Modern blue accent
            secondary: "#64748b",        // Slate gray
            background: "#ffffff",        // White background
            text: "#1e293b"              // Dark slate text
        }
    }
}