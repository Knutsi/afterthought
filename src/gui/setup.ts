import { setupTabs } from "./tabs/tabs";
import { setupMainLayout } from "./layout/MainLayout";
import { setupMenubar } from "./menubar/setup";

export function setupSharedUxComponents() {
    setupTabs();
    setupMainLayout();
    setupMenubar();
}
