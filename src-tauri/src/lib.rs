use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;

use tauri::Manager;

struct AppState {
    open_databases: Mutex<HashMap<String, String>>,
    is_quitting: Mutex<bool>,
}

#[derive(serde::Serialize)]
struct WindowGeometry {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionState {
    open_databases: Vec<String>,
    window_geometry: HashMap<String, WindowGeometry>,
}

fn collect_geometry(app: &tauri::AppHandle, open_databases: &HashMap<String, String>) -> HashMap<String, WindowGeometry> {
    let mut geometry = HashMap::new();
    for (label, path) in open_databases.iter() {
        if let Some(window) = app.get_webview_window(label) {
            if let (Ok(pos), Ok(size), Ok(scale)) = (
                window.outer_position(),
                window.outer_size(),
                window.scale_factor(),
            ) {
                let logical_size = size.to_logical::<u32>(scale);
                let logical_pos = pos.to_logical::<i32>(scale);
                geometry.insert(path.clone(), WindowGeometry {
                    x: logical_pos.x,
                    y: logical_pos.y,
                    width: logical_size.width,
                    height: logical_size.height,
                });
            }
        }
    }
    geometry
}

#[tauri::command]
fn register_window_database(
    label: String,
    path: String,
    state: tauri::State<'_, AppState>,
) {
    let mut map = state.open_databases.lock().unwrap();
    map.insert(label, path);
}

#[tauri::command]
fn unregister_window_database(
    label: String,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) {
    let quitting = *state.is_quitting.lock().unwrap();
    let (paths, geometry) = {
        let mut map = state.open_databases.lock().unwrap();
        map.remove(&label);
        let geo = collect_geometry(&app, &map);
        let paths: Vec<String> = map.values().cloned().collect();
        (paths, geo)
    };
    if !quitting {
        write_session_file(&app, &paths, geometry);
    }
}

fn write_session_file(app: &tauri::AppHandle, paths: &[String], geometry: HashMap<String, WindowGeometry>) {
    if let Ok(dir) = app.path().app_data_dir() {
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("session.json");
        let state = SessionState {
            open_databases: paths.to_vec(),
            window_geometry: geometry,
        };
        let _ = fs::write(file_path, serde_json::to_string_pretty(&state).unwrap());
    }
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    *state.is_quitting.lock().unwrap() = true;

    let (paths, geometry) = {
        let map = state.open_databases.lock().unwrap();
        let geo = collect_geometry(&app, &map);
        let paths: Vec<String> = map.values().cloned().collect();
        (paths, geo)
    };
    write_session_file(&app, &paths, geometry);

    for (_, window) in app.webview_windows() {
        let _ = window.close();
    }
}

#[tauri::command]
fn find_window_for_database(
    path: String,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> bool {
    let map = state.open_databases.lock().unwrap();
    for (label, db_path) in map.iter() {
        if db_path == &path {
            if let Some(window) = app.get_webview_window(label) {
                let _ = window.set_focus();
            }
            return true;
        }
    }
    false
}

fn iso_now() -> String {
    let dur = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let secs = dur.as_secs();
    let millis = dur.subsec_millis();

    // break epoch seconds into date/time components
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let h = time_secs / 3600;
    let m = (time_secs % 3600) / 60;
    let s = time_secs % 60;

    // date from days since 1970-01-01 (civil calendar algorithm)
    let z = days as i64 + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mon = if mp < 10 { mp + 3 } else { mp - 9 };
    let yr = if mon <= 2 { y + 1 } else { y };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        yr, mon, d, h, m, s, millis
    )
}

#[tauri::command]
fn create_database(parent_dir: String, name: String, version: u32) -> Result<String, String> {
    let db_path = PathBuf::from(&parent_dir).join(&name);

    fs::create_dir_all(db_path.join("stores")).map_err(|e| e.to_string())?;
    fs::create_dir_all(db_path.join("personal")).map_err(|e| e.to_string())?;

    let meta = serde_json::json!({
        "name": name,
        "version": version,
        "createdAt": iso_now(),
    });

    let meta_file = db_path.join(format!("{}.afdb", name));
    fs::write(&meta_file, serde_json::to_string_pretty(&meta).unwrap())
        .map_err(|e| e.to_string())?;

    fs::write(db_path.join(".gitignore"), "personal/\n")
        .map_err(|e| e.to_string())?;

    Ok(db_path.to_string_lossy().into_owned())
}

#[derive(serde::Serialize)]
struct FsDirEntry {
    name: String,
}

#[tauri::command]
fn fs_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

#[tauri::command]
fn fs_read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_mkdir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_read_dir(path: String) -> Result<Vec<FsDirEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            result.push(FsDirEntry { name: name.to_owned() });
        }
    }
    Ok(result)
}

#[tauri::command]
fn fs_remove_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn fs_remove_dir(path: String) -> Result<(), String> {
    fs::remove_dir_all(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())

        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_cli::init())
        .manage(AppState {
            open_databases: Mutex::new(HashMap::new()),
            is_quitting: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            quit_app,
            create_database,
            register_window_database,
            unregister_window_database,
            find_window_for_database,
            fs_exists,
            fs_read_text_file,
            fs_write_text_file,
            fs_mkdir,
            fs_read_dir,
            fs_remove_file,
            fs_remove_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
