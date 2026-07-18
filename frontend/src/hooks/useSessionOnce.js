import { useEffect, useState } from "react";

const useSessionOnce = (key) => {
  const [shouldRun] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(key) !== "true";
  });

  useEffect(() => {
    if (shouldRun) {
      sessionStorage.setItem(key, "true");
    }
  }, [key, shouldRun]);

  return shouldRun;
};

export default useSessionOnce;
