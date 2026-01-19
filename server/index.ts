import express from "express";
import cors from "cors";
import * as jose from "jose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

app.post("/api/cdp-create-session", async (req, res) => {
  try {
    const { address, assets } = req.body;
    
    const name = process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

    if (!name || !privateKey) {
      return res.status(500).json({ error: 'CDP credentials not configured' });
    }

    const cleanedKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
    const algorithm = 'ES256';
    const key = await jose.importPKCS8(cleanedKey, algorithm);
    
    const jwt = await new jose.SignJWT({
      iss: 'coinbase-cloud',
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      sub: name,
    })
      .setProtectedHeader({ alg: algorithm, kid: name, typ: 'JWT' })
      .sign(key);

    const response = await fetch('https://api.coinbase.com/api/v3/onramp/session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination_wallets: [
          {
            address,
            blockchains: ['base'],
            assets: assets || ['ETH', 'USDC'],
          },
        ],
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `CDP API error: ${response.status}`, details: result });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "localhost", () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
