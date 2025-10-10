(function ralsei() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  const ralseiEl = document.createElement("div");
  ralseiEl.style.transformOrigin = "center center"; // scale from center
  ralseiEl.style.transform = "scale(2)"; // 2x bigger

  let ralseiPosX = 32;
  let ralseiPosY = 64;

  let mousePosX = 32;
  let mousePosY = 128;
  let lastMousePosX = 0;
  let lastMousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let isBlushing = false;
  let blushEndTime = 0;

  const ralseiSpeed = 10;
  const gridSize = 1; // Grid size for movement
  const animationSpeed = 1; // Higher = slower animation
  const reactionDistance = 64; // Distance at which Ralsei starts following
  const pathRecalcDistance = 32; // Recalculate path if mouse moves this far from target

  // Movement state
  let currentDirection = "front";
  let isMoving = false;
  let targetX = ralseiPosX;
  let targetY = ralseiPosY;
  let movePath = [];
  let currentPathIndex = 0;

  // Ralsei sprite configurations
  const spriteSets = {
    init: [
      { x: 5, y: 5, w: 28, h: 44 },
      { x: 38, y: 5, w: 28, h: 44 },
      { x: 71, y: 5, w: 28, h: 44 },
      { x: 104, y: 5, w: 28, h: 44 },
      { x: 137, y: 5, w: 28, h: 44 },
      { x: 170, y: 5, w: 28, h: 44 },
      { x: 203, y: 5, w: 28, h: 44 },
      { x: 236, y: 5, w: 28, h: 44 }
    ],
    front: {
      idle: { x: 5, y: 54, w: 23, h: 44 },
      walk: [
        { x: 5, y: 54, w: 23, h: 44 },
        { x: 33, y: 54, w: 23, h: 44 },
        { x: 61, y: 54, w: 23, h: 44 },
        { x: 89, y: 54, w: 23, h: 44 }
      ]
    },
    left: {
      idle: { x: 5, y: 103, w: 23, h: 44 },
      walk: [
        { x: 5, y: 103, w: 23, h: 44 },
        { x: 33, y: 103, w: 23, h: 44 },
        { x: 61, y: 103, w: 23, h: 44 },
        { x: 89, y: 103, w: 23, h: 44 }
      ]
    },
    right: {
      idle: { x: 5, y: 152, w: 23, h: 44 },
      walk: [
        { x: 5, y: 152, w: 23, h: 44 },
        { x: 33, y: 152, w: 23, h: 44 },
        { x: 61, y: 152, w: 23, h: 44 },
        { x: 89, y: 152, w: 23, h: 44 }
      ]
    },
    back: {
      idle: { x: 5, y: 201, w: 23, h: 44 },
      walk: [
        { x: 5, y: 201, w: 23, h: 44 },
        { x: 33, y: 201, w: 23, h: 44 },
        { x: 61, y: 201, w: 23, h: 44 },
        { x: 89, y: 201, w: 23, h: 44 }
      ]
    },
    shy_front: {
      idle: { x: 122, y: 54, w: 23, h: 44 },
      walk: [
        { x: 122, y: 54, w: 23, h: 44 },
        { x: 150, y: 54, w: 23, h: 44 },
        { x: 178, y: 54, w: 23, h: 44 },
        { x: 206, y: 54, w: 23, h: 44 }
      ]
    },
    shy_left: {
      idle: { x: 122, y: 103, w: 23, h: 44 },
      walk: [
        { x: 122, y: 103, w: 23, h: 44 },
        { x: 150, y: 103, w: 23, h: 44 },
        { x: 178, y: 103, w: 23, h: 44 },
        { x: 206, y: 103, w: 23, h: 44 }
      ]
    },
    shy_right: {
      idle: { x: 122, y: 152, w: 23, h: 44 },
      walk: [
        { x: 122, y: 152, w: 23, h: 44 },
        { x: 150, y: 152, w: 23, h: 44 },
        { x: 178, y: 152, w: 23, h: 44 },
        { x: 206, y: 152, w: 23, h: 44 }
      ]
    },
    shy_back: {
      idle: { x: 5, y: 201, w: 23, h: 44 },
      walk: [
        { x: 5, y: 201, w: 23, h: 44 },
        { x: 33, y: 201, w: 23, h: 44 },
        { x: 61, y: 201, w: 23, h: 44 },
        { x: 89, y: 201, w: 23, h: 44 }
      ]
    }
  };

  let initPhase = 0;

  function init() {
    ralseiEl.id = "ralsei";
    ralseiEl.ariaHidden = true;
    ralseiEl.style.width = "32px";
    ralseiEl.style.height = "32px";
    ralseiEl.style.position = "fixed";
    ralseiEl.style.pointerEvents = "auto";
    ralseiEl.style.imageRendering = "pixelated";
    ralseiEl.style.left = `${ralseiPosX - 16}px`;
    ralseiEl.style.top = `${ralseiPosY - 16}px`;
    ralseiEl.style.zIndex = 2147483647;
    ralseiEl.style.cursor = "pointer";

    let ralseiFile = "./ralsei.png"
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      ralseiFile = curScript.dataset.cat
    }
    ralseiEl.style.backgroundImage = `url(${ralseiFile})`;

    document.body.appendChild(ralseiEl);

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX + 32;
      mousePosY = event.clientY + 32;
    });

    ralseiEl.addEventListener("click", function () {
      isBlushing = true;
      blushEndTime = Date.now() + 8000; // 8 seconds
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    if (!ralseiEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp
      frame()
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(sprite) {
    ralseiEl.style.backgroundPosition = `-${sprite.x}px -${sprite.y}px`;
    ralseiEl.style.width = `${sprite.w}px`;
    ralseiEl.style.height = `${sprite.h}px`;
    // Adjust position to center the sprite
    ralseiEl.style.left = `${ralseiPosX - sprite.w / 2}px`;
    ralseiEl.style.top = `${ralseiPosY - sprite.h / 2}px`;
  }

  function calculatePath() {
    const path = [];
    let currentX = Math.round(ralseiPosX / gridSize) * gridSize;
    let currentY = Math.round(ralseiPosY / gridSize) * gridSize;

    targetX = Math.round(mousePosX / gridSize) * gridSize;
    targetY = Math.round(mousePosY / gridSize) * gridSize;

    const diffX = targetX - currentX;
    const diffY = targetY - currentY;

    // Move horizontally first, then vertically (like in RPG games)
    if (Math.abs(diffX) > gridSize) {
      const stepsX = Math.abs(diffX) / gridSize;
      const directionX = diffX > 0 ? 1 : -1;

      for (let i = 0; i < stepsX; i++) {
        currentX += gridSize * directionX;
        path.push({ x: currentX, y: currentY });
      }
    }

    if (Math.abs(diffY) > gridSize) {
      const stepsY = Math.abs(diffY) / gridSize;
      const directionY = diffY > 0 ? 1 : -1;

      for (let i = 0; i < stepsY; i++) {
        currentY += gridSize * directionY;
        path.push({ x: currentX, y: currentY });
      }
    }

    return path;
  }

  function shouldRecalculatePath() {
    // Always recalculate if no path exists
    if (movePath.length === 0) return true;

    // Check if mouse has moved significantly from the original target
    const mouseDiffX = mousePosX - targetX;
    const mouseDiffY = mousePosY - targetY;
    const mouseDistance = Math.sqrt(mouseDiffX ** 2 + mouseDiffY ** 2);

    return mouseDistance > pathRecalcDistance;
  }

  function idle() {
    // Check if blush timer expired
    if (isBlushing && Date.now() > blushEndTime) {
      isBlushing = false;
    }

    // Turn to front after ~1.5 seconds of idling
    if (idleTime > 15 && !isBlushing) {
      currentDirection = "front";
    }

    // Use idle sprite for current direction
    const state = isBlushing ? "shy_" + currentDirection : currentDirection;
    setSprite(spriteSets[state].idle);
  }

  function frame() {
    frameCount++;

    // handle initial animation
    if (initPhase < 8) {
      setSprite(spriteSets.init[initPhase]);
      initPhase++;
      return;
    }

    // blush timer
    if (isBlushing && Date.now() > blushEndTime) isBlushing = false;

    // compute distance to mouse
    const diffX = mousePosX - ralseiPosX;
    const diffY = mousePosY - ralseiPosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // move smoothly toward mouse if far enough
    if (distance > 1) { // threshold so it doesn't jitter
      const step = Math.min(ralseiSpeed, distance); // cap step to remaining distance
      ralseiPosX += (diffX / distance) * step;
      ralseiPosY += (diffY / distance) * step;

      // walking animation
      const state = isBlushing ? "shy_" + currentDirection : currentDirection;

      // pick direction
      if (Math.abs(diffX) > Math.abs(diffY)) currentDirection = diffX > 0 ? "right" : "left";
      else currentDirection = diffY > 0 ? "front" : "back";

      const walkFrame = Math.floor(frameCount / animationSpeed) % spriteSets[state].walk.length;
      setSprite(spriteSets[state].walk[walkFrame]);

      idleTime = 0;
    } else {
      // idle
      isMoving = false;
      idleTime++;
      idle();
    }

    // boundaries
    ralseiPosX = Math.min(Math.max(16, ralseiPosX), window.innerWidth - 16);
    ralseiPosY = Math.min(Math.max(16, ralseiPosY), window.innerHeight - 16);
  }
  /*
    function frame() {
      frameCount += 1;
      const diffX = ralseiPosX - mousePosX;
      const diffY = ralseiPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);
  
      // Handle initial animation
      if (initPhase < 8) {
        setSprite(spriteSets.init[initPhase]);
        initPhase++;
        return;
      }
  
      // Check if blush timer expired
      if (isBlushing && Date.now() > blushEndTime) {
        isBlushing = false;
      }
  
      // Calculate new path if needed (mouse moved far enough or no path exists)
      if (shouldRecalculatePath() && distance > reactionDistance) {
        movePath = calculatePath();
        currentPathIndex = 0;
        lastMousePosX = mousePosX;
        lastMousePosY = mousePosY;
      }
  
      // Move along path
      if (movePath.length > 0 && currentPathIndex < movePath.length) {
        isMoving = true;
        const target = movePath[currentPathIndex];
        const pathDiffX = target.x - ralseiPosX;
        const pathDiffY = target.y - ralseiPosY;
        const pathDistance = Math.sqrt(pathDiffX ** 2 + pathDiffY ** 2);
  
        // Determine direction
        if (Math.abs(pathDiffX) > Math.abs(pathDiffY)) {
          currentDirection = pathDiffX > 0 ? "right" : "left";
        } else {
          currentDirection = pathDiffY > 0 ? "front" : "back";
        }
  
        // Move towards target
        if (pathDistance > ralseiSpeed) {
          ralseiPosX += (pathDiffX / pathDistance) * ralseiSpeed;
          ralseiPosY += (pathDiffY / pathDistance) * ralseiSpeed;
          
          // Set walking animation
          const state = isBlushing ? "shy_" + currentDirection : currentDirection;
          const walkFrame = Math.floor(frameCount / animationSpeed) % spriteSets[state].walk.length;
          setSprite(spriteSets[state].walk[walkFrame]);
        } else {
          // Reached this path point, move to next
          currentPathIndex++;
          if (currentPathIndex >= movePath.length) {
            movePath = [];
            isMoving = false;
            idleTime = 0;
          }
        }
      } else {
        // Not moving
        isMoving = false;
        idleTime += 1;
        idle();
      }
  
      // Boundary checking
      ralseiPosX = Math.min(Math.max(16, ralseiPosX), window.innerWidth - 16);
      ralseiPosY = Math.min(Math.max(16, ralseiPosY), window.innerHeight - 16);
    }
  */
  init();
})();
