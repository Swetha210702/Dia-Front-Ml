export const models={Standard:{cost:3,price:null,credits:null,description:'Everyday nutrition workflows'},Pro:{cost:5,price:null,credits:null,description:'More detailed planning and reasoning'},Plus:{cost:8,price:null,credits:null,description:'The most advanced planning tier'}};
// A saved questionnaire describes the client; it must not override the active subscription.
export function generationSettings(subscriptionTier,input={}){
 if(!Object.hasOwn(models,subscriptionTier))throw new Error('Choose a valid subscription before generating a plan.');
 return {model:subscriptionTier,cost:models[subscriptionTier].cost,input:{...input,model:subscriptionTier}};
}
export function updateSubscriptionTier(workspace,tier){
 generationSettings(tier);
 workspace.tier=tier;
 for(const draft of Object.values(workspace.intakeDrafts||{})){
  if((draft.step??0)<5&&draft.answers)draft.answers.model=tier;
 }
}
