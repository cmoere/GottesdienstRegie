import{flagCountryForLanguage}from'./flagCountryCatalog';
import{useI18n}from'../i18n';
export function FlagIcon({languageCode,decorative=false}:{languageCode:string;decorative?:boolean}){const {t}=useI18n(),country=flagCountryForLanguage(languageCode);return <span className={`translation-language-flag fi fi-${country}`} role={decorative?undefined:'img'} aria-label={decorative?undefined:`${t('language')} ${languageCode.toUpperCase()}`} aria-hidden={decorative||undefined}/>}
