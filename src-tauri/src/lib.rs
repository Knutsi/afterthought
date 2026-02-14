use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![quit_app, create_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
