export const noSelect = (): string => `  -webkit-user-select: none;
  user-select: none;`;

export const allowSelect = (): string => `  -webkit-user-select: text;
  user-select: text;`;

export const selectAll = (): string => `  -webkit-user-select: all;
  user-select: all;`;

export const truncate = (): string => `  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;`;

export const lineClamp = (lines: number): string => `  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;`;

export const flexCenter = (): string => `  display: flex;
  align-items: center;
  justify-content: center;`;

export const flexRow = (gap?: string): string => {
  const gapRule = gap ? `\n  gap: ${gap};` : '';
  return `  display: flex;
  align-items: center;${gapRule}`;
};

export const flexColumn = (gap?: string): string => {
  const gapRule = gap ? `\n  gap: ${gap};` : '';
  return `  display: flex;
  flex-direction: column;${gapRule}`;
};

export const transform = (value: string): string => `  -webkit-transform: ${value};
  transform: ${value};`;

export const gpuAccelerate = (): string => `  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);`;

export const noAppearance = (): string => `  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;`;

export const clickable = (): string => `  ${noSelect()}
  cursor: pointer;`;

export const nonInteractive = (): string => `  ${noSelect()}
  pointer-events: none;`;
