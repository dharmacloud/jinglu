import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
import JSZip from 'jszip'
import path from "node:path";
import {exec} from 'child_process';
await nodefs;

const filerenames={
    '0010a-001羽08':'vcpp_kumarajiva',
    '0012-001翔03':'vcpp_gupta',
    '0011b-001翔02':'vcpp_yijing',
    '0011a-001翔01':'vcpp_xuanzang',
    '0010c-001羽10':'vcpp_paramartha',
    '0010b-001羽09':'vcpp_bodhiruci',

    '0166-001惟01':'bhaisajya_gupta',
    '0167-001惟02':'bhaisajya',
    '0163-006恭06':'bhaisajya_srimitra',//from folio 20, chapter 12
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

const dotask=async (pngbuf,frame,nth,zipout)=>{
    const buf=await sharp(pngbuf)
    
    // console.log(buf)

    // const [buf, outfn, x,y,w,h]=t;
    // if (prevfn!==infn) {
    //     buf=await sharp(buf);
    // }
    const [left,top,width,height] =frame;

    const opts={left,top,width,height};
    //fix 450x1000, adjust ratio
    const quality=nth=='001'?50:15; //first page higher quality

    const outbuf=await buf.clone().extract(opts).resize(720,1600,{fit:"fill"}).jpeg({quality,mozjpeg:true}).toBuffer();
    const fn=tempdir+nth+'.jpg';
    if (zipout) {
        zipout.file(nth+'.jpg',outbuf,{compression: "STORE"});
    } else {
        writeChanged(fn,outbuf,false,'');//write binary buffer
    }
    
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
    const zipout=new JSZip();
    for (let i=0;i<tasks.length;i++) {
        const {name, frames} =tasks[i];
        const png=images[name];
        process.stdout.write('\r'+(i+1)+'/'+tasks.length+'   ')
        for (let i=0;i<frames.length;i++) {
            nth++;
            await dotask( png, frames[i],nth.toString().padStart(3,'0'),zipout);
        }        
    }
    
    for (let i in filerenames) {
        if (~outfn.indexOf(i)) {
            outfn=filerenames[i];
            break
        }
    }


    zipout.generateNodeStream({type:'nodebuffer',streamFiles:true,compression: "STORE"})
    .pipe(fs.createWriteStream(outfn+'.zip'))
    .on('finish', function () {
         console.log('done output ',outfn+'.zip')
    });


    // -g 1 create larget file, set min and max key frame interval
    const cmd='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -b:v 0 -crf 45 -keyint_min 1 -g 5 '+outfn+'.webm';
    const cmd2='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -b:v 512k -crf 40 -an  -x264opts keyint=1 -f mp4 -movflags +faststart -pix_fmt yuv420p -vf format=yuv420p -preset slow -profile:v main -level 3.0 '+outfn+'.mp4'

    //const cmd='ffmpeg -r 1 -i '+tempdir+'%03d.jpg -x265-params "crf=40:keyint=1"  -an -c:v libx265 -vtag hvc1 -vprofile main  -f mp4 -movflags +faststart -pix_fmt yuv420p  '+outfn+'.mp4'
    console.log('exec command: ',cmd)
     console.log('exec command: ',cmd2)
//    await runCommand(cmd)

});

