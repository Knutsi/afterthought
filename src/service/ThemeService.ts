import { ITheme, defaultTheme, defaultDarkTheme } from "../gui/theme";


export class ThemeService extends EventTarget {
    private currentTheme: ITheme;
    private darkModeMediaQuery: MediaQueryList;
    private themeRegistry: Map<string, ITheme> = new Map();

    constructor() {
        super();
        this.currentTheme = defaultTheme;
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.setupThemeChangeListener();
        
        // Register default themes
        this.registerTheme(defaultTheme);
        this.registerTheme(defaultDarkTheme);
    }

    getTheme(): ITheme {
        return this.currentTheme;
    }

    private isDarkModePreferred(): boolean {
        return this.darkModeMediaQuery.matches;
    }

    private setupThemeChangeListener(): void {
        // Listen for system theme changes
        if (this.darkModeMediaQuery.addEventListener) {
            this.darkModeMediaQuery.addEventListener('change', () => {
                this.applyDefaultTheme();
            });
        } else {
            // Fallback for older browsers
            this.darkModeMediaQuery.addListener(() => {
                this.applyDefaultTheme();
            });
        }
    }

    private applyThemeToDocument(theme: ITheme): void {
        const root = document.documentElement;
        
        // Apply CSS custom properties
        root.style.setProperty('--theme-color-primary', theme.colors.primary);
        root.style.setProperty('--theme-color-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-color-background', theme.colors.background);
        root.style.setProperty('--theme-color-text', theme.colors.text);
        
        root.style.setProperty('--theme-font-family', theme.fonts.fontFamily);
        root.style.setProperty('--theme-font-size', theme.fonts.fontSize);
        root.style.setProperty('--theme-font-weight', theme.fonts.fontWeight);
        
        root.style.setProperty('--theme-size-menubar-height', theme.sizes.menubarHeight);
        root.style.setProperty('--theme-size-toolbar-height', theme.sizes.toolbarHeight);
        root.style.setProperty('--theme-size-statusbar-height', theme.sizes.statusbarHeight);
        
        root.style.setProperty('--theme-spacing-padding', theme.spacing.padding);
        root.style.setProperty('--theme-spacing-border-radius', theme.spacing.borderRadius);
        
        // Apply direct style properties to document root
        root.style.backgroundColor = theme.colors.background;
        root.style.color = theme.colors.text;
        root.style.fontFamily = theme.fonts.fontFamily;
        root.style.fontSize = theme.fonts.fontSize;
        root.style.fontWeight = theme.fonts.fontWeight;
    }

    applyTheme(theme: ITheme) {
        this.currentTheme = theme;
        this.applyThemeToDocument(theme);
        this.dispatchEvent(new CustomEvent('themechanged', { detail: { theme } }));
    }

    registerTheme(theme: ITheme): void {
        this.themeRegistry.set(theme.name, theme);
    }

    listThemes(): string[] {
        return Array.from(this.themeRegistry.keys());
    }

    applyThemeByName(name: string): boolean {
        const theme = this.themeRegistry.get(name);
        if (!theme) {
            console.warn(`Theme "${name}" not found in registry`);
            return false;
        }
        this.applyTheme(theme);
        return true;
    }

    applyDefaultTheme(): void {
        const theme = this.isDarkModePreferred() ? defaultDarkTheme : defaultTheme;
        this.applyTheme(theme);
    }
}