/* generate vol-page to juan mapping */
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import {nodefs,filesFromPattern, alphabetically, writeChanged} from 'ptk/nodebundle.cjs';
await nodefs;

const srcdir='long-byjuan';
const files=filesFromPattern("*.pdf",srcdir).sort(alphabetically);
const mapping=[];
async function loadPdf(fn){
    const loadingTask = pdfjsLib.getDocument(fn);
    return await loadingTask.promise;
}
let page=0,prevvol; 
for (let i=0;i<files.length;i++) {
    const fn=files[i];
    const m=fn.match(/(\d+)n(\d+[a-z]*)_(\d+)\.pdf/);
    if (!m) continue;
    const [m0,vol,no,juan]=m;
    
    const pdf=await loadPdf(srcdir+'/'+fn);
    if (prevvol!==vol) page=1;
    mapping.push( fn+'\t'+page);
    page+=pdf.numPages;
    process.stdout.write( '\r'+(i+1)+'/'+files.length+' page count:'+pdf.numPages+'   ');
    prevvol=vol;
}

writeChanged(srcdir+'.tsv', mapping.join('\n'), true);

