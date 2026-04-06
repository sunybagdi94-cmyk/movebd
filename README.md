# 🎬 CineZoneBD – Movie Catalog Website

A fully functional, dark-themed movie/series/anime catalog website with a separate admin panel. Inspired by the layout structure of movielinkbd.pw — built entirely with HTML, CSS, and JavaScript (no backend required).

---

## ✅ Completed Features

### 🌐 Public Website (`index.html`)
- **Dark theme** – High-contrast dark palette with neon accents (red, cyan, gold, purple)
- **Logo & Hero area** – Branded header with tagline and animated glow effects
- **Multi-row category navigation pills** – Filter by type (Movie/Series/Anime), language, genre, pinned, new
- **Promo strip chips** – Quick access to Anime, Ongoing, Completed, Bangla Drama, Dubbed content
- **Large search bar** with real-time suggestions dropdown (live search while typing)
- **Content toggle flags** – Hide 18+ toggle button
- **Poster card grid** – Responsive 5-column grid with:
  - Poster images with hover zoom
  - Quality badge (4K, WEB-DL, HDTC, BluRay)
  - Language badge (🇧🇩 Bangla, 🇮🇳 Hindi, 🇺🇸 English, 🌐 Dual)
  - Content type badge (Movie / Series / Anime)
  - Pinned badge (yellow 📌)
  - Rating badge (⭐)
  - Episode progress badge
  - Views count & date added
  - Hover overlay with play button
- **Featured content** highlight (gold border)
- **Detail modal** – Full info popup with poster, rating, description, info table, genre pills, tag pills, Watch/Download buttons
- **Advanced filtering** – Combine type + language + genre + special + status + dubbed
- **Active filter chips** display with "Clear All" option
- **Load More** pagination (16 items per page)
- **No Results** empty state with clear filter button
- **Toast notifications**
- **Keyboard navigation** (Escape to close modal)
- **Fully responsive** – Works on mobile, tablet, and desktop
- **28 sample content items** (Movies, Series, Anime) pre-loaded

### 🔐 Admin Panel (`admin/index.html`)

#### Login Screen
- Username/password authentication (localStorage-based)
- Show/hide password toggle
- Error message display
- **Demo credentials:** `admin` / `admin123`

#### Dashboard
- **Stats cards** – Total, Movies, Series, Anime, Pinned, Featured counts
- **Quick action buttons** – Add Content, View Library, Categories, Settings
- **Recently added table** with poster thumbnails

#### Content Library
- Full searchable/filterable data table
- Filter by: search text, type, status
- **Pagination** (12 items per page)
- Per-row actions:
  - ✏️ Edit – Opens full edit form
  - 📌 Toggle Pin – Pin/unpin content
  - 👁️ Toggle Visibility – Show/hide on public site
  - 🗑️ Delete – With confirmation modal

#### Add/Edit Content Form
- Full fields: Title, Poster URL, Type, Language, Quality, Status, Year, Rating, Views, Episodes, Description, Genres, Tags, Date
- **Live poster preview** as you type the URL
- **Toggle switches** for: Pinned, Featured, Dubbed, Visible
- Edit existing content from any table row

#### Categories & Tags
- View all genres with item count
- Add new genres (prompt dialog)
- Delete genres
- Language breakdown stats
- Content type counts

#### Settings
- Site name, tagline, email
- Change admin credentials
- Export all data to JSON
- Clear all admin data

---

## 🗂️ File Structure

```
index.html              → Main public website
css/
  style.css             → Main stylesheet (dark theme, responsive)
js/
  data.js               → Sample data (28 movies/series/anime)
  main.js               → Frontend logic (filters, search, modal, grid)
admin/
  index.html            → Admin panel (login + dashboard)
  admin.css             → Admin panel stylesheet
  admin.js              → Admin logic (CRUD, localStorage)
README.md               → This file
```

---

## 📍 Entry Points

| URL | Description |
|-----|-------------|
| `index.html` | Main public website |
| `admin/index.html` | Admin panel login screen |

---

## 🔑 Admin Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## 💾 Data Storage

All data is stored in **browser localStorage** under these keys:

| Key | Purpose |
|-----|---------|
| `czbd_content` | Admin-added/edited content items (JSON array) |
| `czbd_deleted` | IDs of deleted sample content items |
| `czbd_settings` | Site settings (name, tagline, email) |
| `czbd_admin_logged_in` | Login session flag |
| `czbd_admin_user` | Logged-in username |
| `czbd_admin_creds` | Updated credentials |

---

## 📱 Content Data Model

```json
{
  "id": "unique_string",
  "title": "Movie Title (Year)",
  "poster": "https://... poster image URL ...",
  "type": "movie | series | anime",
  "language": "bangla | hindi | english | dual",
  "quality": "WEB-DL | 4K uHDRip | HDTC | BluRay",
  "status": "ongoing | completed | upcoming",
  "year": 2026,
  "rating": "8.5",
  "views": "12.5K",
  "episodes": "S01 Ep 1-12",
  "description": "Short plot summary...",
  "genre": ["action", "thriller"],
  "tags": ["WEB-DL", "Dual Audio"],
  "addedDate": "2026-03-21",
  "pinned": true,
  "featured": false,
  "dubbed": false,
  "visible": true
}
```

---

## 🚧 Features Not Yet Implemented

- Real video streaming / download links (demo only)
- User registration and profiles
- Comment / rating system
- Server-side backend (PHP/Node.js)
- Real database (MySQL/MongoDB)
- SEO meta tags per content
- Social sharing buttons
- Watchlist / favorites (requires auth)
- Email notifications
- Advanced analytics

## 📌 Recommended Next Steps

1. Connect to a real backend API for content management
2. Add a real authentication system (JWT/sessions)
3. Implement actual video player embed (YouTube, JW Player, VidCloud)
4. Add SEO improvements (Open Graph, sitemap.xml)
5. Add user accounts with watchlist/history
6. Add multilingual support (Bengali UI text)
7. Implement content request system
8. Add Google Analytics or Plausible

---

*© 2026 CineZoneBD Demo — Static website for demonstration purposes only*
