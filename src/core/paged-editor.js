import {esc,logoUrl} from './ui.js';
import {cleanRichText} from './rich-text.js';
export function pageDimensions(style={}){const sizes={A4:[210*96/25.4,297*96/25.4],Letter:[816,1056],Legal:[816,1344]};const [width,height]=sizes[style.pageSize]||sizes.A4;return style.orientation==='Landscape'?{width:height,height:width}:{width,height}}
export function renderPages(plan,legacyHTML){
 const s=plan.style,{width,height}=pageDimensions(s);let pages=plan.documentPages;
 if(!pages){const doc=new DOMParser().parseFromString(legacyHTML,'text/html');const article=doc.querySelector('article');article.querySelectorAll('.report-logo,.report-footer').forEach(n=>n.remove());pages=[article.innerHTML]}
 if(s.layout==='Pageless')pages=[pages.join('<div class="document-page-break"><br></div>')];
 return `<div class="report-pages ${s.layout==='Pageless'?'pageless':''}" style="--sheet-width:${width}px;--sheet-height:${height}px;--sheet-margin:${Number(s.margin||15)*3.78}px;--logo-height:${Number(s.logoHeight||70)}px;--report-colour:${esc(s.colour)};--heading-size:${Number(s.headingSize||30)}px;--paragraph-gap:${Number(s.paragraphGap||16)}px;--table-pad:10px;font-family:'${esc(s.font)}',Arial,sans-serif;font-size:${Number(s.size)}px;line-height:${Number(s.lineHeight||1.65)};color:${esc(s.textColour||'#303039')}">${pages.map((html,i)=>sheetHTML(plan,html,i)).join('')}</div>`;
}
function sheetHTML(plan,html,index){const s=plan.style;return `<article class="report-page report-sheet" data-page-index="${index}" data-manual-page="${!!plan.documentManualBreaks?.[index]}" style="background:${esc(s.pageColour||'#fff')}"><header class="sheet-header" style="text-align:${esc(s.logoAlign||'left')}">${index===0||s.repeatLogo!==false?`<button type="button" class="sheet-logo-button" data-action="customise-logo" aria-label="${s.logo?'Replace practice logo':'Insert practice logo'}">${s.logo?`<img src="${esc(s.logo)}" alt="Practice logo" style="width:${Number(s.logoWidth||150)}px;max-height:${Number(s.logoHeight||70)}px;object-fit:contain;filter:none"><span>Change logo</span>`:`<img src="${logoUrl}" alt="Dietograms logo" style="width:150px"><span>＋ Insert your logo</span>`}</button>`:''}</header><div class="sheet-body" contenteditable="true" data-document="true" role="textbox" aria-label="Diet plan document page ${index+1}" aria-multiline="true" spellcheck="true">${html||'<p><br></p>'}</div><footer class="sheet-footer"><span>${esc(s.footerText||'Dietograms · Nutrition Intelligence')}</span><span class="sheet-page-number">${index+1} / ${plan.documentPages?.length||1}</span></footer><span class="sheet-page-label" aria-hidden="true">Page ${index+1}</span></article>`}
export function addDocumentPage(plan,manual=true){const container=document.querySelector('.report-pages');if(!container)return;const index=container.children.length;container.insertAdjacentHTML('beforeend',sheetHTML(plan,'<p><br></p>',index));const page=container.lastElementChild;page.querySelector('.sheet-footer span').textContent=plan.style.footerText||container.querySelector('.sheet-footer span').textContent;page.dataset.manualPage=String(manual);numberPages(container);return page.querySelector('.sheet-body')}
function numberPages(container){const pages=[...container.children];pages.forEach((page,index)=>{page.dataset.pageIndex=index;page.querySelector('.sheet-page-number').textContent=`${index+1} / ${pages.length}`;page.querySelector('.sheet-page-label').innerHTML=`Page ${index+1} <button type="button" data-action="doc-remove-page" data-index="${index}" ${pages.length<2||!empty(page.querySelector('.sheet-body'))?'disabled':''}>Remove empty page</button>`;page.querySelector('.sheet-body').setAttribute('aria-label',`Diet plan document page ${index+1}`)});const count=document.querySelector('#document-page-count');if(count)count.textContent=pages.length+' page'+(pages.length===1?'':'s')}
function empty(body){return !body.textContent.trim()&&!body.querySelector('table,img,[data-caret-marker]')}
export function paginateDocument(plan){
 const container=document.querySelector('.report-pages');if(!container)return;const canvas=container.closest('.document-canvas');if(canvas)container.style.zoom=Math.min(1,(canvas.clientWidth-40)/pageDimensions(plan.style).width);if(container.classList.contains('pageless')){numberPages(container);return}
 let caret;const selection=window.getSelection();if(selection?.isCollapsed&&selection.rangeCount&&document.activeElement?.closest('[data-document]')){caret=document.createElement('span');caret.dataset.caretMarker='true';caret.style.cssText='font-size:0;line-height:0';selection.getRangeAt(0).cloneRange().insertNode(caret)}
 let operations=0;
 for(let index=0;index<container.children.length&&index<200;index++){
  const page=container.children[index],body=page.querySelector('.sheet-body');
  const nextBody=(respectBreak=false)=>{const next=container.children[index+1];if(respectBreak&&next?.dataset.manualPage==='true'){const added=addDocumentPage(plan,false);container.insertBefore(added.closest('.report-sheet'),next);return added}return next?.querySelector('.sheet-body')||addDocumentPage(plan,false)};
  const marker=body.querySelector('.document-page-break');
  if(marker){const range=document.createRange();range.setStartAfter(marker);range.setEnd(body,body.childNodes.length);const tail=range.extractContents();marker.remove();const next=nextBody();next.closest('.report-sheet').dataset.manualPage='true';if(empty(next))next.innerHTML='';next.prepend(tail)}
  while(body.scrollHeight>body.clientHeight+2&&operations++<1000){
   const last=body.lastChild;if(!last)break;
   const next=nextBody(true);if(empty(next))next.innerHTML='';
   if(last.nodeType===1&&last.tagName==='TABLE'&&last.tBodies[0]?.rows.length>1){
    let continuation=next.firstElementChild;
    if(!continuation||continuation.tagName!=='TABLE'||continuation.dataset.continuedFrom!==last.dataset.tableId){continuation=last.cloneNode(false);last.dataset.tableId||='table-'+Math.random().toString(36).slice(2,9);continuation.dataset.tableId=last.dataset.tableId;continuation.dataset.continuedFrom=last.dataset.tableId;if(last.tHead&&last.dataset.repeatHeader!=='false')continuation.append(last.tHead.cloneNode(true));continuation.append(document.createElement('tbody'));next.prepend(continuation)}
    continuation.tBodies[0].prepend(last.tBodies[0].lastElementChild);continue;
   }
   if(body.childNodes.length===1&&last.nodeType===1){
    const image=last.tagName==='IMG'?last:null;if(image){image.style.maxHeight=(body.clientHeight-12)+'px';image.style.objectFit='contain';break}
    const walker=document.createTreeWalker(last,NodeFilter.SHOW_TEXT);let textNode,biggest;while(textNode=walker.nextNode())if(!biggest||textNode.length>biggest.length)biggest=textNode;
    if(biggest?.length>40){const range=document.createRange();let split=Math.floor(biggest.length/2);const space=biggest.textContent.lastIndexOf(' ',split);if(space>5)split=space+1;range.setStart(biggest,split);range.setEnd(last,last.childNodes.length);const fragment=range.extractContents();const sibling=last.cloneNode(false);sibling.append(fragment);next.prepend(sibling);continue}
    page.classList.add('sheet-overflow');break;
   }
   next.prepend(last);
  }
 }
 for(let i=0;i<container.children.length-1;i++){
  const page=container.children[i],nextPage=container.children[i+1];if(nextPage.dataset.manualPage==='true')continue;
  const body=page.querySelector('.sheet-body'),next=nextPage.querySelector('.sheet-body');
  while(next.firstChild&&operations++<1500){
   const last=body.lastElementChild,first=next.firstElementChild;
   if(last?.tagName==='TABLE'&&first?.tagName==='TABLE'&&last.dataset.tableId&&last.dataset.tableId===first.dataset.tableId&&first.tBodies[0]?.rows.length){const row=first.tBodies[0].firstElementChild;last.tBodies[0].append(row);if(body.scrollHeight>body.clientHeight+2){first.tBodies[0].prepend(row);break}if(!first.tBodies[0].rows.length)first.remove();continue}
   const node=next.firstChild;body.append(node);if(body.scrollHeight>body.clientHeight+2){next.prepend(node);break}
  }
  if(empty(next)){nextPage.remove();i--}
 }
 if(caret?.isConnected){const range=document.createRange();range.setStartBefore(caret);range.collapse(true);const body=caret.closest('.sheet-body');body?.focus({preventScroll:true});selection.removeAllRanges();selection.addRange(range);caret.remove()}
 numberPages(container);
}
export function capturePages(plan){const sheets=[...document.querySelectorAll('.report-sheet')];plan.documentPages=sheets.map(sheet=>cleanRichText(sheet.querySelector('.sheet-body').innerHTML));plan.documentManualBreaks=sheets.map(sheet=>sheet.dataset.manualPage==='true');plan.documentHtml=plan.documentPages.join('<div class="document-page-break"><br></div>')}
