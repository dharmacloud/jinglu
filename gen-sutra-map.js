/* 產生藏經經號對號表*/
import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines} from 'ptk/nodebundle.cjs'
import * as colors from 'ptk/cli/colors.cjs'; // lukeed/kleur
const {blue,yellow,red,cyan,underline,magenta,green} = colors;
await nodefs;


const tsv=readTextLines('tsv/大藏集成.大藏集成.tsv');
const fields=tsv.shift().split('\t');

const corfrom=parseInt(process.argv[2]);
const corto=parseInt(process.argv[3]);

const showfieldname=()=>{
    for (let i=0;i<fields.length;i++) {
        process.stdout.write(yellow(i.toString())+' '+fields[i]+'|');
    }
    console.log('\nnode gen-sutra-map.js', yellow('fromfield tofield'))
    process.stdout.write('\r')
} 


if (!corfrom||!corto) {
    showfieldname();
} else {
    const map={};
    let entries=0;
    for (let i=0;i<tsv.length;i++) {
        const row=tsv[i].split('\t');
        const from=row[corfrom]
        const to   =row[corto];
        if (!from || !to) continue;
        if (!map[from]) map[from]=[];
        map[from].push(to);
    }

    for (let key in map) {
        if (map[key].length==1) map[key]=map[key][0];
        entries+=map[key].length;
    }
    console.log('entries',entries)
    writeChanged('sutramap-'+corfrom+'-'+corto+'.json', JSON.stringify(map),true);
}

