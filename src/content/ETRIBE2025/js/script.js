gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.animation-section').forEach(section => {
  const canvas = section.querySelector('.bg-canvas');
  const context = canvas.getContext('2d');

  // Get folder name and frame count from data attributes
  const folder = section.dataset.folder; // e.g., "Section_04"
  const frameCount = Number(section.dataset.framecount); // e.g., 200

  const imageSequence = { frame: 0 };
  const images = [];

  // Function to generate the URL for a given frame index
  const currentFrame = index => `./images/${folder}/${String(index + 1).padStart(4, '0')}.png`;

  // Preload images
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  // Define render as an arrow function (now available before setCanvasSize is called)
  const render = () => {
    const frameIndex = Math.floor(imageSequence.frame);
    const image = images[frameIndex];
    // Ensure image is loaded before rendering
    if (!image || !image.complete || !image.naturalWidth) return;
    // Calculate scale to cover canvas while preserving aspect ratio
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const x = (canvas.width - image.naturalWidth * scale) / 2;
    const y = (canvas.height - image.naturalHeight * scale) / 2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
  };

  // Set canvas dimensions to match the viewport, now that render is defined
  const setCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render(); // re-render on resize
  };
  setCanvasSize();
  window.addEventListener('resize', setCanvasSize);

  // Assign the onload handler for the first image (after render is defined)
  if (images[0]) {
    images[0].onload = render;
  } else {
    console.warn("No images loaded for section:", folder);
  }

  // Create a ScrollTrigger to drive the background image sequence animation.
  // This animation will update 'imageSequence.frame' as you scroll, and pin the section while it plays.
  gsap.to(imageSequence, {
    frame: frameCount - 1,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      // "top" means the top of the section triggers the start.
      // "+=2000" means the animation spans an additional 2000 pixels of scroll.
      start: "top",
      end: "+=2000",
      scrub: true,
      pin: true, // Pin the section while its animation plays.
      markers: true, // Debug markers – disable if not needed.
    },
    onUpdate: render
  });
});