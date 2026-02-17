import { readDir } from "../../service/fs";

const SUGGESTIONS = ["Personal", "Work", "Untitled"];

export async function suggestDatabaseName(parentDir: string): Promise<string> {
  let existing: Set<string>;
  try {
    const entries = await readDir(parentDir);
    existing = new Set(entries.map((e) => e.name));
  } catch {
    return SUGGESTIONS[0];
  }

  for (const name of SUGGESTIONS) {
    if (!existing.has(name)) return name;
  }

  let i = 1;
  while (true) {
    const name = `Untitled ${i}`;
    if (!existing.has(name)) return name;
    i++;
  }
}
