import {nodefs,parseQianziwen,qianziwen,readTextLines,normalizeQianziwen, writeChanged, alphabetically} from 'ptk/nodebundle.cjs'
await nodefs;

const shandong=readTextLines('./shandong2019.tsv').map(it=>it.split('\t'))
shandong.shift(); //drop header
const yonglebei=readTextLines('./yonglebei.tsv').map(it=>it.split('\t'))
yonglebei.shift() //drop header

const parseQZW=s=>{
  const qzw=parseQianziwen(s);
  if (qzw==-1) {
      console.log("wrong 千字文",s,s.length)
  }
  return qzw;
}

const mapping={};
yonglebei.forEach(it=>{
  const [no,title,juan,translator, qzw1,j1,qzw2,j2]= it;
  if (!j1||!j2) {
    console.log('無函號',it);
//以下無函號
//大明三藏聖教目錄
//番字藥師琉璃光七佛本願功德經
    return;
  }
  const from=parseQZW(qzw1,10) + (parseInt(j1)-1);
  const to=parseQZW(qzw2,10) + (parseInt(j2)-1);
  let njuan=0;
  for (let i=from;i<=to;i++) {
    const qzw=qianziwen.charAt( Math.floor(i / 10))  
    const key = qzw+(1+(i % 10)).toString().padStart(2,'0')
    if (!mapping[key]) mapping[key]={};
    mapping[key].no=no;
    
    mapping[key].juan=++njuan;
  }
})

shandong.forEach(it=>{
  const [name,m0,pagecount,title,m3,qzwjuan]=it;
  const key=normalizeQianziwen(qzwjuan.replace('?',''))
  //const qzw_juan=parseQZW(m4,10);
  if (!mapping[key]) mapping[key]={};
  mapping[key].zipname=name;
  mapping[key].title=title;
  mapping[key].pagecount=parseInt(pagecount)||0;
})

const out=[]
let acc=0;
for (let key in mapping) {
  const {zipname,no,juan,title,pagecount}=mapping[key];
  if (!juan) continue;
  acc+=pagecount;
  out.push( no+'-'+juan.toString().padStart(3,'0')+key+'\t'
  +(pagecount?pagecount:'')+'\t'+acc+'\t'+title+'\t'+zipname );
}
out.sort(alphabetically)
writeChanged('folio-map.tsv',out.join('\n'));
// writeChanged('folio-map.cmd',out.map(it=> 'ren '+it.replace('\t','.zip ')+'.zip' ).join('\n'),true);