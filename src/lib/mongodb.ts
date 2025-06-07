
import { MongoClient, Db, Collection } from 'mongodb';
import type { Itinerary, Trip, Feedback } from './types';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const mongoClient = await clientPromise;
  return mongoClient.db(); // You can specify your DB name here if it's not in the URI
}

export async function getItinerariesCollection(): Promise<Collection<Itinerary>> {
  const db = await getDb();
  return db.collection<Itinerary>('itineraries');
}

export async function getTripsCollection(): Promise<Collection<Trip>> {
  const db = await getDb();
  return db.collection<Trip>('trips');
}

export async function getFeedbackCollection(): Promise<Collection<Feedback>> {
  const db = await getDb();
  return db.collection<Feedback>('feedback');
}

// You can add more collection getters here as needed, e.g., for users, etc.
