# Custom font assets

Place the font files you received in this folder using the following names so the CSS `@font-face` declarations can find them:

- `NotoSans-Regular.woff2`
- `NotoSans-Regular.woff`
- `NotoSans-Regular.ttf`
- `Sarala-Bold.woff2`
- `Sarala-Bold.woff`
- `Sarala-Bold.ttf`

If your downloads use different names, rename them to match this convention or update the paths in `src/styles/tailwind.css` accordingly. After copying the files, restart the dev server so Vite picks up the new assets.
