import { Layout } from '../components/layout/Layout'

export default function AboutPage() {
  const stats = [
    { label: 'Courses Indexed', value: '4,200+' },
    { label: 'Instructors Tracked', value: '1,100+' },
    { label: 'CTEC Responses Analyzed', value: '250k+' },
    { label: 'NU Schools Covered', value: '12' }
  ]

  const testimonials = [
    {
      quote:
        'Having all the CTEC insights in one place changed how I plan my quarter. It saves hours and gives me confidence in my picks.',
      author: 'Priya A.',
      role: 'McCormick CS, 2026'
    },
    {
      quote:
        'The breakdowns are intuitive and the averages line up with my experience. Love the distribution charts and quick filters.',
      author: 'Ethan L.',
      role: 'Weinberg Econ, 2025'
    },
    {
      quote:
        'I finally feel like I can compare sections fairly. This makes registration week a lot less stressful.',
      author: 'Maya K.',
      role: 'SESP Learning Sciences, 2027'
    }
  ]

  const locations = [
    { title: 'Evanston, IL', detail: 'Main campus focus' },
    { title: 'Chicago, IL', detail: 'Feinberg & Pritzker coverage' },
    { title: 'Doha, Qatar', detail: 'NU-Q select courses' }
  ]

  return (
    <Layout>
      <div className="about-page">
        {/* Hero */}
        <section className="about-hero container">
          <div className="about-hero-content">
            <h1 className="about-title">Our Mission: Help Wildcats Choose Better</h1>
            <p className="about-subtitle">
              We align our success with yours: clearer insights, better schedules, happier quarters.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="about-mission container">
          <div className="mission-card">
            <h2>Why We Built This</h2>
            <p>
              In course planning, interruptions and scattered tabs slow you down. Inspired by
              crafted, customer-first experiences rather than cobbled-together tools, we aim to
              provide a frictionless way to search courses, compare instructors, and understand
              what to expect—grounded in CTEC data.
            </p>
            <p className="mission-note">
              Modeled after purpose-driven product stories like HubSpot’s “crafted, not cobbled” ethos,
              we focus on clarity and outcomes for students.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="about-story container">
          <div className="story-grid">
            <div className="story-text">
              <h3>Our Story</h3>
              <p>
                We noticed a shift: students want helpful, trustworthy information—not noise. We
                started CTEC Search to make data approachable. Instead of digging through PDFs or
                fragmented spreadsheets, you get structured views, rating distributions, and
                instructor histories—all in one place.
              </p>
              <p>
                Built for speed during registration crunch time, our interface helps you go from
                question to confident decision in minutes.
              </p>
            </div>
            <div className="story-highlights">
              <div className="highlight">
                <div className="highlight-icon">⚡</div>
                <div className="highlight-content">
                  <h4>Frictionless Search</h4>
                  <p>Fast filters and clear labels—no guesswork.</p>
                </div>
              </div>
              <div className="highlight">
                <div className="highlight-icon">📊</div>
                <div className="highlight-content">
                  <h4>Structured Insights</h4>
                  <p>Distribution charts, averages, and trends that actually help.</p>
                </div>
              </div>
              <div className="highlight">
                <div className="highlight-icon">🔍</div>
                <div className="highlight-content">
                  <h4>Transparent Sources</h4>
                  <p>CTEC-derived data with careful parsing and labeling.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="about-stats container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="stats-footnote">Numbers are approximations and update as we ingest new CTECs.</p>
        </section>

        {/* Testimonials */}
        <section className="about-testimonials container">
          <div className="section-header">
            <h3>What Students Say</h3>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <p className="testimonial-quote">“{t.quote}”</p>
                <div className="testimonial-author">
                  <span className="author-name">{t.author}</span>
                  <span className="author-role">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Locations */}
        <section className="about-locations container">
          <div className="section-header">
            <h3>Where We Focus</h3>
          </div>
          <div className="locations-grid">
            {locations.map((loc) => (
              <div key={loc.title} className="location-card">
                <div className="location-pin">📍</div>
                <div>
                  <h4 className="location-title">{loc.title}</h4>
                  <p className="location-detail">{loc.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="about-resources container">
          <div className="resources-card">
            <h3>Resources</h3>
            <ul className="resources-list">
              <li>
                <span className="resource-name">CTEC Guide</span>
                <span className="resource-desc">Understand question mappings and rating scales</span>
              </li>
              <li>
                <span className="resource-name">Instructor Profiles</span>
                <span className="resource-desc">See patterns across terms and sections</span>
              </li>
              <li>
                <span className="resource-name">Search Tips</span>
                <span className="resource-desc">Get better results with filters and keywords</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </Layout>
  )
}


