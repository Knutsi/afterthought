import { ActionList } from "./ActionList";

export function addDebugFeature()
{
    // Register the action-list component
    customElements.define('action-list', ActionList);
    console.log("Feature added: Debug (ActionList)")
}
