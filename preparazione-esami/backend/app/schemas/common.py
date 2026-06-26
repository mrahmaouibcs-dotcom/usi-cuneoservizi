"""Schemi comuni."""
from pydantic import BaseModel


class Message(BaseModel):
    detail: str
