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
 
    '0017-001翔08':'pph_xuanzang_kumarajiva',  //兩種略本 +10
    '0929-001薄07':'pph',  //page 29 廣本，有梵文
    '0133-001草10':'pumen',
    '0121-001食10':'lastwords',
    '0658-001慶10':'falun',
    //南藏
    '11249711_39':'sdpdrk1',
    '11249811_37':'sdpdrk2',
    '11249911_36':'sdpdrk3',
    '11250011_43':'sdpdrk4',
    '11250111_40':'sdpdrk5',
    '11250211_38':'sdpdrk6',
    '11250311_34':'sdpdrk7',

}
const tempdir="A:/crop/"
const deffile='./vcpp-yongle-versions/0010a-001羽08.zip'


const input=process.argv[2]||deffile//'E:/yongle-bei-3400/11864611_14普門品/'
const pageoffset=parseInt(process.argv[3]||'0'); 
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
    //const quality=50;
    const W=720;
    const H=1600;
    const fit='fill';//contain'
    const background={r:243, g:208, b:160};
    const outbuf=await buf.clone().extract(opts).resize(W,H,{fit,background}).jpeg({quality,mozjpeg:true}).toBuffer();
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
            await dotask( png, frames[i],(nth+pageoffset).toString().padStart(3,'0'),zipout);
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

