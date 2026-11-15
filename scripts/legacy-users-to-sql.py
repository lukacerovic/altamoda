#!/usr/bin/env python3
"""
Convert the old altamoda.rs (CodeIgniter/MySQL) `users` table into a Postgres
SQL script for the new site.

    python3 -I scripts/legacy-users-to-sql.py <altamoda_db.sql> <out_dir>

Writes (both contain personal data: keep them under /backups/, never commit):
  <out_dir>/legacy-users-import.sql   run with psql against the target DB
  <out_dir>/legacy-users-report.csv   every source row + decision, for review

Mapping:
  - user_type 'not_registered' (old guest checkouts) and obvious test/fake
    accounts are skipped.
  - vp_prices=1 -> role b2b, status active, approved b2b_profile (salon keeps
    wholesale prices). Otherwise b2c.
  - blocked_user=1 -> status suspended.
  - password (sha1(salt+pw), 40 hex) -> users.legacy_password_hash; password_hash
    stays NULL until the first successful login upgrades it to bcrypt.
  - address/city/postal -> one default user_addresses row.
  - Emails are trimmed + lowercased; duplicates keep the wholesale / newest row.
  - Rows whose email already exists in the target DB (case-insensitive) are
    left untouched (INSERT ... WHERE NOT EXISTS).
  - Imported ids are 'legacy_<old id>' so the import is idempotent and easy to
    find or roll back:  DELETE FROM users WHERE id LIKE 'legacy\\_%';
"""
import csv
import os
import re
import sys
from datetime import date

SKIP_EMAIL_DOMAINS = {
    'mailinator.com', 'mailinator.net', 'example.com', 'test.com', 'pera.com',
    'yopmail.com', 'guerrillamail.com', 'tempmail.com',
}
EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
HEX40_RE = re.compile(r'^[0-9a-f]{40}$')
# Obvious junk typed into test registrations.
JUNK_NAME_RE = re.compile(r'^(test|proba|asd\w*|dasd\w*|qwe\w*|xxx+)$', re.I)


def parse_mysql_values(s, i):
    """Parse `(..),(..);` starting at s[i] == '('. Returns (rows, next_index)."""
    rows = []
    n = len(s)
    while i < n:
        while s[i] in ' \n\r\t,':
            i += 1
        if s[i] == ';':
            return rows, i + 1
        assert s[i] == '(', s[i:i + 40]
        i += 1
        row = []
        while True:
            while s[i] in ' \n\r\t':
                i += 1
            if s[i] == "'":
                i += 1
                buf = []
                while True:
                    c = s[i]
                    if c == '\\':
                        nxt = s[i + 1]
                        buf.append({'n': '\n', 'r': '\r', 't': '\t', '0': '\0'}.get(nxt, nxt))
                        i += 2
                    elif c == "'":
                        if s[i + 1] == "'":
                            buf.append("'")
                            i += 2
                        else:
                            i += 1
                            break
                    else:
                        buf.append(c)
                        i += 1
                row.append(''.join(buf))
            else:
                m = re.compile(r'[^,)]+').match(s, i)
                tok = m.group(0).strip()
                i = m.end()
                row.append(None if tok.upper() == 'NULL' else tok)
            while s[i] in ' \n\r\t':
                i += 1
            if s[i] == ',':
                i += 1
                continue
            assert s[i] == ')', s[i:i + 40]
            i += 1
            break
        rows.append(row)
    return rows, i


def read_users(dump_path):
    s = open(dump_path, encoding='utf-8', errors='strict').read()
    cols = None
    rows = []
    for m in re.finditer(r'INSERT INTO `users` \(([^)]*)\) VALUES\s*', s):
        these_cols = [c.strip(' `') for c in m.group(1).split(',')]
        cols = cols or these_cols
        assert these_cols == cols
        r, _ = parse_mysql_values(s, m.end())
        rows.extend(r)
    if cols is None:
        sys.exit('No INSERT INTO `users` found in dump')
    return [dict(zip(cols, r)) for r in rows]


def q(v):
    if v is None:
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"


def clean(v):
    v = (v or '').strip()
    return v or None


