import requestIp from 'request-ip'

const MAX_LENGTH = 400;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: "Method not allowed" });
    }

    const msg = req.body && typeof req.body.msg === 'string' ? req.body.msg.trim() : '';

    if (!msg) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (msg.length > MAX_LENGTH) {
        return res.status(400).json({ error: "Message is too long" });
    }

    // Any IP starting with 128.243 belongs to Uni of Nottingham
    const detectedIp = requestIp.getClientIp(req) || "";
    const campus = detectedIp.indexOf("128.243") == 0;

    const post = (url, body) =>
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    try {
      if (process.env.INT_DISCORD_URL) {
        await post(process.env.INT_DISCORD_URL, { content: msg, embeds: null });
      } else {
        console.warn("INT_DISCORD_URL is not set. Skipping internal webhook.");
      }

      if (process.env.DISCORD_URL) {
        await post(process.env.DISCORD_URL, {
          content: null,
          embeds: [{
            title: "New Message",
            description: msg,
            color: 9002166,
            fields: [
              { name: "IP Address", value: detectedIp || "Unknown", inline: true },
              { name: "On Campus", value: campus ? "Yes :white_check_mark:" : "No :x:", inline: true },
            ],
          }],
        });
      } else {
        console.warn("DISCORD_URL is not set. Skipping public webhook.");
      }
    } catch (error) {
      console.error("Error sending to Discord:", error.message);
      // We still return 200 so the UI doesn't break if a webhook is briefly down.
    }

    res.status(200).json({ success: true })
  }
