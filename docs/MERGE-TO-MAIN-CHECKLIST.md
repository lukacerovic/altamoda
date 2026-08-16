# Merge na main — šta je urađeno i šta treba pre deploy-a

**Datum:** 2026-08-08
**Grana:** `feature/prod-prep` → `main`

Ovaj dokument je pregled svega urađenog na ovoj grani i tačna lista koraka pre spajanja na `main` i deploy-a u produkciju. Fokus je na tome da se **produkciona baza i slike usklade** sa onim što je urađeno lokalno.

---

## 1. Šta je urađeno na ovoj grani

### Tekstovi na sajtu
- Brend tekstovi (10 brendova) prebačeni u i18n fajlove, prikazuju se na stranici proizvoda filtriranoj po brendu.
- Novi tekst za "Svi proizvodi" kolekciju, kontakt stranicu (uvod + newsletter), footer.
- Centar za pomoć (FAQ) kompletno prepisan i preveden — zamenio postojeći FAQ.
- 5 mejl šablona (dobrodošlica, kartična transakcija, potvrda porudžbine, porudžbina poslata) u postojećem AltaModa dizajnu.
- 6 kartica sa rešenjima za tip kose na početnoj strani, linkovane na filtere proizvoda.
- Svi tekstovi prevedeni na sr/en/ru.

### Katalog proizvoda
- Uvezena nova AMS Excel baza (998 proizvoda) — novi format tabele sa blokovima nijansi boja; import (`src/lib/ams-import.ts`) prepravljen da to razume automatski (POL kolona, grupisanje boja bez ručnih skripti).
- Export/backup (`/api/products/export`) popravljen da čuva grupisanje boja kroz ceo krug export→import (ranije bi ga tiho izbrisao).
- Slike ponovo upload-ovane i povezane sa Cloudinary-jem (998/998 proizvoda ima sliku, 3173 slike ukupno).
- Nasumičan redosled proizvoda na `/products` (da se ne prikazuju uvek isti proizvodi prvi) — server sada rangira ceo katalog po seed-u po poseti.
- Ispravljen pad stranice proizvoda pri brzom prelasku mišem preko nijansi boja (Swiper galerija).

### Pantheon (ERP) integracija
- **Kritičan bag ispravljen**: Next.js je tiho sekao Pantheon lozinku na `#` karakteru bez obzira na navodnike — cela integracija nikad nije stvarno radila kroz pravu aplikaciju. Lozinka je sada URL-enkodovana u `.env` i dekodovana u kodu (`src/lib/pantheon/client.ts`).
- `ERP_CRON_SECRET` je bio samo placeholder tekst (`<openssl rand -hex 32>`) — generisan pravi.
- 994/998 proizvoda povezano sa Pantheon-om (`erpId = sku`, potvrđeno uživo).
- Nova `/admin/erp` stranica: ručna sinhronizacija cena/lagera/porudžbina + istorija + red neuspešnih porudžbina sa opcijom ponovnog pokušaja.
- Modal za kontrolisan uvoz novih proizvoda iz Pantheon-a (pretraga + checkbox izbor) — zamenio opasnu "uvezi sve odjednom" opciju koja je jednom napunila katalog sa ~1950 nepotpunih proizvoda.
- Panel "Proizvodi sa nedostacima" na `/admin/products` — pokazuje proizvode bez brenda/kategorije/slike.
- `type=products` sinhronizacija uklonjena i iz cron rute i iz ručne admin rute (ostaje samo dostupna direktno iz koda, za svesnu jednokratnu upotrebu).
- `vercel.json` sa cron rasporedom za lager (15min), cene (1h), porudžbine (5min) — **pripremljeno, ali nije aktivirano** (videti Korak 4 ispod).

**Šema baze (Prisma) nije menjana na ovoj grani** — sva polja koja smo koristili (`colorCode`, `groupSlug`, `erpId`, `erpIsActive`, `costPrice`...) već postoje u ranijim migracijama.

---

## 2. Pre merge-a na main — provere u kodu

