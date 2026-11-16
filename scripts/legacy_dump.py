"""Minimal parser for INSERT statements in the old site mysqldump (altamoda_db.sql)."""
import re

def parse_values(s, i):
    rows=[]; n=len(s)
    while i<n:
        while i<n and s[i] in ' ,\n': i+=1
        if i>=n or s[i]==';': break
        assert s[i]=='(', s[i:i+50]; i+=1; row=[]
        while True:
            while s[i]==' ': i+=1
            if s[i]=="'":
                i+=1; buf=[]
                while True:
                    c=s[i]
                    if c=='\\':
                        nx=s[i+1]; buf.append({'n':'\n','r':'\r','t':'\t','0':'\0'}.get(nx,nx)); i+=2
                    elif c=="'":
                        if s[i+1]=="'": buf.append("'"); i+=2
                        else: i+=1; break
                    else: buf.append(c); i+=1
                row.append(''.join(buf))
            else:
                m=re.match(r"[^,)]*", s[i:i+100]); v=m.group(0).strip(); i+=len(m.group(0))
                row.append(None if v=='NULL' else v)
            while s[i]==' ': i+=1
            if s[i]==',': i+=1; continue
            if s[i]==')': i+=1; break
        rows.append(row)
    return rows
def load(path, tables):
    s=open(path,encoding='utf-8',errors='replace').read(); out={}
    for t in tables:
        out[t]=[]
        for m in re.finditer(r"INSERT INTO `%s` \(([^)]*)\) VALUES "%t, s):
            cols=[c.strip(' `') for c in m.group(1).split(',')]
            for r in parse_values(s, m.end()): out[t].append(dict(zip(cols,r)))
    return out
