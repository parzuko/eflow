import { useQuery } from "@tanstack/react-query";
import { fetchFailedOrders } from "../lib/api";

export const useDLQ = () => {
  return useQuery({
    queryKey: ["dlq"],
    queryFn: fetchFailedOrders,
    refetchInterval: 3000,
  });
};
