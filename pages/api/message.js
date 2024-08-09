import Axios from 'axios';
import requestIp from 'request-ip'

// Any IP starting with 128.243 belongs to Uni of Nottingham
const UON_PREFIX = "128.243"


export default async function handler(req, res) {
    //var url = process.env.SLACK_URL
    //var x = await  Axios.post(url, {text:req.body.msg})

    const detectedIp = requestIp.getClientIp(req)

    const campus = detectedIp.indexOf("128.243") == 0;
    
    if (req.body.msg.length >= 200) {
        return res.status(200).json({});
    }
    
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
    //res.status(x.status).json(x.data)
  }
  
