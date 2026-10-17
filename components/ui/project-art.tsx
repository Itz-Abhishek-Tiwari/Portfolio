import type { Content } from '@/lib/content';
import { MapPin, CalendarDays, Check, ArrowUpRight } from 'lucide-react';
type Project = Content['projects'][number];
export function ProjectArt({ project: p }: { project: Project }) {
  if (p.id === 'wasalt')
    return (
      <div className="product-cover property-cover">
        <span className="product-caption">INTERFACE STUDY / CONCEPTUAL</span>
        <div className="product-device">
          <div className="device-bar" />
          <div className="device-header">
            <span>Explore properties</span>
            <MapPin size={16} />
          </div>
          <div className="device-search">Search a location</div>
          <div className="device-map">
            <svg viewBox="0 0 200 210" aria-hidden="true">
              <path
                d="M0 35 200 100M-20 170 220 40M20 0 140 210M150 -20 35 230"
                stroke="var(--device-road)"
                strokeWidth="16"
                fill="none"
              />
              {[
                [20, 35],
                [80, 12],
                [125, 58],
                [30, 115],
                [120, 135],
                [155, 170]
              ].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width="30" height="25" rx="3" fill="var(--device-block)" />
              ))}
              <circle cx="103" cy="99" r="20" fill="var(--device-highlight)" opacity=".15" />
              <circle cx="103" cy="99" r="7" fill="var(--device-highlight)" />
            </svg>
            <div className="map-prompt">
              <MapPin size={12} />
              Saudi Arabia
            </div>
          </div>
          <div className="device-footer">
            <span>Map</span>
            <span>Saved</span>
            <span>Profile</span>
          </div>
        </div>
        <div className="cover-note">
          <span>Wasalt</span>
          <p>
            Search.
            <br />
            Locate.
            <br />
            Explore.
          </p>
          <small>REACT NATIVE / PROPERTY DISCOVERY</small>
        </div>
      </div>
    );
  if (p.id === 'mtp')
    return (
      <div className="product-cover task-cover">
        <span className="product-caption">INTERFACE STUDY / CONCEPTUAL</span>
        <div className="cover-note">
          <span>My Ticket Partner</span>
          <p>
            Keep the day
            <br />
            in motion.
          </p>
          <small>TASKS / SCHEDULING / STATE</small>
        </div>
        <div className="product-device">
          <div className="device-bar" />
          <div className="device-header">
            <span>Your workspace</span>
            <CalendarDays size={16} />
          </div>
          <div className="device-day">The plan for today</div>
          {['Task assignment', 'Scheduling', 'API synchronization'].map((t, i) => (
            <div className="device-task" key={t}>
              <span className="task-indicator">
                <Check size={12} />
              </span>
              <div>
                <b>{t}</b>
                <span>{['View assigned work', 'Organize the day', 'Keep data in sync'][i]}</span>
              </div>
            </div>
          ))}
          <div className="device-schedule">
            <span>ASSIGN</span>
            <i />
            <span>SCHEDULE</span>
            <i />
            <span>SYNC</span>
          </div>
          <div className="device-footer">
            <span>Tasks</span>
            <span>Calendar</span>
            <span>Profile</span>
          </div>
        </div>
      </div>
    );
  if (p.id === 'nami')
    return (
      <div className="product-cover desktop-cover">
        <span className="product-caption">ACTUAL REPOSITORY SCREENSHOT</span>
        <img src="/assets/nami-desktop.png" alt="NamiConfig Linux desktop" loading="lazy" />
        <span className="desktop-cover-name">
          NamiConfig <ArrowUpRight size={23} />
        </span>
      </div>
    );
  return (
    <div className="product-cover custom-cover">
      <span className="product-caption">{p.category} / PROJECT</span>
      <ArrowUpRight size={90} />
      <span className="custom-cover-name">{p.title}</span>
    </div>
  );
}
