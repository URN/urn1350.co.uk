/*import Axios from 'axios';
import requestIp from 'request-ip'

// Any IP starting with 128.243 belongs to Uni of Nottingham
const UON_PREFIX = "128.243"

const rateLimitMap = new Map();

export default async function handler(req, res) {
    //var url = process.env.SLACK_URL
    //var x = await  Axios.post(url, {text:req.body.msg})

    const detectedIp = requestIp.getClientIp(req)
        const limit = 5; // Limiting requests to 5 per minute per IP
        const windowMs = 60 * 1000; // 1 minute

    const campus = detectedIp.indexOf("128.243") == 0;
    
    if (req.body.msg.length >= 200) {
        return res.status(200).json({});
    }

    if (!rateLimitMap.has(detectedIp)) {
      rateLimitMap.set(detectedIp, {
          count: 0,
          lastReset: Date.now(),
      });
    }
  
    const ipData = rateLimitMap.get(detectedIp);
  
    if (Date.now() - ipData.lastReset > windowMs) {
      ipData.count = 0;
      ipData.lastReset = Date.now();
    }
  
    if (ipData.count >= limit) {
      return res.status(429).send("Too Many Requests");
    }
  
    ipData.count += 1;
    
    var discord = process.env.DISCORD_URL
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
              "value": detectedIp,
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
    })
    res.status(200).json({})
  }
  
*/
