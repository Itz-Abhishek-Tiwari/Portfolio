'use client';
import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export function usePortfolioMotion(root:RefObject<HTMLDivElement|null>){
 useLayoutEffect(()=>{
 if(!root.current)return;gsap.registerPlugin(ScrollTrigger);
 const mm=gsap.matchMedia();let alive=true;
 mm.add('(prefers-reduced-motion: no-preference)',()=>{
 const ctx=gsap.context(()=>{
 const intro=gsap.timeline({defaults:{ease:'power4.out',duration:1.1}});
 intro.fromTo('.hero-name .name-word',{yPercent:110,rotation:4},{yPercent:0,rotation:0,stagger:.13},.12)
 .fromTo('.hero-background',{scale:1.18,opacity:.2},{scale:1,opacity:1,duration:1.9},0)
 .fromTo('.hero-subtitle,.hero-foot,.hero-index',{y:22,opacity:0},{y:0,opacity:1,stagger:.12,duration:.8},.8)
 .fromTo('.nav',{y:-25,opacity:0},{y:0,opacity:1,duration:.8},.4)
 .fromTo('.hero-japanese',{y:45,opacity:0},{y:0,opacity:.65,duration:1.3},.7);
 ScrollTrigger.create({start:80,end:'max',toggleClass:{targets:root.current!.querySelector('.nav')!,className:'nav-scrolled'}});
 gsap.to('.hero-background',{yPercent:13,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
 gsap.to('.hero-name',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
 gsap.to('.orbit-text',{rotation:360,duration:25,repeat:-1,ease:'none'});
 gsap.to('.marquee-track',{xPercent:-50,duration:26,repeat:-1,ease:'none'});
 gsap.fromTo('.reading-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:root.current,start:'top top',end:'bottom bottom',scrub:true}});
 root.current?.querySelectorAll<HTMLElement>('.reveal').forEach(el=>{gsap.fromTo(el,{y:55,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}});});
 gsap.fromTo('.portrait-frame',{rotation:-7,y:55},{rotation:-2,y:-15,ease:'none',scrollTrigger:{trigger:'.about-section',start:'top bottom',end:'bottom top',scrub:1}});
 },root);
 const fine=window.matchMedia('(hover:hover) and (pointer:fine)');const cleanups:(()=>void)[]=[];
 if(fine.matches){
 const cursor=root.current!.querySelector<HTMLElement>('.custom-cursor')!;
 const x=gsap.quickTo(cursor,'x',{duration:.35,ease:'power3'}),y=gsap.quickTo(cursor,'y',{duration:.35,ease:'power3'});
 const move=(e:PointerEvent)=>{x(e.clientX);y(e.clientY);gsap.to(cursor,{opacity:1,duration:.2,overwrite:'auto'});};
 const hover=(e:PointerEvent)=>{const node=e.target as Element;const active=!!node.closest('a,button,[data-cursor]');gsap.to(cursor,{scale:active?1.8:1,duration:.25,overwrite:'auto'});cursor.classList.toggle('cursor-active',active);};
 const leave=()=>gsap.to(cursor,{opacity:0,duration:.2});
 window.addEventListener('pointermove',move);window.addEventListener('pointerover',hover);document.addEventListener('pointerleave',leave);
 cleanups.push(()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerover',hover);document.removeEventListener('pointerleave',leave);gsap.killTweensOf(cursor);});
 root.current!.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el=>{const enter=(e:PointerEvent)=>{const rect=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-rect.left-rect.width/2)*.18,y:(e.clientY-rect.top-rect.height/2)*.18,duration:.35,ease:'power3.out'});};const exit=()=>gsap.to(el,{x:0,y:0,duration:.5,ease:'power3.out'});el.addEventListener('pointermove',enter);el.addEventListener('pointerleave',exit);cleanups.push(()=>{el.removeEventListener('pointermove',enter);el.removeEventListener('pointerleave',exit);gsap.killTweensOf(el);});});
 }
 const goToHash=()=>{const id=window.location.hash.slice(1),target=id?document.getElementById(id):null;if(target)requestAnimationFrame(()=>{if(alive)target.scrollIntoView({behavior:'auto',block:'start'});});};window.addEventListener('hashchange',goToHash);cleanups.push(()=>window.removeEventListener('hashchange',goToHash));
 document.fonts.ready.then(()=>{if(alive){ScrollTrigger.refresh();goToHash();}});
 return()=>{cleanups.forEach(fn=>fn());ctx.revert();};
 },root);
 return()=>{alive=false;mm.revert();};
 },[root]);
}
export function useProjectRail(root:RefObject<HTMLDivElement|null>,filter:string){
 useLayoutEffect(()=>{if(!root.current)return;gsap.registerPlugin(ScrollTrigger);const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
 const ctx=gsap.context(()=>{root.current!.querySelectorAll<HTMLElement>('.project').forEach(card=>{
 gsap.fromTo(card,{y:45,opacity:0},{y:0,opacity:1,duration:.85,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 90%',once:true}});
 const art=card.querySelector('.feature-art');if(art)gsap.fromTo(art,{y:-15},{y:15,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:1}});
 });},root);return()=>ctx.revert();
 },root);ScrollTrigger.refresh();return()=>mm.revert();},[root,filter]);
}
