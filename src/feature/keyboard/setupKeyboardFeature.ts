import type { ServiceLayer } from "../../service/ServiceLayer";
import { KeyboardEvents, type ChordOption } from "../../service/KeyboardService";
import type { ChordPicker } from "../../gui/keyboard/ChordPicker";

import "../../gui/keyboard/ChordPicker";

const CHORD_PICKER_ID = "chord-picker";

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

function getChordPicker(): ChordPicker | null {
  return document.getElementById(CHORD_PICKER_ID) as ChordPicker | null;
}

function showChordPicker(serviceLayer: ServiceLayer, prefix: string, options: ChordOption[]): void {
  const picker = getChordPicker();
  if (!picker) return;

  picker.configure(options);

  picker.onSelect = (option: ChordOption) => {
    serviceLayer.keyboardService.executeChordOption(prefix, option.key);
  };

  picker.onCancel = () => {
    serviceLayer.keyboardService.cancelChord();
  };

  picker.show();
}

function hideChordPicker(): void {
  getChordPicker()?.hide();
}
