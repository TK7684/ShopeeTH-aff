import crypto from 'crypto';

const APP_ID = '15307710043';
const SECRET = 'RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI';
const ENDPOINT = 'https://open-api.affiliate.shopee.co.th/graphql';

async function queryGraphQL(query) {
  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signString = APP_ID + timestamp + payload + SECRET;
  const signature = crypto.createHash('sha256').update(signString, 'utf8').digest('hex');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
  };

  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: payload });
  return res.json();
}

const typeName = process.argv[2];
if (!typeName) {
  console.error('Usage: node scripts/type-inspect.mjs <TypeName>');
  process.exit(1);
}

const query = `{
  __type(name: "${typeName}") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}`;

queryGraphQL(query)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


