<!-- Custom instructions for the website image scraper project -->

This is a website image scraper project designed to extract images from www.topline.al and organize them by page/section.

## Project Overview

- **Type**: Python web scraper
- **Main Script**: `scraper.py`
- **Output**: Downloaded images organized in the `output/` folder
- **Dependencies**: requests, beautifulsoup4

## Key Features

1. Crawls through all pages of the website
2. Extracts images from `<img>` tags and `<picture>` elements
3. Handles lazy-loaded images (data-src, data-lazy-src)
4. Organizes images into folders based on URL structure
5. Respects server load with request delays

## Running the Scraper

```bash
pip install -r requirements.txt
python scraper.py
```

## Configuration

Edit `scraper.py` main() function to:
- Change `website_url` to scrape a different website
- Change `output_directory` for a different output location
- Adjust `max_pages` parameter to limit crawling scope

## Output

Images are saved in the `output/` folder with subfolders for each page:
- `output/homepage/` - Images from homepage
- `output/services/` - Images from services page
- `output/about_us/` - Images from about page
- etc.