- [ ] `src/app/brands/BrandsListClient.tsx` ima nesačuvanu izmenu koja **nije napravljena na ovoj grani tokom rada sa asistentom** (uklanja naziv brenda i opis sa `/brands` stranice). Proveri da li je namerna pre push-a.
- [ ] Proveri `git status` — postoje staged izmene u `graphify-out/` (interni graf koda, bezopasno, samo da ne iznenadi u diff-u).
- [ ] Opciono, još nerešeno iz code review-a (nisu blokirajuće, ali vredi razmotriti): latentna greška u parsiranju grupa boja ako je LINIJA kolona prazna na prvom redu bloka (ne utiče na trenutne podatke), `decodeURIComponent` bez try/catch u `pantheon/client.ts`, sekvencijalni upis pri uvozu do 500 Pantheon proizvoda odjednom.

---

## 3. Environment promenljive — dodati u produkciju

Ovo su **nove ili izmenjene** vrednosti koje trenutno postoje samo u lokalnom `.env` fajlu (koji se ne prati u git-u). Moraju se ručno dodati u produkciono okruženje (hosting panel / Vercel env vars):

| Promenljiva | Napomena |
|---|---|
| `PANTHEON_API_URL` | `http://89.216.106.135:8080/tkomserver/webshop/api` |
| `PANTHEON_API_USER` | `webshopapiuser` |
| `PANTHEON_API_PASS` | **Mora biti URL-enkodovana** (npr. `13q2ad23d43%23%24ads23123`), ne sirova lozinka — pogledaj komentar u `.env` ili `src/lib/pantheon/client.ts`. Ne kopiraj lozinku direktno, provuci je kroz `node -e "console.log(encodeURIComponent('...'))"` prvo. |
| `ERP_CRON_SECRET` | Generiši **novu, posebnu vrednost za produkciju** (ne koristi lokalnu dev vrednost) — `openssl rand -hex 32`. |
| `CRON_SECRET` | Samo ako se hostuje na Vercel-u — Vercel automatski šalje ovaj header cron pozivima ako promenljiva sa ovim tačnim imenom postoji u podešavanjima projekta. |

Proveri i da li `CLOUDINARY_*` promenljive u produkciji pokazuju na **isti Cloudinary nalog** (`dat58wvyj`) na koji smo upload-ovali slike ove sesije — ako produkcija koristi drugi nalog, linkovi neće raditi.

---

## 4. Migracija baze i slika — koraci

### 4.1 Šema (Prisma migracije)

Nema novih migracija na ovoj grani, ali proveri da produkcija ima primenjene sve postojeće:

```bash
DATABASE_URL="<produkciona-konekcija>" npx prisma migrate deploy
```

Ovo je bezbedna, idempotentna komanda — ne radi ništa ako je sve već primenjeno.

### 4.2 Backup pre bilo čega

**Obavezno napravi rezervnu kopiju produkcione baze pre sledećih koraka.** Ako je produkcija na Postgres 17 (kao lokalna), koristi odgovarajuću verziju `pg_dump`:

```bash
pg_dump -h <prod-host> -U <user> -d <baza> -F c -f backup-pre-merge-$(date +%Y%m%d).dump
```

### 4.3 Uvoz kataloga (998 proizvoda)

Ovo je **najvažniji i najosetljiviji korak**. Katalog import radi u "REPLACE" modu — proizvodi kojih nema u Excel-u se brišu (ili arhiviraju ako imaju istoriju porudžbina), a postojeći se ažuriraju po IDENT šifri. Ovo je bezbedno dizajnirano da ne dira porudžbine/korisnike u produkciji, ali je **jednosmerna operacija** — otud i backup iz koraka 4.2.

Preporučen način: kroz admin panel na produkciji, isti kao i lokalno —

1. Uloguj se kao admin na produkcionom sajtu.
2. Idi na `/admin/import`.
3. Preuzmi backup trenutnog produkcionog kataloga (dugme "Preuzmi backup Excel") — dodatna sigurnosna kopija, čuva se odvojeno od baze.
4. Uvezi isti Excel fajl koji je korišćen lokalno (`! AMS sajt 2026_1. baza B2C i B2B, FINAL FINALA, jul FINAL!!! - Copy.xlsx`).
5. Proveri rezultat (kreirano/ažurirano/obrisano/arhivirano) — očekuje se slično kao lokalno: ~997 ažurirano, 1 kreirano, 0 obrisano (osim ako produkcija ima proizvode kojih nema u ovom Excel-u — tada će se ili obrisati ili arhivirati ako imaju porudžbine).

