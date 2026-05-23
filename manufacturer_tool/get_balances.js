#!/usr/bin/env node
/**
 * get_balances.js
 * Consulta saldo nativo (POL/ETH) y MockUSDC de una wallet en el nodo local.
 * Solo usa el módulo `http` incorporado en Node — sin dependencias externas.
 *
 * Uso:   node get_balances.js <address>
 * Salida: JSON  { "pol": 9999.9, "usdc": 500.0 }
 */

const http   = require("http");
const RPC_URL   = process.env.RPC_URL  || "http://127.0.0.1:8545";
const USDC_ADDR = process.env.USDC_ADDR || "0xbBfCa1b8404Dc43238C4A359E8454632f00c292F";
const address   = process.argv[2];

if (!address) {
    process.stdout.write(JSON.stringify({ error: "Falta argumento: address" }) + "\n");
    process.exit(1);
}

function rpc(method, params, id = 1) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
        const url  = new URL(RPC_URL);
        const req  = http.request({
            hostname: url.hostname,
            port:     url.port || 8545,
            path:     url.pathname || "/",
            method:   "POST",
            headers:  {
                "Content-Type":   "application/json",
                "Content-Length": Buffer.byteLength(body),
            },
        }, res => {
            let data = "";
            res.on("data", chunk => { data += chunk; });
            res.on("end",  () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) reject(new Error(json.error.message));
                    else            resolve(json.result);
                } catch (e) { reject(e); }
            });
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    // ── Saldo nativo (POL / ETH) ─────────────────────────────────────────
    const weiHex = await rpc("eth_getBalance", [address, "latest"]);
    const pol    = parseInt(weiHex, 16) / 1e18;

    // ── Saldo MockUSDC (ERC-20 balanceOf) ────────────────────────────────
    let usdc = 0;
    try {
        const addr40   = address.replace(/^0x/i, "").toLowerCase().padStart(64, "0");
        // balanceOf(address) → selector 0x70a08231
        const resHex   = await rpc("eth_call", [{ to: USDC_ADDR, data: "0x70a08231" + addr40 }, "latest"], 2);
        // decimals()         → selector 0x313ce567
        const decHex   = await rpc("eth_call", [{ to: USDC_ADDR, data: "0x313ce567" }, "latest"], 3);
        const decimals = parseInt(decHex, 16) || 6;
        usdc = parseInt(resHex, 16) / Math.pow(10, decimals);
    } catch (_) {
        // contrato no desplegado o red sin USDC → devuelve 0
    }

    process.stdout.write(JSON.stringify({ pol, usdc }) + "\n");
}

main().catch(e => {
    process.stdout.write(JSON.stringify({ error: e.message }) + "\n");
    process.exit(1);
});
