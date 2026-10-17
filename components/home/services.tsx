const services = [
  {
    title: 'Mobile apps',
    text: 'Cross-platform React Native apps for Android and iOS, with navigation, state management and offline support.'
  },
  {
    title: 'APIs & integration',
    text: 'REST API integration, caching and sync with Redux Toolkit, plus Python and Django when the backend needs to move too.'
  },
  {
    title: 'Tooling & systems',
    text: 'Linux workflows, dotfiles and developer tooling that keep builds and machines fast.'
  }
];

export default function Services() {
  return (
    <section id="services" className="section-wrap" aria-labelledby="services-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">What I do</span>
          <h2 id="services-heading">
            Where I can <em>help</em>
          </h2>
        </div>
      </div>
      <div className="services">
        {services.map((service, index) => (
          <article className="service" key={service.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{service.title}</h3>
            <p>{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
