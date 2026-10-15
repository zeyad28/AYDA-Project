import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCommittees } from '../services/committees'
import { HERO_IMAGE_URL, LOGO_URL, getOptimizedImageUrl } from '../lib/assets'
import { useParallax } from '../hooks/useParallax'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Reveal } from '../components/Reveal'
import { PulseLine } from '../components/PulseLine'
import { ProgressiveImage } from '../components/ProgressiveImage'
import type { Committee } from '../types'

const SECTION_LOGO_URL = getOptimizedImageUrl(LOGO_URL, { width: 96, height: 96, quality: 85 })

function CommitteeSkeleton () {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/60 bg-white shadow-card">
      <div className="h-44 animate-pulse bg-sand-deep" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-sand-deep" />
        <div className="h-4 w-full animate-pulse rounded bg-sand-deep" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-sand-deep" />
      </div>
    </div>
  )
}

function CommitteeCard ( { committee, index }: { committee: Committee; index: number } ) {
  const { ref, visible } = useScrollReveal<HTMLElement>()

  return (
    <article
      ref={ ref }
      className={ `group overflow-hidden rounded-2xl border border-line/60 bg-white shadow-card transition-all duration-700 hover:-translate-y-1.5 hover:shadow-glow ${ visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }` }
      style={ { transitionDelay: visible ? `${ Math.min( index, 6 ) * 90 }ms` : '0ms' } }
    >
      <div className="relative h-44 bg-teal-soft">
        { committee.image_url ? (
          <>
            <ProgressiveImage
              src={ committee.image_url }
              alt=""
              width={ 440 }
              height={ 176 }
              containerClassName="h-full w-full"
              className="transition duration-500 group-hover:scale-105"
            />
            {/* Duotone wash so photos of varying quality/color read as one system */ }
            <div className="pointer-events-none absolute inset-0 bg-teal mix-blend-color opacity-30" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-teal/30">
            { committee.code }
          </div>
        ) }
        <span className="absolute bottom-3 right-3 rounded-xl bg-ink/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          { committee.code }
        </span>
      </div>
      <div className="h-1 bg-brand-fade" aria-hidden="true" />
      <div className="p-6">
        <h3 className="font-display text-xl font-bold">{ committee.name }</h3>
        { committee.description && (
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink/75">{ committee.description }</p>
        ) }
      </div>
    </article>
  )
}

