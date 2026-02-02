// =====================
// SCROLL POSITION RESET
// Reset scroll position to top on page load/refresh
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);


// =========================
// WAVE ANIMATION BACKGROUND
// Custom HTML element for interactive wave animation
// Credit: Adapted from https://codepen.io/wodniack/pen/abeMZXQ
// USED: Landing and Contact sections background
class AWaves extends HTMLElement {
  /**
   * Init
   */
  connectedCallback() {
    // Elements
    this.svg = this.querySelector('.js-svg')

    // Properties
    this.mouse = {
      x: -10,
      y: 0,
      lx: 0,
      ly: 0,
      sx: 0,
      sy: 0,
      v: 0,
      vs: 0,
      a: 0,
      set: false,
    }

    this.lines = []
    this.paths = []
    this.noise = new Noise(Math.random())

    // Init
    this.setSize()
    this.setLines()

    this.bindEvents()
    
    // RAF
    requestAnimationFrame(this.tick.bind(this))
  }

  /**
   * Bind events
   */
  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this))
    
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.addEventListener('touchmove', this.onTouchMove.bind(this))
  }

  /**
   * Resize handler
   */
  onResize() {
    this.setSize()
    this.setLines()
  }

  /**
   * Mouse handler
   */
  onMouseMove(e) {
    this.updateMousePosition(e.pageX, e.pageY)
  }

  /**
   * Touch handler
   */
  onTouchMove(e) {
    e.preventDefault()
    const touch = e.touches[0]
   
    this.updateMousePosition(touch.clientX, touch.clientY)
    this.mouse.vs *= 1.5
  }

  /**
   * Update mouse position
   */
  updateMousePosition(x, y) {
    const { mouse } = this

    mouse.x = x - this.bounding.left
    mouse.y = y - this.bounding.top + window.scrollY

    if (!mouse.set) {
      mouse.sx = mouse.x
      mouse.sy = mouse.y
      mouse.lx = mouse.x
      mouse.ly = mouse.y

      mouse.set = true
    }
  }

  /**
   * Set size
   */
  setSize() {
    this.bounding = this.getBoundingClientRect()

    this.svg.style.width = `${this.bounding.width}px`
    this.svg.style.height = `${this.bounding.height}px`
  }

  /**
   * Set lines
   */
  setLines() {
    const { width, height } = this.bounding
    
    this.lines = []

    this.paths.forEach((path) => {
      path.remove()
    })
    this.paths = []

    const xGap = 10
    const yGap = 32

    const oWidth = width + 200
    const oHeight = height + 30

    const totalLines = Math.ceil(oWidth / xGap)
    const totalPoints = Math.ceil(oHeight / yGap)

    const xStart = (width - xGap * totalLines) / 2
    const yStart = (height - yGap * totalPoints) / 2

    for (let i = 0; i <= totalLines; i++) {
      const points = []

      for (let j = 0; j <= totalPoints; j++) {
        const point = {
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        }

        points.push(point)
      }

      // Create path
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )
      path.classList.add('a__line')
      path.classList.add('js-line')

      this.svg.appendChild(path)
      this.paths.push(path)

      // Add points
      this.lines.push(points)
    }
  }

  /**
   * Move points
   */
  movePoints(time) {
    const { lines, mouse, noise } = this

    lines.forEach((points) => {
      points.forEach((p) => {
        // Wave movement
        const move =
              noise.perlin2(
                (p.x + time * 0.0125) * 0.002,
                (p.y + time * 0.005) * 0.0015
              ) * 12
        p.wave.x = Math.cos(move) * 32
        p.wave.y = Math.sin(move) * 16

        // Mouse effect
        const dx = p.x - mouse.sx
        const dy = p.y - mouse.sy
        const d = Math.hypot(dx, dy)
        const l = Math.max(175, mouse.vs)

        if (d < l) {
          const s = 1 - d / l
          const f = Math.cos(d * 0.001) * s

          p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065
          p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065
        }

        p.cursor.vx += (0 - p.cursor.x) * 0.005 // String tension
        p.cursor.vy += (0 - p.cursor.y) * 0.005

        p.cursor.vx *= 0.925 // Friction/duration
        p.cursor.vy *= 0.925

        p.cursor.x += p.cursor.vx * 2 // Strength
        p.cursor.y += p.cursor.vy * 2

        p.cursor.x = Math.min(100, Math.max(-100, p.cursor.x)) // Clamp movement
        p.cursor.y = Math.min(100, Math.max(-100, p.cursor.y))
      })
    })
  }

  /**
   * Get point coordinates with movement added
   */
  moved(point, withCursorForce = true) {
    const coords = {
      x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    }

    // Round to 2 decimals
    coords.x = Math.round(coords.x * 10) / 10
    coords.y = Math.round(coords.y * 10) / 10

    return coords
  }

  /**
   * Draw lines
   */
  drawLines() {
    const { lines, moved, paths } = this
    
    lines.forEach((points, lIndex) => {
      let p1 = moved(points[0], false)

      let d = `M ${p1.x} ${p1.y}`

      points.forEach((p1, pIndex) => {
        const isLast = pIndex === points.length - 1

        p1 = moved(p1, !isLast)

        const p2 = moved(
          points[pIndex + 1] || points[points.length - 1],
          !isLast
        )

        // d += `Q ${p1.x} ${p1.y} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2} `
        d += `L ${p1.x} ${p1.y}`
      })


      paths[lIndex].setAttribute('d', d)
    })
  }

  /**
   * Tick
   */
  tick(time) {
    const { mouse } = this

    // Smooth mouse movement
    mouse.sx += (mouse.x - mouse.sx) * 0.1
    mouse.sy += (mouse.y - mouse.sy) * 0.1

    // Mouse velocity
    const dx = mouse.x - mouse.lx
    const dy = mouse.y - mouse.ly
    const d = Math.hypot(dx, dy)

    mouse.v = d
    mouse.vs += (d - mouse.vs) * 0.1
    mouse.vs = Math.min(100, mouse.vs)

    // Mouse last position
    mouse.lx = mouse.x
    mouse.ly = mouse.y

    // Mouse angle
    mouse.a = Math.atan2(dy, dx)

    // Animation
    this.style.setProperty('--x', `${mouse.sx}px`)
    this.style.setProperty('--y', `${mouse.sy}px`)

    this.movePoints(time)
    this.drawLines()
    
    requestAnimationFrame(this.tick.bind(this))
  }
}
customElements.define('a-waves', AWaves)


