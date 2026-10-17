import { brandIcons as brands } from '@/lib/brand-icons';
import {
  Code2,
  Database,
  Globe,
  Building2,
  GraduationCap,
  Smartphone,
  Layers,
  Terminal,
  Palette
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Content } from '@/lib/content';

const symbols: Record<string, LucideIcon> = {
  'rest apis': Globe,
  sql: Database,
  education: GraduationCap,
  mobile: Smartphone,
  frontend: Layers,
  backend: Database,
  tools: Terminal,
  illustration: Palette
};
const companyAssets: Record<string, string> = {
  'thoughtwin it solution': '/assets/brands/thoughtwin.svg',
  thoughtwin: '/assets/brands/thoughtwin.svg',
  'ideal it techno': '/assets/brands/ideal-it.png'
};
export default function SiteIcon({
  name,
  kind = 'skill',
  assets = [],
  style = 'themed',
  fallback: Fallback,
  size = 24
}: {
  name: string;
  kind?: 'skill' | 'company' | 'interface';
  assets?: Content['iconAssets'];
  style?: Content['iconStyle'];
  fallback?: LucideIcon;
  size?: number;
}) {
  const key = name.trim().toLowerCase(),
    custom = assets.find(a => a.kind === kind && a.name.trim().toLowerCase() === key),
    asset =
      custom?.image ||
      (kind === 'company' ? companyAssets[key] : key === 'linkedin' ? '/assets/brands/linkedin.svg' : '');
  if (asset) {
    const themed = custom ? custom.themed : style === 'themed';
    return (
      <span
        className={'site-icon asset-icon' + (themed ? ' themed-icon' : ' original-icon')}
        style={{
          width: size,
          height: size,
          ...(themed ? { maskImage: 'url(' + asset + ')', WebkitMaskImage: 'url(' + asset + ')' } : {})
        }}
        aria-hidden="true"
      >
        {!themed && <img src={asset} alt="" loading="lazy" />}
      </span>
    );
  }
  const brand = key === 'sql' ? undefined : brands[key as keyof typeof brands];
  if (brand)
    return (
      <svg
        className="site-icon brand-icon"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={style === 'brand' ? '#' + brand.hex : 'currentColor'}
        aria-hidden="true"
      >
        <path d={brand.path} />
      </svg>
    );
  const Symbol = symbols[key] || Fallback || (kind === 'company' ? Building2 : Code2);
  return <Symbol className="site-icon" size={size} strokeWidth={1.7} aria-hidden="true" />;
}
