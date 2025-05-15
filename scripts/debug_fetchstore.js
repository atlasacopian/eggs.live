import { config } from 'dotenv';
config({path: '.env.local'});
import fetch from 'node-fetch';

const { KROGER_CLIENT_ID, KROGER_CLIENT_SECRET } = process.env;
if(!KROGER_CLIENT_ID||!KROGER_CLIENT_SECRET){
  console.error('env missing');process.exit(1);
}
const basic = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');
async function getToken(){
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token',{
    method:'POST',
    headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials&scope=product.compact'
  });
  const json = await res.json();
  return json.access_token;
}
(async()=>{
  const loc = process.argv[2]||'01100002';
  const t=await getToken();
  for(const id of [loc, String(Number(loc))]){
    const url = new URL('https://api.kroger.com/v1/products');
    url.searchParams.set('filter.locationId', id);
    url.searchParams.set('filter.term','eggs');
    url.searchParams.set('filter.limit','5');
    console.log('Request', url.toString());
    const r = await fetch(url,{headers:{Authorization:`Bearer ${t}`}});
    console.log('Status',r.status);
    console.log(await r.text());
  }
})(); 