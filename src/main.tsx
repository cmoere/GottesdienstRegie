import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'material-symbols/outlined.css';
import { App } from './App';
import './styles.css';
import './settings-v08.css';
import './v09.css';
import './v010.css';
import './auth.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
