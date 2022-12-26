// init prev, next destination

// calculate move time
// move to next destination
// listen to next destination
// calculate next destination base on prev, next destination
// assign new prev, next destination
// calculate move time
// move to next destination

(function () {
  var MOVE_SPEED = 500;

  var containerDom = document.querySelector('#container');
  var dvdDom = document.querySelector('#dvd');

  var cntDest = {};
  var nextDest = {};
  var moveVector = { x: 0, y: 0 };

  var maxLeft = containerDom.clientWidth - dvdDom.offsetWidth;
  var maxTop = containerDom.clientHeight - dvdDom.offsetHeight;
  var transitionedEventCount = 0;

  setTimeout(() => {
    moveToNextDest(true);
  }, 1000);

  dvdDom.addEventListener('transitionend', (event) => {
    console.log('transitionend', event);
    transitionedEventCount += 1;
    if (transitionedEventCount === 2) {
      transitionedEventCount = 0;
      moveToNextDest();
    }
  });

  function logInfo() {
    console.log('cntDest', cntDest, 'nextDest', nextDest, 'moveVector', moveVector, 'dvdDom.offsetLeft', dvdDom.offsetLeft, 'dvdDom.offsetTop', dvdDom.offsetTop);
  }


  function moveToNextDest(isInit) {
    if (isInit) {
      // init prev, next destination
      cntDest = getNormPosition({ top: dvdDom.offsetTop, left: dvdDom.offsetLeft });
      nextDest = getNormPosition({ top: window.innerHeight / 2, right: 0 });
      moveVector = getMoveVector();
    } else {
      // calculate next destination base on prev, next destination
      // assign new prev, next destination
      cntDest = nextDest;
      const boundedVector = getBoundedVector();
      nextDest = getNextDest(cntDest, boundedVector);
      moveVector = getMoveVector();
    }
    logInfo();

    updateDvdStyle();
    console.log('\n\n\n\n');
  }

  function getNormPosition(position) {
    const normPos = {};

    if ('top' in position) {
      normPos.top = position.top;
    } else if ('bottom' in position) {
      normPos.top = maxTop - position.bottom;
    } else {
      console.error('no top or bottom in position');
    }

    if ('left' in position) {
      normPos.left = position.left;
    } else if ('right' in position) {
      normPos.left = maxLeft - position.right;
    } else {
      console.error('no left or right in position');
    }

    return normPos;
  }

  function getBoundedVector() {
    if (dvdDom.offsetLeft === 0 || dvdDom.offsetLeft === maxLeft) {
      console.log('x bounded');
      return { x: -moveVector.x, y: moveVector.y };
    } else {
      console.log('y bounded');
      return { x: moveVector.x, y: -moveVector.y };
    }
  }

  function getNextDest(cntDest, moveDirection) {
    let priorX;
    let priorY;
    if (moveDirection.x > 0) {
      priorX = (maxLeft - cntDest.left) / moveDirection.x;
    } else {
      priorX = cntDest.left / -moveDirection.x;
    }

    if (moveDirection.y > 0) {
      priorY = (maxTop - cntDest.top) / moveDirection.y;
    } else {
      priorY = cntDest.top / -moveDirection.y;
    }

    const directionWeight = Math.min(priorX, priorY);
    console.log(priorX, priorY, directionWeight, cntDest, moveDirection);
    return {
      left: cntDest.left + moveDirection.x * directionWeight,
      top: cntDest.top + moveDirection.y * directionWeight,
    };
  }

  function getMoveVector() {
    moveVector = {
      x: nextDest.left - cntDest.left,
      y: nextDest.top - cntDest.top,
    };
    return moveVector;
  }

  function getMoveTime() {
    const displacement = moveVector.x * moveVector.x + moveVector.y * moveVector.y;
    return Math.sqrt(displacement) / MOVE_SPEED;
  }

  function updateDvdStyle() {
    const moveTime = getMoveTime();
    console.log('moveTime', moveTime);

    dvdDom.style.transitionDuration = `${moveTime}s`;
    Object.entries(nextDest).forEach(([k, v]) => {
      dvdDom.style[k] = `${v}px`;
    });
  }

})();
