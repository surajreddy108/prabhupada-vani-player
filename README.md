# Srila Prabhupada Vani Player

A web application to listen to the transcendental teachings of His Divine Grace A.C. Bhaktivedanta Swami Prabhupada. This app automatically loads data from a Google Sheet and provides a beautiful interface to browse and play the lectures.

## Features

- 🎵 **Live Data**: Automatically fetches lectures from Google Sheet
- 🎧 **Audio Player**: Play Prabhupada's lectures directly in your browser
- 📂 **Organized Tabs**: Lectures categorized by scripture
- 🔍 **Smart Search**: Search by title, year, or location
- ❤️ **Favorites**: Save your favorite lectures (stored locally)
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🔄 **Playback Controls**: Play, pause, skip, repeat, and volume control
- 🎲 **Shuffle Play**: Randomize lecture playback
- 📊 **Statistics**: Shows total lectures and favorites count
- ♾️ **Infinite Scroll**: Automatically loads more lectures as you scroll

## Live Demo

You can view the live demo at: [Your GitHub Pages URL]

## How to Use

1. The app loads automatically - no setup needed
2. Browse lectures by clicking on the tabs
3. Click any lecture to play it
4. Use the search box to find specific lectures
5. Filter by year or location using the dropdowns
6. Click the heart icon to add lectures to favorites
7. Use the player controls to manage playback

## Data Source

The app loads data directly from this Google Sheet:
[https://docs.google.com/spreadsheets/d/1CcDKyg-_JaiKHyvLZv-zn-g2O8b-8wWC-OP9fiaS0_M](https://docs.google.com/spreadsheets/d/1CcDKyg-_JaiKHyvLZv-zn-g2O8b-8wWC-OP9fiaS0_M)

The sheet must have the following columns:
- `date`: Date of the lecture
- `location`: Location where the lecture was given
- `title`: Title of the lecture
- `link`: Direct link to the audio file

## Local Storage

The app uses browser's local storage to:
- Save your favorite lectures
- Remember your playback preferences

## Deployment

### Deploy to GitHub Pages:

1. **Create a GitHub repository** named `prabhupada-vani-player`
2. **Upload all 3 files** to the repository:
   - `index.html`
   - `style.css`
   - `app.js`
3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "GitHub Pages" section
   - Under "Source", select "Deploy from a branch"
   - Select "main" branch and "/ (root)" folder
   - Click Save
4. **Your app will be live at**: `https://[your-username].github.io/prabhupada-vani-player/`

### Alternative: Deploy to any web host:

Simply upload all 3 files to any web hosting service. The app works as a static website.

## Browser Compatibility

Works on all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Offline Usage

The app works offline for browsing favorites (once loaded), but requires internet connection to:
- Load initial data from Google Sheet
- Stream audio files

## Customization

To customize the app:

1. **Change colors**: Edit the CSS variables in `style.css`
2. **Change Google Sheet**: Update the `sheetId` in `app.js`
3. **Change items per page**: Update `itemsPerPage` in `app.js`

## Troubleshooting

### If lectures don't load:
1. Ensure the Google Sheet is publicly accessible
2. Check browser console for errors (F12 → Console)
3. Try refreshing the page

### If audio doesn't play:
1. Check if the audio link is valid
2. Try a different browser
3. Check browser console for CORS errors

## Credits

- All lectures courtesy of PrabhupadaVani.org
- Icons by Font Awesome
- Fonts by Google Fonts
- Built with pure HTML, CSS, and JavaScript

## License

This project is for educational and devotional purposes. All audio content belongs to their respective copyright holders.

---

**Hare Krishna!** 🙏
