gsap.registerPlugin(ScrollTrigger);

// Get the main canvas
const mainCanvas = document.getElementById('main-canvas');
const context = mainCanvas.getContext('2d');

// Set canvas dimensions to match the viewport
const setCanvasSize = () => {
  mainCanvas.width = window.innerWidth;
  mainCanvas.height = window.innerHeight;
};
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Store all animation data
const animations = [];

// Process each section
document.querySelectorAll('.animation-section').forEach(section => {
  // Get folder name and frame count from data attributes
  const folder = section.dataset.folder;
  const frameCount = Number(section.dataset.framecount);
  
  // Create animation data object
  const animation = {
    folder,
    frameCount,
    currentFrame: 0,
    images: [],
    loaded: false,
    isActive: false
  };
  
  // Function to generate the URL for a given frame index
  const currentFrame = index => `./images/${folder}/${String(index + 1).padStart(4, '0')}.png`;
  
  // Preload images
  let loadedCount = 0;
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => {
      loadedCount++;
      if (loadedCount === frameCount) {
        animation.loaded = true;
        // If this is the first animation, render it immediately
        if (animations.length === 1) {
          render();
        }
      }
    };
    animation.images.push(img);
  }
  
  // Add to animations array
  animations.push(animation);
  
  // Create a ScrollTrigger for this section
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onEnter: () => {
      // Deactivate all animations
      animations.forEach(a => a.isActive = false);
      // Activate this animation
      animation.isActive = true;
    },
    onEnterBack: () => {
      // Deactivate all animations
      animations.forEach(a => a.isActive = false);
      // Activate this animation
      animation.isActive = true;
    },
    onLeave: () => {
      // Keep the last frame visible until the next section is entered
      if (animation.isActive) {
        animation.currentFrame = frameCount - 1;
      }
    },
    onLeaveBack: () => {
      // Keep the first frame visible until the previous section is entered
      if (animation.isActive) {
        animation.currentFrame = 0;
      }
    }
  });
  
  // Create a separate ScrollTrigger for the frame animation
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onUpdate: (self) => {
      if (animation.isActive && animation.loaded) {
        // Calculate frame based on progress
        animation.currentFrame = Math.floor(self.progress * (frameCount - 1));
        render();
      }
    }
  });
});

// Render function to draw the current active animation
function render() {
  // Clear the canvas
  context.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  
  // Find the active animation
  const activeAnimation = animations.find(a => a.isActive);
  
  if (activeAnimation && activeAnimation.loaded) {
    const frameIndex = activeAnimation.currentFrame;
    const image = activeAnimation.images[frameIndex];
    
    if (image && image.complete && image.naturalWidth) {
      // Calculate scale to cover canvas while preserving aspect ratio
      const scale = Math.max(mainCanvas.width / image.naturalWidth, mainCanvas.height / image.naturalHeight);
      const x = (mainCanvas.width - image.naturalWidth * scale) / 2;
      const y = (mainCanvas.height - image.naturalHeight * scale) / 2;
      
      // Draw the image
      context.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
    }
  }
}