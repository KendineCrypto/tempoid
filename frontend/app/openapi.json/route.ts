import { NextResponse } from "next/server";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "TempoID — .tempo Name Service",
      version: "1.1.0",
      description:
        "Register, resolve, and trade .tempo domains on the Tempo blockchain. Humans use the frontend, AI agents use MPP.",
      "x-guidance":
        "TempoID lets you register .tempo domains on Tempo. Use /api/mpp/check/{name} to check availability (free), then POST /api/mpp/register to mint a domain (paid via MPP with USDC.e). You can also browse and buy names from the marketplace, transfer names, renew names, and set metadata. All paid endpoints use MPP 402 challenge/credential flow.",
    },
    servers: [{ url: "https://tempoid.xyz" }],
    "x-discovery": {
      ownershipProofs: ["dns:tempoid.xyz"],
    },
    paths: {
      "/api/mpp/check/{name}": {
        get: {
          operationId: "checkAvailability",
          summary: "Check if a .tempo name is available and get pricing. If the name is taken but listed on the marketplace, returns listing info so agents can buy it directly.",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "The name to check (without .tempo suffix)",
            },
          ],
          responses: {
            "200": {
              description: "Availability and pricing info",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Full name with .tempo suffix" },
                      available: { type: "boolean", description: "Whether the name is available" },
                      price_per_year: { type: "number", description: "Price per year in USD" },
                      currency: { type: "string", description: "Payment currency" },
                      decimals: { type: "number", description: "Token decimals" },
                      price_raw: { type: "string", description: "Raw price in smallest unit" },
                      owner: { type: "string", description: "Current owner address (if taken)" },
                      expiry: { type: "number", description: "Expiry timestamp (if taken)" },
                      is_expired: { type: "boolean", description: "Whether the name is expired" },
                      listed_for_sale: { type: "boolean", description: "Whether the name is listed on the marketplace" },
                      listing_seller: { type: "string", description: "Seller address (if listed)" },
                      listing_price_usd: { type: "number", description: "Listing price in USD (if listed)" },
                      listing_price_raw: { type: "string", description: "Listing price raw (if listed)" },
                      buy_endpoint: { type: "string", description: "Endpoint to buy this name (if listed)" },
                      message: { type: "string", description: "Human-readable message about the name status" },
                    },
                    required: ["name", "available", "price_per_year_usd", "currency"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/mpp/resolve/{name}": {
        get: {
          operationId: "resolveName",
          summary: "Resolve a .tempo name to a wallet address",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "The name to resolve (without .tempo suffix)",
            },
          ],
          responses: {
            "200": {
              description: "Resolved address",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      address: { type: "string" },
                      resolver: { type: "string" },
                    },
                    required: ["name", "address"],
                  },
                },
              },
            },
            "404": { description: "Name not found or expired" },
          },
        },
      },
      "/api/mpp/reverse/{address}": {
        get: {
          operationId: "reverseLookup",
          summary: "Look up the primary .tempo name for a wallet address",
          parameters: [
            {
              name: "address",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Wallet address (0x...)",
            },
          ],
          responses: {
            "200": {
              description: "Primary name for address",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      address: { type: "string" },
                      primary_name: { type: "string" },
                    },
                    required: ["address", "primary_name"],
                  },
                },
              },
            },
            "404": { description: "No primary name set" },
          },
        },
      },
      "/api/mpp/marketplace": {
        get: {
          operationId: "getMarketplaceListings",
          summary: "Browse all names listed for sale on the marketplace",
          responses: {
            "200": {
              description: "Active marketplace listings",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      listings: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            seller: { type: "string" },
                            price: { type: "string" },
                            price_formatted: { type: "string" },
                          },
                        },
                      },
                      total: { type: "number" },
                    },
                    required: ["listings", "total"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/mpp/register": {
        post: {
          operationId: "registerDomain",
          summary: "Register a .tempo domain (paid via MPP)",
          "x-payment-info": {
            protocols: ["mpp"],
            pricingMode: "range",
            minPrice: "1.000000",
            maxPrice: "20.000000",
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Domain name to register (without .tempo)" },
                    owner_address: { type: "string", description: "Wallet address that will own the domain (0x...)" },
                    duration_years: { type: "number", description: "Registration duration in years (1-10)", default: 1 },
                  },
                  required: ["name", "owner_address"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Domain registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      owner: { type: "string" },
                      duration_years: { type: "number" },
                      price_paid: { type: "string" },
                      tx_hash: { type: "string" },
                      block: { type: "string" },
                    },
                    required: ["success", "name", "owner", "tx_hash"],
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
            "409": { description: "Name already taken" },
          },
        },
      },
      "/api/mpp/buy": {
        post: {
          operationId: "buyFromMarketplace",
          summary: "Buy a listed name from the marketplace (paid via MPP)",
          "x-payment-info": {
            protocols: ["mpp"],
            pricingMode: "quote",
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to buy (without .tempo)" },
                    buyer_address: { type: "string", description: "Wallet address of the buyer (0x...)" },
                  },
                  required: ["name", "buyer_address"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Name purchased successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      buyer: { type: "string" },
                      price_paid: { type: "string" },
                      tx_hash: { type: "string" },
                    },
                    required: ["success", "name", "buyer", "tx_hash"],
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
            "404": { description: "Name not listed for sale" },
          },
        },
      },
      "/api/mpp/renew": {
        post: {
          operationId: "renewDomain",
          summary: "Renew a .tempo domain (paid via MPP)",
          "x-payment-info": {
            protocols: ["mpp"],
            pricingMode: "range",
            minPrice: "1.000000",
            maxPrice: "20.000000",
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to renew (without .tempo)" },
                    duration_years: { type: "number", description: "Renewal duration in years (1-10)", default: 1 },
                  },
                  required: ["name"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Domain renewed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      new_expiry: { type: "string" },
                      price_paid: { type: "string" },
                      tx_hash: { type: "string" },
                    },
                    required: ["success", "name", "tx_hash"],
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
            "404": { description: "Name not found" },
          },
        },
      },
      "/api/mpp/list": {
        post: {
          operationId: "listForSale",
          summary: "List a .tempo domain for sale on the marketplace",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to list (without .tempo)" },
                    price: { type: "number", description: "Sale price in pathUSD" },
                  },
                  required: ["name", "price"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Name listed for sale",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      price: { type: "string" },
                    },
                    required: ["success", "name", "price"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/mpp/transfer": {
        post: {
          operationId: "transferDomain",
          summary: "Transfer a .tempo domain to another address",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to transfer (without .tempo)" },
                    to_address: { type: "string", description: "Recipient wallet address (0x...)" },
                  },
                  required: ["name", "to_address"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Name transferred successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      from: { type: "string" },
                      to: { type: "string" },
                      tx_hash: { type: "string" },
                    },
                    required: ["success", "name", "to", "tx_hash"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/mpp/metadata": {
        post: {
          operationId: "setMetadata",
          summary: "Set metadata (bio, avatar, links) for a .tempo domain",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to set metadata for (without .tempo)" },
                    key: { type: "string", description: "Metadata key (e.g. bio, avatar, twitter, website)" },
                    value: { type: "string", description: "Metadata value" },
                  },
                  required: ["name", "key", "value"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Metadata set successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      name: { type: "string" },
                      key: { type: "string" },
                      value: { type: "string" },
                      tx_hash: { type: "string" },
                    },
                    required: ["success", "name", "key", "value", "tx_hash"],
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
