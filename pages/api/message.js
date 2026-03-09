import Axios from 'axios';
import requestIp from 'request-ip'

// Any IP starting with 128.243 belongs to Uni of Nottingham
const UON_PREFIX = "128.243"

export default async function handler(req, res) {
    //var url = process.env.SLACK_URL
    //var x = await  Axios.post(url, {text:req.body.msg})

    const detectedIp = requestIp.getClientIp(req)
    const campus = detectedIp.indexOf("128.243") == 0;
    
    if (!req.body || !req.body.msg) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (req.body.msg.length >= 200) {
        return res.status(200).json({});
    }

    if (req.body.msg === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    
    var discord = process.env.DISCORD_URL
    var discord_internal = process.env.INT_DISCORD_URL

    try {
      if (discord_internal) {
        await Axios.post(discord_internal, {
          "content": req.body.msg,
          "embeds": null
        });
      } else {
        console.warn("INT_DISCORD_URL is not set. Skipping internal webhook.");
      }

      if (discord) {
        await Axios.post(discord, {
          "content": null,
          "embeds": [
            {
              "title": "New Message",
              "description": req.body.msg,
              "color": 9002166,
              "fields": [
                {
                  "name": "IP Address",
                  "value": detectedIp || "Unknown",
                  "inline": true
                },
                {
                  "name": "On Campus",
                  "value": campus ? "Yes :white_check_mark:" : "No :x:",
                  "inline": true
                }
              ]
            }
          ],
        });
      } else {
        console.warn("DISCORD_URL is not set. Skipping public webhook.");
      }
    } catch (error) {
      console.error("Error sending to Discord:", error.message);
      // We can still return 200 to the client even if the webhook fails, 
      // or return a 500 if it's critical. Let's return 200 so the UI doesn't break.
    }

    res.status(200).json({ success: true })
  }
