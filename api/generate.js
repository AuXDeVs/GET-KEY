import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI;

async function connectDB() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

function generateKey() {
  const prefix = 'Aux_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_';
  let key = prefix;
  
  for (let i = 0; i < 25; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
}

function generateID() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await connectDB();
    const db = client.db('platoboost');
    const keys = db.collection('keys');

    const key = generateKey();
    const id = generateID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    await keys.insertOne({
      id,
      key,
      createdAt: now,
      expiresAt
    });

    await client.close();

    return res.status(200).json({
      success: true,
      id,
      key,
      expiresAt
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
