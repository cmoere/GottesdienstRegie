export class StableLoopSnapshot<T extends {id:string}>{
  private active:T[];
  private pending:T[]|null=null;
  private displayed:T|null=null;
  constructor(initial:T[]=[]){this.active=[...initial]}
  prepare(next:T[]){if(this.displayed)this.pending=[...next];else this.active=[...next]}
  beginDisplay(id:string):T|null{const item=this.active.find(entry=>entry.id===id)??null;this.displayed=item;return item}
  completeDisplay(){this.displayed=null;if(this.pending){this.active=this.pending;this.pending=null}}
  current():readonly T[]{return this.active}
  visible():T|null{return this.displayed}
  get isEmpty(){return this.active.length===0&&!this.displayed}
}
