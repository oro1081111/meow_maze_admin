(function(root){
  "use strict";
  const COLORS=["R","B","G","Y","P"],NAMES={R:"紅色",B:"藍色",G:"綠色",Y:"黃色",P:"紫色"};
  const OFFSETS=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],DIR=["右方","右上","左上","左方","左下","右下"];
  const MOVE={
    R:{edges:[[1,2],[2,6],[1,6],[3,4]],labels:{1:"Y",3:"P",5:"Door"},boy:2},
    B:{edges:[[1,2],[3,4],[6,3],[4,6]],labels:{1:"G",5:"P"},boy:3},
    G:{edges:[[1,5],[2,3]],labels:{2:"Y",4:"B",6:"Key"},boy:1},
    Y:{edges:[[1,2],[3,2],[1,3],[4,5]],labels:{1:"R",6:"G"},boy:2},
    P:{edges:[[1,6],[2,4]],labels:{3:"R",4:"B"},boy:1}
  };
  const ROTATE={
    R:{edges:[[2,3],[4,6]],labels:{1:"Door",2:"P",5:"Y"},boy:4},
    B:{edges:[[1,2],[2,3],[1,3],[4,5]],labels:{4:"G",6:"P"},boy:1},
    G:{edges:[[1,2],[3,6]],labels:{5:"Key",3:"Y",4:"B"},boy:1},
    P:{edges:[[1,6],[3,4],[4,5],[3,5]],labels:{2:"R",3:"B"},boy:1},
    Y:{edges:[[1,2],[2,4],[1,4],[5,6]],labels:{3:"G",5:"R"},boy:1}
  };
  const worldSide=(side,r)=>(side-1+2*r)%6+1;
  const posKey=positions=>COLORS.map(c=>`${c}:${positions[c][0]},${positions[c][1]}`).join("|");
  const stateKey=s=>`${posKey(s.positions)}/${s.rot.join("")}/${s.boy}/${s.hasKey?1:0}`;
  function plateData(color,mode,r){
    const p=mode==="rotate"?ROTATE[color]:MOVE[color];
    if(mode!=="rotate")return p;
    return{edges:p.edges.map(([a,b])=>[worldSide(a,r),worldSide(b,r)]),labels:Object.fromEntries(Object.entries(p.labels).map(([s,v])=>[worldSide(+s,r),v]))};
  }
  function startNode(color,modes,rot){const p=modes[color]==="rotate"?ROTATE[color]:MOVE[color],r=modes[color]==="rotate"?rot[COLORS.indexOf(color)]:0;return color+worldSide(p.boy,r)}
  function analyze(positions,rot,modes,cache){
    const key=`${posKey(positions)}/${rot.join("")}`,hit=cache.get(key);if(hit)return hit;
    const adj={},labels={};
    for(const c of COLORS)for(let s=1;s<=6;s++)adj[c+s]=[];
    COLORS.forEach((c,i)=>{const p=plateData(c,modes[c],rot[i]);for(const[a,b]of p.edges){adj[c+a].push(c+b);adj[c+b].push(c+a)}for(const[s,label]of Object.entries(p.labels))labels[c+s]=label});
    const at=new Map(COLORS.map(c=>[positions[c].join(","),c]));
    for(const c of COLORS){const[x,y]=positions[c];for(let s=1;s<=3;s++){const[dx,dy]=OFFSETS[s-1],other=at.get(`${x+dx},${y+dy}`);if(other){adj[c+s].push(other+(s+3));adj[other+(s+3)].push(c+s)}}}
    const ids={},comps=[];
    for(const c of COLORS)for(let side=1;side<=6;side++){const first=c+side;if(first in ids)continue;const id=comps.length,nodes=[first],stack=[first];ids[first]=id;while(stack.length){const u=stack.pop();for(const v of adj[u])if(!(v in ids)){ids[v]=id;nodes.push(v);stack.push(v)}}const levers={},info={nodes,levers,hasKey:false,hasDoor:false};for(const n of nodes){const label=labels[n];if(label==="Key")info.hasKey=true;else if(label==="Door")info.hasDoor=true;else if(COLORS.includes(label))levers[n]=label}comps.push(info)}
    const result={ids,comps};cache.set(key,result);return result;
  }
  function normalMoves(positions,color){const occupied=new Set(COLORS.map(c=>positions[c].join(","))),cells=new Map();for(const c of COLORS){if(c===color)continue;const[x,y]=positions[c];for(const[dx,dy]of OFFSETS){const p=[x+dx,y+dy],k=p.join(",");if(!occupied.has(k))cells.set(k,p)}}return[...cells.values()]}
  function specialMoves(positions,nodes,color){const occupied=new Set(COLORS.map(c=>positions[c].join(","))),cells=new Map();for(const node of nodes){const c=node[0];if(c===color)continue;const[x,y]=positions[c],[dx,dy]=OFFSETS[+node[1]-1],p=[x+dx,y+dy],k=p.join(",");if(!occupied.has(k))cells.set(k,p)}return[...cells.values()]}
  function relativePosition(positions,cell){const at=new Map(COLORS.map(c=>[positions[c].join(","),c]));for(let s=1;s<=6;s++){const[dx,dy]=OFFSETS[s-1],c=at.get(`${cell[0]-dx},${cell[1]-dy}`);if(c)return[c,s]}return["?",1]}
  function answer(goalKey,parents,states,rootHasKey){const chain=[];for(let key=goalKey;parents.get(key);key=parents.get(key).prev)chain.push({state:states.get(key),...parents.get(key)});chain.reverse();const lines=[],moves=[];let hadKey=rootHasKey;if(hadKey)lines.push("找到鑰匙");chain.forEach((step,i)=>{const source=NAMES[step.boy[0]],target=NAMES[step.color];if(step.action.type==="rotate")lines.push(`${i+1}.走到${source}將${target}向${step.action.delta===1?"左":"右"}旋轉120度`);else{const[c,s]=relativePosition(step.state.positions,step.action.cell);lines.push(`${i+1}.走到${source}將${target}移動到${NAMES[c]}${DIR[s-1]}`)}moves.push({boy:step.boy,color:step.color,...step.action});if(step.state.hasKey&&!hadKey)lines.push("找到鑰匙");hadKey=step.state.hasKey});lines.push("找到大門");return{status:"solved",optimalSteps:chain.length,solution:lines.join("\n"),moves}}
  function solve(input,maxDepth=6){
    const positions=Object.fromEntries(COLORS.map(c=>[c,[...input.positions[c]]]));
    const modes=Object.fromEntries(COLORS.map(c=>[c,input.plateModes[c]||"move"])),rot=COLORS.map(c=>modes[c]==="rotate"?((input.rotations&&input.rotations[c])||0)%3:0),cache=new Map();
    const boy=startNode(input.start,modes,rot),rootInfo=analyze(positions,rot,modes,cache),rootComp=rootInfo.comps[rootInfo.ids[boy]],start={positions,rot,boy,hasKey:rootComp.hasKey};
    if(start.hasKey&&rootComp.hasDoor)return{status:"solved",optimalSteps:0,solution:"找到鑰匙\n找到大門",moves:[],visited:1};
    const first=stateKey(start),queue=[[start,0]],parents=new Map([[first,null]]),states=new Map([[first,start]]);let head=0,truncated=false;
    while(head<queue.length){const[state,depth]=queue[head++];if(depth>=maxDepth){truncated=true;continue}const info=analyze(state.positions,state.rot,modes,cache),comp=info.comps[info.ids[state.boy]],entries=Object.entries(comp.levers),onlyOne=entries.length===1;
      for(const[lever,color]of entries){const ci=COLORS.indexOf(color),actions=modes[color]==="rotate"?[{type:"rotate",delta:1},{type:"rotate",delta:-1}]:(onlyOne?specialMoves(state.positions,comp.nodes,color):normalMoves(state.positions,color)).map(cell=>({type:"move",cell}));
        for(const action of actions){const next={positions:state.positions,rot:state.rot,boy:lever,hasKey:state.hasKey};if(action.type==="rotate"){next.rot=[...state.rot];next.rot[ci]=(next.rot[ci]+action.delta+3)%3}else{next.positions={...state.positions,[color]:action.cell}}const nextInfo=analyze(next.positions,next.rot,modes,cache),nextComp=nextInfo.comps[nextInfo.ids[lever]];next.hasKey=next.hasKey||nextComp.hasKey;const key=stateKey(next);if(parents.has(key))continue;parents.set(key,{prev:stateKey(state),boy:lever,color,action});states.set(key,next);if(next.hasKey&&nextComp.hasDoor){const result=answer(key,parents,states,start.hasKey);result.visited=parents.size;return result}queue.push([next,depth+1])}
      }
    }
    return{status:truncated?"depth_limited":"no_solution",optimalSteps:null,solution:truncated?`超過 ${maxDepth} 步，無法輸出最佳解`:"此題無解，無法輸出最佳解",moves:[],visited:parents.size};
  }
  const api={solve,startNode,worldSide};if(typeof module!=="undefined")module.exports=api;root.MeowMazeSolver=api;
})(typeof globalThis!=="undefined"?globalThis:this);
