
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'four-dreams-restaurant';
const COLLECTION_NAME = 'orders';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { db } = await connectToDatabase();
    const orders = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ orderId: -1 })
      .toArray();

    res.status(200).json(orders);
  } catch (error) {
    console.error('Failed to fetch order history:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
