export type TestRunResult = "dead" | "return" | "abandon" | "clear";
export type TestRun = { endedAt: string; runId?: string; route?: "normal" | "descent"; startFloor?: number; job: string; floor: number; result: TestRunResult; kills: number; bosses: number; cause?: "enemy" | "status" };
type ActiveRun = { runId: string; route: "normal" | "descent"; startFloor: number; reached: number[] };
export type TestTelemetry = {
  version: 2; installId: string; firstSeen: string; lastSeen: string; activeDays: string[]; sessions: number;
  runs: number; maxFloor: number; floorReached: Record<string, number>; jobs: Record<string, { runs: number; bestFloor: number }>; outcomes: Record<TestRunResult, number>; recentRuns: TestRun[];
  activeRun: ActiveRun | null; legacyFloorEvents: Record<string,number>; routeFloorReached: Record<"normal"|"descent",Record<string,number>>;
};
export const TELEMETRY_KEY = "chika-hyakkei-test-record-v1";
const day=(date=new Date())=>date.toISOString().slice(0,10);
const id=()=> "t-"+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-5);
export const emptyTelemetry=():TestTelemetry=>({version:2,installId:id(),firstSeen:day(),lastSeen:day(),activeDays:[],sessions:0,runs:0,maxFloor:0,floorReached:{},jobs:{},outcomes:{dead:0,return:0,abandon:0,clear:0},recentRuns:[],activeRun:null,legacyFloorEvents:{},routeFloorReached:{normal:{},descent:{}}});
export const normalizeTelemetry=(value:Partial<TestTelemetry>|null|undefined):TestTelemetry=>{
  const base=emptyTelemetry(),modern=value?.version===2;
  return {...base,...value,version:2,installId:value?.installId||id(),activeDays:Array.isArray(value?.activeDays)?value.activeDays.slice(-90):[],
    floorReached:modern?value?.floorReached??{}:{},legacyFloorEvents:modern?value?.legacyFloorEvents??{}:value?.floorReached??{},
    routeFloorReached:modern?{normal:value?.routeFloorReached?.normal??{},descent:value?.routeFloorReached?.descent??{}}:{normal:{},descent:{}},
    jobs:value?.jobs??{},outcomes:{...base.outcomes,...value?.outcomes},recentRuns:Array.isArray(value?.recentRuns)?value.recentRuns.slice(-30):[],
    activeRun:modern&&value?.activeRun&&Array.isArray(value.activeRun.reached)?value.activeRun:null};
};
export const touchTelemetry=(value:TestTelemetry,date=new Date()):TestTelemetry=>{
  const today=day(date),days=value.activeDays.includes(today)?value.activeDays:[...value.activeDays,today].slice(-90);
  return {...value,lastSeen:today,activeDays:days,sessions:value.sessions+1};
};
export const recordFloor=(value:TestTelemetry,job:string,floor:number,runId?:string):TestTelemetry=>{
  const active=value.activeRun;
  if(!active||runId&&active.runId!==runId||active.reached.includes(floor))return value;
  const route=active.route,routeFloors=value.routeFloorReached[route];
  return {...value,activeRun:{...active,reached:[...active.reached,floor]},maxFloor:Math.max(value.maxFloor,floor),
    floorReached:{...value.floorReached,[floor]:(value.floorReached[floor]??0)+1},
    routeFloorReached:{...value.routeFloorReached,[route]:{...routeFloors,[floor]:(routeFloors[floor]??0)+1}},
    jobs:{...value.jobs,[job]:{runs:value.jobs[job]?.runs??0,bestFloor:Math.max(value.jobs[job]?.bestFloor??0,floor)}}};
};
export const recordRunStart=(value:TestTelemetry,job:string,options:Partial<Omit<ActiveRun,"reached">>={}):TestTelemetry=>{
  const activeRun:ActiveRun={runId:options.runId??id(),route:options.route??"normal",startFloor:options.startFloor??1,reached:[]};
  if(value.activeRun?.runId===activeRun.runId)return value;
  return recordFloor({...value,runs:value.runs+1,activeRun,jobs:{...value.jobs,[job]:{runs:(value.jobs[job]?.runs??0)+1,bestFloor:value.jobs[job]?.bestFloor??0}}},job,activeRun.startFloor,activeRun.runId);
};
export const recordRunEnd=(value:TestTelemetry,run:Omit<TestRun,"endedAt">):TestTelemetry=>{
  if(run.runId&&value.recentRuns.some(entry=>entry.runId===run.runId))return value;
  const active=value.activeRun,current=recordFloor(value,run.job,run.floor,run.runId);
  return {...current,activeRun:null,outcomes:{...current.outcomes,[run.result]:(current.outcomes[run.result]??0)+1},
    recentRuns:[...current.recentRuns,{...run,runId:run.runId??active?.runId,route:run.route??active?.route,startFloor:run.startFloor??active?.startFloor,endedAt:new Date().toISOString()}].slice(-30)};
};
export const telemetryExport=(value:TestTelemetry)=>JSON.stringify({kind:"地下百景テスト記録",...value},null,2);
