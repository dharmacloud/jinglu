import sharp  from "sharp";
import {nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
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
    '0997-001斯09':'ksitigarbha1',
    '0997-002斯10':'ksitigarbha2',

    '1650-031扶01':'platform',
    //http://faculty.stust.edu.tw/~tang/shallow/best_sutra.htm
    //無量壽經 
    '0020-017師07':'svv1_ruci', //大寶積經無量壽如來會
    '0020-018師08':'svv2_ruci',
    '0022-001乃04':'svv1_ls',　//支婁迦讖
    '0022-002乃05':'svv2_ls',
    '0022-003乃06':'svv3_ls',
    '0023-001乃07':'svv1_zq',  //《阿彌陀三耶三佛薩樓佛檀過度人道經》 支謙
    '0023-002乃08':'svv2_zq',
    '0024-001乃09':'svv1_sv', //康僧鎧
    '0024-002乃10':'svv2_sv',
    '0857-001命10':'svv_fx', //法賢 大乘無量壽莊嚴經
    
    '0121-001食10':'lastword',//佛垂般涅槃畧說教誡經

    //南藏
    '11249711_39':'sdpdrk1', //法華經
    '11249811_37':'sdpdrk2',
    '11249911_36':'sdpdrk3',
    '11250011_43':'sdpdrk4',
    '11250111_40':'sdpdrk5',
    '11250211_38':'sdpdrk6',
    '11250311_34':'sdpdrk7',


    
    
    '11275811_29':'amty_kalam',//佛說觀無量壽佛經
    '11275911_28':'amtb_xuanzang', 

    '11276611_30':'amtb_', //會集本 大阿彌陀經
    '11276711_41':'amtb_',
    //小阿彌陀兩版 two version  http://www.minlun.org.tw/2pt/2pt-1-7/01.htm
    //folio 16 , 46.jpg 什譯阿彌陀經

}
const tempdir="A:/crop/"
const deffile='./vcpp-yongle-versions/0010a-001羽08.zip'


let input=(process.argv[2]||deffile).replace('.json','.zip')//'E:/yongle-bei-3400/11864611_14普門品/'
let named=false;//name specified in json filename
const pageoffset=parseInt(process.argv[3]||'0'); 
let at2=input.lastIndexOf('/');
if (at2==-1) at2=input.lastIndexOf('\\');
let outfn=input.slice(at2+1).replace('.zip','');


let  cropfile=input.replace('.zip','')+'.json';
const at=input.indexOf('-');//json specific name
if (~at && input.match(/\-[a-z]/)) {
    outfn=input.match(/\-([^\.]+)/)[1]
    input=input.replace(/\-[^\.]+/,'');
    named=true;
}


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

const dotask=async (buf,frame,nth,adjx,adjy,zipout)=>{  
    // console.log(buf)

    // const [buf, outfn, x,y,w,h]=t;
    // if (prevfn!==infn) {
    //     buf=await sharp(buf);
    // }
    const [left,top,width,height] =frame;
    
    const opts={left:left+adjx,top:top+adjy,width,height};
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
    let extracted=null;
    for (let i=0;i<tasks.length;i++) {
        const {name, frames,rotate} =tasks[i];
        const png=images[name];
        process.stdout.write('\r'+(i+1)+'/'+tasks.length+'   ')
        
        const buf=sharp(png);
        let adjy=0,adjx=0;
        if (rotate) {
            const angle=rotate/60; //60分之一
            const meta=await buf.metadata()
            const width=meta.width, height=meta.height;
            buf.rotate(angle);
            adjx = Math.round(0.5*Math.abs(width * Math.sin(rotate*Math.PI/(180*60))));//多出來的高
            adjy  = Math.round(0.5*Math.abs(height * Math.sin(rotate*Math.PI/(180*60))));//多出來的寬
        }
        for (let i=0;i<frames.length;i++) {
            nth++;
            await dotask(buf, frames[i],(nth+pageoffset).toString().padStart(3,'0'),adjx,adjy,zipout);
        }
    }
    


    if (!named){
        for (let i in filerenames) {
            if (~outfn.indexOf(i)) {
                outfn=filerenames[i];
                break
            }
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

