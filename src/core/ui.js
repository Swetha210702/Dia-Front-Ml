export const fontFamilies=['Manrope','DM Mono','Arial','Aptos','Calibri','Cambria','Candara','Century Gothic','Comic Sans MS','Consolas','Constantia','Corbel','Courier New','Franklin Gothic Medium','Garamond','Georgia','Gill Sans','Helvetica','Helvetica Neue','Impact','Lucida Console','Lucida Sans Unicode','Optima','Palatino','Palatino Linotype','Segoe UI','Tahoma','Times New Roman','Trebuchet MS','Verdana','Baskerville','Didot','Futura','Menlo','Monaco','Book Antiqua','Arial Narrow','system-ui'];
export const brandLogo=()=>'<img class="dietograms-logo" src="/public/assets/dietograms-logo.png" alt="Dietograms — Nutrition Intelligence">';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const initials=name=>name.split(' ').map(x=>x[0]).slice(0,2).join('');
export const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export const fruitTypes=['apple','orange','banana','lemon','pear','strawberry','blueberry','peach','cherry','raspberry','blackberry','grapes','watermelon'];
export function fruit(type='apple'){
  let shape='';
  if(['apple','orange','lemon','pear','blueberry','peach'].includes(type))shape=`<i class="ref-${type}"></i>`;
  if(type==='banana')shape='<i class="ref-banana"></i><i class="ref-banana-line"></i>';
  if(type==='strawberry')shape='<i class="ref-strawberry"></i><i class="ref-leaf-up ref-strawberry-leaf-up"></i><i class="ref-leaf-down ref-strawberry-leaf-down"></i>';
  if(type==='cherry')shape='<i class="ref-cherry ref-cherry1"></i><i class="ref-cherry ref-cherry2"></i><i class="ref-cherry-join"></i>';
  if(['raspberry','blackberry'].includes(type))shape=`<i class="ref-berry ref-${type}"></i>${Array.from({length:8},(_,i)=>`<i class="ref-berry-ball ref-berry-ball${i+1} ref-${type}-ball"></i>`).join('')}<i class="ref-leaf-up ref-raspberry-leaf-up"></i><i class="ref-leaf-down ref-raspberry-leaf-down"></i>`;
  if(type==='yoghurt')shape='<i class="ref-yoghurt"><span class="ref-label">yoghurt</span></i><i class="ref-upper-part"></i>';
  if(shape)return `<span class="fruit fruit-art ${type}" aria-hidden="true">${shape}</span>`;
  return `<span class="fruit ${type}" aria-hidden="true"><i class="stem"></i><i class="leaf"></i><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></span>`;
}
export function botanical(){return ''}
export function badge(value){return `<span class="badge ${value.toLowerCase().replaceAll(' ','-')}">${esc(value)}</span>`}
export function avatar(c,size=''){return `<span class="avatar ${esc(c.colour||'green')} ${size}">${esc(initials(c.name))}</span>`}
export function field(label,name,value='',type='text',required=false,extra=''){return `<label class="field"><span>${esc(label)}${required?' <em>*</em>':''}</span><input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${extra}></label>`}
export function select(label,name,values,value='',extra=''){if(value&&!values.some(v=>(typeof v==='string'?v:v.value)===value))values=[{value,label:value+' (custom)'},...values];return `<label class="field"><span>${esc(label)}</span><select name="${name}" ${extra}>${values.map(v=>`<option value="${esc(typeof v==='string'?v:v.value)}" ${(typeof v==='string'?v:v.value)===value?'selected':''}>${esc(typeof v==='string'?v:v.label)}</option>`).join('')}</select></label>`}
export function area(label,name,value='',extra=''){return `<label class="field full"><span>${esc(label)}</span><textarea name="${name}" rows="3" ${extra}>${esc(value)}</textarea></label>`}
export const button=(label,action,kind='primary',attrs='')=>`<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${label}</button>`;
export function header(kicker,title,subtitle,actions=''){return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`}
export function empty(title,text,action=''){return `<div class="empty"><div class="empty-art">${fruit('pear')}</div><h3>${title}</h3><p>${text}</p>${action}</div>`}
export const metric=(label,value,detail,tone='')=>`<div class="metric ${tone}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
export function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;document.querySelector('#toasts').append(el);setTimeout(()=>el.remove(),4500)}
export function download(name,body,type='text/plain'){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
