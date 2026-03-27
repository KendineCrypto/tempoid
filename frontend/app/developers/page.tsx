"use client";

import { useState } from "react";

const CONTRACT = "0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9";
const PATHUSD = "0x20c0000000000000000000000000000000000000";

type Tab = "foundry" | "mpp" | "mcp";

const TABS: { id: Tab; label: string }[] = [
  { id: "foundry", label: "Foundry" },
  { id: "mpp", label: "MPP / HTTP" },
  { id: "mcp", label: "MCP Server" },
];

function CodeBlock({ title, code }: { title?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      {title && (
        <p className="text-[11px] text-tertiary font-mono mb-1.5">{title}</p>
      )}
      <pre className="bg-primary text-white text-xs font-mono p-4 rounded-lg overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute top-2 right-2 text-[10px] font-mono px-2 py-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}

function FoundryTab() {
  return (
    <div className="space-y-8">
      {/* Setup */}
      <section>
        <h3 className="text-lg mb-2">Setup</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          Foundry now supports Tempo natively. Install the latest nightly and
          you can interact with .tempo names directly from the command line
          &mdash; no private keys needed.
        </p>
        <CodeBlock
          title="Install Foundry with Tempo support"
          code="foundryup -n tempo"
        />
      </section>

      {/* Tempo Wallet */}
      <section>
        <h3 className="text-lg mb-2">Tempo Wallet (no private keys)</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          Use your passkey wallet instead of managing private keys. One passkey,
          infinite session keys.
        </p>
        <div className="space-y-3">
          <CodeBlock
            title="Check your wallet address"
            code="tempo wallet whoami --json-output | jq -r .wallet"
          />
          <CodeBlock
            title="Check Tempo block number"
            code="cast bn -r tempo"
          />
        </div>
      </section>

      {/* Resolve */}
      <section>
        <h3 className="text-lg mb-2">Resolve a .tempo name</h3>
        <div className="space-y-3">
          <CodeBlock
            title="Resolve name to address"
            code={`cast call ${CONTRACT} "resolve(string)(address)" "fatih" -r tempo`}
          />
          <CodeBlock
            title="Reverse lookup (address to name)"
            code={`cast call ${CONTRACT} "reverseLookup(address)(string)" 0xYOUR_ADDRESS -r tempo`}
          />
        </div>
      </section>

      {/* Check availability */}
      <section>
        <h3 className="text-lg mb-2">Check availability & pricing</h3>
        <div className="space-y-3">
          <CodeBlock
            title="Check if a name is available"
            code={`cast call ${CONTRACT} "isNameAvailable(string)(bool)" "myagent" -r tempo`}
          />
          <CodeBlock
            title="Get registration fee (name, years)"
            code={`cast call ${CONTRACT} "getRegistrationFee(string,uint256)(uint256)" "myagent" 1 -r tempo`}
          />
        </div>
      </section>

      {/* Register */}
      <section>
        <h3 className="text-lg mb-2">Register a name</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          Two transactions: approve pathUSD spend, then register.
        </p>
        <div className="space-y-3">
          <CodeBlock
            title="1. Approve pathUSD for the contract"
            code={`WALLET=$(tempo wallet whoami --json-output | jq -r .wallet)

cast send ${PATHUSD} \\
  "approve(address,uint256)" ${CONTRACT} 1000000 \\
  -r tempo --from $WALLET`}
          />
          <CodeBlock
            title="2. Register the name (1 year)"
            code={`cast send ${CONTRACT} \\
  "register(string,uint256)" "myagent" 1 \\
  -r tempo --from $WALLET`}
          />
        </div>
      </section>

      {/* Manage */}
      <section>
        <h3 className="text-lg mb-2">Manage your name</h3>
        <div className="space-y-3">
          <CodeBlock
            title="Set primary name"
            code={`cast send ${CONTRACT} \\
  "setPrimaryName(string)" "myagent" \\
  -r tempo --from $WALLET`}
          />
          <CodeBlock
            title="Set metadata (avatar, bio, twitter, website)"
            code={`cast send ${CONTRACT} \\
  "setMetadata(string,string,string)" "myagent" "bio" "I'm an AI agent on Tempo" \\
  -r tempo --from $WALLET`}
          />
          <CodeBlock
            title="Transfer to another address"
            code={`cast send ${CONTRACT} \\
  "transfer(string,address)" "myagent" 0xNEW_OWNER \\
  -r tempo --from $WALLET`}
          />
          <CodeBlock
            title="Renew for another year"
            code={`cast send ${CONTRACT} \\
  "renew(string,uint256)" "myagent" 1 \\
  -r tempo --from $WALLET`}
          />
        </div>
      </section>

      {/* Marketplace */}
      <section>
        <h3 className="text-lg mb-2">Marketplace</h3>
        <div className="space-y-3">
          <CodeBlock
            title="List a name for sale (price in pathUSD wei, 6 decimals)"
            code={`cast send ${CONTRACT} \\
  "listForSale(string,uint256)" "myagent" 10000000 \\
  -r tempo --from $WALLET`}
          />
          <CodeBlock
            title="Buy a listed name"
            code={`# First approve the listing price
cast send ${PATHUSD} \\
  "approve(address,uint256)" ${CONTRACT} 10000000 \\
  -r tempo --from $WALLET

# Then buy
cast send ${CONTRACT} \\
  "buyName(string)" "coolname" \\
  -r tempo --from $WALLET`}
          />
        </div>
      </section>
    </div>
  );
}

function MppTab() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg mb-2">Agent Discovery</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          AI agents can discover and interact with TempoID via the Model Payment
          Protocol. All endpoints support HTTP 402 payment challenges.
        </p>
        <CodeBlock
          title="Add TempoID to your agent's service list"
          code="npx agentcash add https://tempoid.xyz"
        />
      </section>

      <section>
        <h3 className="text-lg mb-2">Free endpoints (GET)</h3>
        <div className="space-y-3">
          <CodeBlock
            title="Check name availability"
            code={`curl https://tempoid.xyz/api/mpp/check/myagent`}
          />
          <CodeBlock
            title="Resolve name to address"
            code={`curl https://tempoid.xyz/api/mpp/resolve/myagent`}
          />
          <CodeBlock
            title="Reverse lookup"
            code={`curl https://tempoid.xyz/api/mpp/reverse/0xADDRESS`}
          />
          <CodeBlock
            title="Browse marketplace"
            code={`curl https://tempoid.xyz/api/mpp/marketplace`}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg mb-2">Paid endpoints (POST + MPP)</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          These endpoints return HTTP 402 with a payment challenge. Your agent
          pays with USDC.e via MPP, and the server executes the on-chain
          transaction.
        </p>
        <div className="space-y-3">
          <CodeBlock
            title="Register a name"
            code={`curl -X POST https://tempoid.xyz/api/mpp/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "myagent", "owner_address": "0x...", "duration_years": 1}'`}
          />
          <CodeBlock
            title="Renew a name"
            code={`curl -X POST https://tempoid.xyz/api/mpp/renew \\
  -H "Content-Type: application/json" \\
  -d '{"name": "myagent", "duration_years": 1}'`}
          />
          <CodeBlock
            title="Set metadata"
            code={`curl -X POST https://tempoid.xyz/api/mpp/metadata \\
  -H "Content-Type: application/json" \\
  -d '{"name": "myagent", "key": "bio", "value": "AI agent on Tempo"}'`}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg mb-2">Resources</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/llms.txt"
            target="_blank"
            className="text-xs font-mono px-4 py-2 bg-primary text-white hover:bg-secondary transition-colors rounded"
          >
            llms.txt
          </a>
          <a
            href="/api/openapi.json"
            target="_blank"
            className="text-xs font-mono px-4 py-2 bg-primary text-white hover:bg-secondary transition-colors rounded"
          >
            OpenAPI Spec
          </a>
          <a
            href="https://www.mppscan.com/server/2a0fa682b26a3951bcf1b55f2552cc48698def04d8634618bdbdd0da86d80767"
            target="_blank"
            className="text-xs font-mono px-4 py-2 bg-primary text-white hover:bg-secondary transition-colors rounded"
          >
            MPPscan
          </a>
        </div>
      </section>
    </div>
  );
}

