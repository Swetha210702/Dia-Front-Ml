export const goalOptions=[
  {value:'Fat loss',description:'Reduce body fat percentage without significant changes in overall weight.'},
  {value:'Weight loss',description:'Decrease overall body weight.'},
  {value:'Muscle gain',description:'Build muscle while maintaining a stable weight.'},
  {value:'Weight gain',description:'Increase overall body weight.'},
  {value:'General healthy diet',description:'Support overall health and wellness without a specific weight-related goal.'}
];
export const intakeSections=[
  {title:'Personal details',short:'Personal',description:'Start with the person. Confirm their details and the goal you’re working towards.',fields:[
    {name:'clientName',label:'Name of the client',kind:'text'},
    {name:'age',label:'Age',kind:'number',min:1,max:120},
    {name:'gender',label:'Gender',kind:'choice',options:['Male','Female'],compact:true},
    {name:'height',label:'Height (in cm)',kind:'number',min:30,max:250,step:0.1},
    {name:'weight',label:'Weight (in kg)',kind:'number',min:1,max:400,step:0.1},
    {name:'goal',label:'Goal',kind:'choice',options:goalOptions}
  ]},
  {title:'Routine & lifestyle',short:'Routine',description:'Make the plan fit their day: work, sleep, movement, and everything in between.',fields:[
    {name:'wakeTime',label:'Wake-up time',kind:'time'},
    {name:'sleepTime',label:'Sleep time',kind:'time'},
    {name:'occupation',label:'Occupation',kind:'choice',options:['Student','Work from home','Work from office'],compact:true},
    {name:'occupationalSchedule',label:'Explain the occupational schedule with timings',kind:'textarea',hint:'Include work or class hours, breaks, commute, and shifts where relevant.'},
    {name:'lifestyle',label:'How would you describe the client’s lifestyle?',kind:'choice',options:[{value:'Sedentary',description:'Mostly seated with little daily movement.'},{value:'Moderate',description:'Some regular movement or moderate activity.'},{value:'Active',description:'A physically active day or frequent exercise.'},{value:'Very active',description:'Intensive training, a physically demanding job, or multiple daily activity sessions.'}]},
    {name:'workoutRoutine',label:'Workout routine: type, timing, and duration',kind:'textarea',hint:'Describe the routine, or enter “No workout routine” if none.'}
  ]},
  {title:'Medical history',short:'Medical',description:'Record the client’s health context for practitioner review. Enter “None” where a question does not apply.',fields:[
    {name:'medicalHistory',label:'Any medical condition in the past? Explain what and since when',kind:'textarea',hint:'Include relevant history and when each condition started, or enter “None”.'},
    {name:'medications',label:'Current medications (if any)',kind:'textarea',hint:'Specify medications, or enter “None”.'},
    {name:'procedures',label:'Procedures undergone (if any)',kind:'textarea',hint:'Explain relevant procedures, or enter “None”.'},
    {name:'supplements',label:'Supplements currently consumed (if any)',kind:'textarea',hint:'Specify supplements, or enter “None”.'},
    {name:'supplementSuggestions',label:'Is the client open to suggestions about taking supplements?',kind:'choice',options:['Yes','No'],compact:true}
  ]},
  {title:'Food habits & preferences',short:'Food habits',description:'A useful plan begins with how they eat today, their preferences, and their restrictions.',fields:[
    {name:'breakfastRecall',label:'What does the client usually have for breakfast, and when?',kind:'textarea',hint:'Include typical foods, portions if known, and meal timing.'},
    {name:'lunchRecall',label:'What does the client usually have for lunch, and when?',kind:'textarea'},
    {name:'dinnerRecall',label:'What does the client usually have for dinner, and when?',kind:'textarea'},
    {name:'snacksRecall',label:'Mid-morning / evening snacks and their timings (if any)',kind:'textarea',hint:'Include snacks and timings, or enter “None”.'},
    {name:'allergies',label:'Any food allergies? If yes, specify',kind:'textarea',hint:'Specify allergies, or explicitly enter “None”.'},
    {name:'dietPreference',label:'Food preference',kind:'choice',options:['Veg','Non veg','Egg (eggitarian)'],compact:true},
    {name:'likedFoods',label:'Foods the client likes',kind:'textarea',optional:true},
    {name:'additionalDetails',label:'Anything else the client would like us to know?',kind:'textarea',optional:true}
  ]}
];
export const requiredIntakeFields=intakeSections.flatMap(s=>s.fields).filter(f=>!f.optional);
const allFields=intakeSections.flatMap(s=>s.fields);
export function normalizeGoal(goal){return ({'Weight management':'Weight loss','Maintenance':'General healthy diet'})[goal]||goal||''}
export function normalizeDiet(diet){return ({Vegetarian:'Veg','Non-vegetarian':'Non veg',Eggitarian:'Egg (eggitarian)'})[diet]||(['Veg','Non veg','Egg (eggitarian)'].includes(diet)?diet:'')}
export function clientIntake(client={}){const intake=client.intake||{};return {...intake,clientName:client.name||'',age:client.age||'',gender:client.gender||intake.gender||'',height:client.height||'',weight:client.weight||'',goal:normalizeGoal(client.goal),lifestyle:intake.lifestyle||({'Sedentary':'Sedentary','Lightly active':'Moderate','Moderately active':'Moderate','Active':'Active','Very active':'Very active'})[client.activity]||'',allergies:client.allergies||intake.allergies||'',medicalHistory:client.conditions||intake.medicalHistory||'',dietPreference:normalizeDiet(client.diet),privacyConsent:false,consentRecordedAt:undefined,review:false}}
function fieldError(field,value){const v=String(value??'').trim();if(!v)return field.optional?'':`${field.label} is required.`;if(field.kind==='number'&&(!Number.isFinite(Number(v))||Number(v)<field.min||Number(v)>field.max))return `${field.label} must be between ${field.min} and ${field.max}.`;if(field.name==='age'&&!Number.isInteger(Number(v)))return 'Age must be a whole number.';if(field.kind==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))return `${field.label} must be a valid time.`;if(field.kind==='choice'&&!field.options.some(o=>(typeof o==='string'?o:o.value)===v))return `Choose a valid option for ${field.label.toLowerCase()}.`;return ''}
export function validateIntake(answers,section=null,withConsent=true){const errors={};const fields=section===null?allFields:intakeSections[section]?.fields||[];for(const field of fields){const error=fieldError(field,answers[field.name]);if(error)errors[field.name]=error}if(section===null&&withConsent&&answers.privacyConsent!==true)errors.privacyConsent='Client agreement to the privacy policy and terms is required.';return errors}
export function completion(answers){const done=requiredIntakeFields.filter(f=>!fieldError(f,answers[f.name])).length+(answers.privacyConsent===true?1:0);return {done,total:requiredIntakeFields.length+1,percent:Math.round(done/(requiredIntakeFields.length+1)*100)}}
export function questionnaireSnapshot(answers){const data={};for(const f of allFields)data[f.name]=f.kind==='number'?Number(answers[f.name]):String(answers[f.name]??'').trim();data.privacyConsent=answers.privacyConsent===true;data.consentRecordedAt=answers.consentRecordedAt||new Date().toISOString();data.version=1;return data}
export function updateClientFromIntake(client,answers){const snapshot=questionnaireSnapshot(answers);Object.assign(client,{intake:snapshot,name:snapshot.clientName,age:snapshot.age,gender:snapshot.gender,height:snapshot.height,weight:snapshot.weight,goal:snapshot.goal,diet:({'Veg':'Vegetarian','Non veg':'Non-vegetarian','Egg (eggitarian)':'Eggitarian'})[snapshot.dietPreference],activity:({'Sedentary':'Sedentary','Moderate':'Moderately active','Active':'Active','Very active':'Very active'})[snapshot.lifestyle],allergies:snapshot.allergies,conditions:snapshot.medicalHistory});return client}
