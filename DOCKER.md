# Docker ile Sunucuya Kurulum

Bu proje **durum tutan (stateful)** bir uygulama. Admin paneli iki yere yazıyor:

| Yol                  | İçerik                                | Kaynak                        |
| -------------------- | ------------------------------------- | ----------------------------- |
| `src/data/*.json`    | Projeler, yetenekler, site ayarları   | `src/lib/localData.ts`        |
| `public/uploads/`    | Panelden yüklenen görseller           | `src/app/api/upload/route.ts` |

Her ikisi de **named volume** olarak bağlanıyor. Bu yüzden `docker compose down` +
yeniden build içeriği silmez; ama `docker compose down -v` **siler**.

---

## 1. Sunucuda ilk kurulum

```bash
git clone https://github.com/Hafikan/hafikan.github.io.git portfolio
cd portfolio

# Ortam değişkenleri
cp .env.docker.example .env.docker
chmod 600 .env.docker

# ADMIN_PASSWORD zorunlu. Akılda kalıcı parola değil, rastgele secret üret:
openssl rand -base64 36
$EDITOR .env.docker

docker compose up -d --build
docker compose logs -f
```

`http://127.0.0.1:3000` üzerinde ayakta olmalı. Dışarıya **bilerek** açık değil —
bkz. bölüm 2.

Sağlık kontrolü:

```bash
docker compose ps          # STATUS "healthy" olmalı
curl -s localhost:3000/api/config | head -c 200
```

### Mevcut görselleri taşıma

Yerelde `public/uploads/` altındaki dosyalar imaja **girmiyor** (`.dockerignore`).
Taşımak için:

```bash
docker cp public/uploads/. portfolio-web:/app/public/uploads/
docker compose exec -u root web chown -R node:node /app/public/uploads
```

---

## 2. UFW + Docker: dikkat edilmesi gereken asıl konu

**Sorun.** Docker, port yayınlarken kendi `DOCKER` zincirini iptables `nat`
tablosuna yazar. `nat/PREROUTING` zinciri, ufw'nin kurallarının bulunduğu
`filter/INPUT` zincirinden **önce** işlenir. Sonuç:

```yaml
ports:
  - "3000:3000"     # ← BUNU YAPMAYIN
```

Bu satır portu `0.0.0.0` üzerinde yayınlar ve port, şu durumlarda bile
internetten erişilebilir olur:

- `ufw default deny incoming` aktifken
- `ufw deny 3000` kuralı yazılmışken
- `ufw status` çıktısı portu kapalı gösterirken

ufw bu trafiği hiç görmez. Klasik "veritabanım nasıl sızdı" senaryosu budur.

**Bu repodaki çözüm.** `docker-compose.yml` host tarafını loopback'e bağlıyor:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

Böylece DNAT hedefi loopback olur; porta yalnızca sunucunun kendisi (yani ters
proxy'niz) erişebilir. Docker ağa hiçbir şey açmaz, ufw ile çakışma kalmaz.
Dışarıya açılan tek şey nginx'in 80/443 portlarıdır ve **onları ufw yönetir**.

Doğrulama — dışarıdan bakan bir makineden:

```bash
nmap -Pn -p 3000 SUNUCU_IP        # "filtered" veya "closed" olmalı, "open" DEĞİL
```

Sunucunun kendisinden:

```bash
sudo ss -lntp | grep 3000         # sadece 127.0.0.1:3000 görünmeli, 0.0.0.0:3000 değil
sudo iptables -t nat -L DOCKER -n # DNAT hedefi 127.0.0.1 olmalı
```

### UFW kuralları

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

3000 için kural yazmaya gerek yok; zaten yayınlanmıyor.

### İleride başka konteyner eklerseniz

Bir konteyneri gerçekten dışarı açmanız gerekirse iki seçenek var:

**a) `DOCKER-USER` zinciri (önerilen).** Docker bu zinciri kendi kurallarından
önce işler ve asla ezmez:

```bash
# Varsayılan olarak konteyner ağına dışarıdan gelen her şeyi reddet
sudo iptables -I DOCKER-USER -i eth0 ! -s 10.0.0.0/8 -j DROP
```

`eth0` yerine kendi dış arayüzünüzü yazın (`ip route get 1.1.1.1` ile bulunur).
Kuralı kalıcı yapmak için `iptables-persistent` kullanın.

