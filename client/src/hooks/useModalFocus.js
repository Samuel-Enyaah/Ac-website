import { useEffect, useEffectEvent, useRef } from "react";
export default function useModalFocus(open, onClose) {
  const ref = useRef(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...panel.querySelectorAll(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length);
    // Persistent drawers can remain visibility:hidden during opening layout.
    // Focus once the target is visible; cancel on close and never move focus
    // away from a control the user has already reached inside the panel.
    let focusFrame;
    const focusDeadline = performance.now() + 1000;
    const focusWhenVisible = () => {
      if (panel.contains(document.activeElement)) return;
      const target = focusable()[0] || panel;
      if (getComputedStyle(target).visibility === "visible") target.focus();
      if (
        !panel.contains(document.activeElement) &&
        performance.now() < focusDeadline
      )
        focusFrame = requestAnimationFrame(focusWhenVisible);
    };
    focusWhenVisible();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          event.preventDefault();
          panel.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !panel.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !panel.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const focusin = (event) => {
      if (!panel.contains(event.target)) (focusable()[0] || panel).focus();
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", focusin);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", focusin);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  return ref;
}
