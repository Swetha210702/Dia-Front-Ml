const allowed=new Set(['B','STRONG','I','EM','U','S','STRIKE','P','BR','DIV','UL','OL','LI','BLOCKQUOTE','SPAN','FONT','SUB','SUP','SMALL','H1','H2','H3','H4','H5','H6','TABLE','COLGROUP','COL','THEAD','TBODY','TFOOT','TR','TD','TH','HR','A','IMG']);
const styleKeys=['text-align','font-weight','font-style','text-decoration','color','background-color','font-family','font-size','line-height','margin-left','margin-right','margin-top','margin-bottom','padding','padding-top','padding-right','padding-bottom','padding-left','border','border-top','border-right','border-bottom','border-left','border-spacing','table-layout','min-height','border-collapse','width','max-width','height','vertical-align','break-before','page-break-before'];
const classes=new Set(['report-logo','report-title','report-kicker','report-meta','report-intro','report-table','report-total','report-footer','preserve','rich-edit','document-page-break','custom-table']);
function safeImage(value){if(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value))return true;try{const url=new URL(value,location.href);return url.origin===location.origin&&/\/public\/assets\/dietograms-logo(?:-white)?\.png$/.test(url.pathname)}catch{return false}}
export function cleanRichText(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 function clean(parent){for(const node of [...parent.children]){
  if(['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','LINK','META','INPUT','BUTTON','SELECT','TEXTAREA'].includes(node.tagName)){node.remove();continue}
  clean(node);if(!allowed.has(node.tagName)){node.replaceWith(...node.childNodes);continue}
  const kept={};for(const key of styleKeys){const value=node.style.getPropertyValue(key);if(value&&!/url\(|expression|[<>]|javascript:/i.test(value))kept[key]=value}
  const attrs=Object.fromEntries([...node.attributes].map(a=>[a.name,a.value]));
  for(const a of [...node.attributes])node.removeAttribute(a.name);
  for(const [key,value] of Object.entries(kept))node.style.setProperty(key,value);
  const safeClasses=(attrs.class||'').split(/\s+/).filter(c=>classes.has(c));if(safeClasses.length)node.className=safeClasses.join(' ');
  if(['name','instructions','notes'].includes(attrs['data-doc-field']))node.dataset.docField=attrs['data-doc-field'];
  if(/^\d{1,3}$/.test(attrs['data-meal-row']||''))node.dataset.mealRow=attrs['data-meal-row'];
  if(['name','time','food','portion','calories'].includes(attrs['data-meal-field']))node.dataset.mealField=attrs['data-meal-field'];
  if(node.tagName==='FONT'){if(/^#[0-9a-f]{3,8}$/i.test(attrs.color||''))node.setAttribute('color',attrs.color);if(/^[\w\s,-]+$/.test(attrs.face||''))node.setAttribute('face',attrs.face);if(/^[1-7]$/.test(attrs.size||''))node.setAttribute('size',attrs.size)}
  if(node.tagName==='A'&&/^(https?:\/\/|mailto:)/i.test(attrs.href||'')){node.setAttribute('href',attrs.href);node.setAttribute('rel','noopener noreferrer');node.setAttribute('target','_blank')}
  if(node.tagName==='IMG'){if(!safeImage(attrs.src||'')){node.remove();continue}node.setAttribute('src',attrs.src);node.setAttribute('alt',attrs.alt||'Document image');if(/^\d{1,3}$/.test(attrs.width||''))node.setAttribute('width',attrs.width)}
  if(node.tagName==='TABLE'){for(const key of ['tableId','continuedFrom']){const value=attrs[key==='tableId'?'data-table-id':'data-continued-from'];if(value&&/^[\w-]+$/.test(value))node.dataset[key]=value}node.dataset.repeatHeader=attrs['data-repeat-header']==='false'?'false':'true'}
  if(['TD','TH'].includes(node.tagName))for(const key of ['colspan','rowspan'])if(/^[1-9]\d?$/.test(attrs[key]||''))node.setAttribute(key,attrs[key]);
 }}
 clean(doc.body);return doc.body.innerHTML;
}
