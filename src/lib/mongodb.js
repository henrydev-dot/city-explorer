import { MongoClient } from 'mongodb';

// Cached connection — survives hot reloads in dev and is shared per
// serverless/Node instance in production. Set MONGODB_URI in the environment
// (see .env.example); without it the API routes respond 503 and the game
// falls back to local-only persistence.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'monaco-estate';

let clientPromise = null;

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getDb() {
  if (!uri) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    clientPromise = client.connect();
  }
  const client = await clientPromise;
  return client.db(dbName);
}
