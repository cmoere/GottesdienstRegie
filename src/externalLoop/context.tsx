import {createContext} from 'react';
import type {ExternalLoopController} from './controller';
export const ExternalLoopContext=createContext<ExternalLoopController|null>(null);