def skip_reason(u, email):
    if u['user_type'] == 'not_registered':
        return 'guest (not_registered)'
    if not email or not EMAIL_RE.match(email):
        return 'invalid email'
    if email.split('@', 1)[1] in SKIP_EMAIL_DOMAINS:
        return 'test/fake email domain'
    first, last = (u['first_name'] or '').strip(), (u['last_name'] or '').strip()
    if JUNK_NAME_RE.match(first) or JUNK_NAME_RE.match(last):
        return 'test/fake name'
    if not HEX40_RE.match((u['password'] or '').lower()):
        return 'no legacy password hash'
    return None


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    dump_path, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    users = read_users(dump_path)

    report = []
    candidates = {}
    for u in users:
        email = (u['email'] or '').strip().lower()
        reason = skip_reason(u, email)
        report.append({'old_id': u['id'], 'email': email, 'name': f"{u['first_name']} {u['last_name']}".strip(),
                       'user_type': u['user_type'], 'vp_prices': u['vp_prices'], 'blocked': u['blocked_user'],
                       'decision': 'skip: ' + reason if reason else 'import'})
        if reason:
            continue
        prev = candidates.get(email)
        # Prefer the wholesale account, then the newest one.
        key = (u['vp_prices'] == '1', int(u['id']))
        if prev is None or key > (prev['vp_prices'] == '1', int(prev['id'])):
            if prev is not None:
                for r in report:
                    if r['old_id'] == prev['id']:
                        r['decision'] = f"skip: duplicate email (kept old id {u['id']})"
            candidates[email] = u
        else:
            report[-1]['decision'] = f"skip: duplicate email (kept old id {prev['id']})"

    today = date.today().isoformat()
    out = [
        '-- Generated by scripts/legacy-users-to-sql.py — contains personal data, do not commit.',
        'BEGIN;',
    ]
    n_b2b = 0
    for email, u in sorted(candidates.items(), key=lambda kv: int(kv[1]['id'])):
        uid = f"legacy_{u['id']}"
        name = ' '.join(x for x in [(u['first_name'] or '').strip(), (u['last_name'] or '').strip()] if x) or email
        is_b2b = u['vp_prices'] == '1'
        status = 'suspended' if u['blocked_user'] == '1' else 'active'
        reg = u.get('date_registered')
        created = reg if reg and reg != '0000-00-00' else None
        created_sql = f"{q(created)}::timestamp" if created else 'CURRENT_TIMESTAMP'
        out.append(
            'INSERT INTO users (id, email, legacy_password_hash, name, phone, role, status, created_at, updated_at) '
            f"SELECT {q(uid)}, {q(email)}, {q(u['password'].lower())}, {q(name)}, {q(clean(u['phone']))}, "
            f"{q('b2b' if is_b2b else 'b2c')}::\"UserRole\", {q(status)}::\"UserStatus\", {created_sql}, CURRENT_TIMESTAMP "
            f"WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = {q(email)});"
        )
        street, city, postal = clean(u['address']), clean(u['city']), clean(u['postal_number'])
        if street and city:
            out.append(
                'INSERT INTO user_addresses (id, user_id, label, street, city, postal_code, country, is_default) '
                f"SELECT {q(uid + '_addr')}, {q(uid)}, 'Adresa', {q(street)}, {q(city)}, {q(postal or '')}, 'Srbija', true "
                f"WHERE EXISTS (SELECT 1 FROM users WHERE id = {q(uid)}) "
                f"AND NOT EXISTS (SELECT 1 FROM user_addresses WHERE id = {q(uid + '_addr')});"
            )
        if is_b2b:
            n_b2b += 1
            salon = clean(u['company_name']) or name
            addr = ', '.join(x for x in [street, ' '.join(y for y in [postal, city] if y)] if x) or None
            out.append(
                'INSERT INTO b2b_profiles (id, user_id, salon_name, pib, maticni_broj, address, approved_at) '
                f"SELECT {q(uid + '_b2b')}, {q(uid)}, {q(salon)}, {q(clean(u['company_pib']))}, "
                f"{q(clean(u['company_reg_number']))}, {q(addr)}, CURRENT_TIMESTAMP "
                f"WHERE EXISTS (SELECT 1 FROM users WHERE id = {q(uid)}) "
                f"AND NOT EXISTS (SELECT 1 FROM b2b_profiles WHERE user_id = {q(uid)});"
            )
    out.append('COMMIT;')
    out.append('')

    sql_path = os.path.join(out_dir, 'legacy-users-import.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    rep_path = os.path.join(out_dir, 'legacy-users-report.csv')
    with open(rep_path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(report[0].keys()))
        w.writeheader()
        w.writerows(report)

    from collections import Counter
    c = Counter(r['decision'].split(' (')[0] for r in report)
    print(f'source rows: {len(users)}')
    for k, v in sorted(c.items(), key=lambda kv: -kv[1]):
        print(f'  {k}: {v}')
    print(f'to import: {len(candidates)} (b2b/wholesale: {n_b2b})')
    print(f'wrote {sql_path}\nwrote {rep_path}')


if __name__ == '__main__':
    main()
