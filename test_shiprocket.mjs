import crypto from 'crypto';

const apiKey = 'BTtWwfWEghLfbPY9';
const secretKey = 'VEScCmd6fDFqukGQO12Kp9bgNHdWqVLb';

async function generateHmacSha256(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64');
}

async function run() {
  const payload = JSON.stringify({ timestamp: new Date().toISOString() });
  const sig = await generateHmacSha256(secretKey, payload);
  const res = await fetch('https://checkout-api.shiprocket.com/api/v1/custom-platform-order/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'X-Api-HMAC-SHA256': sig },
    body: payload
  });
  const text = await res.text();
  console.log('List API:', text);
}
run();
