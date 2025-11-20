import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleJob } from "../lib/api";

export const useToggleJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ job, enabled }: { job: string; enabled: boolean }) =>
      toggleJob(job, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });
};
