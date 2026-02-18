Services in src/service are CORE SERVICES. They facilitate features and are the "operating system" of the Afterthrough application. 

- ObjectService keeps a sentralized storage mechanims for all parts of the application
- All objects stored needs a URL with a schele, such as "task//GUID"
- PersonalStore stores per-database personal state (ui-state, preferences) in the `personal/` dir (git-ignored). Used for restoring activities on relaunch.
- SessionService stores app-level session state (which databases were open) in appDataDir/session.json, alongside recent-databases.json
- Filesystem operations go through custom Rust commands exposed via `src/service/fs.ts`, not through `@tauri-apps/plugin-fs` or any JS-side filesystem APIs
