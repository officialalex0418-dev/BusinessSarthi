import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * MongoDB connection configuration
 *
 * Phase 1 infrastructure:
 * - Northflank: 1 vCPU / 1 GB RAM
 * - MongoDB Atlas: M0 Free Tier
 *
 * Designed for a small production/beta deployment.
 */

export async function connectDB() {
  // Keep MongoDB query behavior predictable
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      // --------------------------------------------------
      // INDEX MANAGEMENT
      // --------------------------------------------------
      // Development:
      //   Mongoose automatically creates indexes.
      //
      // Production:
      //   Indexes should be created/managed deliberately.
      //
      autoIndex: !env.isProd,

      // --------------------------------------------------
      // CONNECTION POOL
      // --------------------------------------------------
      // Conservative settings for:
      // Northflank 1 vCPU / 1 GB RAM
      // MongoDB Atlas M0
      //
      // Increase later based on monitoring.
      maxPoolSize: 10,
      minPoolSize: 2,

      // Close idle connections after 60 seconds.
      maxIdleTimeMS: 60000,

      // --------------------------------------------------
      // TIMEOUTS
      // --------------------------------------------------

      // Maximum time to find/select a MongoDB server.
      serverSelectionTimeoutMS: 10000,

      // Maximum time to establish a connection.
      connectTimeoutMS: 10000,

      // Maximum time a socket can remain inactive.
      socketTimeoutMS: 45000,
    });

    console.log('========================================');
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    console.log('🔗 Pool: min=2 / max=10');
    console.log('========================================');

  } catch (err) {
    console.error('========================================');
    console.error('❌ MongoDB connection failed');
    console.error(`Message: ${err.message}`);
    console.error('========================================');

    // If the application cannot connect to MongoDB,
    // do not start the API in a broken state.
    process.exit(1);
  }

  // --------------------------------------------------
  // CONNECTION EVENTS
  // --------------------------------------------------

  mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('🟠 MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
}