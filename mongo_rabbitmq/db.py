import os
from pymongo import MongoClient, ASCENDING
from pymongo.errors import CollectionInvalid

client = MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
db = client["mongo_rabbitmq"]

def init_db():
    # Create collections explicitly (optional — they'd be auto-created on first insert)
    existing = db.list_collection_names()
    for name in ["users", "chats"]:
        if name not in existing:
            try:
                db.create_collection(name)
                print(f"Created collection: {name}")
            except CollectionInvalid:
                pass
