// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Variable to hold current primary touch event identifier.
// iOS needs this since it does not attribute
// identifier 0 to primary touch event.
let primaryTouchId = null;

if (!("PointerEvent" in window)) {
  // Create Pointer polyfill from mouse events only on non-touch device
  if (!("TouchEvent" in window)) {
    addMouseToPointerListener(document, "mousedown", "pointerdown");
    addMouseToPointerListener(document, "mousemove", "pointermove");
    addMouseToPointerListener(document, "mouseup", "pointerup");
  }

  addTouchToPointerListener(document, "touchstart", "pointerdown");
  addTouchToPointerListener(document, "touchmove", "pointermove");
  addTouchToPointerListener(document, "touchend", "pointerup");
}

function addMouseToPointerListener(target, mouseType, pointerType) {
  target.addEventListener(mouseType, mouseEvent => {
    let pointerEvent = new MouseEvent(pointerType, mouseEvent);
    pointerEvent.pointerId = 1;
    pointerEvent.isPrimary = true;
    mouseEvent.target.dispatchEvent(pointerEvent);
    if (pointerEvent.defaultPrevented) {
      mouseEvent.preventDefault();
    }
  });
}

function addTouchToPointerListener(target, touchType, pointerType) {
  target.addEventListener(touchType, touchEvent => {
    let mouseEvent = new CustomEvent("", { bubbles: true, cancelable: true });
    mouseEvent.ctrlKey = touchEvent.ctrlKey;
    mouseEvent.shiftKey = touchEvent.shiftKey;
    mouseEvent.altKey = touchEvent.altKey;
    mouseEvent.metaKey = touchEvent.metaKey;

    const changedTouches = touchEvent.changedTouches;
    const nbTouches = changedTouches.length;
    for (let t = 0; t < nbTouches; t++) {
      const touch = changedTouches.item(t);
      mouseEvent.clientX = touch.clientX;
      mouseEvent.clientY = touch.clientY;
      mouseEvent.screenX = touch.screenX;
      mouseEvent.screenY = touch.screenY;
      mouseEvent.pageX = touch.pageX;
      mouseEvent.pageY = touch.pageY;
      const rect = touch.target.getBoundingClientRect();
      mouseEvent.offsetX = touch.clientX - rect.left;
      mouseEvent.offsetY = touch.clientY - rect.top;

      let pointerEvent = new MouseEvent(pointerType, mouseEvent);
      pointerEvent.pointerId = 1 + touch.identifier;

      // First touch is the primary pointer event.
      if (touchType === "touchstart" && primaryTouchId === null) {
        primaryTouchId = touch.identifier;
      }
      pointerEvent.isPrimary = touch.identifier === primaryTouchId;

      // If first touch ends, reset primary touch id.
      if (touchType === "touchend" && pointerEvent.isPrimary) {
        primaryTouchId = null;
      }

      touchEvent.target.dispatchEvent(pointerEvent);
    }
  });
}
