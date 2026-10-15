import { MotionTweaks } from '@/components/motion/MotionSettings'
import Link from 'next/link'
import { Navigation } from '@/components/brand/Navigation'
import { SmokeStage } from '@/components/hero/SmokeStage'
import { CompactForm } from '@/components/wholesale/CompactForm'
import { InterestLink } from '@/components/wholesale/InterestLink'
import { Brands } from './Brands'
import { salesContact, splash } from '@/content/splash'
import { categories, signupCopy, steps } from '@/content/wholesale'
import styles from './Splash.module.css'

export function Splash() {
  return (
    <>
      <Navigation />
      <MotionTweaks />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="home-title">
          <SmokeStage />
          <div className={styles.heroInner}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>
                <span className={styles.dot} />
                Wholesale, with some personality.
              </p>
              <h1 id="home-title" className={styles.title}>
                <span>STOCK UP.</span>
                <span>STAND OUT.</span>
              </h1>
              <p className={styles.tagline}>
                Make your shelves a <strong>Smoke Show.</strong>
              </p>
              <p className={styles.subtitle}>{splash.subheadline}</p>
              <p className={styles.body}>
                Sign up to receive the current wholesale menu and connect with your
                dedicated salesperson.
              </p>
              <Link href="/wholesale" className={styles.mobileCta}>
                Get the Wholesale Menu <span aria-hidden="true">→</span>
              </Link>
            </div>
            <CompactForm />
          </div>
        </section>
        <Brands />
        <section id="products" className={styles.supply} aria-labelledby="supply-title">
          <p className={styles.eyebrow}>Your shelves. Your selection.</p>
          <div className={styles.sectionHeading}>
            <h2 id="supply-title">Find your category.</h2>
            <Link href="/wholesale">
              Ask about the lineup <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.categories}>
            {categories.map((category, index) => (
              <InterestLink
                key={category.title}
                interest={category.interest}
                className={`${styles.category} ${styles[`category${index}`]}`}
              >
                <span className={styles.categoryNumber}>
                  0{index + 1} / {category.title}
                </span>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.detail}</p>
                </div>
              </InterestLink>
            ))}
          </div>
        </section>
        <section id="helix" className={styles.helix} aria-labelledby="helix-title">
          <div className={styles.helixArt}>
            {/* Local supplied brand artwork. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/house-of-helix-vertical-dark.png"
              alt="House of Helix"
              width={500}
              height={500}
            />
          </div>
          <div className={styles.helixCopy}>
            <p className={styles.eyebrow}>HOUSE OF HELIX — BULK PEPTIDE STRIP SUPPLY</p>
            <h2 id="helix-title">Peptide strips, available in bulk.</h2>
            <p className={styles.helixDescription}>{signupCopy.helix}</p>
          </div>
          <InterestLink
            interest="HOUSE OF HELIX Peptide Strips"
            className={styles.helixCta}
          >
            Ask about Helix <span aria-hidden="true">↗</span>
          </InterestLink>
        </section>
        <section id="how-it-works" className={styles.process} aria-label="How it works">
          {steps.map((step, index) => (
            <div key={step.title}>
              <span className={styles.step}>0{index + 1}</span>
              <h2>{step.title}</h2>
              <p>{step.detail}</p>
            </div>
          ))}
        </section>
      </main>

      <footer id="contact" className={styles.footer}>
        <div className={styles.contact}>
          <h2>Let’s talk</h2>
          <a href={salesContact.phone.href}>{salesContact.phone.display}</a>
          <a href={salesContact.email.href}>{salesContact.email.display}</a>
          <p>{salesContact.hours}</p>
        </div>
        <p className="sl">© {new Date().getFullYear()} Smoke Show Labs</p>
        <nav aria-label="Legal" className={styles.legal}>
          <a className="sl" href="/privacy">
            Privacy
          </a>
          <a className="sl" href="/terms">
            Terms
          </a>
        </nav>
      </footer>
    </>
  )
}
