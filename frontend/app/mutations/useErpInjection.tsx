import { useMutation, useQueryClient } from "@tanstack/react-query";
import { injectOrder } from "../lib/api";

export const useErpInjection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      scenario: "NORMAL" | "FAIL_RANDOM" | "FAIL_HARD" | "DUPLICATE"
    ) => {
      const id = "ORD-" + Math.floor(Math.random() * 10000);
      const order = {
        erpOrderId: id,
        organizationId: "ORG-1",
        channelId: "CH-1",
        deliveryAddress: {
          name: "John Doe",
          address1: "123 Main St",
          city: "New York",
          zip: "10001",
          countryCode: "US",
        },
        lines: [
          {
            id: 1,
            product: { id: 101, name: "Widget A", code: "WID-A" },
            quantity: 2,
            currency: "USD",
            unitCustomsValue: 10.0,
          },
        ],
        scenario,
      };
      return injectOrder(order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
