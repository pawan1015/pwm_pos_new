// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use mysql::prelude::*;
use mysql::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: u32,
    pub name: String,
}

fn get_connection() -> Result<PooledConn> {
    let opts = OptsBuilder::default()
        .ip_or_hostname(Some("127.0.0.1"))
        .tcp_port(3306)
        .user(Some("root"))
        .pass(Some("root123456"))
        .db_name(Some("pos_system"));

    let pool = Pool::new(opts)?;
    pool.get_conn()
}

fn init_database() -> Result<()> {
    // Connect without specifying database
    let opts = OptsBuilder::default()
        .ip_or_hostname(Some("127.0.0.1"))
        .tcp_port(3306)
        .user(Some("root"))
        .pass(Some("root123456"));

    let pool = Pool::new(opts)?;
    let mut conn = pool.get_conn()?;

    // Create database if not exists
    conn.query_drop("CREATE DATABASE IF NOT EXISTS pos_system")?;

    // Now connect to the database
    let opts = OptsBuilder::default()
        .ip_or_hostname(Some("127.0.0.1"))
        .tcp_port(3306)
        .user(Some("root"))
        .pass(Some("root123456"))
        .db_name(Some("pos_system"));

    let pool = Pool::new(opts)?;
    let mut conn = pool.get_conn()?;

    // Create categories table if not exists
    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
    )?;

    // Create items table if not exists
    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            buying_price DECIMAL(10, 2) NOT NULL,
            selling_price DECIMAL(10, 2) NOT NULL,
            discount DECIMAL(10, 2) DEFAULT 0,
            discount_type VARCHAR(20) DEFAULT 'percentage',
            category_id INT NOT NULL,
            barcode VARCHAR(100) NOT NULL UNIQUE,
            quantity INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )",
    )?;

    // Add quantity column if it doesn't exist (for existing databases)
    let alter_result = conn.query_drop(
        "ALTER TABLE items ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 0"
    );
    if let Err(e) = alter_result {
        eprintln!("Note: Could not add quantity column (maybe already there): {}", e);
    }

    Ok(())
}

#[tauri::command]
fn add_category(name: String) -> Result<String, String> {
    init_database().map_err(|e| e.to_string())?;

    let mut conn = get_connection().map_err(|e| e.to_string())?;

    match conn.exec_drop("INSERT INTO categories (name) VALUES (?)", (name.clone(),)) {
        Ok(_) => Ok(format!("Category '{}' added successfully", name)),
        Err(e) => {
            if e.to_string().contains("Duplicate entry") {
                Err("Category already exists".to_string())
            } else {
                Err(e.to_string())
            }
        }
    }
}

#[tauri::command]
fn get_categories() -> Result<Vec<Category>, String> {
    init_database().map_err(|e| e.to_string())?;

    let mut conn = get_connection().map_err(|e| e.to_string())?;

    let categories: Vec<Category> = conn
        .query_map(
            "SELECT id, name FROM categories ORDER BY name",
            |(id, name)| Category { id, name },
        )
        .map_err(|e| e.to_string())?;

    Ok(categories)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    pub id: u32,
    pub name: String,
    pub code: String,
    pub buying_price: f64,
    pub selling_price: f64,
    pub discount: f64,
    pub discount_type: String,
    pub category: String,
    pub barcode: String,
    pub quantity: i32,
}

#[tauri::command]
fn add_item(
    name: String,
    code: String,
    buyingPrice: f64,
    sellingPrice: f64,
    discount: f64,
    discountType: String,
    category: String,
    barcode: String,
    quantity: i32,
) -> Result<String, String> {
    init_database().map_err(|e| e.to_string())?;
    let mut conn = get_connection().map_err(|e| e.to_string())?;

    let category_id: Option<u32> = conn
        .exec_first(
            "SELECT id FROM categories WHERE name = ?",
            (category.clone(),),
        )
        .map_err(|e| e.to_string())?;

    let category_id = category_id.ok_or_else(|| "Category not found".to_string())?;

    conn.exec_drop(
        "INSERT INTO items (name, code, buying_price, selling_price, discount, discount_type, category_id, barcode, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            name.clone(),
            code.clone(),
            buyingPrice,
            sellingPrice,
            discount,
            discountType.clone(),
            category_id,
            barcode.clone(),
            quantity,
        ),
    )
    .map_err(|e| {
        if e.to_string().contains("Duplicate entry") {
            "Item code or barcode already exists".to_string()
        } else {
            e.to_string()
        }
    })?;

    Ok(format!("Item '{}' saved successfully", name))
}

#[tauri::command]
fn get_items() -> Result<Vec<Item>, String> {
    init_database().map_err(|e| e.to_string())?;
    let mut conn = get_connection().map_err(|e| e.to_string())?;

    let items: Vec<Item> = conn
        .query_map(
            "SELECT i.id, i.name, i.code, i.buying_price, i.selling_price, i.discount, i.discount_type, c.name, i.barcode, i.quantity 
             FROM items i 
             JOIN categories c ON i.category_id = c.id 
             ORDER BY i.created_at DESC",
            |(id, name, code, buying_price, selling_price, discount, discount_type, category, barcode, quantity)| Item {
                id,
                name,
                code,
                buying_price,
                selling_price,
                discount,
                discount_type,
                category,
                barcode,
                quantity,
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn update_item(
    id: u32,
    name: String,
    code: String,
    buyingPrice: f64,
    sellingPrice: f64,
    discount: f64,
    discountType: String,
    category: String,
    barcode: String,
    quantity: i32,
) -> Result<String, String> {
    let mut conn = get_connection().map_err(|e| e.to_string())?;

    let category_id: Option<u32> = conn
        .exec_first(
            "SELECT id FROM categories WHERE name = ?",
            (category.clone(),),
        )
        .map_err(|e| e.to_string())?;

    let category_id = category_id.ok_or("Category not found")?;

    conn.exec_drop(
        "UPDATE items
         SET name=?, code=?, buying_price=?, selling_price=?,
             discount=?, discount_type=?, category_id=?, barcode=?, quantity=?
         WHERE id=?",
        (
            name,
            code,
            buyingPrice,
            sellingPrice,
            discount,
            discountType,
            category_id,
            barcode,
            quantity,
            id,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok("Item updated successfully".to_string())
}

#[tauri::command]
fn delete_item(id: u32) -> Result<String, String> {
    let mut conn = get_connection().map_err(|e| e.to_string())?;

    conn.exec_drop("DELETE FROM items WHERE id=?", (id,))
        .map_err(|e| e.to_string())?;

    Ok("Item deleted successfully".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            add_category,
            get_categories,
            add_item,
            update_item,
            delete_item,
            get_items
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}