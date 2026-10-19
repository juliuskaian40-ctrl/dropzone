DROPZONE website update — installation

Files in this ZIP:
- index.html       Complete homepage
- styles.css       Shared neon-purple styling
- app.js           Homepage translations + Item Shop loader
- map.html         Separate Battle Royale map page
- map.js           Map API loader, location names and filter controls

How to install:
1. Open https://github.com/juliuskaian40-ctrl/dropzone
2. Download/keep a backup of your existing files first.
3. Upload/replace the files listed above in the repository root.
4. Keep your existing logo image named exactly:
   Neon-Dropzone-Emblem in Violett.png
5. Commit the changes, wait for GitHub Pages to deploy, then open:
   https://juliuskaian40-ctrl.github.io/dropzone/
   Map page:
   https://juliuskaian40-ctrl.github.io/dropzone/map.html

API key notes:
- The homepage Item Shop loader has an empty API_KEY variable in app.js.
- If the provider requires an API key, you can add it there, but anything included in public frontend JavaScript is visible to every visitor. Prefer rotating the existing key if it has already been publicly committed.
- The Battle Royale map endpoint is called without a key in this bundle. If it fails due to provider changes or rate limits, check the provider's current docs.
- Exact chest/loot/NPC spawn coordinates are not available from the map endpoint used here. The filters intentionally show an explanatory message rather than fabricated markers.

The logo image is not bundled because it should be the same image already present in your repository.
