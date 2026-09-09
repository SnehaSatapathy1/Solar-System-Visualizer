# Solar System Visualizer

An interactive 3D solar system visualization built with **Three.js, JavaScript, HTML, and CSS**.

What started as a small experiment with Codex gradually evolved into a date-driven, heliocentric simulation with interactive planets and moons, camera controls, multiple visualization scales, and locally calculated orbital positions.

> **This project is still a work in progress.** The goal is not to be a professional-grade astronomical ephemeris, but to create an interactive visualization that is both engaging and scientifically meaningful where practical.

---

## Live Demo

**[Explore the Solar System Visualizer →] (https://snehasatapathy1.github.io/Solar-System-Visualizer/)**

---

## What Can You Do?

* Explore the Sun, planets, and major moons in an interactive 3D environment
* Select planets and moons to view information about them
* Focus and follow individual celestial bodies
* Move freely around the scene using the camera controls
* Change the simulation date
* Accelerate or pause the passage of time
* Toggle orbital paths, labels, and motion trails
* Switch between conventional and realistic **size scales**
* Switch between conventional and realistic **distance scales**
* Explore contextual moon labels and moon selection
* View procedural planetary textures
* Observe planetary atmospheres and Saturn's rings
* Use the interface across different screen sizes

---

## How It Works

The project uses **Three.js** for the 3D scene and a local JavaScript astronomy layer for calculating date-dependent planetary positions.

The astronomy model includes:

* Julian-date calculations
* Date-dependent orbital elements
* Kepler's equation
* Heliocentric planetary coordinates
* A more detailed date-based model for Earth's Moon

The calculations are performed locally in the browser rather than depending on live astronomical APIs for every position update.

### Important Note on Accuracy

The project uses an analytical model designed for visualization rather than high-precision professional astronomy.

Planetary positions received the largest accuracy upgrade, while Earth's Moon has a more meaningful date-based model. Other major moons continue to use simplified orbital representations.

Some deeper physical phenomena, including advanced eclipse/shadow calculations, are intentionally left for future development.

---

## Architecture

The current implementation is organized around a small set of JavaScript modules:

```text
index.html
    │
    ├── planets.js
    │       └── Celestial-body data
    │
    ├── astronomy.js
    │       └── Date & orbital calculations
    │
    ├── scene.js
    │       └── Three.js scene & rendering
    │
    ├── ui.js
    │       └── Interface & user interaction
    │
    └── main.js
            └── Application state & animation loop
```

The architecture evolved during development rather than being completely fixed beforehand.

For example, adding moons eventually required moving from a planet-specific selection model toward a more general **celestial-body** model. Camera behavior also grew from simple focus controls into a stateful system supporting following, smoothing, manual override, and dynamic constraints.

---

## Development Journey

This project did **not** follow a perfectly linear development process.

It started as a simple interactive solar-system experiment and gradually changed as new problems, ideas, and requirements appeared during implementation.

Some of the major transitions were:

```text
Interactive Solar System
          ↓
Three.js Prototype
          ↓
Interactive UI
          ↓
Camera Focus
          ↓
Moon Support
          ↓
Accuracy Question
          ↓
Date-Driven Astronomy Model
          ↓
Earth–Moon Improvement
          ↓
Independent Size & Distance Scales
          ↓
Refined Camera System
          ↓
General Celestial-Body Model
          ↓
Current Project
```

Along the way, the project encountered issues involving coordinate scaling, animation state, camera behavior, selection state, moon usability, UI responsiveness, and astronomical accuracy.

Instead of hiding those iterations, I documented them.

### Read the Full Development History

**[→ Actual Build Workflow](docs/Solar_System_Visualizer_Build_Workflow.docx)**

The development history documents:

* What was originally planned
* What was actually implemented
* Bugs and mistakes encountered during development
* How those problems were fixed
* Changes in architecture
* Major changes in project direction
* Features that were added later
* Features that were deliberately deferred
* The difference between the planned workflow and the actual workflow

---

## Tech Stack

| Technology       | Purpose                          |
| ---------------- | -------------------------------- |
| **JavaScript**   | Application logic and simulation |
| **Three.js**     | 3D rendering                     |
| **HTML**         | Application structure            |
| **CSS**          | Interface and responsive layout  |
| **Canvas API**   | Procedural planetary textures    |
| **GitHub Pages** | Deployment                       |

---

## Running Locally

This is a plain HTML/CSS/JavaScript project, so there is no complex build process.

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Open the project in a local development server and load:

```text
index.html
```

Because the project uses browser-based modules/CDN resources, running it through a local server is preferable to opening the HTML file directly.

---

## Project Status

**Current status: Active / Work in Progress**

The core visualization and interaction systems are functional, but there are still areas that could be expanded.

Possible future directions include:

* Higher-precision astronomical calculations
* More detailed moon models
* More advanced eclipse and shadow calculations
* Additional celestial objects
* Improved astronomical data
* Further rendering and performance improvements
* Additional visualization modes

---

## Why I Built This

This wasn't originally intended to become a serious astronomy project.

It started with curiosity:

**How far could I take this?**

That question kept changing as the project developed.

At one point, I realized that I had encountered something similar almost a decade earlier, when I was introduced to an astronomy application that could show the positions of planets and moons.

That memory became part of the reason I wanted to push this project beyond simply making planets move around a screen.

The result is still imperfect—but that's also what makes the development interesting.

It is a record of how a small experiment gradually became a much larger technical project.

---

## Credits & References

Built as an independent project using:

* [Three.js](https://threejs.org/)
* JavaScript
* HTML & CSS

---

## Author

**Sneha Satapathy**

Engineering student exploring software development, creative coding, and projects that sit somewhere between technology and curiosity.

[GitHub](https://github.com/SnehaSatapathy1) · [LinkedIn](www.linkedin.com/in/sneha-satapathy-ss)
