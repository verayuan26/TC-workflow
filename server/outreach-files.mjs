import {createServer} from "node:http";
import {createHmac,createHash,timingSafeEqual} from "node:crypto";
import {mkdir,readFile,rename,stat,unlink,writeFile} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";

const host="127.0.0.1";
const port=Number(process.env.TIGER_OUTREACH_FILE_PORT||8788);
const root=resolve(process.env.TIGER_OUTREACH_FILE_ROOT||"/Users/mac/Library/Application Support/TigerOutreach/files");
const secret=process.env.TIGER_OUTREACH_FILE_SIGNING_SECRET||"";
if(secret.length<32)throw new Error("TIGER_OUTREACH_FILE_SIGNING_SECRET must be at least 32 characters");

const b64=value=>Buffer.from(value).toString("base64url");
const sign=value=>{const encoded=b64(JSON.stringify(value));return `${encoded}.${createHmac("sha256",secret).update(encoded).digest("base64url")}`};
function verify(token,op){
  const [encoded,sig,...extra]=String(token||"").split(".");if(!encoded||!sig||extra.length)throw new Error("invalid token");
  const expected=createHmac("sha256",secret).update(encoded).digest();const actual=Buffer.from(sig,"base64url");
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error("invalid token");
  const payload=JSON.parse(Buffer.from(encoded,"base64url").toString("utf8"));if(payload.op!==op||Number(payload.exp)<Math.floor(Date.now()/1000))throw new Error("expired token");return payload;
}
function storagePath(key){const target=resolve(join(root,String(key)));if(!target.startsWith(root+"/"))throw new Error("invalid storage key");return target;}
const send=(res,status,value,headers={})=>{res.writeHead(status,{"content-type":"application/json;charset=utf-8","cache-control":"no-store",...headers});res.end(JSON.stringify(value))};

createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||"/",`http://${host}:${port}`);const upload=url.pathname.match(/^\/outreach-files\/upload\/([^/]+)$/);const download=url.pathname.match(/^\/outreach-files\/download\/([^/]+)$/);
    if(upload&&req.method==="PUT"){
      const token=verify(url.searchParams.get("token"),"upload");if(token.attachment_id!==upload[1])throw new Error("attachment mismatch");
      const size=Number(token.size_bytes);if(!Number.isInteger(size)||size<1||size>25*1024*1024)throw new Error("size rejected");
      const chunks=[];let received=0;for await(const chunk of req){received+=chunk.length;if(received>size)throw new Error("size mismatch");chunks.push(chunk)}
      if(received!==size)throw new Error("size mismatch");const bytes=Buffer.concat(chunks);const digest=createHash("sha256").update(bytes).digest("hex");if(digest!==token.sha256)throw new Error("sha256 mismatch");
      const target=storagePath(token.storage_key);await mkdir(dirname(target),{recursive:true});const temp=`${target}.${process.pid}.tmp`;await writeFile(temp,bytes,{mode:0o600});await rename(temp,target);await writeFile(`${target}.json`,JSON.stringify({attachment_id:token.attachment_id,size_bytes:size,sha256:digest,content_type:token.content_type,stored_at:new Date().toISOString()}),{mode:0o600});
      return send(res,201,{attachment_id:token.attachment_id,status:"stored",receipt:sign({op:"stored",attachment_id:token.attachment_id,storage_key:token.storage_key,size_bytes:size,sha256:digest,exp:Math.floor(Date.now()/1000)+600})});
    }
    if(download&&req.method==="GET"){
      const token=verify(url.searchParams.get("token"),"download");if(token.attachment_id!==download[1])throw new Error("attachment mismatch");const target=storagePath(token.storage_key);const meta=JSON.parse(await readFile(`${target}.json`,"utf8"));const info=await stat(target);res.writeHead(200,{"content-type":meta.content_type||"application/octet-stream","content-length":String(info.size),"cache-control":"private,no-store","content-disposition":`attachment; filename="${download[1]}"`});res.end(await readFile(target));return;
    }
    if(url.pathname==="/outreach-files/health"&&req.method==="GET")return send(res,200,{status:"ok",storage:"local-controlled",time:new Date().toISOString()});
    return send(res,404,{error:"not found"});
  }catch(error){if(req.url?.includes(".tmp"))try{await unlink(req.url)}catch{};return send(res,409,{error:error instanceof Error?error.message:"storage error"})}
}).listen(port,host,()=>console.log(`Tiger Outreach file store listening on ${host}:${port}`));
