# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from agent import chat_with_agent
from models import get_all_tasks, delete_task, init_db, add_task, update_task

app = FastAPI()
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

class AgentRequest(BaseModel):
    message: str

class Todo(BaseModel):
    id: int
    name: str
    description: str
    status: bool

@app.get("/")
async def root():
    return {"tasks": get_all_tasks()}

@app.post("/agent/chat")
async def chat(req: AgentRequest):
    try:
        reply = chat_with_agent(req.message)
        return {"reply": reply.content} 
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {"reply": f"Sorry, something went wrong: {str(e)}"}


@app.delete("/delete/{task_id}")
async def delete_task_endpoint(task_id: int):
    try:
        result = delete_task(task_id)
        return {"message": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in delete_task_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/add")
async def add_task_endpoint(task: Todo):
    try:
        result = add_task(task.id, task.name, task.description, task.status)
        return {"message": result}
    except Exception as e:
        print(f"Error in add_task_endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to add task: {str(e)}")

@app.put("/update/{task_id}")
async def update_task_endpoint(task_id: int, task: Todo):
    try:
        result = update_task(task_id, task.name, task.description, task.status)
        return {"message": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in update_task_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



