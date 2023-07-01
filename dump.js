/* 倒出 經錄 mdb */
import {filesFromPattern,nodefs, writeChanged, readTextContent} from 'ptk/nodebundle.cjs'
await nodefs;

import MDBReader from "mdb-reader";
const mdbs=filesFromPattern("*.mdb","mdb");
const convtsv=(data,mdbname)=>{
    const header=[],table=[];
    for (let i=0;i<data.length;i++) {
        const obj=data[i],row=[];
        if (i==0) {
            for (let key in obj) {
                header.push(key);
            }   
            table.push(header.join('\t'))
        }
        for (let key in obj) {
            let field=obj[key]||'';
            if (typeof field!=='string') field=field.toString();
            if (~field.indexOf('\t')) {
                console.log("has tab in "+mdbname+field);
                field=field.replace(/\t/g,'\\t');
            }
            row.push(field);
        }
        table.push(row.join('\t'));
    }
    
    return table.join('\n');
}
const dump=(mdbname)=>{
    // const mdbname='永樂北藏';
    const buffer = fs.readFileSync("mdb/"+mdbname);
    const reader = new MDBReader(buffer);
    const tables=reader.getTableNames(); // ['Cats', 'Dogs', 'Cars']

    
    for (let i=0;i<tables.length;i++) {
        const table = reader.getTable(tables[i]);
        writeChanged(mdbname.slice(0,mdbname.length-3)+tables[i]+'.tsv',
        convtsv(table.getData(),mdbname),true);
    }
}
mdbs.forEach(dump);