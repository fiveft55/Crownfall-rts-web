/* Static-site WebRTC transport. The hosting tab owns the C++ world in its worker.
   Invitations are one-use SDP exchanges; no signaling backend/account is assumed.
   All game authority still lives in C++. This adapter binds each peer to its own
   issued session and permits only the gameplay API, never Studio/admin access. */
"use strict";
(() => {
  if (!window.CrownWeb) return;
  const localFetch = window.fetch.bind(window), peers = new Map(), pending = new Map();
  const PROTOCOL="crownfall-silkroad-rtc-1", MAX=8*1024*1024, CHUNK=8000;
  let role="local", upstream=null, sequence=0, wire=0, joining="join", observerPush=false;
  const $=id=>document.getElementById(id);
  const status=text=>{$("peer-status").textContent=text;};
  const error=text=>{status(text);throw Error(text);};
  const allowGet=new Set(["info","preview","catalog","races","technologies","difficulties","content","state","ping"]);
  const allowPost=new Set(["join","lobby","command","leave","surrender","telemetry"]);
  function code(data){const bytes=new TextEncoder().encode(JSON.stringify(data));return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join("")).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");}
  function decode(value){
    value=value.trim();if(value.includes("#peer="))value=value.slice(value.indexOf("#peer=")+6);
    if(value.length>150000)throw Error("Invitation is too large");
    const raw=atob(value.replaceAll("-","+").replaceAll("_","/"));
    const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    if(data.protocol!==PROTOCOL||!data.description||!["offer","answer"].includes(data.description.type)||typeof data.description.sdp!=="string"||data.description.sdp.length>100000||typeof data.peer!=="string")throw Error("Invalid or incompatible invitation");
    return data;
  }
  function iceServers(){
    const value=JSON.parse($("peer-ice").value||"[]");
    if(!Array.isArray(value)||value.length>4)throw Error("Use at most four ICE servers");
    for(const server of value){const urls=typeof server.urls==="string"?[server.urls]:server.urls;
      if(!Array.isArray(urls)||urls.length>4||urls.some(u=>typeof u!=="string"||u.length>512||!/^stuns?:|^turns?:/.test(u)))throw Error("Invalid ICE server URL");
    }return value;
  }
  async function gathered(pc){
    if(pc.iceGatheringState==="complete")return;
    await new Promise(resolve=>{const done=()=>{if(pc.iceGatheringState==="complete"){clearTimeout(timer);pc.removeEventListener("icegatheringstatechange",done);resolve();}};const timer=setTimeout(()=>{pc.removeEventListener("icegatheringstatechange",done);resolve();},10000);pc.addEventListener("icegatheringstatechange",done);});
  }
  async function send(peer,packet){
    const text=JSON.stringify(packet);if(text.length>MAX)throw Error("Peer message exceeds the bounded size");
    const id=++wire,total=Math.ceil(text.length/CHUNK);
    for(let part=0;part<total;part++){
      if(peer.channel?.readyState!=="open")throw Error("Peer disconnected");
      if(peer.channel.bufferedAmount>1024*1024)await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{cleanup();reject(Error("Peer is receiving too slowly"));},5000);
        const cleanup=()=>{clearTimeout(timer);peer.channel.removeEventListener("bufferedamountlow",ready);peer.channel.removeEventListener("close",closed);};
        const ready=()=>{cleanup();resolve();},closed=()=>{cleanup();reject(Error("Peer disconnected"));};
        peer.channel.bufferedAmountLowThreshold=65536;peer.channel.addEventListener("bufferedamountlow",ready,{once:true});peer.channel.addEventListener("close",closed,{once:true});
      });
      peer.channel.send(JSON.stringify({id,part,total,text:text.slice(part*CHUNK,(part+1)*CHUNK)}));
    }
  }
  async function gameplay(peer,request){
    if(!Number.isSafeInteger(request.id)||request.id<=0||typeof request.path!=="string"||request.path.length>4096||!request.path.startsWith("/api/")||typeof request.method!=="string")throw Error("Invalid peer request");
    const now=performance.now();
    if(now-peer.rateStart>=1000){peer.rateStart=now;peer.rateCount=0;}
    if(++peer.rateCount>120)throw Error("Peer request rate exceeded");
    ++peer.requests;
    const url=new URL(request.path,location.origin),name=url.pathname.slice(5),method=request.method;
    if((method==="GET"&&!allowGet.has(name))||(method==="POST"&&!allowPost.has(name))||!["GET","POST"].includes(method))return {status:403,body:'{"error":"This peer API is not available"}'};
    if(typeof request.body!=="string"||request.body.length>512*1024)throw Error("Peer request body is too large");
    if(name==="join"){
      if(peer.session)return {status:409,body:'{"error":"This connection already owns a seat"}'};
      if(!["join","watch"].includes(url.searchParams.get("mode")))return {status:403,body:'{"error":"Only the hosting tab can create a council"}'};
      url.searchParams.set("transport","webrtc");
    }
    if(!peer.session&&!allowGet.has(name)&&name!=="join")return {status:401,body:'{"error":"Join a seat first"}'};
    const response=await localFetch(url.pathname+url.search,{method,headers:{"Content-Type":"application/json","X-Session":peer.session||""},...(method==="POST"?{body:request.body}:{} )});
    const body=await response.text();
    if(name==="join"&&response.ok){const data=JSON.parse(body);peer.session=data.token;peer.seat=data.player;peer.lastSeen=performance.now();renderPeers();}
    if(name==="leave"&&response.ok)peer.session="";
    return {status:response.status,body};
  }
  function observe(peer, body) {
    const data=JSON.parse(body), state=data.state||data;
    peer.pushRevision=state.revision||0;
    const observer=state.role==="spectator"||state.role==="team-spectator";
    if(!observer){peer.pushing=false;return;}
    if(peer.pushing)return;
    peer.pushing=true;
    const tick=async()=>{
      if(peer.closed||!peer.pushing||!peer.session)return;
      try{
        const response=await localFetch(`/api/state?stream=1&since=${peer.pushRevision}`,{headers:{"X-Session":peer.session}});
        if(!response.ok)throw Error("Spectator seat ended");
        const body=await response.text();observe(peer,body);
        await send(peer,{type:"snapshot",body});
      }catch(e){disconnect(peer);return;}
      if(peer.pushing)peer.pushTimer=setTimeout(tick,50);
    };
    peer.pushTimer=setTimeout(tick,50);
  }
  async function packet(peer,message){
    if(role==="host"){
      if(message.type==="resync"&&peer.pushing){peer.pushRevision=0;return;}
      if(message.type!=="request"||peer.inflight>=4)throw Error("Peer request limit exceeded");
      ++peer.inflight;
      try{const response=await gameplay(peer,message);await send(peer,{type:"response",id:message.id,...response});if(message.path.startsWith("/api/state")&&response.status===200)observe(peer,response.body);}
      finally{--peer.inflight;}
    }else if(role==="client"&&message.type==="snapshot"){
      if(typeof message.body!=="string")throw Error("Invalid snapshot");
      if(!connected)return;
      try{applySnapshot(JSON.parse(message.body));observerPush=isObserver();if(!observerPush)wakePoll();}
      catch(e){CrownStream.reset();if(state)state.revision=0;await send(peer,{type:"resync"});}
    }else if(role==="client"&&message.type==="response"){
      const job=pending.get(message.id);if(!job)return;
      if(!Number.isInteger(message.status)||message.status<200||message.status>599||typeof message.body!=="string")throw Error("Invalid peer response");
      if(job.state&&message.status===200){const data=JSON.parse(message.body),next=data.state||data;observerPush=next.role==="spectator"||next.role==="team-spectator";}
      clearTimeout(job.timer);pending.delete(message.id);job.resolve(new Response(message.body,{status:message.status,headers:{"Content-Type":"application/json"}}));
    }
  }
  function attach(peer,channel){
    peer.channel=channel;channel.bufferedAmountLowThreshold=65536;
    channel.onmessage=async event=>{
      try{
        if(typeof event.data!=="string"||event.data.length>CHUNK*6+512)throw Error("Invalid peer fragment");
        const f=JSON.parse(event.data);
        if(!Number.isSafeInteger(f.id)||!Number.isInteger(f.part)||!Number.isInteger(f.total)||f.part<0||f.total<1||f.total>Math.ceil(MAX/CHUNK)||f.part>=f.total||typeof f.text!=="string"||f.text.length>CHUNK)throw Error("Invalid peer fragment");
        let item=peer.fragments.get(f.id);
        if(!item){if(peer.fragments.size>=8||f.part!==0)throw Error("Peer fragment limit exceeded");item={next:0,total:f.total,text:"",time:performance.now()};peer.fragments.set(f.id,item);}
        if(f.part!==item.next||f.total!==item.total||item.text.length+f.text.length>MAX)throw Error("Out-of-order peer fragment");
        item.text+=f.text;++item.next;item.time=performance.now();
        if(item.next===item.total){peer.fragments.delete(f.id);await packet(peer,JSON.parse(item.text));}
      }catch(e){status(e.message);disconnect(peer);}
    };
    channel.onopen=async()=>{
      clearTimeout(peer.connectTimer);peer.open=true;renderPeers();status("Connected. The hosting tab must remain open.");
      if(role==="client"){
        upstream=peer;$("peer-dialog").close();
        try {
          const response=await remoteFetch("/api/content");
          if(response.ok){window.crownContent=await response.json();dispatchEvent(new Event("crown-content-ready"));}
          await join(joining);
          if(!connected){open("join");status($("welcome-error").textContent||"The room could not accept this seat.");}
        } catch(e){status(e.message);disconnect(peer);}
      }
    };
    channel.onclose=()=>disconnect(peer);
    channel.onerror=()=>disconnect(peer);
  }
  function disconnect(peer){
    if(peer.closed)return;peer.closed=true;
    clearTimeout(peer.connectTimer);clearTimeout(peer.pushTimer);peer.pushing=false;
    const session=peer.session;peer.session="";peer.fragments.clear();
    peer.channel?.close();peer.pc.close();peers.delete(peer.id);renderPeers();
    if(role==="host"&&session)localFetch("/api/leave",{method:"POST",headers:{"X-Session":session}}).catch(()=>{});
    if(role==="client"&&upstream===peer){upstream=null;role="local";observerPush=false;for(const job of pending.values()){clearTimeout(job.timer);job.reject(Error("The browser host disconnected"));}pending.clear();if(connected)returnToMainMenu("The browser host disconnected.");}
  }
  function connection(id){
    if(!window.RTCPeerConnection||!window.isSecureContext)throw Error("Browser rooms require HTTPS or localhost and WebRTC support");
    if(peers.size>=20)throw Error("The room connection limit is reached");
    const peer={id,pc:new RTCPeerConnection({iceServers:iceServers()}),fragments:new Map(),requests:0,rateStart:performance.now(),rateCount:0,session:"",seat:-1,inflight:0,open:false,closed:false,created:performance.now()};
    peers.set(id,peer);peer.pc.onconnectionstatechange=()=>{if(peer.pc.connectionState==="failed"){status("Connection failed. STUN cannot relay traffic. Configure a TURN relay on both devices, or use the same LAN, then exchange a fresh invitation and answer.");disconnect(peer);}else if(peer.pc.connectionState==="closed")disconnect(peer);};
    return peer;
  }
  function renderPeers(){
    const area=$("peer-connections");area.replaceChildren();
    for(const peer of peers.values()){
      const row=document.createElement("div");row.className="peer-row";
      const label=document.createElement("span");label.textContent=peer.open?`Connected · ${peer.seat>=0?"seat "+(peer.seat+1):"joining"}`:"Waiting for answer";row.append(label);
      if(role==="host"){const kick=document.createElement("button");kick.textContent="Disconnect";kick.onclick=()=>disconnect(peer);row.append(kick);}
      area.append(row);
    }
  }
  async function offer(){
    if(role!=="host")throw Error("Create a browser host first");
    status("Preparing a one-use invitation…");
    const peer=connection(crypto.randomUUID());attach(peer,peer.pc.createDataChannel("crownfall",{ordered:true}));
    await peer.pc.setLocalDescription(await peer.pc.createOffer());await gathered(peer.pc);
    if(!peer.pc.localDescription.sdp.includes("a=candidate:")){disconnect(peer);throw Error("No usable network candidates. Configure ICE/TURN; browser policy or network restrictions may block direct connections.");}
    $("peer-host-code").value=code({protocol:PROTOCOL,peer:peer.id,description:peer.pc.localDescription.toJSON()});
    status("Send the invitation to one friend. Paste their answer below. Make a new invite for every friend.");renderPeers();
    return $("peer-host-code").value;
  }
  async function answer(value,seat="join"){
    if(connected||role==="host")throw Error("Leave the current game before joining another browser host");
    const invite=decode(value);if(invite.description.type!=="offer")throw Error("Paste a host invitation, not an answer");
    if(role==="client"&&peers.size)throw Error("Cancel the pending connection before using another invitation");
    role="client";joining=seat;
    const peer=connection(invite.peer);upstream=peer;
    peer.pc.ondatachannel=e=>attach(peer,e.channel);
    await peer.pc.setRemoteDescription(invite.description);
    await peer.pc.setLocalDescription(await peer.pc.createAnswer());await gathered(peer.pc);
    if(!peer.pc.localDescription.sdp.includes("a=candidate:")){disconnect(peer);role="local";throw Error("No usable candidates. Configure ICE/TURN on this device and try a new invitation.");}
    $("peer-answer-code").value=code({protocol:PROTOCOL,peer:peer.id,description:peer.pc.localDescription.toJSON()});
    status("Send this answer back to the host. Joining starts when the host accepts it.");
    return $("peer-answer-code").value;
  }
  async function accept(value){
    const answer=decode(value),peer=peers.get(answer.peer);
    if(role!=="host"||!peer||answer.description.type!=="answer"||peer.pc.signalingState!=="have-local-offer")throw Error("No waiting invitation matches this answer");
    await peer.pc.setRemoteDescription(answer.description);
    if(!peer.open){
      status("Connecting… Allow up to 45 seconds. STUN alone cannot connect every network.");
      peer.connectTimer=setTimeout(()=>{
        if(peer.open||peer.closed)return;
        status("Connection timed out. No playable route was established. Configure TURN on both devices (Google STUN is not TURN), or try the same LAN. Create a fresh invitation after changing ICE settings.");
        disconnect(peer);
      },45000);
    }
  }
  function remoteFetch(input,options={}){
    const url=new URL(typeof input==="string"?input:input.url,location.href);
    if(role!=="client"||!url.pathname.startsWith("/api/"))return localFetch(input,options);
    if(!upstream?.open)return Promise.reject(Error("The browser host is not connected yet"));
    if(pending.size>=4)return Promise.reject(Error("Too many pending peer requests"));
    return new Promise((resolve,reject)=>{
      const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error("Browser host timed out"));},15000);
      pending.set(id,{resolve,reject,timer,state:url.pathname==="/api/state"});
      send(upstream,{type:"request",id,path:url.pathname+url.search,method:options.method||"GET",body:typeof options.body==="string"?options.body:""}).catch(e=>{clearTimeout(timer);pending.delete(id);reject(e);});
    });
  }
  window.fetch=remoteFetch;
  function open(mode){$("peer-host-controls").hidden=mode!=="host";$("peer-join-controls").hidden=mode==="host";renderPeers();if(!$("peer-dialog").open)$("peer-dialog").showModal();}
  const action=fn=>async()=>{try{await fn();}catch(e){status(e.message);}};
  $("host").onclick=action(async()=>{if(!state||!atlas)throw Error("Wait for the game to finish loading");role="host";await join("host-player");if(!connected){role="local";throw Error("The host could not start");}open("host");});
  $("join").onclick=()=>{joining="join";$("peer-seat").value="join";open("join");};
  $("watch").onclick=()=>{joining="watch";$("peer-seat").value="watch";open("join");};
  $("peer-invite").onclick=()=>open(role==="host"?"host":"join");
  $("peer-close").onclick=()=>{if(role==="client"&&!connected)window.CrownPeer.close();$("peer-dialog").close();};
  $("peer-create-invite").onclick=action(offer);
  $("peer-accept-answer").onclick=action(()=>accept($("peer-host-answer").value));
  $("peer-create-answer").onclick=action(()=>answer($("peer-join-code").value,$("peer-seat").value));
  for(const id of ["peer-host-code","peer-answer-code"])$(id+"-copy").onclick=action(async()=>{if(!$(id).value)throw Error("Generate a code first");await navigator.clipboard.writeText($(id).value);status("Copied. Share it privately with your friend.");});
  setInterval(()=>{for(const peer of [...peers.values()]){for(const [id,item]of peer.fragments)if(performance.now()-item.time>10000)peer.fragments.delete(id);if(!peer.open&&performance.now()-peer.created>300000){status("Invitation expired without a connection. Create a fresh invitation; if direct connections fail, configure TURN on both devices.");disconnect(peer);}}},2000);
  window.CrownPeer={offer,answer,accept,open,debug(){return [...peers.values()].map(p=>({state:p.pc.connectionState,ice:p.pc.iceConnectionState,signal:p.pc.signalingState,open:p.open,seat:p.seat,inflight:p.inflight,fragments:p.fragments.size,requests:p.requests,pushing:!!p.pushing}));},get observerPush(){return observerPush;},get role(){return role;},get active(){return role!=="local";},get connectedPeers(){return [...peers.values()].filter(p=>p.open).length;},close(){const old=role;role="local";observerPush=false;for(const peer of [...peers.values()])disconnect(peer);upstream=null;for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error("Peer session closed"));}pending.clear();return old;}};
  $("peer-invite").hidden=false;
  $("host").textContent="HOST BROWSER ROOM";$("join").textContent="JOIN BROWSER ROOM";
  if(location.hash.startsWith("#peer=")){$("peer-join-code").value=location.hash.slice(6);history.replaceState(null,"",location.pathname+location.search);open("join");}
})();
