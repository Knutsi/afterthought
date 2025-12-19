import { App, ElementName } from "./App";

export function setupAppFeature()
{
// 6. Register the component
    customElements.define(ElementName, App);
    console.log("Feature added: App")
}