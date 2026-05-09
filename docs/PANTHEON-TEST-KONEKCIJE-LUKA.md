# Pantheon — Test Konekcije (vodič za Luku)

Kratak vodič kako da proveriš da li tvoja mašina (ili server na kome će aplikacija raditi) može da pristupi Pantheon tkomserver API-ju, **pre** nego što počneš bilo kakav rad na integraciji u kodu.

Ovaj vodič pokriva **samo testiranje konekcije**. Za punu integraciju vidi `docs/PANTHEON-INTEGRATION-GUIDE.md`.

---

## Šta testiramo

Postoji **jedan jedini endpoint** preko kog komuniciramo sa Pantheon-om (preko tkomserver middleware-a):

```
POST http://109.93.104.29:8080/tkomserver/webshop/api
Content-Type: application/x-www-form-urlencoded
```

- Samo **POST** metoda (GET ne radi).
- Bez tokena, bez OAuth-a — `userEmail` i `userPass` se šalju u telu zahteva svaki put.
- Polje `action` određuje šta se dešava (`products`, `stock`, `altaorder`).

---

## Preduslovi

- [ ] **Tvoja izlazna IP adresa mora biti whitelistovana** na tkomserver firewall-u. Ako nije — kontaktiraj IT / Pantheon admina i zatraži da je dodaju. Bez ovoga ništa drugo neće raditi.
- [ ] Imaš **aktuelni `userPass`**. Šifra u staroj dokumentaciji je `13q2ad23d43#$ads23123`, ali možda je rotirana. Proveri sa adminom ako test ne prođe.
- [ ] `curl` instaliran (Linux/Mac imaju default; na Windows-u koristi WSL ili Git Bash).
- [ ] `nc` (netcat) instaliran za TCP test (opciono, ali korisno).

Tvoju trenutnu javnu IP možeš proveriti sa:

```bash
curl -s https://ifconfig.me
```

---

## Korak 1 — Provera mrežnog pristupa (TCP)

Pre nego što gađaš API, proveri da li uopšte možeš da otvoriš TCP konekciju ka portu 8080:

```bash
nc -zv 109.93.104.29 8080
```

**Šta očekivati:**
- `Connection to 109.93.104.29 8080 port [tcp/*] succeeded!` → mreža radi, idi na Korak 2
- `Operation timed out` ili `Connection refused` → **stani ovde**. IP nije whitelistovana ili firewall blokira. Nema smisla ići dalje dok ovo ne proradi.

Alternativa bez `nc`:

```bash
curl -v --connect-timeout 5 http://109.93.104.29:8080/ 2>&1 | head -5
```

Ako vidiš `Connection timed out` → isti problem.

---

## Korak 2 — Test POST `action=stock`

Najlakši test (vraća samo stanje, manji odgovor):

```bash
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d 'userPass=13q2ad23d43#$ads23123' \
  -d "action=stock"
```

> **Važno:** koristi **jednostruke** navodnike oko `userPass` jer šifra sadrži `$` koji bash može da interpretira.

**Šta očekivati (uspeh):**

```json
{
  "products": [
    { "a": "10002", "f": 25 },
    { "a": "10003", "f": 0 },
    ...
  ]
}
```

Gde je:
- `a` — šifra artikla u Pantheon-u (`acIdent`)
- `f` — količina na stanju

---

## Korak 3 — Test POST `action=products`

Vraća ceo katalog sa cenama. Veći odgovor (može biti više MB):

```bash
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d 'userPass=13q2ad23d43#$ads23123' \
  -d "action=products" \
  -o pantheon-products.json
```

`-o` snima odgovor u fajl jer je veliki. Posle možeš pogledati prvih nekoliko proizvoda sa:

```bash
head -c 2000 pantheon-products.json
```

**Šta očekivati (uspeh):**

```json
{
  "products": [
    {
      "a": "10002",        // šifra artikla (acIdent)
      "b": "Naziv",        // naziv na srpskom
      "c": 450.00,         // cena bez PDV-a
      "e": 540.00,         // maloprodajna cena sa PDV-om
      "f": 25,             // stanje
      "g": "T"             // aktivan: "T" = da, "F" = ne
    }
  ]
}
```

---

## Korak 4 (opciono) — Test push porudžbine `action=altaorder`

> **PAŽNJA:** ovo zaista šalje porudžbinu u Pantheon. **Koristiti samo na test podacima** ili u dogovoru sa adminom. Ne testirati sa realnim šiframa proizvoda u radnoj bazi.

```bash
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d 'userPass=13q2ad23d43#$ads23123' \
  -d "action=altaorder" \
  --data-urlencode 'data={"order_id":99999,"first_name":"Test","last_name":"Test","email":"test@test.rs","contact_phone":"+381600000000","city":"Beograd","address":"Test 1","postal_no":"11000","items_price":100,"shipping_price":0,"total_price":100,"payment_type":"pouzecem","ship_to_diff_address":0,"order_date":"2026-05-09 12:00:00","items":[{"product_code":"10002","quantity":1,"price":100}]}'
```

**Šta očekivati:** JSON sa potvrdom (`success: true` ili sličnom porukom) i ID-om porudžbine u Pantheon-u.

---

## Tumačenje odgovora

| Šta vidiš | Značenje | Šta uraditi |
|-----------|----------|-------------|
| `Connection timed out` | TCP blokiran, IP nije whitelistovana | Traži whitelist od admina, pošalji mu svoju javnu IP |
| `Connection refused` | tkomserver verovatno ne radi na tom portu | Pitaj admina da li je servis up |
| HTTP 401 / 403 | Pogrešan `userEmail` ili `userPass` | Proveri da li je šifra rotirana |
| HTTP 404 | Pogrešan URL ili `action` | Proveri da nisi pogrešno otkucao putanju |
| HTTP 500 | Greška na tkomserver strani | Pogledaj odgovor (može imati poruku); javi adminu |
| HTTP 200 + prazan body | Akcija prepoznata ali nema podataka | Proveri da li je `action` parametar tačno napisan |
| HTTP 200 + `{"products":[...]}` | **Radi!** | Pređi na sledeći korak (vidi dole) |

---

## Šta dalje kad radi

1. **Sačuvaj radne kredencijale u `.env`** (i u `.env.example` bez stvarne šifre):

   ```env
   PANTHEON_API_URL=http://109.93.104.29:8080/tkomserver/webshop/api
   PANTHEON_API_USER=webshopapiuser
   PANTHEON_API_PASS=<aktuelna šifra>
   ```

2. **Pročitaj `docs/PANTHEON-INTEGRATION-GUIDE.md`** — Step 2 nadalje opisuje kako da napišeš `PantheonClient` klasu u `src/lib/pantheon/client.ts`.

3. **Pogledaj `docs/pantheon-alignment-audit.md`** — sadrži tačnu listu šta je već implementirano (Phase 1-3 gotovi: schema, import, admin UI) i šta nedostaje (Phase 4-6: API client, inbound/outbound sync, customer sync).

4. **Pre produkcije** — razmisli o HTTPS-u. Endpoint je trenutno čist HTTP, kredencijali idu u plaintext-u. Za produkciju treba ili VPN/tunnel ili da admin podigne HTTPS na tkomserver-u.

---

## Brzi rezime (TL;DR)

```bash
# 1. TCP test
nc -zv 109.93.104.29 8080

# 2. Stock test (najlakši)
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d 'userPass=13q2ad23d43#$ads23123' \
  -d "action=stock"
```

Ako ovo prođe i vrati JSON sa `products` nizom — sve ostalo je samo kod.
