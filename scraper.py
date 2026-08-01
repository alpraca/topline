"""
Website Image Scraper
Extracts images from a website and organizes them into folders by page/section.
"""

import os
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time
from pathlib import Path
from urllib.parse import quote

class WebsiteScraper:
    def __init__(self, base_url, output_dir="output"):
        self.base_url = base_url
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.visited_urls = set()
        self.images_downloaded = 0
        self.domain = urlparse(base_url).netloc
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
    
    def is_valid_url(self, url):
        """Check if URL belongs to the same domain"""
        try:
            parsed = urlparse(url)
            return parsed.netloc == self.domain
        except:
            return False
    
    def get_page_folder_name(self, url):
        """Generate folder name based on URL"""
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        
        if not path or path == 'en':
            return "homepage"
        
        # Clean up the path for folder naming
        folder_name = path.replace('/', '_').replace('-', '_')
        folder_name = folder_name.strip('_')
        
        return folder_name[:50]  # Limit folder name length
    
    def download_image(self, img_url, page_folder):
        """Download a single image"""
        try:
            # Validate image URL
            if not img_url or not isinstance(img_url, str):
                return False
            
            # Convert relative URLs to absolute
            img_url = urljoin(self.base_url, img_url)
            
            # Check if URL is valid
            if not img_url.startswith(('http://', 'https://')):
                return False
            
            response = self.session.get(img_url, timeout=10)
            response.raise_for_status()
            
            # Create page folder
            folder_path = os.path.join(self.output_dir, page_folder)
            os.makedirs(folder_path, exist_ok=True)
            
            # Generate filename
            parsed_url = urlparse(img_url)
            filename = os.path.basename(parsed_url.path)
            
            # Handle cases where filename is empty or invalid
            if not filename or '.' not in filename:
                # Try to get extension from content-type
                content_type = response.headers.get('content-type', 'image/jpeg')
                ext = content_type.split('/')[-1].split(';')[0]
                filename = f"image_{int(time.time() * 1000)}_{self.images_downloaded}.{ext}"
            
            # Sanitize filename
            filename = "".join(c for c in filename if c.isalnum() or c in ('_', '-', '.'))
            
            # Save image
            filepath = os.path.join(folder_path, filename)
            
            # Handle duplicate filenames
            if os.path.exists(filepath):
                name, ext = os.path.splitext(filename)
                filepath = os.path.join(folder_path, f"{name}_{int(time.time() * 1000)}{ext}")
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            self.images_downloaded += 1
            print(f"✓ Downloaded: {filename} to {page_folder}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to download {img_url}: {str(e)}")
            return False
    
    def scrape_page(self, url):
        """Scrape a single page for images"""
        if url in self.visited_urls:
            return []
        
        if not self.is_valid_url(url):
            return []
        
        self.visited_urls.add(url)
        
        try:
            print(f"\n📄 Scraping: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Get folder name for this page
            page_folder = self.get_page_folder_name(url)
            
            # Find all images - including various attributes
            img_tags = soup.find_all('img')
            print(f"   Found {len(img_tags)} img tags")
            
            for img in img_tags:
                # Check multiple image source attributes
                img_src = (img.get('src') or img.get('data-src') or 
                          img.get('data-lazy-src') or img.get('data-image') or 
                          img.get('data-original') or img.get('srcset'))
                if img_src:
                    # Handle srcset - extract first URL
                    if 'srcset' in img.attrs:
                        img_src = img_src.split(',')[0].strip().split(' ')[0]
                    self.download_image(img_src, page_folder)
            
            # Also check for picture tags
            picture_tags = soup.find_all('picture')
            if picture_tags:
                print(f"   Found {len(picture_tags)} picture tags")
            
            for picture in picture_tags:
                sources = picture.find_all('source')
                for source in sources:
                    img_src = source.get('srcset')
                    if img_src:
                        # srcset can have multiple URLs, get the first one
                        img_url = img_src.split(',')[0].strip().split(' ')[0]
                        self.download_image(img_url, page_folder)
                
                # Also check img tag inside picture
                img = picture.find('img')
                if img and img.get('src'):
                    self.download_image(img.get('src'), page_folder)
            
            # Check for background images in style attributes
            elements_with_bg = soup.find_all(style=True)
            for elem in elements_with_bg:
                style = elem.get('style', '')
                if 'background' in style and 'url(' in style:
                    # Extract URL from background-image: url(...)
                    urls = re.findall(r'url\([\'"]?([^\)\'\"]+)[\'"]?\)', style)
                    for img_url in urls:
                        if img_url.strip():
                            self.download_image(img_url, page_folder)
            
            # Find all links to other pages
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Skip certain links
                if any(skip in href.lower() for skip in ['javascript:', 'mailto:', '.pdf', '.zip', 'tel:']):
                    continue
                
                absolute_url = urljoin(url, href)
                
                # Remove fragments and query params for consistency
                absolute_url = absolute_url.split('#')[0]
                # Don't remove query params as they might lead to different content
                
                if self.is_valid_url(absolute_url) and absolute_url not in self.visited_urls:
                    links.append(absolute_url)
            
            # Also check for any URLs in onclick attributes and data attributes
            for elem in soup.find_all(True):  # Find all elements
                for attr in ['data-url', 'data-link', 'onclick', 'data-href']:
                    attr_val = elem.get(attr)
                    if attr_val and isinstance(attr_val, str):
                        # Try to extract URLs
                        if 'http' in attr_val or attr_val.startswith('/'):
                            # Simple extraction
                            if attr_val.startswith('/') or attr_val.startswith('http'):
                                try:
                                    test_url = urljoin(url, attr_val.split("'")[0].split('"')[0])
                                    if self.is_valid_url(test_url) and test_url not in self.visited_urls:
                                        links.append(test_url)
                                except:
                                    pass
            
            print(f"   Found {len(set(links))} new links to follow")
            return list(set(links))  # Remove duplicates
            
        except Exception as e:
            print(f"✗ Error scraping {url}: {str(e)}")
            return []
    
    def scrape_website(self, max_pages=None):
        """Scrape the entire website"""
        to_visit = [self.base_url]
        pages_visited = 0
        
        print(f"\n🚀 Starting website scraper for: {self.base_url}")
        print(f"📁 Output directory: {os.path.abspath(self.output_dir)}\n")
        
        # Also try common page paths
        common_paths = [
            '/en/gallery', '/en/galleries', '/en/portfolio', '/en/projects',
            '/en/services', '/en/products', '/en/team', '/en/about',
            '/gallery', '/galleries', '/portfolio', '/projects'
        ]
        
        for path in common_paths:
            try_url = urljoin(self.base_url, path)
            if self.is_valid_url(try_url):
                to_visit.append(try_url)
        
        while to_visit:
            # Safety limit to prevent infinite loops (increased to 500)
            if max_pages is None:
                max_pages = 500
            
            if pages_visited >= max_pages:
                print(f"\n✓ Reached maximum pages limit: {max_pages}")
                if len(to_visit) > 0:
                    print(f"   (Still {len(to_visit)} pages in queue)")
                break
            
            url = to_visit.pop(0)
            
            if url in self.visited_urls:
                continue
            
            new_links = self.scrape_page(url)
            to_visit.extend(new_links)
            pages_visited += 1
            
            # Be respectful with requests
            time.sleep(0.2)
        
        print(f"\n" + "="*50)
        print(f"✓ Scraping complete!")
        print(f"📊 Pages visited: {pages_visited}")
        print(f"🖼️  Images downloaded: {self.images_downloaded}")
        print(f"📁 Location: {os.path.abspath(self.output_dir)}")
        print("="*50)


def main():
    """Main function"""
    website_url = "https://www.topline.al/en/"
    output_directory = "output"
    
    print("""
    ╔════════════════════════════════════╗
    ║   Website Image Scraper            ║
    ║   v1.0 - Enhanced                  ║
    ╚════════════════════════════════════╝
    """)
    
    # Create scraper instance
    scraper = WebsiteScraper(website_url, output_directory)
    
    # Scrape the website - no limit to get ALL images
    scraper.scrape_website()


if __name__ == "__main__":
    main()
