import net from 'net';

const client = net.createConnection({ port: 27018, host: '127.0.0.1' }, () => {
  console.log('Connected to 27018');
  client.end();
});
client.on('error', (err) => {
  console.log('Error connecting:', err.message);
});