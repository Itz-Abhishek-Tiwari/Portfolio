const stars=[[14,18],[28,11],[43,22],[60,13],[81,10],[92,31],[74,25],[34,29],[54,7],[9,39],[65,35],[85,45]];
export default function LayeredScene({theme}:{theme:'night'|'sunset'|'forest'}){return <div className="layered-scene" aria-hidden="true">
 <div className="scene-plane scene-plane-back" data-scroll-depth="0.12"><div data-pointer-depth="6" className="scene-pointer"><img className="scene-image scene-backdrop" src={theme==='sunset'?'/assets/sunset-background.png':'/assets/night-background.png'} alt="" fetchPriority="high"/></div></div>
 <div className="scene-stars">{stars.map(([x,y],i)=><i key={i} style={{left:x+'%',top:y+'%',animationDelay:i*.37+'s'}}/>)}</div>
 <div className="scene-plane scene-plane-mist" data-scroll-depth="0.22"><div data-pointer-depth="14" className="scene-pointer"><img className="scene-image scene-mist" src="/assets/night-mist.png" alt=""/></div></div>
 <div className="scene-plane scene-plane-front" data-scroll-depth="0.38"><div data-pointer-depth="30" className="scene-pointer"><img className="scene-image scene-foreground" src="/assets/night-foreground.png" alt=""/></div></div>
 <div className="scene-vignette"/><div className="scene-base-fade"/>
 </div>;}
