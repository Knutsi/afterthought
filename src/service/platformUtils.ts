const IS_MAC = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export function formatShortcutForDisplay(shortcut: string): string {
  if (IS_MAC) {
    return shortcut
      .replace(/Mod2\+/g, "⌘⌥\u2009")
      .replace(/Mod\+/g, "⌘\u2009")
      .replace(/Ctrl\+/g, "⌃\u2009")
      .replace(/Alt\+/g, "⌥\u2009")
      .replace(/Shift\+/g, "⇧\u2009")
      .replace(/ArrowLeft/g, "←")
      .replace(/ArrowRight/g, "→")
      .replace(/ArrowUp/g, "↑")
      .replace(/ArrowDown/g, "↓");
  }
  return shortcut
    .replace(/Mod2\+/g, "Alt+")
    .replace(/Mod\+/g, "Ctrl+")
    .replace(/ArrowLeft/g, "←")
    .replace(/ArrowRight/g, "→")
    .replace(/ArrowUp/g, "↑")
    .replace(/ArrowDown/g, "↓");
}

export { IS_MAC };
