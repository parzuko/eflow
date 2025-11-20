import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../lib/api";

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    refetchInterval: 3000,
  });
};
