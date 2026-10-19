import { BunqContext } from "../BunqContext";
import type { Payment } from "../types";

export class PaymentAPI {
  #context: BunqContext;

  constructor(context: BunqContext) {
    this.#context = context;
  }

  /**
   * Get payments for a specific monetary account
   */
  async getPayments({
    userId = this.#context.token.userId,
    monetaryAccountId,
  }: {
    userId?: number;
    monetaryAccountId: number;
  }) {
    type PaymentResponse = {
      Response: Array<{
        Payment: Payment;
      }>;
    };
    const url = `/user/${userId}/monetary-account/${monetaryAccountId}/payment?count=200`;
    const data = await this.#context.makeSignedRequest<PaymentResponse>(url);
    return data.Response.map((item) => item.Payment);
  }

  async getInsights({
    userId,
    dateStart,
    dateEnd,
  }: {
    userId?: number;
    dateStart?: Date;
    dateEnd?: Date;
  }) {
    userId = userId ?? this.#context.token.userId;
    let endDate = dateEnd ? new Date(dateEnd) : new Date();
    // Set time to 00:00:00 for consistency
    endDate.setHours(0, 0, 0, 0);
    let startDate = dateStart ? new Date(dateStart) : new Date(endDate);
    if (!dateStart) {
      startDate.setDate(endDate.getDate() - 6); // 6 days before end, inclusive
    }

    // We need formatDateYYYYMMDD which was imported in UserAPI.ts
    // For this refactoring, let's just implement it inline
    const formatDateYYYYMMDD = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    const start = formatDateYYYYMMDD(startDate);
    const end = formatDateYYYYMMDD(endDate);
    const url = `/user/${userId}/insights?time_start=${start}&time_end=${end}`;

    const data = await this.#context.makeSignedRequest<unknown>(url);

    return data;
  }

  /**
   * Create a draft payment. bunq holds it until the account holder accepts it in the app.
   * POST /v1/user/{userID}/monetary-account/{monetary-accountID}/draft-payment
   */
  async createDraftPayment({
    userId = this.#context.token.userId,
    monetaryAccountId,
    amount,
    counterpartyAlias,
    description,
  }: {
    userId?: number;
    monetaryAccountId: number;
    amount: { value: string; currency: "EUR" };
    counterpartyAlias: { type: "IBAN"; value: string; name: string };
    description: string;
  }): Promise<{ id: number }> {
    const url = `/user/${userId}/monetary-account/${monetaryAccountId}/draft-payment`;
    const requestBody = {
      status: "ACTIVE",
      entries: [{ amount, counterparty_alias: counterpartyAlias, description }],
      number_of_required_accepts: 1,
    };
    const data = await this.#context.makeSignedRequest<{ Response: [{ Id: { id: number } }] }>(
      url,
      "POST",
      requestBody,
    );
    return { id: data.Response[0].Id.id };
  }
}
