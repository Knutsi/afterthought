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

function parseStrokeKeys(stroke: string): string[] {
  const keys: string[] = [];
  let rest = stroke;
  const modPattern = /^(Mod2|Mod|Shift|Alt|Ctrl|⌘\u2009?|⌥\u2009?|⇧\u2009?|⌃\u2009?)\+/;
  let match = modPattern.exec(rest);
  while (match) {
    keys.push(match[1]);
    rest = rest.slice(match[0].length);
    match = modPattern.exec(rest);
  }
  if (rest) keys.push(rest.trim());
  return keys;
}

export function formatShortcutAsHTML(shortcut: string): string {
  if (!shortcut) return '';

  const formatted = formatShortcutForDisplay(shortcut);
  const alternatives = formatted.split(' / ');

  return alternatives.map((alt, i) => {
    const strokes = alt.split(' ').filter(s => s);
    const formattedStrokes = strokes.map(stroke => {
      const keys = parseStrokeKeys(stroke);
      return keys.map(key => `<kbd>${key}</kbd>`).join('');
    }).join('<span class="chord-sep">+</span>');

    const separator = i < alternatives.length - 1 ? '<span class="separator">/</span>' : '';
    return formattedStrokes + separator;
  }).join('');
}

export { IS_MAC };
