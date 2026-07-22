import { useRef } from "react";
import { useLocation } from "react-router-dom";

// In-memory set of animated routes during the active JS session.
// Automatically resets on initial site load and F5 refresh!
const animatedRoutesInSession = new Set();

export default function useSessionOnce(key = "home_hero") {
  const location = useLocation();
  const shouldAnimateRef = useRef(null);

  if (shouldAnimateRef.current === null) {
    const routeKey = `${key}_${location.pathname}`;

    if (!animatedRoutesInSession.has(routeKey)) {
      shouldAnimateRef.current = true;
      animatedRoutesInSession.add(routeKey);
    } else {
      shouldAnimateRef.current = false;
    }
  }

  return shouldAnimateRef.current;
}
