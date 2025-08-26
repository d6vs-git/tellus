(function() {
    class TellusTestimonials extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }
  
      async connectedCallback() {
        const code = this.getAttribute('code');
        const limit = this.getAttribute('limit') || '5';
        const theme = this.getAttribute('theme') || 'light';
  
        if (!code) {
          this.shadowRoot.innerHTML = '<p>Error: Missing business code</p>';
          return;
        }
  
        try {
          const response = await fetch(
            `${window.location.origin}/api/testimonials/${code}?limit=${limit}`
          );
          const testimonials = await response.json();
  
          const styles = `
            :host {
              display: block;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 1rem;
            }
            .testimonial {
              background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
              color: ${theme === 'dark' ? '#ffffff' : '#1f2937'};
              padding: 1rem;
              margin: 1rem 0;
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .stars {
              color: #fbbf24;
            }
          `;
  
          this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="container">
              ${testimonials.map(t => `
                <div class="testimonial">
                  <h3>${t.name}</h3>
                  <div class="stars">
                    ${'★'.repeat(Math.round(t.rating))}${'☆'.repeat(5 - Math.round(t.rating))}
                  </div>
                  <p>${t.feedback}</p>
                  <small>${new Date(t.createdAt).toLocaleDateString()}</small>
                </div>
              `).join('')}
            </div>
          `;
        } catch (error) {
          this.shadowRoot.innerHTML = '<p>Failed to load testimonials</p>';
        }
      }
    }
  
    customElements.define('tellus-testimonials', TellusTestimonials);
  })();