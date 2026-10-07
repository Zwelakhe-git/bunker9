from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from bson import ObjectId

@dataclass
class User:
    username: str
    hashed_password: str
    queue_name: str
    _id: ObjectId = field(default_factory=ObjectId)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

class chats:
    user_id: ObjectId
    receipient_id: ObjectId
    content: str