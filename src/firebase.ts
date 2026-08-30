import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const communityFirebaseConfig = {
  apiKey: 'AIzaSyB0fmfjqC8aPyOEZxLjk1TfQal_s5xZFAM', authDomain: 'philippusgemeindebie.firebaseapp.com',
  databaseURL: 'https://philippusgemeindebie-default-rtdb.europe-west1.firebasedatabase.app', projectId: 'philippusgemeindebie',
  storageBucket: 'philippusgemeindebie.firebasestorage.app', messagingSenderId: '429968461937', appId: '1:429968461937:web:3c0f654404ec5d0e24cbd0'
};
const presentationFirebaseConfig = {
  apiKey: 'AIzaSyA4mg6UxlJVUeV09MY8ml1ul1IzgB8I_0g', authDomain: 'pgb-present.firebaseapp.com', projectId: 'pgb-present',
  storageBucket: 'pgb-present.firebasestorage.app', messagingSenderId: '694227342870', appId: '1:694227342870:web:9a120ff9901df225278737'
};

const namedApp = (name:string, config:object) => getApps().some(a => a.name === name) ? getApp(name) : initializeApp(config, name);
export const communityApp = namedApp('community', communityFirebaseConfig);
export const presentationApp = namedApp('presentation', presentationFirebaseConfig);
export const communityAuth = getAuth(communityApp);
export const communityDatabase = getDatabase(communityApp);
export const communityStorage = getStorage(communityApp);
export const presentationFirestore = getFirestore(presentationApp);
export const presentationStorage = getStorage(presentationApp);
export const presentationAuth = getAuth(presentationApp);
