import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** GSAP with ScrollTrigger registered. Call from effects only (needs the DOM). */
export function scrollMotion() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile address bars resize the viewport mid-scroll; recalculating every trigger then causes a hitch.
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger };
}
