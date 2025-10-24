import { useEffect, useState } from "react";
import { getUser } from "../services/auth";

/** Renvoie l'utilisateur connecté (ou null) et se met à jour si la session change */
export default function useAuthUser() {
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    const onStorage = (e) => {
      // met à jour si bmvt_user / bmvt_token changent (localStorage ou sessionStorage)
      if (!e || e.key === null || e.key === "bmvt_user" || e.key === "bmvt_token") {
        setUser(getUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return user; // attendu: { id, name, email, role }
}
