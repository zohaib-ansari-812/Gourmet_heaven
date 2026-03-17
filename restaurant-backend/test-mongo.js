require('dotenv').config();
const mongoose = require('mongoose');

console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('Testing connection...');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:');
  console.error('Error Code:', err.code);
  console.error('Error Message:', err.message);
  console.error('Full Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Connection timeout - MongoDB didn\'t respond');
  process.exit(1);
}, 7000);
