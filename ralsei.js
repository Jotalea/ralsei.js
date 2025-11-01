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

    let ralseiFile = 'data:image/png;base64,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'
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
