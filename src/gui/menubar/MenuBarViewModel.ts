export interface MenuBarViewModel {
    menuItems: MenuItem[];
}


interface MenuItem {
    label: string;
    items: MenuItem[];
    shortcut: string;
}

