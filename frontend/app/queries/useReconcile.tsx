import { useQuery } from "@tanstack/react-query";
import { fetchReconciliation } from "../lib/api";

export const useReconcile = (isEnabled: boolean) => {
  return useQuery({
    queryKey: ["reconcile"],
    queryFn: fetchReconciliation,
    enabled: isEnabled,
    refetchInterval: 3000,
  });
};
