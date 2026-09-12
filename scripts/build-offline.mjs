import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const target=process.argv[2];
if(!target)throw new Error('Pass an absolute output HTML path. Run the existing build first.');
let html=readFileSync('dist/index.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)];
const styles=[...html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)];
for(const match of scripts){const js=readFileSync(resolve('dist',match[1].replace(/^\//,'')),'utf8').replace(/<\/script/gi,'<\\/script');html=html.replace(match[0],()=>`<script type="module">${js}</script>`);}
for(const match of styles){const css=readFileSync(resolve('dist',match[1].replace(/^\//,'')),'utf8');html=html.replace(match[0],()=>`<style>${css}</style>`);}
if(/(?:src|href)="\/assets\//.test(html))throw new Error('Offline asset is unresolved');
writeFileSync(target,html);
console.log(`Standalone HTML written (${Buffer.byteLength(html)} bytes).`);
