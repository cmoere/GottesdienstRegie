import type {ReactNode} from 'react';
import './loadingStatus.css';

export function LoadingStatus({children}:{children:ReactNode}){
  return <span className="loading-status" role="status">
    <span className="loading-status-spinner" aria-hidden="true"/>
    {children}
  </span>;
}
