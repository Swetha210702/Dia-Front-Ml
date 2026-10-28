// Injectable SDK methods allow tests without credentials or live account requests.
export function createFirebaseAuthAdapter(auth,sdk) {
  const account=user=>user?Object.freeze({
    uid:user.uid,email:user.email||'',displayName:user.displayName||'',
    emailVerified:user.emailVerified===true
  }):null;
  return {
    async signIn({email,password,remember=false}) {
      await sdk.setPersistence(auth,remember?sdk.browserLocalPersistence:sdk.browserSessionPersistence);
      const result=await sdk.signInWithEmailAndPassword(auth,email.trim(),password);
      return account(result.user);
    },
    signOut(){return sdk.signOut(auth)},
    async resetPassword(email) {
      try {await sdk.sendPasswordResetEmail(auth,email.trim())}
      catch(error){if(error.code!=='auth/user-not-found')throw error}
    },
    observeSession(onAccount,onError) {
      return sdk.onAuthStateChanged(auth,user=>onAccount(account(user)),onError);
    }
  };
}

export async function initializeFirebaseAuthentication() {
  const [{initializeApp,getApps,getApp},sdk,{firebaseConfig}]=await Promise.all([
    import('firebase/app'),import('firebase/auth'),import('./firebase-config.js')
  ]);
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  // No Analytics tracking is initialized by authentication setup.
  return createFirebaseAuthAdapter(sdk.getAuth(app),sdk);
}
