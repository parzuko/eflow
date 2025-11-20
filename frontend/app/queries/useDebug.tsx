import { useQuery } from "@tanstack/react-query";
import { debugErp, debugWms } from "../lib/api";

export const useDebug = () => {
  return useQuery({
    queryKey: ["debugView"],
    queryFn: async () => {
      const erp = await debugErp();
      const wms = await debugWms();

      return {
        erp,
        wms,
      };
    },
    refetchInterval: 3000,
  });
};
