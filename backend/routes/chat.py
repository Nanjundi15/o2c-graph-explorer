"""
routes/chat.py
--------------
LLM-powered natural language query endpoint.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from llm import answer_question

router = APIRouter()


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


@router.post("/query")
async def chat_query(request: ChatRequest):
    """
    Accept a natural language question, generate SQL via Gemini,
    execute it, and return a data-backed natural language answer.
    """
    try:
        result = await answer_question(request.question)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
