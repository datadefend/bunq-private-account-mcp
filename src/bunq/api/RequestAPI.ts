import { BunqContext } from "../BunqContext";
import type { RequestInquiry } from "../types";

export class RequestAPI {
  #context: BunqContext;

  constructor(context: BunqContext) {
    this.#context = context;
  }

  /**
   * Get request inquiries for a specific monetary account
   */
  async listRequestInquiries({
    userId = this.#context.token.userId,
    monetaryAccountId,
  }: {
    userId?: number;
    monetaryAccountId: number;
  }) {
    type RequestInquiryResponse = {
      Response: Array<{
        RequestInquiry: RequestInquiry;
      }>;
    };
    const url = `/user/${userId}/monetary-account/${monetaryAccountId}/request-inquiry`;
    const data = await this.#context.makeSignedRequest<RequestInquiryResponse>(url);
    return data.Response.map((item) => item.RequestInquiry);
  }

  async getRequestInquiry({
    userId = this.#context.token.userId,
    monetaryAccountId,
    itemId,
  }: {
    userId?: number;
    monetaryAccountId: number;
    itemId: number;
  }): Promise<RequestInquiry> {
    const url = `/user/${userId}/monetary-account/${monetaryAccountId}/request-inquiry/${itemId}`;
    const data = await this.#context.makeSignedRequest<{
      Response: [{ RequestInquiry: RequestInquiry }];
    }>(url, "GET");
    return data.Response[0].RequestInquiry;
  }

  async listRequestInquiryResponse({
    userId = this.#context.token.userId,
    monetaryAccountId,
  }: {
    userId?: number;
    monetaryAccountId: number;
  }): Promise<any[]> {
    const url = `/user/${userId}/monetary-account/${monetaryAccountId}/request-response`;
    const data = await this.#context.makeSignedRequest<{
      Response: any[];
    }>(url, "GET");
    return data.Response;
  }
}
