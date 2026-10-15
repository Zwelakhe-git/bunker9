from ..database import base as Base


class User(Base):
    __tablename__ = "users"
    id: int
    name: str
    created_at: str