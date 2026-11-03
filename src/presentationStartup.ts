// Device enumeration, version metadata and connectivity are informational. A
// hung optional IPC must never hold authentication/document restoration hostage.
export function prepareStartupSession<T>(authentication:Promise<T>,optional:readonly (()=>Promise<unknown>)[]):Promise<T>{
  for(const query of optional)void Promise.resolve().then(query).catch(()=>{});
  return authentication;
}

// Skip may bypass the splash delay, but readiness includes the initial document
// and recovery decision so the editor cannot race a later startup load.
export async function initializePresentationStartup<T,D,R>(authentication:Promise<T>,document:Promise<D>,recovery:Promise<R>,apply:(document:D,recovery:R)=>void):Promise<T>{
  const [session,loaded,offer]=await Promise.all([authentication,document,recovery]);
  apply(loaded,offer);
  return session;
}
