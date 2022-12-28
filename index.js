(function () {

  const containerDom = document.querySelector('#container');
  const ballDom = document.querySelector('#ball');

  const maxLeft = containerDom.clientWidth - ballDom.offsetWidth;
  const maxTop = containerDom.clientHeight - ballDom.offsetHeight;
  const moveSpeed = ((maxLeft * maxLeft + maxTop * maxTop) ** 0.5) / 2;
  const initDest = { x: 0, y: 0 };

  var brickDomList;
  var moveDisplacement = { x: 0, y: 0 };

  function init() {
    refreshBrickList();
    moveToNextDest(initDest);
    window.requestAnimationFrame(handler);
  }

  function handler(timestamp) {
    const wallHitDirection = getWallHitDirection();
    if (wallHitDirection) {
      changeMovingDirection(wallHitDirection);
    } else {
      const brickCollideDirection = getBrickCollideDirection();
      if (brickCollideDirection) {
        changeMovingDirection(brickCollideDirection);
      }
    }
    window.requestAnimationFrame(handler);
  }

  function getWallHitDirection() {
    const hitWallX = ballDom.offsetLeft === 0 || ballDom.offsetLeft === maxLeft;
    const hitWallY = ballDom.offsetTop === 0 || ballDom.offsetTop === maxTop;
    if (hitWallX) {
      if (hitWallY) {
        return { x: true, y: true };
      }
      return { x: true, y: false };
    } else if (hitWallY) {
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

  function refreshBrickList() {
    brickDomList = Array.from(document.querySelectorAll('[data-collider]'));
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
    const cloneElement = element.cloneNode(true);

    element.removeAttribute('data-collider');
    element.style.visibility = 'hidden';
    refreshBrickList();

    const brickRect = element.getBoundingClientRect();
    const containerRect = containerDom.getBoundingClientRect();
    const cloneLeft = brickRect.left - containerRect.left;
    const cloneTop = brickRect.top - containerRect.top;
    cloneElement.removeAttribute('data-collider');
    cloneElement.style.position = 'absolute';
    cloneElement.style.left = `${cloneLeft}px`;
    cloneElement.style.top = `${cloneTop}px`;
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

  setTimeout(init, 1000);
})();
