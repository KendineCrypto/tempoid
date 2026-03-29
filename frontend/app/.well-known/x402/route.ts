import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      version: "1.0",
      service: "TempoID",
      description: ".tempo domain name service — register, resolve, and trade domains for humans and AI agents",
      website: "https://tempoid.xyz",
      openapi: "https://tempoid.xyz/openapi.json",
      payment_methods: ["tempo"],
      currency: "0x20c000000000000000000000b9537d11c60e8b50",
      chain_id: 4217,
      endpoints: [
        { path: "/api/mpp/check/{name}", method: "GET", paid: false },
        { path: "/api/mpp/resolve/{name}", method: "GET", paid: false },
        { path: "/api/mpp/reverse/{address}", method: "GET", paid: false },
        { path: "/api/mpp/marketplace", method: "GET", paid: false },
        { path: "/api/mpp/register", method: "POST", paid: true },
        { path: "/api/mpp/buy", method: "POST", paid: true },
        { path: "/api/mpp/renew", method: "POST", paid: true },
        { path: "/api/mpp/list", method: "POST", paid: false },
        { path: "/api/mpp/transfer", method: "POST", paid: false },
        { path: "/api/mpp/metadata", method: "POST", paid: false },
        { path: "/api/mpp/chat", method: "POST", paid: true },
        { path: "/api/chat/relay", method: "POST", paid: true },
      ],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
