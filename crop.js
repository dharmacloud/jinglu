import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
import JSZip from 'jszip'
import path from "node:path";
import {exec} from 'child_process';
await nodefs;
const tempdir="A:/crop/"
const deffile='./vcpp-yongle-versions/0010a-001羽08.zip'
const input=process.argv[2]||deffile//'E:/yongle-bei-3400/11864611_14普門品/'
let at2=input.lastIndexOf('/');
if (at2==-1) at2=input.lastIndexOf('\\');
const outfn=input.slice(at2+1).replace('.zip','');

import sharp  from "sharp";

let  cropfile=input.replace('.zip','')+'.json';

const tasks=JSON.parse(readTextContent(cropfile));

const preparetempdir=()=>{
    if (fs.existsSync(tempdir)) {
        for (const file of fs.readdirSync(tempdir)) {
            fs.unlinkSync(path.join(tempdir, file));
        }
        // fs.rmdirSync(tempdir)
    } else {
        fs.mkdirSync(tempdir);
    }    
}
preparetempdir();

const dotask=async (pngbuf,frame,nth)=>{
    const buf=await sharp(pngbuf)
    
    // console.log(buf)

    // const [buf, outfn, x,y,w,h]=t;
    // if (prevfn!==infn) {
    //     buf=await sharp(buf);
    // }
    const [left,top,width,height] =frame;

    const opts={left,top,width,height};
    //fix 450x1000, adjust ratio
    const outbuf=await buf.clone().extract(opts).resize(720,1600,{fit:"fill"}).jpeg({mozjpeg:true}).toBuffer();
    const fn=tempdir+nth+'.jpg';
    writeChanged(fn,outbuf,false,'');//write binary buffer
    // prevfn=infn;
}

const data=fs.readFileSync(input);
async function runCommand(command) {
    const { stdout, stderr, error } = await exec(command);
    if(stderr){
        console.error('stderr:', stderr);
    }
    if(error){
        console.error('error:', error);
    }
    return stdout;
}

JSZip.loadAsync(data).then(async function (zip) {
    
    const images={};
    for (let zipfile in zip.files) {
        if (zip.files[zipfile].dir)continue;
        const buf = await zip.file(zipfile).async("arraybuffer");
        const at=zipfile.indexOf('/');
        const filename=zipfile.slice(at+1);
        images[filename]=buf
        // await dotask(buf);
    }
    let nth=0;
    for (let i=0;i<tasks.length;i++) {
        const {name, frames} =tasks[i];
        const png=images[name];
        for (let i=0;i<frames.length;i++) {
            nth++;
            dotask( png, frames[i],nth.toString().padStart(3,'0'));
        }        
    }

    const mp4filename=outfn+'.webm';
    const cmd='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -crf 40 -b:v 0 '+mp4filename;
    console.log('exec command: ',cmd)
//    await runCommand(cmd)

});

