import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

async function connectDB() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await connectDB();
    const db = client.db('platoboost');
    const keys = db.collection('keys');

    const now = new Date();
    const validKeys = await keys
      .find({ expiresAt: { $gt: now } })
      .project({ key: 1, _id: 0 })
      .toArray();

    await client.close();

    const keyList = validKeys.map(k => k.key);

    return res.status(200).json(keyList);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
