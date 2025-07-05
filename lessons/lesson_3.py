import sqlite3
import json

DB_NAME = "todos.db"

# Initialize database
def initialize_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            name VARCHAR NOT NULL,
            description VARCHAR,
            status BOOLEAN
        );
    """)
    
    conn.commit()
    conn.close()
 
# Add tasks (CREATE) 
def add_task(task):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO tasks (id, name, description, status)
        VALUES(?, ?, ?, ?);               
    """, (task["id"], task["name"], task["description"], task["status"]))
    
    conn.commit()
    conn.close()

    
# display all tasks (READ)
def display_all():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks;
    """)
    
    records =  cursor.fetchall()
    conn.close()
    
    return records
    
# Update task (UPDATE)
def update_task(task):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE tasks
        SET name =?, description =?, status =?
        WHERE id=?;
    """, (task["name"], task["description"], task["status"], task["id"]))
    
    conn.commit()
    conn.close()
    
# Delete Task (DELETE)
def delete_task(id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM tasks WHERE id=?;               
    """, (id,))
    
    conn.commit()
    conn.close()
    
def main():
    initialize_database()
    
    add_task({
        "id" : 1,
        "name" : "Drink Milk", 
        "description" : "7AM drink milk", 
        "status" : False
    })
    
    add_task({
        "id": 2, 
        "name" : "Send Email", 
        "description" : "Email Sarah about meetings", 
        "status" : False
    })
    
    print("\n\nADDING TWO TASKS")
    tasks = display_all()
    for task in tasks:
        task_dict = {
            "id": task[0],
            "name": task[1],
            "description": task[2],
            "status": bool(task[3])
        }
        
        print(json.dumps(task_dict, indent=4))
    
    print("\n\nUPDATING TASK 1")
    update_task({
        "id" : 1,
        "name" : "Drink Milk",
        "description" : "7AM drink milk", 
        "status" : True
    })
    
    # print("\n\nTASK 2 DELETED")
    # delete_task(2)
    
    print("\n\nDISPLAY ALL TASKS")
    tasks = display_all()
    for task in tasks:
        task_dict = {
            "id": task[0],
            "name": task[1],
            "description": task[2],
            "status": bool(task[3])
        }
        
        print(json.dumps(task_dict, indent=4))

if __name__ == "__main__":
    main()