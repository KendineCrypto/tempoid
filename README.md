# TempID — Tempo Name Service

Tempo blockchain üzerinde `.tempo` isimlerini kaydedin. Uzun cüzdan adresleri yerine `fatih.tempo` gibi okunabilir isimler kullanın.

**Domain:** tempoid.xyz
**Chain:** Tempo (EVM-uyumlu)
**Ödeme:** pathUSD (TIP-20 stablecoin)

## Fiyatlandırma

| Karakter Uzunluğu | Yıllık Ücret |
|--------------------|-------------|
| 3 karakter         | $20 pathUSD |
| 4 karakter         | $5 pathUSD  |
| 5+ karakter        | $1 pathUSD  |

## Proje Yapısı

```
tempoid/
├── contracts/          # Solidity smart contract (tempo-foundry)
│   ├── src/TempoNameService.sol
│   ├── test/TempoNameService.t.sol
│   └── script/Deploy.s.sol
├── frontend/           # Next.js 14 (App Router)
│   ├── app/            # Sayfalar
│   ├── components/     # UI bileşenleri
│   ├── hooks/          # Wagmi hooks
│   └── lib/            # Config & utils
└── README.md
```

## Kurulum & Deploy

### 1. tempo-foundry kur

```bash
foundryup -n tempo
```

### 2. Contract'ı derle

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
```

### 3. Testleri çalıştır

```bash
forge test -vvv
```

### 4. Testnet faucet (Moderato)

```bash
cast rpc tempo_fundAddress YOUR_ADDRESS --rpc-url https://rpc.moderato.tempo.xyz
```

### 5. Testnet'e deploy et

```bash
forge create src/TempoNameService.sol:TempoNameService \
  --constructor-args 0x20c0000000000000000000000000000000000000 \
  --tempo.fee-token 0x20c0000000000000000000000000000000000000 \
  --rpc-url https://rpc.moderato.tempo.xyz \
  --interactive \
  --broadcast \
  --verify
```

Deploy çıktısından contract adresini `frontend/lib/contract.ts` dosyasındaki `TEMPO_NAME_SERVICE_ADDRESS` değişkenine yapıştırın.

### 6. Mainnet'e deploy et

```bash
forge create src/TempoNameService.sol:TempoNameService \
  --constructor-args 0x20c0000000000000000000000000000000000000 \
  --tempo.fee-token 0x20c0000000000000000000000000000000000000 \
  --rpc-url https://rpc.tempo.xyz \
  --interactive \
  --broadcast \
  --verify
```

### 7. Frontend'i çalıştır

```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Akış

1. Kullanıcı arama kutusuna isim yazar (ör. `fatih`)
2. `.tempo` otomatik eklenir, müsaitlik kontrol edilir
3. Müsaitse kayıt sayfasına yönlendirilir
4. Süre seçer (1/2/3 yıl), toplam ücret gösterilir
5. **Adım 1:** pathUSD approve (ERC-20 onayı)
6. **Adım 2:** register (isim kaydı)
7. Profil sayfasında isim, sahip, bitiş tarihi ve metadata görüntülenir

## Ağ Bilgileri

| | Mainnet | Testnet (Moderato) |
|---|---|---|
| Chain ID | 4217 | 42431 |
| RPC | https://rpc.tempo.xyz | https://rpc.moderato.tempo.xyz |
| Explorer | https://explore.tempo.xyz | https://explore.tempo.xyz |
| pathUSD | `0x20c0000000000000000000000000000000000000` | Aynı |

## Smart Contract Fonksiyonları

- `register(name, owner, years)` — İsim kaydı
- `resolve(name)` — İsmi adrese çevir
- `reverseLookup(address)` — Adresi isme çevir (primary)
- `renew(name, years)` — Süre uzat
- `transfer(name, newOwner)` — İsmi devret
- `setPrimaryName(name)` — Primary name belirle
- `setMetadata(name, key, value)` — Metadata ekle (avatar, twitter, website...)
- `getNameInfo(name)` — İsim detayları
- `isNameAvailable(name)` — Müsaitlik kontrolü
- `getRegistrationFee(name, years)` — Ücret hesapla

## Teknoloji

- **Contract:** Solidity 0.8.24, OpenZeppelin, tempo-foundry
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Web3:** Viem v2.43.0+, Wagmi v2.14.0+
- **Ödeme:** pathUSD (TIP-20)
