# riskLAN

Speed up your RISK session by hosting riskLAN on your LAN.

## Getting started

1. Clone the repository.

```
git clone git@github.com:sigurdo/riskLAN.git
cd riskLAN
```

2. Install Node.js and packages.

```
sudo apt install nodejs
npm install
```

3. Set up a local PostgreSQL database called `risk` and a postgres user called `risk` with the password `risk` that has admin priviliges on the `risk` database. If you have docker, you can do all of this with

```
docker run --name risk-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=risk -d -p 5432:5432 postgres
```

4. Start riskLAN

```
npm run start
```

5. Get your computer's LAN IP address and share it with the people in the RISK session

```
ip addr
```

6. When everyone is connected, go to [http://localhost/admin/](http://localhost/admin/) and start a new game.
