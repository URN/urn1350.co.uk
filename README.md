# University Radio Nottingham

## Developing

```shell
npm run dev
```

## Now Playing (GLUE)

Track metadata is pushed from the RCS/Zetta machine — the website never connects into RCS.

1. Set `NOW_PLAYING_SECRET` in Netlify → Project configuration → Environment variables.
2. Deploy so `POST` / `GET` `/api/now-playing` is live on https://urn1350.co.uk
3. On the RCS server, copy `scripts/rcs/Upload-NowPlaying.ps1` to e.g. `C:\GLUE\`
4. Edit `$ApiSecret` in that script so it matches `NOW_PLAYING_SECRET`
5. Run the script (or schedule it at startup). It watches `C:\GLUE\nowplaying.txt` and POSTs on change.

Public clients only call `GET /api/now-playing` (no secret). Updates require `Authorization: Bearer <secret>`.

On Netlify, the latest track is stored with **Netlify Blobs** (the serverless filesystem is read-only). Locally, `next dev` falls back to `data/now-playing.json`.
