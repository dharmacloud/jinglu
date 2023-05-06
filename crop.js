import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
await nodefs;
const srcdir=process.argv[2]||'E:/yongle-bei-3400/11864611_14普門品/'
import sharp  from "sharp";

const tasks=readTextLines(srcdir+'crop.tsv').map(it=>it.split('\t'));

let prevfn='', buf;
const dotask=async t=>{
    const [infn, outfn, x,y,w,h]=t;
    if (prevfn!==infn) {
        buf=await sharp(srcdir+infn);
    }
    const opts={left:parseInt(x),top:parseInt(y),width:parseInt(w),height:parseInt(h)};
    const outbuf=await buf.clone().extract(opts).toBuffer();
    writeChanged(outfn,outbuf,true,'');//write binary buffer
    prevfn=infn;
}

for (let i=0;i<tasks.length;i++) {
    await dotask(tasks[i]);
}