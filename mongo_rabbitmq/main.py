from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from .db import *
from .models import *


app = FastAPI(title="mongo_rabbitmq")

@app.get("/auth/register")
def register_user():
    pass

@app.get("/api/chats")
def get_user_chats():
    pass