### 4.4 Slike (Cloudinary povezivanje)

Slike su **već upload-ovane na Cloudinary** (deljeni servis, ne zavisi od okruženja) — ne treba ih ponovo slati. Treba samo da se u produkcionoj bazi upišu redovi koji povezuju proizvode sa tim slikama, isto kao što smo uradili lokalno.

Skripta trenutno čita samo `DATABASE_URL` (nema `--prod` opciju kao starija verzija) — pokreni je sa produkcionom konekcijom eksplicitno:

```bash
DATABASE_URL="<produkciona-konekcija>" node scripts/link-products-to-photos-2026-08.mjs            # dry-run, samo ispis
DATABASE_URL="<produkciona-konekcija>" node scripts/link-products-to-photos-2026-08.mjs --apply     # stvarni upis
```

Očekivan rezultat: 998 proizvoda povezano, ~3173 slike ukupno (isto kao lokalno).

### 4.5 Povezivanje sa Pantheon-om (erpId)

Nakon uvoza kataloga, proizvodi u produkciji nemaju `erpId` postavljen (uvoz iz Excel-a ga ne dira). Da bi dugmad za sinhronizaciju cena/lagera radila u produkciji, potrebno je jednokratno povezivanje — isti princip kao lokalno (šifra proizvoda = Pantheon kod, potvrđeno da se poklapa za >99% kataloga):

```bash
DATABASE_URL="<produkciona-konekcija>" npx tsx scripts/backfill-erpid-by-sku.ts            # dry-run
DATABASE_URL="<produkciona-konekcija>" npx tsx scripts/backfill-erpid-by-sku.ts --apply     # stvarni upis
```

Skripta je bezbedna za ponovno pokretanje — dira samo proizvode kojima `erpId` još nije postavljen.

### 4.6 Provera pre nego što je sajt javno vidljiv

- Otvori nekoliko proizvoda i proveri da se slike i nijanse boja prikazuju ispravno.
- Idi na `/admin/erp` i probaj "Sinhronizuj sada" za Cene i Lager — treba da javi broj sinhronizovanih proizvoda blizu 994-998.
- Proveri `/admin/products` panel "Proizvodi sa nedostacima" — očekivano prazan ili sa par proizvoda ako ih ima iz ranijih ručnih unosa.

---

## 5. Aktivacija automatske sinhronizacije (cron)

`vercel.json` je pripremljen, ali **cron se aktivira samo ako je sajt hostovan na Vercel-u** i ako je `CRON_SECRET` env promenljiva podešena u Vercel projektu (Vercel tada sam šalje taj header cron pozivima, bez potrebe da se tajna upisuje u fajl).

Ako je hosting **cPanel ili nešto drugo**, cron treba ručno podesiti u kontrolnom panelu hostinga, pozivajući:

```bash
curl -H "Authorization: Bearer $ERP_CRON_SECRET" "https://<domen>/api/cron/erp-sync?type=stock"
curl -H "Authorization: Bearer $ERP_CRON_SECRET" "https://<domen>/api/cron/erp-sync?type=prices"
curl -H "Authorization: Bearer $ERP_CRON_SECRET" "https://<domen>/api/cron/erp-sync?type=orders"
```

Preporučen raspored: lager na 15 min, cene na 1h, porudžbine na 5 min. (`type=products` namerno ne postoji ni na jednoj ruti — vidi napomenu u kodu zašto.)

**Ovo pitanje čeka odgovor:** gde je sajt tačno hostovan (Vercel ili nešto drugo) — bez tog odgovora ne može se dovršiti aktivacija croná.

---

## 6. Redosled preporučen za sam merge

1. Reši checklistu iz sekcije 2 (kod).
2. Napravi backup produkcione baze (4.2).
3. Uradi merge grane na `main` i deploy koda (bez brige — sam kod ne dira bazu dok se eksplicitno ne pokrenu koraci ispod).
4. Dodaj environment promenljive u produkciju (sekcija 3).
5. Uradi migraciju kataloga i slika (4.1–4.5), po tom redosledu.
6. Prođi proveru iz 4.6.
7. Aktiviraj cron (sekcija 5), kada se potvrdi hosting.
