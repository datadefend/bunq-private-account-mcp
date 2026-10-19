import { z } from "zod";
import { BunqClient } from "../bunq/BunqClient";
import { getCounterpartyAlias, validateCounterpartyFields } from "./paymentUtils";

export default function createPaymentTool(bunqClient: BunqClient) {
  return {
    name: "createPayment",
    requiresApiKey: true,
    description:
      "Create a REAL payment from a specific monetary account. This will send REAL money immediately. " +
      "You must provide exactly one of counterpartyIban, counterpartyEmail, or counterpartyPhone. ",
    parameters: {
      monetaryAccountId: z.number().describe("Monetary Account ID"),
      amount: z
        .object({
          currency: z.string().describe("Currency, e.g. 'EUR'"),
          value: z.string().describe("Amount as string, e.g. '184.80'"),
        })
        .describe("Amount object: { currency: 'EUR', value: '184.80' }"),
      description: z.string().describe("Description for the payment"),
      counterpartyIban: z
        .string()
        .optional()
        .describe(
          "Counterparty IBAN (optional, but exactly one of IBAN, Email, or Phone must be set)",
        ),
      counterpartyEmail: z
        .string()
        .optional()
        .describe(
          "Counterparty Email (optional, but exactly one of IBAN, Email, or Phone must be set)",
        ),
      counterpartyPhone: z
        .string()
        .optional()
        .describe(
          "Counterparty Phone (optional, but exactly one of IBAN, Email, or Phone must be set)",
        ),
      counterpartyName: z.string().describe("Counterparty display name (used for all types)"),
    },
    handler: async ({
      monetaryAccountId,
      amount,
      description,
      counterpartyIban,
      counterpartyEmail,
      counterpartyPhone,
      counterpartyName,
    }: {
      monetaryAccountId: number;
      amount: { currency: string; value: string };
      description: string;
      counterpartyIban?: string;
      counterpartyEmail?: string;
      counterpartyPhone?: string;
      counterpartyName: string;
    }) => {
      // Validate that exactly one counterparty field is set
      const error = validateCounterpartyFields(
        counterpartyIban,
        counterpartyEmail,
        counterpartyPhone,
      );
      if (error) {
        return error;
      }
      const counterpartyAlias = getCounterpartyAlias(
        counterpartyIban,
        counterpartyEmail,
        counterpartyPhone,
        counterpartyName,
      );
      if (!counterpartyAlias) {
        return {
          content: [{ type: "text", text: "Internal error: counterparty_alias not set." }],
          isError: true,
        };
      }
      try {
        const result = await bunqClient.payment.createRealPayment({
          monetaryAccountId,
          body: {
            amount: amount,
            counterparty_alias: counterpartyAlias,
            description,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        console.error(error);
        return {
          content: [{ type: "text", text: `Error creating payment: ${error}` }],
          isError: true,
        };
      }
    },
  };
}
