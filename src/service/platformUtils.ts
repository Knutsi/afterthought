const IS_MAC = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export function formatShortcutForDisplay(shortcut: string): string {
  if (IS_MAC) {
    return shortcut
      .replace(/Mod\+/g, "⌘\u2009")
      .replace(/Ctrl\+/g, "⌃\u2009")
      .replace(/Alt\+/g, "⌥\u2009")
      .replace(/Shift\+/g, "⇧\u2009");
  }
  return shortcut.replace(/Mod\+/g, "Ctrl+");
}

export { IS_MAC };
