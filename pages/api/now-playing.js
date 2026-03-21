import soap from 'soap';

const DEFAULT_WSDL_URL = 'http://urnctarcssv01:3132/StatusFeed?wsdl';
const STATION_ID = 1;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const wsdlUrl = process.env.ZETTA_STATUS_FEED_WSDL || DEFAULT_WSDL_URL;

  try {
    const client = await soap.createClientAsync(wsdlUrl);

    const [rawResult] = await client.GetStationFullAsync({
      stationID: STATION_ID,
      includeQueue: true,
    });

    const station =
      rawResult?.GetStationFullResult ||
      rawResult?.Station ||
      rawResult;

    const queue =
      station?.Queue?.Item ||
      station?.Queue ||
      [];

    const queueArray = Array.isArray(queue) ? queue : [queue].filter(Boolean);

    const currentItem = queueArray.find(
      (item) => Number(item?.Status) === 2
    );

    if (!currentItem) {
      return res.status(200).json({
        artist: '',
        title: '',
        text: '',
      });
    }

    const artist = currentItem.Artist || '';
    const title = currentItem.Title || '';

    return res.status(200).json({
      artist,
      title,
      text: artist && title ? `${artist} - ${title}` : artist || title || '',
    });
  } catch (error) {
    // If the Status Feed is unreachable or misconfigured, fail gracefully.
    console.error('Error fetching now playing from Zetta Status Feed:', error);
    return res.status(500).json({
      error: 'Unable to fetch now playing information from Zetta.',
    });
  }
}