**b) [`ufw-docker`](https://github.com/chaifeng/ufw-docker)** — `after.rules`
dosyasına Docker'ı ufw'ye tabi kılan bir blok ekler, sonra `ufw route allow`
ile port bazlı izin verirsiniz.

> `/etc/docker/daemon.json` içinde `"iptables": false` yapmak da dolaşımda olan
> bir tavsiye, ama konteyner çıkış NAT'ını da bozar; ayrı bir kurulum işi
> gerektirir. Loopback binding varken gerek yok.

---

## 3. Ters proxy + TLS (nginx)

`/etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    server_name ornek.com www.ornek.com;
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ornek.com www.ornek.com;

    ssl_certificate     /etc/letsencrypt/live/ornek.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ornek.com/privkey.pem;

    # Admin paneline yüklenen görseller 5MB'a kadar
    client_max_body_size 6m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }

    # Next.js'in hash'li asset'leri — uzun süre cache'lenebilir
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ornek.com -d www.ornek.com
```

**HTTPS zorunlu.** Admin oturum çerezi `secure: true` ile set ediliyor
(`src/app/api/auth/login/route.ts`), yani düz HTTP üzerinden panele giriş
yapılamaz — tarayıcı çerezi saklamaz.

---

## 4. Güncelleme

```bash
cd portfolio
git pull
docker compose up -d --build
docker image prune -f
```

Volume'lar korunur; içerik kaybolmaz.

## 5. Yedekleme

```bash
# Volume'ları tek arşive al
docker run --rm \
  -v portfolio-data:/data:ro \
  -v portfolio-uploads:/uploads:ro \
  -v "$PWD:/backup" alpine \
  tar czf /backup/portfolio-$(date +%F).tar.gz -C / data uploads
```

Geri yükleme:

```bash
docker compose down
docker run --rm \
  -v portfolio-data:/data \
  -v portfolio-uploads:/uploads \
  -v "$PWD:/backup" alpine \
  tar xzf /backup/portfolio-2026-01-01.tar.gz -C /
docker compose up -d
```

Volume adları `docker-compose.yml` içinde `name:` ile sabitlendi, yani klasör
adından bağımsızdır. `docker volume ls` ile doğrulayabilirsiniz.

---

## 6. İmajda ne var, ne yok

`.dockerignore` build context'ten şunları tamamen dışlıyor — yani Docker
daemon'a hiç gitmiyorlar, imaj katmanına veya `docker history` çıktısına
sızmaları mümkün değil:

- `.env`, `.env.*`, `*.pem`, `*.key`, `serviceAccount*.json`
- `.git/` — tüm commit geçmişi; imaja girseydi geçmişte silinmiş her secret
  imajdan geri çıkarılabilirdi
- `node_modules/`, `.next/` — imaj içinde sıfırdan kurulur
- `public/uploads/` — kullanıcı verisi, volume'da yaşar
- `diff.log`, `*.tsbuildinfo`, `.claude/`

Doğrulama:

```bash
docker run --rm --entrypoint sh portfolio-website:latest -c \
  'ls -a /app; test -e /app/.git && echo "!! .git SIZDI" || echo "ok: .git yok"'

docker history --no-trunc portfolio-website:latest | grep -i -c "ADMIN_PASSWORD\|GITHUB_TOKEN"
# 0 dönmeli
```

Secret'lar imaja değil, çalışma anında `env_file` ile geçiyor.

## 7. Konteyner sertleştirme

`docker-compose.yml` içinde aktif olanlar:

| Ayar                           | Ne işe yarar                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `USER node` (uid 1000)         | root değil; konteyner içinde ayrıcalık yok                          |
| `no-new-privileges:true`       | setuid ile yetki yükseltmeyi engeller                               |
| `cap_drop: ALL`                | Tüm Linux capability'leri düşer; Node'un ihtiyacı yok               |
| `read_only: true`              | Root dosya sistemi salt-okunur; volume/tmpfs dışına yazım imkânsız  |
| `tmpfs` (`noexec,nosuid`)      | `/tmp` ve Next cache'i bellekte, çalıştırılabilir dosya yazılamaz   |
| `memory: 1g`, `pids_limit`     | Kaçak süreç/render döngüsü sunucuyu düşüremez                       |
| `dumb-init`                    | SIGTERM'i iletir; `docker stop` temiz kapanır                       |

---

## 8. Sorun giderme

**Konteyner hemen kapanıyor, log'da `FATAL ADMIN_PASSWORD is not set`**
`.env.docker` yok ya da `ADMIN_PASSWORD` boş. Entrypoint bilerek durduruyor:
boş bırakılırsa `src/lib/auth.ts` oturum imzası için `'default_secret'`
sabitine düşer ve panel herkese açılır.

**Site boş, proje görünmüyor**
Volume seed edilememiş olabilir:
```bash
docker compose exec web ls -la /app/src/data
docker compose logs web | grep entrypoint
```

**Yüklenen görsel 404**
```bash
docker compose exec web ls -la /app/public/uploads
```
Boşsa volume mount'u veya sahiplik bozuktur; `chown -R node:node` uygulayın.

Dosya yerinde ama yine 404 dönüyorsa `src/app/uploads/[...path]/route.ts`
silinmiş olabilir — bkz. bölüm 9.

---

## 9. Neden `src/app/uploads/[...path]/route.ts` var? (silmeyin)

Next.js'in **production** sunucusu `public/` klasörünün içeriğini **açılışta bir
kez** tarar. Sunucu ayaktayken `public/uploads/` içine yazılan dosyalar bu
listede olmadığı için, süreç yeniden başlatılana kadar **404 döner.**

Yani bu dosya olmadan: admin panelinden görsel yüklersiniz, yükleme başarılı
olur, dosya diske yazılır — ama görsel sitede görünmez. `docker compose restart`
atana kadar. `next dev` klasörü her istekte yeniden okuduğu için hata yerelde
fark edilmez; sadece production/konteynerde ortaya çıkar.

Bu route handler, açılış listesinde bulunmayan `/uploads/*` isteklerini diskten
okuyup servis eder. Güvenlik önlemleri:

- Path traversal reddi (`../`, alt klasör, gizli dosya)
- Çözümlenen yolun `public/uploads` dışına çıkmadığının ikinci kez doğrulanması
- Sadece izin verilen görsel uzantıları (upload endpoint'iyle aynı liste)
- Yüklenen SVG'lerin script çalıştırmasına karşı
  `Content-Security-Policy: default-src 'none'; sandbox` + `nosniff`

Doğrulama:

```bash
# Sunucu ayaktayken dosya oluştur, restart atmadan iste
docker compose exec web sh -c 'printf x > /app/public/uploads/test.png'
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/uploads/test.png   # 200 olmalı
docker compose exec web rm /app/public/uploads/test.png
```

**Panele giriş yapılamıyor**
HTTPS üzerinden bağlandığınızdan emin olun (bkz. bölüm 3) ve nginx'in
`X-Forwarded-Proto $scheme` header'ını gönderdiğini kontrol edin.

**"GitHub ile giriş" çalışmıyor**
Bilerek devre dışı; 501 döner. Bkz. bölüm 10.

---

## 10. Admin oturumu (auth) düzeltmeleri

Konteynerleştirme sırasında oturum katmanında iki ciddi sorun bulundu ve
düzeltildi.

### 10.1 `/api/auth/github` — kimlik doğrulamasız admin girişi (kritik)

Route, istek gövdesinden gelen `username` alanına bakıp doğrudan admin oturum
çerezi veriyordu. Firebase ID token **hiç kontrol edilmiyordu** ve `"hafikan"`
izin listesine sabit yazılmıştı. Yani tek bir istekle tam yetkili oturum
alınabiliyordu:

```bash
curl -X POST https://siteniz.com/api/auth/github \
     -H 'Content-Type: application/json' \
     -d '{"username":"hafikan"}'
```

Parola tamamen devre dışı kalıyordu ve bütün admin API'leri (projects, skills,
config, upload) bu çereze güveniyor. Route artık **fail-closed**: 501 döner,
oturum üretmez. Güvenli şekilde geri açmak için gereken adımlar dosyanın
başındaki yorumda yazılı (ID token'ın RS256 imzasının Google'ın açık
anahtarlarıyla sunucu tarafında doğrulanması).

Giriş yolu artık yalnızca parola: `/api/auth/login`.

### 10.2 Oturum çerezi

Önceki token `HMAC(ADMIN_PASSWORD, "admin_session_granted")` idi — yani:

- her girişte **birebir aynı** değer üretiliyordu,
- token'ın kendi içinde **son kullanma tarihi yoktu**; çerez süresi dolsa bile
  aynı değer elle geri konarak süresiz kullanılabiliyordu,
- `ADMIN_PASSWORD` tanımsızsa bu repoda yazılı `'default_secret'` ile
  imzalanıyordu; yani kimse forge etmekten alıkonmuyordu,
- doğrulama `===` ile yapılıyordu (timing sızıntısı).

Yeni format: `v1.<base64url(payload)>.<base64url(HMAC-SHA256)>`, payload
`{sub, iat, exp, jti}`. Getirdikleri:

| Önlem                       | Etkisi                                                  |
| --------------------------- | ------------------------------------------------------- |
| Rastgele `jti`              | Her giriş benzersiz token üretir                        |
| `exp` (24 saat)             | Token'ın kendisi süre dolunca geçersiz                  |
| `iat` + skew kontrolü       | Gelecek tarihli token reddedilir                        |
| `exp - iat` politika sınırı | Aşırı uzun ömürlü token reddedilir                      |
| `crypto.subtle.verify`      | Sabit zamanlı imza karşılaştırması                      |
| `ADMIN_PASSWORD` zorunlu    | Tanımsızsa imzalama ve doğrulama tamamen reddedilir     |

Parola karşılaştırması da (`/api/auth/login`) SHA-256 özetleri üzerinden sabit
zamanlı hale getirildi.

**Oturum iptali:** `.env.docker` içindeki `ADMIN_PASSWORD` değiştirilip
`docker compose up -d` çalıştırıldığında dağıtılmış tüm çerezler anında
geçersiz olur.

> Dağıtımdan sonra eski format çerezler geçersizdir; panele bir kez yeniden
> giriş yapmanız gerekir.

**Hâlâ eklenmemiş olan:** `/api/auth/login` üzerinde brute-force koruması
(rate limit) yok. Parolayı `openssl rand` ile üretilmiş uzun bir değer
yaparsanız pratikte sorun olmaz; istenirse nginx `limit_req` ile de
sınırlandırılabilir.
