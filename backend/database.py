import logging
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import settings

logger = logging.getLogger("uvicorn")

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    try:
        if settings.MONGODB_URL:
            db_manager.client = AsyncIOMotorClient(settings.MONGODB_URL)
            db_manager.db = db_manager.client[settings.DATABASE_NAME]
            logger.info("Successfully connected to MongoDB Atlas / Local MongoDB.")
            await create_indexes()
        else:
            logger.warning("MONGODB_URL not set. Running without MongoDB persistence.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("Closed MongoDB connection.")

async def create_indexes():
    if db_manager.db is not None:
        try:
            collection = db_manager.db["invoice_documents"]
            await collection.create_index("invoice.invoice_number", unique=False)
            await collection.create_index("seller.gstin")
            await collection.create_index("seller.name")
            await collection.create_index("status")
            await collection.create_index("created_at")
            logger.info("MongoDB indexes created successfully for collection 'invoice_documents'.")
        except Exception as e:
            logger.error(f"Error creating MongoDB indexes: {e}")

def get_database():
    return db_manager.db
