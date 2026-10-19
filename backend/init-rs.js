import mongoose from 'mongoose';

async function initReplicaSet() {
  try {
    console.log('Connecting to mongodb://localhost:27018/admin...');
    const conn = await mongoose.connect('mongodb://localhost:27018/admin', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected.');

    // Check replica set status
    try {
      const status = await conn.connection.db.admin().command({ replSetGetStatus: 1 });
      console.log('Replica set is already initialized.');
      console.log('Status:', status.set);
    } catch (err) {
      if (err.message.includes('no replset config has been received') || err.codeName === 'NotYetInitialized') {
        console.log('Initializing replica set...');
        const result = await conn.connection.db.admin().command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: 'localhost:27018' }]
          }
        });
        console.log('Initiate result:', result);
      } else {
        console.error('Error checking replSet status:', err.message);
      }
    }
  } catch (err) {
    console.error('Failed to connect or initiate:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

initReplicaSet();