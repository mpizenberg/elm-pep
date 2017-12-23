// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Variable to hold current primary touch event identifier.
// iOS needs this since it does not attribute
// identifier 0 to primary touch event.
let primaryTouchId = null;

// Variable to hold mouse pointer captures.
let mouseCaptureTarget = null;

// pointerId assigned to mouse-generated pointer events.
const mousePointerId = 1;

if (!("PointerEvent" in window)) {
  // Define {set,release}PointerCapture element methods
  definePointerCapture();

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
    pointerEvent.pointerId = mousePointerId;
    pointerEvent.isPrimary = true;

    let target = mouseEvent.target;
    if (mouseCaptureTarget !== null) {
      target = mouseCaptureTarget;

      // Implicit pointer release on pointerup/pointercancel.
      if (mouseType === "mouseup") {
        mouseCaptureTarget = null;
      }
    }

    target.dispatchEvent(pointerEvent);
    if (pointerEvent.defaultPrevented) {
      mouseEvent.preventDefault();
    }
  });
}

function addTouchToPointerListener(target, touchType, pointerType) {
  target.addEventListener(touchType, touchEvent => {
    const changedTouches = touchEvent.changedTouches;
    const nbTouches = changedTouches.length;
    for (let t = 0; t < nbTouches; t++) {
      let pointerEvent = new CustomEvent(pointerType, { bubbles: true, cancelable: true });
      pointerEvent.ctrlKey = touchEvent.ctrlKey;
      pointerEvent.shiftKey = touchEvent.shiftKey;
      pointerEvent.altKey = touchEvent.altKey;
      pointerEvent.metaKey = touchEvent.metaKey;

      const touch = changedTouches.item(t);
      pointerEvent.clientX = touch.clientX;
      pointerEvent.clientY = touch.clientY;
      pointerEvent.screenX = touch.screenX;
      pointerEvent.screenY = touch.screenY;
      pointerEvent.pageX = touch.pageX;
      pointerEvent.pageY = touch.pageY;
      const rect = touch.target.getBoundingClientRect();
      pointerEvent.offsetX = touch.clientX - rect.left;
      pointerEvent.offsetY = touch.clientY - rect.top;
      pointerEvent.pointerId = 1 + touch.identifier;

      // Default values for standard MouseEvent fields.
      pointerEvent.button = 0;
      pointerEvent.buttons = 1;
      pointerEvent.movementX = 0;
      pointerEvent.movementY = 0;
      pointerEvent.region = null;
      pointerEvent.relatedTarget = null;
      pointerEvent.x = pointerEvent.clientX;
      pointerEvent.y = pointerEvent.clientY;

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
      if (pointerEvent.defaultPrevented) {
        touchEvent.preventDefault();
      }
    }
  });
}

function definePointerCapture() {
  if (window.Element && !Element.prototype.setPointerCapture) {
    Object.defineProperties(Element.prototype, {
      'setPointerCapture': {
        value: function(pointerId) {
          if (pointerId !== mousePointerId) {
            return;
          }
          mouseCaptureTarget = this;
        }
      },
      'releasePointerCapture': {
        value: function(pointerId) {
          if (pointerId !== mousePointerId) {
            return;
          }
          if (mouseCaptureTarget === this) {
            mouseCaptureTarget = null;
          }
        }
      }
    });
  }
}
