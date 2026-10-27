import {cleanRichText} from './rich-text.js';
let savedSelection;
let activeDocument;
export function rememberDocumentSelection(){const selection=window.getSelection();if(!selection?.rangeCount)return;const anchor=selection.anchorNode?.nodeType===1?selection.anchorNode:selection.anchorNode?.parentElement;if(anchor?.closest('[data-document]')){activeDocument=anchor.closest('[data-document]');savedSelection=selection.getRangeAt(0).cloneRange()}}
export function restoreDocumentSelection(){const article=activeDocument?.isConnected?activeDocument:document.querySelector('[data-document]');if(!article)return false;article.focus({preventScroll:true});const selection=window.getSelection();if(savedSelection&&article.contains(savedSelection.commonAncestorContainer)){selection.removeAllRanges();selection.addRange(savedSelection)}else if(!selection.rangeCount||!article.contains(selection.anchorNode)){const range=document.createRange();range.selectNodeContents(article);range.collapse(false);selection.removeAllRanges();selection.addRange(range)}return true}
export function applyDocumentCommand(command,value=null){if(!restoreDocumentSelection())return false;document.execCommand(command,false,value);rememberDocumentSelection();return true}
export function saveDocumentToPlan(article,plan){
 const title=article.querySelector('[data-doc-field="name"]')?.textContent.trim();if(title)plan.name=title;
 const intro=article.querySelector('[data-doc-field="instructions"]');if(intro)plan.instructions=intro.textContent;
 const notes=article.querySelector('[data-doc-field="notes"]');if(notes)plan.style.notes=notes.textContent;
 const rows=[...article.querySelectorAll('[data-meal-row]')];
 const previousMeals=plan.meals;
 plan.meals=rows.map((row,nextIndex)=>{const meal={...(previousMeals[Number(row.dataset.mealRow)]||{name:'Meal',time:'',food:'',portion:'',calories:0})};for(const key of ['name','time','food','portion','calories']){const field=row.querySelector(`[data-meal-field="${key}"]`);if(!field){meal[key]=key==='calories'?0:'';continue}const value=field.textContent.trim();if(key==='calories')meal[key]=Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=5000?Number(value):0;else meal[key]=value}row.dataset.mealRow=nextIndex;return meal});
 const total=article.querySelector('.report-total strong');if(total){const value=plan.meals.reduce((sum,m)=>sum+Number(m.calories),0)+' kcal';if(total.textContent!==value)total.textContent=value}
 const footer=article.querySelector('.report-footer span');if(footer){const value=`${plan.status} · Version ${plan.version} · Sample plan`;if(footer.textContent!==value)footer.textContent=value}
 plan.documentHtml=cleanRichText(article.innerHTML);
}
export function printableDocument(html){const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('.sheet-logo-button').forEach(button=>button.replaceWith(...button.querySelectorAll('img')));doc.querySelectorAll('.sheet-page-label').forEach(node=>node.remove());doc.querySelectorAll('[contenteditable],[data-document]').forEach(el=>{el.removeAttribute('contenteditable');el.removeAttribute('role');el.removeAttribute('aria-label');el.removeAttribute('aria-multiline');el.removeAttribute('data-document')});return doc.body.innerHTML}
