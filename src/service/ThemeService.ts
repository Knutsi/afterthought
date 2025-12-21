import { ITheme, defaultTheme } from "../gui/theme";


export class ThemeService extends EventTarget {
    private currentTheme: ITheme;

    constructor() {
        super();
        this.currentTheme = defaultTheme;
    }

    getTheme(): ITheme {
        return this.currentTheme;
    }

    private applyThemeToDocument(theme: ITheme): void {
        const root = document.documentElement;
        
        // Apply colors
        root.style.setProperty('--theme-color-primary', theme.colors.primary);
        root.style.setProperty('--theme-color-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-color-background', theme.colors.background);
        root.style.setProperty('--theme-color-text', theme.colors.text);
        
        // Apply fonts
        root.style.setProperty('--theme-font-family', theme.fonts.fontFamily);
        root.style.setProperty('--theme-font-size', theme.fonts.fontSize);
        root.style.setProperty('--theme-font-weight', theme.fonts.fontWeight);
        
        // Apply sizes
        root.style.setProperty('--theme-size-menubar-height', theme.sizes.menubarHeight);
        root.style.setProperty('--theme-size-toolbar-height', theme.sizes.toolbarHeight);
        root.style.setProperty('--theme-size-statusbar-height', theme.sizes.statusbarHeight);
        
        // Apply spacing
        root.style.setProperty('--theme-spacing-padding', theme.spacing.padding);
        root.style.setProperty('--theme-spacing-border-radius', theme.spacing.borderRadius);
    }

    applyTheme(theme: ITheme) {
        this.currentTheme = theme;
        this.applyThemeToDocument(theme);
        this.dispatchEvent(new CustomEvent('themechanged', { detail: { theme } }));
    }

    applyDefaultTheme(): void {
        this.applyTheme(defaultTheme);
    }
}