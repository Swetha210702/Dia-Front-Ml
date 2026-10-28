import {validateIntake} from './intake.js';
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validateClientRecord(client){
  const errors={};
  if(!text(client.name,160))errors.name='Enter a name of 1–160 characters.';
  if(!text(client.email,254)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email))errors.email='Enter a valid email address.';
  for(const [key,min,max] of [['age',1,120],['height',30,250],['weight',1,400],['target',1,400]]){
    if(String(client[key]??'').trim()===''||!Number.isFinite(Number(client[key]))||Number(client[key])<min||Number(client[key])>max)errors[key]=`${key} must be between ${min} and ${max}.`;
  }
  if(!Number.isInteger(Number(client.age)))errors.age='Age must be a whole number.';
  if(!['Active','Paused','Archived'].includes(client.status))errors.status='Choose a valid client status.';
  if(!['Vegetarian','Vegan','Non-vegetarian','Eggitarian'].includes(client.diet))errors.diet='Choose a valid dietary pattern.';
  if(String(client.notes||'').length>10000)errors.notes='Notes must be 10,000 characters or fewer.';
  return errors;
}
export function validateGenerationRequest(input){
  const errors=validateIntake({...input.intake,...input});
  if(!text(input.name,200))errors.name='Enter a plan title of 1–200 characters.';
  if(![7,14,28].includes(Number(input.days)))errors.days='Choose a supported plan duration.';
  if(!Number.isInteger(Number(input.calories))||Number(input.calories)<800||Number(input.calories)>5000)errors.calories='Calorie target must be a whole number between 800 and 5000.';
  if(input.review!==true)errors.review='Review the assessment before generating.';
  return errors;
}
