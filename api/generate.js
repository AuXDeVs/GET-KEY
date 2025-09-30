import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI;

async function connectDB() {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    client = await connectDB();
    const db = client.db('platoboost');
    const keys = db.collection('keys');

    const key = generateKey();
    const id = generateID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    console.log('Creating key:', { id, key, createdAt: now, expiresAt });

    await keys.insertOne({
      id,
      key,
      createdAt: now,
      expiresAt
    });

    console.log('Key created successfully');

    return res.status(200).json({
      success: true,
      id,
      key,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error in generate endpoint:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
