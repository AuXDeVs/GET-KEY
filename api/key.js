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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ valid: false, error: 'ID required' });
  }

  try {
    const client = await connectDB();
    const db = client.db('platoboost');
    const keys = db.collection('keys');

    const keyData = await keys.findOne({ id: id });

    await client.close();

    if (!keyData) {
      return res.status(404).json({ valid: false, error: 'Key not found' });
    }

    const now = new Date();
    if (now > new Date(keyData.expiresAt)) {
      return res.status(200).json({ valid: false, error: 'Key expired' });
    }

    return res.status(200).json({
      valid: true,
      key: keyData.key,
      expiresAt: new Date(keyData.expiresAt).getTime()
    });

  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
}
