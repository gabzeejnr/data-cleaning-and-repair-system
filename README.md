
# Data Cleaning and Repair System

This project is written in accordance to the blah blah blah blah...


## API Reference

#### Health Check

```http
  GET /health
```
Checks server availability



## Deployment

To deploy this project run

In powershell:
```
  .\scripts\setup-ml-service.ps1
```

then:
```bash
npm run dev:all
```

To start each process individually run

Client/Frontend:
```bash
npm run dev:client
```
Node server/Backend:
```bash
npm run dev:server
```
Python/Cleaning:
```bash
npm run dev:ml
```