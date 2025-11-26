import crypto from 'crypto';

const APP_ID = '15307710043';
const SECRET = 'RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI';
const ENDPOINT = 'https://open-api.affiliate.shopee.co.th/graphql';

async function run() {
  const query = `{
    __schema {
      types {
        name
      }
    }
  }`;

  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signString = APP_ID + timestamp + payload + SECRET;
  const signature = crypto.createHash('sha256').update(signString, 'utf8').digest('hex');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
  };

  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: payload });
  const text = await res.text();
  console.log(text);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});


