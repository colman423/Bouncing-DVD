(function () {

  var containerDom = document.querySelector('#container');
  var dvdDom = document.querySelector('#dvd');

  var maxLeft = containerDom.clientWidth - dvdDom.offsetWidth;
  var maxTop = containerDom.clientHeight - dvdDom.offsetHeight;
  var moveSpeed = ((maxLeft * maxLeft + maxTop * maxTop) ** 0.5) / 2;

  var nextDest = {};
  var moveVector = { x: 0, y: 0 };
  var transitionedEventCount = 0;

  function init() {
    moveToNextDest(true);

    dvdDom.addEventListener('transitionend', (event) => {
      transitionedEventCount += 1;
      if (transitionedEventCount === 2) {
        // NOTE: wait for transitionedEvents for x & y direction, although they must triggered at the same time
        transitionedEventCount = 0;
        moveToNextDest();
      }
    });
  }

  function moveToNextDest(isInit) {
    if (isInit) {
      const cntDest = { x: dvdDom.offsetLeft, y: dvdDom.offsetTop };
      nextDest = { x: maxLeft, y: maxTop / 2 };
      moveVector = getMoveVector(cntDest, nextDest);
    } else {
      const cntDest = nextDest;
      const boundedVector = getBoundedVector(moveVector);
      nextDest = getNextDest(cntDest, boundedVector);
      moveVector = getMoveVector(cntDest, nextDest);
    }

    const moveTime = getMoveTime(moveVector);
    updateDvdStyle(nextDest.x, nextDest.y, moveTime);
  }


  function getBoundedVector(prevMoveVector) {
    const isBoundedX = dvdDom.offsetLeft === 0 || dvdDom.offsetLeft === maxLeft;
    const isBoundedY = dvdDom.offsetTop === 0 || dvdDom.offsetTop === maxTop;

    if (isBoundedX && isBoundedY) {
      return { x: -prevMoveVector.x, y: -prevMoveVector.y };
    } else if (isBoundedX) {
      return { x: -prevMoveVector.x, y: prevMoveVector.y };
    } else if (isBoundedY) {
      return { x: prevMoveVector.x, y: -prevMoveVector.y };
    } else {
      console.error('not bounded');
    }
  }

  function getNextDest(cntDest, moveDirection) {
    let priorX;
    let priorY;
    if (moveDirection.x > 0) {
      priorX = (maxLeft - cntDest.x) / moveDirection.x;
    } else {
      priorX = cntDest.x / -moveDirection.x;
    }

    if (moveDirection.y > 0) {
      priorY = (maxTop - cntDest.y) / moveDirection.y;
    } else {
      priorY = cntDest.y / -moveDirection.y;
    }

    const directionWeight = Math.min(priorX, priorY);
    return {
      x: cntDest.x + moveDirection.x * directionWeight,
      y: cntDest.y + moveDirection.y * directionWeight,
    };
  }

  function getMoveVector(cntDest, nextDest) {
    return {
      x: nextDest.x - cntDest.x,
      y: nextDest.y - cntDest.y,
    };
  }

  function getMoveTime(moveVector) {
    const displacement = Math.sqrt(moveVector.x * moveVector.x + moveVector.y * moveVector.y);
    return displacement / moveSpeed;
  }

  function updateDvdStyle(x, y, moveTime) {
    dvdDom.style.transitionDuration = `${moveTime}s`;
    dvdDom.style.left = `${x}px`;
    dvdDom.style.top = `${y}px`;
  }

  setTimeout(init, 1000);
})();
