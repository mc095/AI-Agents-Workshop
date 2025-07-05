# models.py
import datetime
import sqlite3

DB_NAME = "todos.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status BOOLEAN
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_all_tasks():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks")
        records = cursor.fetchall()
        conn.close()
        tasks = []
        for r in records:
            if len(r) < 4:
                print(f"[WARNING] Skipping malformed row: {r}")
                continue
            try:
                tasks.append({
                    "id": r[0],
                    "name": r[1],
                    "description": r[2],
                    "status": bool(r[3])
                })
            except Exception as e:
                print(f"[ERROR] Failed to parse row {r}: {e}")
        return tasks
    except Exception as e:
        print(f"Error in get_all_tasks: {str(e)}")
        raise

def add_task(id, name, description, status):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO tasks VALUES (?, ?, ?, ?)", (id, name, description, status))
        conn.commit()
        conn.close()
        return f"Task {id} added."
    except Exception as e:
        print(f"Error in add_task: {str(e)}")
        raise

def update_task(id, name, description, status):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tasks WHERE id=?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise ValueError(f"Task {id} not found")
        cursor.execute(
            "UPDATE tasks SET name=?, description=?, status=? WHERE id=?",
            (name, description, status, id)
        )
        conn.commit()
        conn.close()
        return f"Task {id} updated."
    except Exception as e:
        print(f"Error in update_task: {str(e)}")
        raise

def delete_task(id):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tasks WHERE id=?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise ValueError(f"Task {id} not found")
        cursor.execute("DELETE FROM tasks WHERE id=?", (id,))
        conn.commit()
        conn.close()
        return f"Task {id} deleted."
    except Exception as e:
        print(f"Error in delete_task: {str(e)}")
        raise
    
