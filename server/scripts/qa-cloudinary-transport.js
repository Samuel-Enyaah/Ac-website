import dotenv from 'dotenv';
dotenv.config({path:new URL('../.env',import.meta.url),override:false,quiet:true});
if(process.env.RUN_ISOLATED_QA !== '1') throw new Error('Explicit QA opt-in required.');
const { getCloudinary } = await import('../src/config/cloudinary.js');
const cloud=getCloudinary();
const timestamp=Math.floor(Date.now()/1000);
const params={timestamp,folder:'rj-ac/qa'};
const data=new FormData();
for(const [key,value] of Object.entries(params))data.append(key,String(value));
data.append('api_key',process.env.CLOUDINARY_API_KEY);
data.append('signature',cloud.utils.api_sign_request(params,process.env.CLOUDINARY_API_SECRET));
data.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'qa.png');
const r=await fetch('https://api.cloudinary.com/v1_1/'+process.env.CLOUDINARY_CLOUD_NAME+'/image/upload',{method:'POST',body:data});
const result=await r.json();
let safeMessage = result.error?.message || 'none';
for (const value of [process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET, data.get('signature')]) {
 if(value) safeMessage=safeMessage.split(value).join('[redacted]');
}
console.log('Signed fetch status:',r.status,'error:',safeMessage.replace(/\[prodenv:[^\]]+\]/g,'[prodenv:redacted]').replace(/[a-f0-9]{32,}/g,'[redacted signature]'));
if(!r.ok || !result.public_id || !result.secure_url) process.exitCode=1;
if(result.public_id){
 const cleanup={timestamp:Math.floor(Date.now()/1000),public_id:result.public_id};
 const body=new URLSearchParams({...cleanup,api_key:process.env.CLOUDINARY_API_KEY,signature:cloud.utils.api_sign_request(cleanup,process.env.CLOUDINARY_API_SECRET)});
 const response=await fetch('https://api.cloudinary.com/v1_1/'+process.env.CLOUDINARY_CLOUD_NAME+'/image/destroy',{method:'POST',body});
 const cleanupResult=(await response.json()).result;
 console.log('QA asset cleanup:',response.status,cleanupResult);
 if(!response.ok || !['ok','not found'].includes(cleanupResult)) process.exitCode=1;
}
