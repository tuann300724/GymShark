const http = require('http');

const email = process.env.TEST_LOGIN_EMAIL;
const password = process.env.TEST_LOGIN_PASSWORD;

if (!email || !password) {
  throw new Error('TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD environment variables are required.');
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

post('http://localhost:3001/api/auth/login', { email, password })
  .then(r => console.log('LOGIN:', r.status, r.body.slice(0, 300)))
  .catch(e => console.log('LOGIN ERR:', e.message));
