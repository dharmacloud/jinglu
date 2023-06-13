# jinglu
convet cbeta jinglu to open format

## prerequisite

batch download pdf from  http://www.sutrapearls.org/

compare toc.htm with filenames, fix broken link (see sutrapearls/ errata)

node count-pdf-page.js to generate vol-no-juan to page mappng

## longcang 使用
node gen-sutra-map.js 59 2  // 乾隆到大正對照表
node gen-sutra-map.js 2 59  //大正對到乾隆對照表
node gen-sutra-map.js 2 53  //大正對到永樂北對照表
