export interface ITheme {
    name: string
    colors: {
        primary: string
        secondary: string
        background: string
        text: string
    }
    fonts: {
        fontFamily: string
        fontSize: string
        fontWeight: string
    }
    sizes: {
        menubarHeight: string
        toolbarHeight: string
        statusbarHeight: string
    }
    spacing: {
        padding: string
        borderRadius: string
    }

    time: {
        formattingFunction: (value: Date) => string
        parsingFunction: (value: string) => Date
    }
}

export const defaultTheme: ITheme = {
    name: "default",
    colors: {
        primary: "#2563eb",          // Modern blue accent
        secondary: "#64748b",        // Slate gray
        background: "#ffffff",       // White background
        text: "#1e293b"              // Dark slate text
    },
    fonts: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontWeight: "400"
    },
    sizes: {
        menubarHeight: "32px",
        toolbarHeight: "40px",
        statusbarHeight: "24px"
    },
    spacing: {
        padding: "8px",
        borderRadius: "4px"
    },
    time: {
        formattingFunction: (value: Date) => value.toISOString(),
        parsingFunction: (value: string) => new Date(value)
    }
}

export const defaultDarkTheme: ITheme = {
    name: "default-dark",
    colors: {
        primary: "#3b82f6",          // Lighter blue accent for better visibility on dark
        secondary: "#94a3b8",        // Lighter slate gray for borders and secondary elements
        background: "#0f172a",       // Dark slate background
        text: "#f1f5f9"              // Light slate text
    },
    fonts: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontWeight: "400"
    },
    sizes: {
        menubarHeight: "32px",
        toolbarHeight: "40px",
        statusbarHeight: "24px"
    },
    spacing: {
        padding: "8px",
        borderRadius: "4px"
    },
    time: {
        formattingFunction: (value: Date) => value.toISOString(),
        parsingFunction: (value: string) => new Date(value)
    }
}
