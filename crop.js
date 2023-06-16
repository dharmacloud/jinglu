import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
import JSZip from 'jszip'
import path from "node:path";
import {exec} from 'child_process';
await nodefs;

const filerenames={
    '0010a-001羽08':'vcpp_kumarajiva',
    '0012-001翔03':'vcpp_gupta',
    '0011b-001翔02':'vcpp_yijing',
    '0011a-001翔01':'vcpp_xuanzhan',
    '0010c-001羽10':'vcpp_paramartha',
    '0010b-001羽09':'vcpp_bodhiruci'
}
const tempdir="A:/crop/"
const deffile='./vcpp-yongle-versions/0010a-001羽08.zip'


const input=process.argv[2]||deffile//'E:/yongle-bei-3400/11864611_14普門品/'
let at2=input.lastIndexOf('/');
if (at2==-1) at2=input.lastIndexOf('\\');
let outfn=input.slice(at2+1).replace('.zip','');

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
    
    for (let i in filerenames) {
        if (~outfn.indexOf(i)) {
            outfn=filerenames[i];
            break
        }
    }
    // -g 1 create larget file, set min and max key frame interval
    const cmd='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -b:v 0 -crf 45 -keyint_min 1 -g 10 '+outfn+'.webm';
    const cmd2='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -crf 40  -x264opts keyint=1 -movflags +faststart '+outfn+'.mp4'
    console.log('exec command: ',cmd)
    console.log('exec command: ',cmd2)
//    await runCommand(cmd)

});

