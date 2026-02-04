import type { ServiceLayer } from "../../service/ServiceLayer";
import { KeyboardEvents, type ChordOption } from "../../service/KeyboardService";
import type { ChordPicker } from "../../gui/keyboard/ChordPicker";

import "../../gui/keyboard/ChordPicker";

let chordPickerElement: ChordPicker | null = null;

export function setupKeyboardFeature(serviceLayer: ServiceLayer): void {
  serviceLayer.keyboardService.initialize();

  serviceLayer.keyboardService.addEventListener(KeyboardEvents.CHORD_STARTED, ((e: CustomEvent) => {
    showChordPicker(serviceLayer, e.detail.prefix, e.detail.options);
  }) as EventListener);

  serviceLayer.keyboardService.addEventListener(KeyboardEvents.CHORD_CANCELLED, () => {
    hideChordPicker();
  });

  serviceLayer.keyboardService.addEventListener(KeyboardEvents.CHORD_COMPLETED, () => {
    hideChordPicker();
  });
}

function showChordPicker(serviceLayer: ServiceLayer, prefix: string, options: ChordOption[]): void {
  hideChordPicker();

  chordPickerElement = document.createElement("chord-picker") as ChordPicker;
  chordPickerElement.configure(options);

  chordPickerElement.onSelect = (option: ChordOption) => {
    serviceLayer.keyboardService.executeChordOption(prefix, option.key);
  };

  chordPickerElement.onCancel = () => {
    serviceLayer.keyboardService.cancelChord();
  };

  document.body.appendChild(chordPickerElement);
}

function hideChordPicker(): void {
  if (chordPickerElement) {
    chordPickerElement.remove();
    chordPickerElement = null;
  }
}
