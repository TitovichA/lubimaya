import type { LifeAreaId } from '../types'

const sources: Record<LifeAreaId, string> = {
  home: `${import.meta.env.BASE_URL}illustrations/home.jpg`,
  body: `${import.meta.env.BASE_URL}illustrations/body.jpg`,
  business: `${import.meta.env.BASE_URL}illustrations/business.jpg`,
  growth: `${import.meta.env.BASE_URL}illustrations/growth.jpg`,
  family: `${import.meta.env.BASE_URL}illustrations/family.jpg`,
}

const labels: Record<LifeAreaId, string> = {
  home: 'Мой дом',
  body: 'Моё тело',
  business: 'Мой бизнес',
  growth: 'Саморазвитие',
  family: 'Моя семья',
}

export function AreaIllustration({ areaId, className = '' }: { areaId: LifeAreaId; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-cream ${className}`}>
      <img
        src={sources[areaId]}
        alt={labels[areaId]}
        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cream/25 via-transparent to-cream/10" />
    </div>
  )
}
