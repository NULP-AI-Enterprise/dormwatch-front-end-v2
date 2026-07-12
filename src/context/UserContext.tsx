import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fetchUserProfile } from "../services/problemsApi";

interface UserContextValue {
  user: any;
  loading: boolean;
  refreshUser: () => Promise<any>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: () => Promise.resolve(null),
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    setLoading(true);
    return fetchUserProfile()
      .then((data) => {
        setUser(data);
        return data;
      })
      .catch(() => {
        setUser(null);
        return null;
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshUser();
    window.addEventListener("profileUpdated", refreshUser);
    return () => window.removeEventListener("profileUpdated", refreshUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
