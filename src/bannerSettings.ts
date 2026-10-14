import type {BannerPosition} from './announcementBannerModel';
export function normalizeBannerPosition(value:unknown):BannerPosition{return value==='top'?'top':'bottom'}
