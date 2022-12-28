(function () {
  const startButton = document.querySelector('#start-btn');
  const containerDom = document.querySelector('#container');
  const ballDom = document.querySelector('#ball');
  const paddleDom = document.querySelector('#paddle');
  const brickCountDom = document.querySelector('#brick-count');
  const containerRect = containerDom.getBoundingClientRect();
  const containerBorderWidth = parseInt(getComputedStyle(containerDom).getPropertyValue('border-width'));


  const maxLeft = containerDom.clientWidth - ballDom.offsetWidth;
  const maxTop = containerDom.clientHeight - ballDom.offsetHeight;
  const moveSpeed = ((maxLeft * maxLeft + maxTop * maxTop) ** 0.5) / 2;

  var brickDomList;
  var moveDisplacement = { x: 0, y: 0 };

  function init() {
    document.addEventListener('mousemove', paddleHandler);
    startButton.addEventListener('click', startGame);
  }

  function startGame() {
    startButton.disabled = true;
    refreshBrickList();
    const initDest = refreshBall();
    moveToNextDest(initDest);
    window.requestAnimationFrame(frameHandler);
  }

  function endGame() {
    clearBall();
    startButton.disabled = false;
  }

  function refreshBrickList() {
    brickDomList = Array.from(document.querySelectorAll('[data-collider]'));
    brickCountDom.innerHTML = document.querySelectorAll('[data-collider="brick"]').length;
  }

  function refreshBall() {
    ballDom.style.display = '';
    ballDom.style.left = `${paddleDom.offsetLeft + paddleDom.offsetWidth / 2}px`;
    ballDom.style.top = 'calc(100% - 30px)';

    const destX = Math.random() > 0.5 ? 0 : maxLeft;
    const destY = Math.random() * maxTop / 2;
    return { x: destX, y: destY };
  }

  function clearBall() {
    ballDom.style.display = 'none';
    ballDom.style.top = '';
    ballDom.style.left = '';
    ballDom.style.transition = '';
  }

  function frameHandler(_timestamp) {
    if (isBallHitGroundGround()) {
      endGame();
      return;
    }
    ballHandler();
    window.requestAnimationFrame(frameHandler);
  }

  function paddleHandler(mouseEvt) {
    const mouseX = clamp(
      mouseEvt.clientX - containerRect.left - containerBorderWidth,
      0,
      maxLeft - paddleDom.offsetWidth + containerBorderWidth
    );
    paddleDom.style.left = `${mouseX}px`;
  }

  function ballHandler() {
    const paddleHitDirection = getPaddleHitDirection();
    if (paddleHitDirection) {
      changeMovingDirection(paddleHitDirection);
      return;
    }
    const wallHitDirection = getWallHitDirection();
    if (wallHitDirection) {
      changeMovingDirection(wallHitDirection);
      return;
    }
    const brickCollideDirection = getBrickCollideDirection();
    if (brickCollideDirection) {
      changeMovingDirection(brickCollideDirection);
      return;
    }
  }

  function getPaddleHitDirection() {
    const ballRect = ballDom.getBoundingClientRect();
    const paddleRect = paddleDom.getBoundingClientRect();
    if (hasRectCollision(ballRect, paddleRect)) {
      return { x: false, y: true };
    }
    return null;
  }


  function isBallHitGroundGround() {
    if (ballDom.offsetTop === maxTop) {
      return true;
    }
  }

  function getWallHitDirection() {
    const hitWallLeft = ballDom.offsetLeft === 0;
    const hitWallRight = ballDom.offsetLeft === maxLeft;
    const hitWallTop = ballDom.offsetTop === 0;

    if (hitWallLeft || hitWallRight) {
      if (hitWallTop) {
        return { x: true, y: true };
      }
      return { x: true, y: false };
    } else if (hitWallTop) {
      return { x: false, y: true };
    }
    return null;
  }

  function getBrickCollideDirection() {
    const ballRect = ballDom.getBoundingClientRect();

    for (let i = 0; i < brickDomList.length; i++) {
      const element = brickDomList[i];
      const brickRect = element.getBoundingClientRect();
      if (hasRectCollision(ballRect, brickRect)) {
        const collision = getRectCollisionSide(ballRect, brickRect);

        if (collision.left || collision.right) {
          removeBrick(element);
          return { x: true, y: false };
        } else if (collision.top || collision.bottom) {
          removeBrick(element);
          return { x: false, y: true };
        } else {
          console.error('brick wrong collision data', collision, element);
        }
      }
    }
    return null;
  }

  function changeMovingDirection(boundedDirection) {
    const cntPos = getCntPosition();
    const nextDest = getNextDest(cntPos, boundedDirection);
    moveToNextDest(nextDest);
  }

  function moveToNextDest(nextDest) {
    const cntPos = getCntPosition();
    moveDisplacement = getMoveDisplacement(cntPos, nextDest);

    const moveTime = getMoveTime(moveDisplacement);
    updateBallStyle(nextDest.x, nextDest.y, moveTime);
  }

  function getCntPosition() {
    return { x: ballDom.offsetLeft, y: ballDom.offsetTop };
  }

  function getNextDest(cntPos, boundedDirection) {
    const moveVector = getBoundedVector(moveDisplacement, boundedDirection);
    let priorX;
    let priorY;

    if (moveVector.x > 0) {
      priorX = (maxLeft - cntPos.x) / moveVector.x;
    } else {
      priorX = cntPos.x / -moveVector.x;
    }

    if (moveVector.y > 0) {
      priorY = (maxTop - cntPos.y) / moveVector.y;
    } else {
      priorY = cntPos.y / -moveVector.y;
    }

    const directionWeight = Math.min(priorX, priorY);
    return {
      x: cntPos.x + moveVector.x * directionWeight,
      y: cntPos.y + moveVector.y * directionWeight,
    };
  }

  function getBoundedVector(prevMoveDisplacement, boundedDirection) {
    if (boundedDirection.x && boundedDirection.y) {
      return { x: -prevMoveDisplacement.x, y: -prevMoveDisplacement.y };
    } else if (boundedDirection.x) {
      return { x: -prevMoveDisplacement.x, y: prevMoveDisplacement.y };
    } else if (boundedDirection.y) {
      return { x: prevMoveDisplacement.x, y: -prevMoveDisplacement.y };
    } else {
      console.error('not bounded');
    }
  }

  function getMoveDisplacement(cntPos, nextDest) {
    return {
      x: nextDest.x - cntPos.x,
      y: nextDest.y - cntPos.y,
    };
  }

  function getMoveTime(moveDisplacement) {
    const displacement = Math.sqrt(moveDisplacement.x * moveDisplacement.x + moveDisplacement.y * moveDisplacement.y);
    return displacement / moveSpeed;
  }

  function updateBallStyle(x, y, moveTime) {
    ballDom.style.transitionDuration = `${moveTime}s`;
    ballDom.style.left = `${x}px`;
    ballDom.style.top = `${y}px`;
  }

  function hasRectCollision(rect1, rect2) {
    return rect1.left < rect2.right &&
      rect1.right > rect2.left &&
      rect1.top < rect2.bottom &&
      rect1.bottom > rect2.top;
  }

  function getRectCollisionSide(rect1, rect2) {
    return {
      left: rect1.right > rect2.left && rect1.left < rect2.left,
      right: rect1.left < rect2.right && rect1.right > rect2.right,
      top: rect1.bottom > rect2.top && rect1.top < rect2.top,
      bottom: rect1.top < rect2.bottom && rect1.bottom > rect2.bottom
    };
  }

  function removeBrick(element) {
    if (element.dataset.collider === 'obstacle') {
      return;
    }

    const cloneElement = element.cloneNode(true);

    element.removeAttribute('data-collider');
    element.style.visibility = 'hidden';
    refreshBrickList();

    const brickRect = element.getBoundingClientRect();
    const cloneLeft = brickRect.left - containerRect.left - containerBorderWidth;
    const cloneTop = brickRect.top - containerRect.top;
    cloneElement.removeAttribute('data-collider');
    cloneElement.style.position = 'absolute';
    cloneElement.style.left = `${cloneLeft}px`;
    cloneElement.style.top = `${cloneTop}px`;
    cloneElement.style.width = `${brickRect.width}px`;
    cloneElement.style.height = `${brickRect.height}px`;
    cloneElement.style.transition = 'top 0.5s, left 0.5s';

    containerDom.appendChild(cloneElement);
    setTimeout(() => {
      cloneElement.style.transition = 'top 0.2s cubic-bezier(0, .5, .5, 1)';
      cloneElement.style.top = `${cloneTop - 50}px`;
    }, 0);

    setTimeout(() => {
      cloneElement.style.transition = 'top 1s cubic-bezier(.5, 0, 1, .5)';
      cloneElement.style.top = `${maxTop + 200}px`;
    }, 300);

    setTimeout(() => {
      cloneElement.remove();
    }, 1300);
  }

  init();
})();