function McpTab() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg mb-2">MCP Server</h3>
        <p className="text-sm text-secondary leading-relaxed mb-4">
          TempoID provides a Model Context Protocol server that AI agents can
          use directly. Add it to your agent&apos;s tool configuration.
        </p>
        <CodeBlock
          title="Run the MCP server"
          code={`cd mcp-server && npx ts-node index.ts`}
        />
      </section>

      <section>
        <h3 className="text-lg mb-2">Available tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              name: "check_domain",
              desc: "Check availability & pricing",
              cost: "Free",
            },
            {
              name: "resolve_name",
              desc: "Resolve .tempo to address",
              cost: "Free",
            },
            {
              name: "reverse_lookup",
              desc: "Address to .tempo name",
              cost: "Free",
            },
            {
              name: "marketplace",
              desc: "Browse listed names",
              cost: "Free",
            },
            {
              name: "register_domain",
              desc: "Register a new name",
              cost: "Paid",
            },
            {
              name: "buy_domain",
              desc: "Buy from marketplace",
              cost: "Paid",
            },
            {
              name: "renew_domain",
              desc: "Extend expiration",
              cost: "Paid",
            },
            {
              name: "list_domain",
              desc: "List name for sale",
              cost: "Free",
            },
          ].map((tool) => (
            <div
              key={tool.name}
              className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-mono font-medium text-primary">
                  {tool.name}
                </p>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    tool.cost === "Free"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {tool.cost}
                </span>
              </div>
              <p className="text-[11px] text-tertiary">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg mb-2">Example: Agent registers a name</h3>
        <CodeBlock
          code={`// Agent uses MCP tool
{
  "tool": "register_domain",
  "input": {
    "name": "myagent",
    "owner_address": "0x...",
    "duration_years": 1
  }
}

// Server returns HTTP 402 → agent pays via MPP → name registered
// Response:
{
  "success": true,
  "name": "myagent.tempo",
  "owner": "0x...",
  "tx_hash": "0x...",
  "expires": "2027-03-28"
}`}
        />
      </section>
    </div>
  );
}

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("foundry");

  return (
    <div className="min-h-[80vh] max-w-[720px] mx-auto w-full py-12 md:py-20">
      {/* Header */}
      <div className="mb-10 md:mb-14">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-3">
          Developers
        </p>
        <h1 className="font-serif text-[36px] md:text-[52px] leading-[0.95] tracking-tight text-primary mb-4">
          Build with
          <br />
          .tempo names
        </h1>
        <p className="text-sm md:text-base text-secondary leading-relaxed max-w-[480px]">
          Register and resolve .tempo names from the CLI, your agent, or any
          application. No private keys required &mdash; Tempo Wallet&apos;s
          passkey auth handles everything.
        </p>
      </div>

      {/* Contract info */}
      <div className="bg-white/80 backdrop-blur-sm p-4 md:p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-xs text-tertiary shrink-0">Contract</p>
          <p className="text-xs font-mono text-primary break-all">
            {CONTRACT}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          <p className="text-xs text-tertiary shrink-0">Network</p>
          <p className="text-xs font-mono text-primary">
            Tempo (Chain ID 4217)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          <p className="text-xs text-tertiary shrink-0">RPC</p>
          <p className="text-xs font-mono text-primary">
            cast ... -r tempo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/60 backdrop-blur-sm p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs font-mono px-4 py-2 rounded transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-sm"
                : "text-tertiary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "foundry" && <FoundryTab />}
      {activeTab === "mpp" && <MppTab />}
      {activeTab === "mcp" && <McpTab />}

      {/* Footer CTA */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="bg-primary text-white p-6 md:p-8 rounded-lg">
          <h3 className="font-serif text-[24px] md:text-[28px] leading-[1.1] mb-3">
            One passkey, infinite keys
          </h3>
          <p className="text-sm opacity-70 leading-relaxed mb-5 max-w-[440px]">
            With Tempo Wallet you never need to manage private keys again. Issue
            session keys from your passkey, use them in Foundry, revoke anytime.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wallet.tempo.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
            >
              Tempo Wallet
            </a>
            <a
              href="https://github.com/KendineCrypto/tempoid"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://explore.tempo.xyz/address/0x9a56ae2275c85aab13533c00d2cfa42c619bc3a9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
            >
              Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
