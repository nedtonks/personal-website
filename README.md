# Personal Portfolio Website

A fully responsive personal portfolio website showcasing projects, design work, and front-end development skills. Built with custom animations and modern web design principles.

## Live Demo

**Website:** https://nedtonks.com  

## Features

- Fully responsive layout using `clamp()`
- Liquid glass header effect on scroll
- Interactive wave animation background
- GSAP scroll-triggered animations
- Horizontal project carousel
- Custom loading screen with session storage
- Pinned scroll sections

## Tech Stack

- **HTML, CSS, JavaScript**
- **GSAP 3.12.2**
  - ScrollTrigger
  - ScrollToPlugin
- **Fonts**
  - IBM Plex Mono

## Setup & Local Development

Clone the repository and run locally:

```bash
git clone https://github.com/nedtonks/personal-website.git
cd personal-website/PersonalWebsite
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

> Note: A local server is required for animations and asset loading to work correctly.

## Project Structure

```text
personal-website/
├── index.html                  # Main landing page (GitHub Pages entry point)
├── README.md                   # Repo documentation (ignored by Pages)
├── css/
    └── style.css               # Global styles & responsive design
├── js/
    └── main.js                 # Animations, scroll effects, interactions
├── assets/
    ├── icon.png                # Icons & images
    ├── NT-Animation.svg        # Loading / hero animation
    └── ...                     # Other media assets
├── projects/
    ├── personal-website.html   # Project detail pages
    ├── stock-portfolio-app.html
    └── wip.html
```

## Color Palette

- **Carbon Black:** `#1D1D1B`
- **Porcelain:** `#FFFFF7`
- **Soft Linen:** `#E7E7DD`

## Accessibility & Performance

- Semantic HTML structure
- Scalable typography for improved readability
- Optimised animations using GSAP timelines
- Assets loaded efficiently to minimise layout shift

## Credits

- Wave animation inspired by **wodniack** (CodePen)
- Loading animation created with **SVGator**
- Animation library: **GSAP**

## Author

**Ned Tonks**  
https://nedtonks.com  
ned.tonks@gmail.com

## License

This project is for personal and portfolio use.  
All rights reserved unless otherwise stated.