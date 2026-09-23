import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models/index.js';
import { notify } from './src/services/notification.service.js';

async function main() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/business_sarthi1';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const user = await User.findOne({ email: 'officialalex0418@gmail.com' });
    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    console.log('Found user:', user.name, 'ID:', user._id.toString(), 'Company:', user.company?.toString());

    const result = await notify({
      recipient: user._id,
      company: user.company,
      type: 'CHAT_MESSAGE',
      title: 'Company Alert',
      message: 'New urgent chat message received from company owner!',
      link: '/staff/complaints',
    });

    console.log('Notification created and dispatched successfully:', result?._id?.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