export default function CommitteesPage () {
  const {
    data: committees = [],
    isLoading,
    isError,
  } = useQuery( { queryKey: [ 'committees' ], queryFn: fetchCommittees } )

  const { ref: auroraRef, offset: auroraOffset } = useParallax<HTMLDivElement>( -0.12 )
  const { ref: photoRef, offset: photoOffset } = useParallax<HTMLDivElement>( 0.05 )

  return (
    <div>
      {/* Hero */ }
      <section className="relative overflow-hidden bg-ink">
        <div
          ref={ auroraRef }
          className="absolute inset-0 bg-aurora"
          style={ { transform: `translateY(${ auroraOffset }px)` } }
          aria-hidden="true"
        />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-coral/20 blur-3xl animate-float-slow" aria-hidden="true" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-teal/30 blur-3xl animate-float" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 md:grid-cols-2 md:py-32">
          {/* Content - centered while stacked (no photo alongside to justify
              right-alignment yet), right-aligned once the two columns sit
              side by side at md+. */}
          <div className="animate-fade-up text-center md:text-right">
            <span className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-1.5 text-sm font-bold text-amber ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              Association of Young Doctors
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.15] text-white sm:text-5xl md:text-6xl">
              الصحة <span className="text-gradient">حق للجميع</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/70 md:mx-0">
              فريق من أطباء المستقبل يعمل على توصيل الدواء والأجهزة الطبية والاستشارات لمن
              يحتاجها، مجاناً وبكرامة كاملة.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to="/request"
                className="rounded-xl bg-brand-fade px-7 py-3.5 font-display font-bold text-white shadow-glow transition hover:brightness-110"
              >
                اطلب مساعدة طبية
              </Link>
              <a
                href="#committees"
                className="rounded-xl border border-white/20 px-7 py-3.5 font-bold text-white transition hover:bg-white/10"
              >
                تعرّف على اللجان
              </a>
            </div>

            {/* Signature pulse divider with real/qualitative stats threaded along it */ }
            <div className="relative mx-auto mt-12 max-w-md md:mx-0">
              <PulseLine className="h-8 w-full text-coral/70" strokeWidth={ 2.5 } />
              <div className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm md:justify-start">
                <div>
                  <span className="font-display text-xl font-bold text-white">
                    { committees.length || '—' }
                  </span>
                  <span className="mr-1.5 text-white/50">لجان نشطة</span>
                </div>
                <div>
                  <span className="font-display text-xl font-bold text-white">مجاناً</span>
                  <span className="mr-1.5 text-white/50">لكل الحالات</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo */ }
          <div ref={ photoRef } className="relative" style={ { transform: `translateY(${ photoOffset }px)` } }>
            <div className="relative rounded-tr-[3.5rem] rounded-bl-[3.5rem] rounded-tl-2xl rounded-br-2xl shadow-lift ring-1 ring-white/10">
              <ProgressiveImage
                src={ HERO_IMAGE_URL }
                alt="فريق AYDA"
                width={ 700 }
                height={ 560 }
                quality={ 75 }
                eager
                containerClassName="h-80 w-full rounded-tr-[3.5rem] rounded-bl-[3.5rem] rounded-tl-2xl rounded-br-2xl md:h-[26rem]"
              />
              <div className="pointer-events-none absolute inset-0 rounded-tr-[3.5rem] rounded-bl-[3.5rem] rounded-tl-2xl rounded-br-2xl bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            </div>

            {/* Floating availability badge - ties to the pulse/ECG motif instead of a generic stat card */ }
            <div className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lift sm:-right-6">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
              </span>
              <span className="text-sm font-bold text-ink">فريقنا متاح الآن</span>
            </div>
          </div>
        </div>
      </section>

      {/* A crisp brand-gradient seam marks the transition deliberately instead
          of an alpha-blended fade, which muddies badly between hues this far
          apart (dark teal ink -> warm cream sand). */}
      <div className="h-[3px] bg-brand-fade" aria-hidden="true" />

      {/* Committees */ }
      <section id="committees" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-10 text-center">
          <span className="text-sm font-bold text-coral">فرق العمل</span>
          <h2 className="mt-1 font-display text-3xl font-bold">لجان AYDA</h2>
          <span className="mx-auto mt-4 block w-fit rounded-2xl bg-brand-fade p-[3px] shadow-card">
            <img
              src={SECTION_LOGO_URL}
              alt="AYDA"
              width="64"
              height="64"
              className="block h-16 w-16 rounded-[0.95rem] bg-sand object-cover"
            />
          </span>
          <p className="mt-4 text-ink/60">تعرّف على اللجان التي تشكّل عمل الفريق ومجالات تخصصه</p>
        </Reveal>

        { isError && (
          <p className="rounded-xl bg-red-50 p-4 text-center font-bold text-red-700" role="alert">
            تعذر تحميل اللجان، حاول تحديث الصفحة
          </p>
        ) }

        { !isError && !isLoading && committees.length === 0 && (
          <p className="text-center text-ink/50">لا توجد لجان مضافة حالياً</p>
        ) }

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          { isLoading
            ? Array.from( { length: 6 } ).map( ( _, i ) => <CommitteeSkeleton key={ i } /> )
            : committees.map( ( c, i ) => <CommitteeCard key={ c.id } committee={ c } index={ i } /> ) }
        </div>
      </section>
    </div>
  )
}