// ========================
// LOADING SCREEN ANIMATION
// Hides loading screen after 2.5s on first visit
// Uses sessionStorage to skip on subsequent navigation
window.addEventListener('load', function(){
  const loadingScreen = document.querySelector('.loading-screen');
  
  if (!loadingScreen) return;
  
  // Check if user has already seen the animation this session
  if (sessionStorage.getItem('loadingShown')) {
      // Skip animation - remove immediately
      loadingScreen.remove();
      return;
  }
  
  // First visit - show animation
  sessionStorage.setItem('loadingShown', 'true');
  
  setTimeout(function(){
      loadingScreen.classList.add('hidden');

      setTimeout(function(){
          loadingScreen.remove();
      }, 500);
  }, 2500);
});


// ==========================
// LIQUID GLASS HEADER EFFECT
// Adds frosted glass effect to header when user scrolls
// USED: All pages, activates at 100px scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.site-header');
    const scrollPosition = window.scrollY;

    //activate glass effect when user scrolls 
    if (scrollPosition > 100) {
        header.classList.add('has-glass');
    } else {
        header.classList.remove('has-glass');
    }
});


// ===============================
// ABOUT SECTION SCROLL ANIMATIONS
// GSAP ScrollTrigger for text fade-in and section pinning
// USED: About section only
gsap.registerPlugin(ScrollTrigger);
// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.querySelector('#about');
    const fadeElements = document.querySelectorAll('#about .fade-in-sentence');
    const aboutLine = document.querySelector('#about .about-line');
    
    if (!aboutSection || !fadeElements.length) return;

    // Create a timeline for the text animations
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#about',
            start: 'top top',      // When top of #about hits top of viewport
            end: '+=100%',         // Stay pinned for 100% of viewport height
            pin: true,             // Pin the section
            scrub: 1,              // Smooth scrubbing (1 second to catch up)
            pinSpacing: true,     
        }
    });

    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#about',
        start: 'top 50%%',   
        end: 'top top',
        scrub: 1,
        pin: false
      }
    });
  
    // Animate each paragraph: fade in, then turn white
    fadeElements.forEach((el, index) => {
        const startTime = index * 0.25; // Stagger start times
        
        // Fade in (opacity + visible color)
        textTl.to(el, {
            opacity: 1,
            color: '#3a3a3a',
            duration: 0.7,
        }, startTime);
        
        // Turn white
        textTl.to(el, {
            color: '#FFFFF7',
            duration: 0.8,
        }, startTime + 0.8);
    });

    // Animate the line at the end
    if (aboutLine) {
        tl.to(aboutLine, {
            width: '100%',
            duration: 1.0,
        }, 0.2); // Start after text animations
    }

    // ============================================
    // PROJECTS SECTION PINNING
    // Pin the Projects section for immersive viewing
    const projectsSection = document.querySelector('#projects');

    if (projectsSection) {
      ScrollTrigger.create({
          trigger: '#projects',
          start: 'top top',
          end: '+=50%',  // Reduced from 100% - shorter pin time
          pin: true,
          scrub: true,
          pinSpacing: true,
      });
    }
});

// ============================================
// CONTACT FORM - MAILTO FUNCTIONALITY
// ============================================
// Collects form data and opens user's email client with pre-filled email
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission
        
        // Get form values
        const firstName = this.querySelector('[name="firstName"]').value;
        const lastName = this.querySelector('[name="lastName"]').value;
        const email = this.querySelector('[name="email"]').value;
        const message = this.querySelector('[name="message"]').value;
        
        // Create email subject
        const subject = encodeURIComponent(`Contact from ${firstName} ${lastName}`);
        
        // Create email body with form data
        const body = encodeURIComponent(
            `Name: ${firstName} ${lastName}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}`
        );
        
        // Create mailto link
        const mailtoLink = `mailto:nedtonks@gmail.com?subject=${subject}&body=${body}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Optional: Show success message
        alert('Opening your email client...');
    });
}
