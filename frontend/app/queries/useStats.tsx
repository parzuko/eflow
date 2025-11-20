import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../lib/api";

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 3000,
  });
};
