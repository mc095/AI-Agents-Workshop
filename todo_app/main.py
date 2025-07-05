from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
import sqlite3

DB_NAME = "todos.db"

class Todo(BaseModel):
    id : int
    name : str
    description : str
    status : bool

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get('/')
def display_tasks():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks;
    """)
    records = cursor.fetchall()
    conn.close()
    
    todo_list = []
    
    for record in records:
        new_record = {
            "id" : record[0],
            "name" : record[1],
            "description" : record[2],
            "status" : bool(record[3])
        }     
        todo_list.append(new_record)
        
    return todo_list
        
        
@app.post('/add')
def add_task(task : Todo):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks WHERE id=?;
    """, (task.id,))
    record = cursor.fetchone()
    if record:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Id {task.id} already exists")

    cursor.execute("""
        INSERT INTO tasks (id, name, description, status) VALUES (?, ?, ?, ?);
    """, (task.id, task.name, task.description, task.status))

    conn.commit()
    conn.close()

    return {"message" : "new task added successfully"}


@app.put("/update")
def update_task(task: Todo):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks WHERE id=?
    """, (task.id,))
    record = cursor.fetchone()
    if not record:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Task {task.id} not found")
    
    cursor.execute("""
        UPDATE tasks
        SET name=?, description=?, status=?
        WHERE id=?;
    """,(task.name, task.description, task.status, task.id))

    conn.commit()
    conn.close()
    
    return {"message" : f"task {task.id} is updated successfully"}


@app.delete("/delete/{id}")
def delete_task(id : int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks WHERE id=?;
    """, (id,))
    record = cursor.fetchone()
    if not record:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Task {id} not found")
    
    
    cursor.execute("""
        DELETE FROM tasks WHERE id=?;
    """, (id,))
    
    conn.commit()
    conn.close()
    
    return {"message" : "task {id} deleted successfully"}
    