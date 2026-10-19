import { z } from "zod";
import { BunqClient } from "../bunq/BunqClient";

export default function createPaymentRequestTool(bunqClient: BunqClient) {
  return {
    name: "createPaymentRequest",
    description:
      "Create a payment request to add funds to a specific monetary account. " +
      "You must provide exactly one of counterpartyIban, counterpartyEmail, or counterpartyPhone.",
    parameters: {
      monetaryAccountId: z.number().describe("Monetary Account ID"),
      amount: z
        .object({
          currency: z.string().describe("Currency, e.g. 'EUR'"),
          value: z.string().describe("Amount as string, e.g. '184.80'"),
        })
        .describe("Amount object: { currency: 'EUR', value: '184.80' }"),
      description: z.string().describe("Description for the request inquiry"),
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
      const provided = [counterpartyIban, counterpartyEmail, counterpartyPhone].filter(Boolean);
      if (provided.length !== 1) {
        return {
          content: [
            {
              type: "text",
              text: "You must provide exactly one of counterpartyIban, counterpartyEmail, or counterpartyPhone.",
            },
          ],
          isError: true,
        };
      }
      let counterpartyAlias:
        | (
            | { type: "IBAN"; value: string; name?: string }
            | { type: "EMAIL"; value: string; name?: string }
            | { type: "PHONE_NUMBER"; value: string; name?: string }
          )
        | undefined;
      if (counterpartyIban) {
        counterpartyAlias = { type: "IBAN", value: counterpartyIban, name: counterpartyName };
      } else if (counterpartyEmail) {
        counterpartyAlias = { type: "EMAIL", value: counterpartyEmail, name: counterpartyName };
      } else if (counterpartyPhone) {
        counterpartyAlias = {
          type: "PHONE_NUMBER",
          value: counterpartyPhone,
          name: counterpartyName,
        };
      }
      if (!counterpartyAlias) {
        return {
          content: [{ type: "text", text: "Internal error: counterparty_alias not set." }],
          isError: true,
        };
      }
      try {
        const result = await bunqClient.request.createRequestInquiry({
          monetaryAccountId,
          body: {
            amount_inquired: amount,
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
          content: [{ type: "text", text: `Error creating request inquiry: ${error}` }],
          isError: true,
        };
      }
    },
  };
}
