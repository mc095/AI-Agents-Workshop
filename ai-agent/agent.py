# agent.py

from agno.agent import Agent
from agno.tools import tool
from agno.models.groq import Groq
from agno.storage.sqlite import SqliteStorage
from models import add_task, update_task, get_all_tasks, delete_task
from dotenv import load_dotenv
import os

load_dotenv()

llm = Groq(
    id="meta-llama/llama-4-scout-17b-16e-instruct",
    api_key=os.environ["GROQ_API_KEY"],
)

# define tools
@tool
def create_task(id: int | str, name: str, description: str, status: str | bool):
    """
    Create a new task with the given id, name, description, and status.
    Status can be true/false or a string like 'pending'/'done'.
    """
    try:
        id_int = int(id)
        if isinstance(status, bool):
            status_bool = status
        elif isinstance(status, str):
            status_bool = status.lower() in ["true", "completed", "done"]
        else:
            status_bool = False
        return add_task(id_int, name, description, status_bool)
    except Exception as e:
        return f"Failed to add task: {e}"



@tool
def update_task_info(id: int | str, name: str, description: str, status: str | bool):
    try:
        id_int = int(id)
        if isinstance(status, bool):
            status_bool = status
        elif isinstance(status, str):
            status_bool = status.lower() in ["true", "completed", "done"]
        else:
            status_bool = False
        return update_task(id_int, name, description, status_bool)
    except Exception as e:
        return f"Failed to update task: {e}"



@tool
def show_tasks():
    """ Display all tasks."""
    
    return get_all_tasks()

@tool
def remove_task(id: int | str):
    try:
        id_int = int(id)
        return delete_task(id_int)
    except Exception as e:
        return f"Failed to delete task: {e}"

# the actual agent
agent = Agent(
    model=llm,
    tools=[create_task, update_task_info, show_tasks, remove_task],
    description="""
    You are a chill GenZ AI todo assistant.
    Talk to them like a friend
    Help users manage their tasks.
    If they say things like 'add a task', 'remove task', 'update my todo', etc,
    you should call the right tool to handle it. 
    Always provide:
    - id as an integer
    - status as 'true' or 'false' for booleans.
    """,
    markdown=True,
    storage=SqliteStorage(db_file="todos.db", table_name="sessions"),
    add_history_to_messages=True,
    add_datetime_to_instructions=True,
)

def chat_with_agent(message: str):
    return agent.run(message, stream=False)

