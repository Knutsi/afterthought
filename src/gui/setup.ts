import { setupTabs } from "./tabs/tabs";
import "./layout/MainLayout"; // Auto-registers via defineComponent
import { setupMenubar } from "./menubar/setup";

export function setupSharedUxComponents() {
    setupTabs();
    // MainLayout auto-registers via side-effect import above
    setupMenubar();
}
