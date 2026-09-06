import { signInAnonymously } from 'firebase/auth';
import { get, onValue, ref, remove, set, update, type Unsubscribe } from 'firebase/database';
import { communityAuth, communityDatabase } from './firebase';

export type LiveQuizPublicOption={id:string;text:string};
export type LiveQuizPublicQuestion={id:string;type:string;question:string;options:LiveQuizPublicOption[];durationSeconds:number;points:number;allowAnswerChange:boolean};
export type LiveQuizSession={id:string;code:string;ownerUid:string;quizId:string;title:string;description:string;quizType:'quiz'|'poll';participation:'anonymous'|'name';status:'lobby'|'open'|'ended';activeQuestionId:string;questions:LiveQuizPublicQuestion[];questionPermissions:Record<string,{allowAnswerChange:boolean}>;createdAt:number;expiresAt:number};
export type LiveQuizAnswer={questionId:string;participantId:string;displayName:string;answer:string|string[];submittedAt:number};

const JOIN_BASE='https://cmoere.github.io/GottesdienstRegie/quiz/';
const sessionKey=(quizId:string)=>`gottesdienstregie.liveQuiz.${quizId}`;

async function signedInUid(){
  if(communityAuth.currentUser)return communityAuth.currentUser.uid;
  return (await signInAnonymously(communityAuth)).user.uid;
}

async function unusedCode(){
  for(let attempt=0;attempt<30;attempt++){
    const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%900000+100000);
    if(!(await get(ref(communityDatabase,`quizCodes/${code}`))).exists())return code;
  }
  throw new Error('Zurzeit konnte kein freier Teilnahmecode erzeugt werden. Bitte versuche es erneut.');
}

export function quizJoinUrl(code:string){return `${JOIN_BASE}?code=${encodeURIComponent(code)}`}

export async function createLiveQuizSession(definition:{id:string;title:string;description:string;quizType:'quiz'|'poll';participation:'anonymous'|'name';questions:Array<{id:string;type:string;question:string;options:Array<{id:string;text:string}>;durationSeconds:number;points:number;allowAnswerChange:boolean;disabled:boolean}>}){
  const ownerUid=await signedInUid(),code=await unusedCode(),id=crypto.randomUUID(),now=Date.now();
  const enabled=definition.questions.filter(question=>!question.disabled),questions=enabled.map(question=>({id:question.id,type:question.type,question:question.question,options:question.options,durationSeconds:question.durationSeconds,points:question.points,allowAnswerChange:question.allowAnswerChange}));
  const questionPermissions=Object.fromEntries(enabled.map(question=>[question.id,{allowAnswerChange:question.allowAnswerChange}]));
  const session:LiveQuizSession={id,code,ownerUid,quizId:definition.id,title:definition.title,description:definition.description,quizType:definition.quizType,participation:definition.participation,status:'lobby',activeQuestionId:'',questions,questionPermissions,createdAt:now,expiresAt:now+4*60*60*1000};
  await update(ref(communityDatabase),{[`quizSessions/${id}`]:session,[`quizCodes/${code}`]:{sessionId:id,ownerUid,expiresAt:session.expiresAt}});
  sessionStorage.setItem(sessionKey(definition.id),id);
  return session;
}

export function storedLiveQuizSessionId(quizId:string){return sessionStorage.getItem(sessionKey(quizId))??''}

export function watchLiveQuizSession(sessionId:string,listener:(session:LiveQuizSession|null)=>void):Unsubscribe{
  return onValue(ref(communityDatabase,`quizSessions/${sessionId}`),snapshot=>listener(snapshot.exists()?snapshot.val() as LiveQuizSession:null),()=>listener(null));
}

export function watchLiveQuizAnswers(sessionId:string,listener:(answers:LiveQuizAnswer[])=>void):Unsubscribe{
  return onValue(ref(communityDatabase,`quizResponses/${sessionId}`),snapshot=>{
    const questions=(snapshot.val()??{}) as Record<string,Record<string,Omit<LiveQuizAnswer,'questionId'>>>,answers=Object.entries(questions).flatMap(([questionId,value])=>Object.values(value??{}).map(answer=>({...answer,questionId})));
    listener(answers);
  },()=>listener([]));
}

export async function openLiveQuizQuestion(sessionId:string,questionId:string){
  await update(ref(communityDatabase,`quizSessions/${sessionId}`),{status:'open',activeQuestionId:questionId,questionStartedAt:Date.now()});
}

export async function returnLiveQuizToLobby(sessionId:string){await update(ref(communityDatabase,`quizSessions/${sessionId}`),{status:'lobby',activeQuestionId:''})}

export async function endLiveQuizSession(session:LiveQuizSession){
  await update(ref(communityDatabase,`quizSessions/${session.id}`),{status:'ended',activeQuestionId:'',endedAt:Date.now()});
  await remove(ref(communityDatabase,`quizCodes/${session.code}`));
  sessionStorage.removeItem(sessionKey(session.quizId));
}
