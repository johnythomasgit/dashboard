## Personal Dashboard

Lightweight dashboard with an initial Pomodoro widget, optional 5-minute chime, notifications, and persistence. Built with Vite + React + TypeScript. Deployed to GitHub Pages via Actions.

### Local development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Keyboard shortcuts

- Space: start/pause
- R: reset
- C: toggle 5-min chime

### GitHub Pages deployment

This repo includes a workflow at `.github/workflows/deploy.yml` that builds and deploys to GitHub Pages.

Steps:
1. Create a GitHub repository and push this project.
2. Ensure your default branch is `main` (or update the workflow trigger).
3. In GitHub, go to Settings → Pages:
   - Source: GitHub Actions.
4. On push to `main`, the workflow will:
   - Set the Vite `base` automatically (`/` for `*.github.io` repos, `/<repo>/` otherwise)
   - Build and upload the `dist/` artifact
   - Deploy to Pages

The site will be available at:
- User/Org page repo (`<user>.github.io`): `https://<user>.github.io/`
- Project repo: `https://<user>.github.io/<repo>/`
