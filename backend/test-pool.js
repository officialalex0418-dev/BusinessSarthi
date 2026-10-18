import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { Company } from './src/models/index.js';

async function testPool() {
  await mongoose.connect(env.mongoUri, { maxPoolSize: 20, minPoolSize: 2 });
  console.log("Connected to DB with poolSize 20");

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < 100; i++) {
    promises.push(Company.findOne({}).lean());
  }

  await Promise.all(promises);
  const duration = Date.now() - startTime;

  console.log(`Executed 100 concurrent DB queries in ${duration} ms`);
  await mongoose.disconnect();
}

testPool().catch(console.error);