'use client';
import { useLayoutEffect,type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export function usePortfolioMotion(root:RefObject<HTMLDivElement|null>,enabled=true){
 useLayoutEffect(()=>{if(!root.current)return;gsap.registerPlugin(ScrollTrigger);const scope=root.current;let alive=true;const mm=gsap.matchMedia();
 const goToHash=()=>{const target=document.getElementById(window.location.hash.slice(1));if(target)requestAnimationFrame(()=>{if(alive)target.scrollIntoView({block:'start',behavior:'auto'});});};window.addEventListener('hashchange',goToHash);
 if(enabled)mm.add('(prefers-reduced-motion: no-preference)',()=>{
 const cleanup:(()=>void)[]=[];const ctx=gsap.context(()=>{
 gsap.timeline({defaults:{ease:'power3.out'}}).fromTo('.scene-backdrop',{scale:1.07,opacity:.4},{scale:1,opacity:1,duration:1.7},0).fromTo('.hero-letter',{yPercent:105,opacity:0},{yPercent:0,opacity:1,duration:.95,stagger:.035},.15).fromTo('.hero-overline,.hero-intro,.hero-actions,.hero-bottom',{y:18,opacity:0},{y:0,opacity:1,duration:.8,stagger:.1},.6).fromTo('.scene-foreground',{y:25,opacity:0},{y:0,opacity:1,duration:1.5},.15);
 scope.querySelectorAll<HTMLElement>('[data-scroll-depth]').forEach(layer=>{gsap.to(layer,{yPercent:Number(layer.dataset.scrollDepth)*100,ease:'none',scrollTrigger:{trigger:scope.querySelector('.hero')!,start:'top top',end:'bottom top',scrub:1}});});
 gsap.to('.scene-mist',{xPercent:4,yPercent:2,duration:16,repeat:-1,yoyo:true,ease:'sine.inOut'});
 gsap.fromTo('.reading-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:scope,start:'top top',end:'bottom bottom',scrub:true}});
 scope.querySelectorAll<HTMLElement>('.reveal').forEach(el=>gsap.fromTo(el,{y:35,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
 if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){const hero=scope.querySelector<HTMLElement>('.hero')!,layers=[...scope.querySelectorAll<HTMLElement>('[data-pointer-depth]')].map(el=>({el,depth:Number(el.dataset.pointerDepth),x:gsap.quickTo(el,'x',{duration:.85,ease:'power3.out'}),y:gsap.quickTo(el,'y',{duration:.85,ease:'power3.out'})}));const move=(e:PointerEvent)=>{const bounds=hero.getBoundingClientRect(),x=(e.clientX-bounds.left)/bounds.width-.5,y=(e.clientY-bounds.top)/bounds.height-.5;layers.forEach(l=>{l.x(x*l.depth);l.y(y*l.depth*.4);});};const leave=()=>layers.forEach(l=>{l.x(0);l.y(0);});hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',leave);cleanup.push(()=>{hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);layers.forEach(l=>gsap.killTweensOf(l.el));});}
 },scope);return()=>{cleanup.forEach(fn=>fn());ctx.revert();};
 },scope);
 document.fonts.ready.then(()=>{if(alive){ScrollTrigger.refresh();goToHash();}});return()=>{alive=false;window.removeEventListener('hashchange',goToHash);mm.revert();};
 },[root,enabled]);
}
export function useProjectRail(root:RefObject<HTMLDivElement|null>,filter:string,enabled=true){useLayoutEffect(()=>{if(!root.current||!enabled)return;gsap.registerPlugin(ScrollTrigger);const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{const ctx=gsap.context(()=>{root.current!.querySelectorAll<HTMLElement>('.project').forEach(card=>gsap.fromTo(card,{y:25,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 92%',once:true}}));},root);return()=>ctx.revert();},root);ScrollTrigger.refresh();return()=>mm.revert();},[root,filter,enabled]);}
