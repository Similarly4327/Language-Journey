const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function clientAssetRevision(html){
 const paths=[...new Set([...html.matchAll(/(?:src|href)="\.\/([^"?]+\.(?:js|css))(?:\?[^" ]*)?"/g)].map(match=>match[1]))].sort();
 const hash=crypto.createHash('sha256');for(const asset of paths)hash.update(asset+'\0').update(fs.readFileSync(path.join(root,asset),'utf8').replace(/\r\n/g,'\n')).update('\0');
 return 'recall-recovery-'+hash.digest('hex').slice(0,16);
}
if(require.main===module){const file=path.join(root,'index.html'),html=fs.readFileSync(file,'utf8'),revision=clientAssetRevision(html);const next=html.replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css))(?:\?[^" ]*)?"/g,`$1?v=${revision}"`);if(next!==html)fs.writeFileSync(file,next);console.log(revision)}
module.exports={clientAssetRevision};
