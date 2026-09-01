export interface ServiceAccess { enabled:boolean; authMode:'sso'; role:'viewer'|'presenter'|'editor'|'admin'; teamId?:string; permissions:Record<string,boolean> }
export interface SafeUser { uid:string; email:string; firstname?:string; lastName?:string; phone?:string; role:string; profile?:Record<string,unknown>; settings?:Record<string,unknown>; darkmode?:boolean; verification?:unknown; appAccess:{gottesdienstRegie:ServiceAccess} }
export interface AuthSession { user:SafeUser; permissions:string[]; expiresAt:number }
export interface TwoFactorChallenge { twoFactorRequired:true; challengeId:string; method:'email'|'sms'|'totp'|string; destination:string; expiresAt:number }
export type LoginResult=AuthSession|TwoFactorChallenge;

export async function login(email:string,password:string,remember:boolean):Promise<LoginResult>{
  if(!window.desktop)throw new Error('DESKTOP_REQUIRED');
  return window.desktop.auth.login(email.trim().toLowerCase(),password,remember);
}
export async function verifyTwoFactor(challengeId:string,code:string,recovery:boolean):Promise<AuthSession>{
  if(!window.desktop)throw new Error('DESKTOP_REQUIRED');
  return window.desktop.auth.verifyTwoFactor(challengeId,code,recovery);
}
export async function cancelTwoFactor(challengeId:string){await window.desktop?.auth.cancelTwoFactor(challengeId)}
export function isTwoFactorChallenge(result:LoginResult):result is TwoFactorChallenge{return 'twoFactorRequired' in result&&result.twoFactorRequired===true}
export async function restore():Promise<AuthSession|null>{return window.desktop?.auth.restore()??null}
export async function logout(){await window.desktop?.auth.logout()}

function cleanedRemoteError(raw:string){
  return raw
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i,'')
    .replace(/^Error:\s*/i,'')
    .replace(/[\r\n]+/g,' ')
    .trim();
}

export function twoFactorMessage(raw:string,t:Translator){
  const cleaned=cleanedRemoteError(raw);
  const serverDetail=cleaned.match(/TWO_FACTOR_(?:INVALID|ERROR):(.+)$/)?.[1]?.trim();
  if(serverDetail){
    if(/abgelaufen/i.test(serverDetail))return t('serverCodeExpired');
    if(/fehlversuche/i.test(serverDetail))return t('serverTooMany');
    if(/wiederherstellungscode/i.test(serverDetail))return t('serverRecoveryInvalid');
    if(/authenticator/i.test(serverDetail))return t('serverTotpInvalid');
    return t('authTwoFactorInvalid');
  }
  if(cleaned.includes('TWO_FACTOR_EXPIRED'))return t('authTwoFactorExpired');
  if(cleaned.includes('TWO_FACTOR_COOLDOWN'))return t('authTwoFactorCooldown');
  return authMessage(raw,t);
}

export function authMessage(raw:string,t:Translator){
  const messages:Record<string,TranslationKey>={
    DESKTOP_REQUIRED:'authDesktop',
    SECURE_STORAGE_UNAVAILABLE:'authStorage',
    GAS_NETWORK:'authGasNetwork',
    GAS_RESPONSE_INVALID:'authGasResponse',
    EMAIL_NOT_VERIFIED:'authEmailUnverified',
    ACCOUNT_LOCKED:'authLocked',
    INITIAL_PASSWORD_CHANGE_REQUIRED:'authInitialPassword',
    TWO_FACTOR_COOLDOWN:'authTwoFactorCooldown',
    TWO_FACTOR_EXPIRED:'authTwoFactorExpired',
    TWO_FACTOR_INVALID:'authTwoFactorInvalid',
    TWO_FACTOR_ERROR:'authTwoFactorError',
    SESSION_CREATE_FAILED:'authSessionFailed',
    UNSUPPORTED_PASSWORD_ALGORITHM:'authAlgorithm',
    NETWORK:'authFirebase',
    SERVICE_ACCESS_UNAVAILABLE:'authAccessUnavailable',
    DISABLED:'authDisabled',
    NO_SERVICE_ACCESS:'authNoAccess',
    INVALID_CREDENTIALS:'authInvalid'
  };
  const code=Object.keys(messages).find(key=>raw.includes(key));
  if(code)return t(messages[code]);
  console.error('[auth]',{code:'AUTH_UNKNOWN',timestamp:new Date().toISOString(),detail:cleanedRemoteError(raw).slice(0,240)});
  return t('authTechnical',{detail:''}).replace(/:\s*$/,'');
}
import type { TranslationKey, Translator } from './i18n';
