import { invoke } from "@tauri-apps/api/core";
import { IAction } from "./core/ActionService";

// core services and functions:
import { setupAppFeature } from "./feature/app/setup.ts";
import { setupSharedUxComponents } from "./gui/setup.ts";
import { getDefaultServiceLayer } from "./core/ServiceLayer";

// features:
import { setupProjectBrowser } from "./feature/project-browser/ProjectBrowser";
import { addDebugFeature } from "./feature/debug/setup";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;

async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});

setupSharedUxComponents();

setupAppFeature();
setupProjectBrowser();
addDebugFeature();


var newProjectAction: IAction = {
  id: "core.newProject",
  name: "New Project",
  shortcut: "Ctrl+N",
  group: "File",
  do: async () => {
    console.log("New Project");
  },
  canDo: () => true
}

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcut: "Ctrl+Q",
  group: "File",
  do: async () => {
    console.log("Quit");
  },
  canDo: () => true
}

getDefaultServiceLayer().actionService.addAction(newProjectAction);
getDefaultServiceLayer().actionService.addAction(quitAction);

// Test event system: Add a Help action after 1 second
setTimeout(() => {
  var helpAction: IAction = {
    id: "core.help",
    name: "Help",
    shortcut: "F1",
    group: "Help",
    do: async () => {
      console.log("Help");
    },
    canDo: () => true
  };
  getDefaultServiceLayer().actionService.addAction(helpAction);
}, 1000);