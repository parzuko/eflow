import { useMutation, useQueryClient } from "@tanstack/react-query";
import { replayOrder } from "../lib/api";

export const useReplay = (onComplete: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replayOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dlq"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onComplete();
    },
  });
};
