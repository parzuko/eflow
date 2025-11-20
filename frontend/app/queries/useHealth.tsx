import { useQuery } from "@tanstack/react-query";
import { fetchSystemHealth } from "../lib/api";

export const useHealth = () => {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 3000,
  });
};
