import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reconcile } from "../lib/api";

export const useReconcileExplicit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reconcile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["reconcile"] });
    },
  });
};
