from ..database import base as Base, get_db

class Chat(Base):
    __tablename__ = "chats"
    user_id: str
    content: str