# Northern North Ministerial Council

Static conference website with:

- `index.html` public homepage
- `register.html` registration form
- `admin.html` browser-based admin panel

## Deploy

### Netlify Git Import

1. Open Netlify
2. Choose `Add new site`
3. Choose `Import an existing project`
4. Select this GitHub repo
5. Netlify will publish the site using `netlify.toml`

### Manual Netlify Upload

Upload `NNMC-netlify-upload.zip` from the project folder with Netlify drag-and-drop deploy.

## Important Note

The admin panel stores edits in browser `localStorage`.
That means content changes are only saved on the browser/device where the edits are made.
This project does not yet use a shared database or CMS.
