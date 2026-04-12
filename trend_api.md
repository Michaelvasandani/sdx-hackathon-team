# Trend Data API Guide
> How to get trend data from Google, YouTube, TikTok, Reddit, X (Twitter), and Instagram

---

## Table of Contents
- [Google Trends (SerpApi)](#1-google-trends--serpapi)
- [YouTube (Official API)](#2-youtube--official-data-api-v3)
- [TikTok (Research API + RapidAPI)](#3-tiktok--research-api--rapidapi)
- [Reddit (Official API)](#4-reddit--official-api)
- [X / Twitter (RapidAPI)](#5-x--twitter--rapidapi)
- [Instagram (RapidAPI)](#6-instagram--rapidapi)
- [Setup Summary](#setup-summary)

---

## 1. Google Trends — SerpApi

**Why SerpApi:** Google has no official Trends API. SerpApi is the most reliable structured solution.

**Docs:** https://serpapi.com/google-trends-api  
**Sign up:** https://serpapi.com/users/sign_up  
**Free tier:** 250 searches/month

### Authentication
Add your API key as a query parameter: `api_key=YOUR_KEY`

### Key Endpoints

#### Interest Over Time (TIMESERIES)
Tracks search interest for a keyword over time, scored 0–100.
```
GET https://serpapi.com/search.json
  ?engine=google_trends
  &q=YOUR_KEYWORD
  &date=today 7-d
  &data_type=TIMESERIES
  &api_key=YOUR_KEY
```

**Date options:**
- `now 1-H` — Past hour
- `now 4-H` — Past 4 hours
- `now 1-d` — Past day
- `now 7-d` — Past 7 days *(hourly granularity — best for trend speed tracking)*
- `today 1-m` — Past 30 days
- `today 12-m` — Past 12 months

#### Trending Now
What's spiking right now in a given country.
```
GET https://serpapi.com/search.json
  ?engine=google_trends_trending_now
  &frequency=realtime
  &geo=US
  &api_key=YOUR_KEY
```

#### Related Rising Queries
What breakout queries are emerging around a topic.
```
GET https://serpapi.com/search.json
  ?engine=google_trends
  &q=YOUR_KEYWORD
  &data_type=RELATED_QUERIES
  &api_key=YOUR_KEY
```

### Sample Response (TIMESERIES)
```json
{
  "interest_over_time": {
    "timeline_data": [
      {
        "date": "Apr 5 – 11, 2026",
        "timestamp": "1743897600",
        "values": [
          { "query": "your keyword", "value": "72", "extracted_value": 72 }
        ]
      }
    ]
  }
}
```

### Python Example
```python
import requests

params = {
    "engine": "google_trends",
    "q": "your keyword",
    "date": "now 7-d",
    "data_type": "TIMESERIES",
    "api_key": "YOUR_SERPAPI_KEY"
}

response = requests.get("https://serpapi.com/search.json", params=params)
data = response.json()
timeline = data["interest_over_time"]["timeline_data"]

for point in timeline:
    print(point["date"], point["values"][0]["extracted_value"])
```

---

## 2. YouTube — Official Data API v3

**Why official:** Free, reliable, and gives direct access to the trending videos feed.

**Docs:** https://developers.google.com/youtube/v3  
**Console:** https://console.cloud.google.com  
**Free tier:** 10,000 quota units/day (each trending call = 1 unit)

### Authentication
1. Go to Google Cloud Console → Enable **YouTube Data API v3**
2. Create an API key under Credentials
3. Pass it as `key=YOUR_KEY` in requests

### Key Endpoint: Trending Videos
```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,statistics
  &chart=mostPopular
  &regionCode=US
  &maxResults=50
  &key=YOUR_KEY
```

**Parameters:**
- `regionCode` — ISO 3166-1 alpha-2 country code (e.g. `US`, `GB`, `JP`)
- `videoCategoryId` — Filter by category (e.g. `10` = Music, `24` = Entertainment, `25` = News)
- `maxResults` — Up to 50 per request

### Sample Response
```json
{
  "items": [
    {
      "id": "VIDEO_ID",
      "snippet": {
        "publishedAt": "2026-04-11T14:00:00Z",
        "title": "Video Title",
        "channelTitle": "Channel Name",
        "tags": ["tag1", "tag2"]
      },
      "statistics": {
        "viewCount": "4500000",
        "likeCount": "180000",
        "commentCount": "12000"
      }
    }
  ]
}
```

### Python Example
```python
import requests

params = {
    "part": "snippet,statistics",
    "chart": "mostPopular",
    "regionCode": "US",
    "maxResults": 50,
    "key": "YOUR_YOUTUBE_API_KEY"
}

response = requests.get(
    "https://www.googleapis.com/youtube/v3/videos",
    params=params
)
data = response.json()

for video in data["items"]:
    print(video["snippet"]["title"], video["statistics"]["viewCount"])
```

---

## 3. TikTok — Research API + RapidAPI

Two options depending on your access level.

---

### Option A: Official TikTok Research API

**Best for:** Academic/research use, structured queries  
**Docs:** https://developers.tiktok.com/doc/research-api-get-started  
**Access:** Apply at developers.tiktok.com (approval required)

#### Authentication
1. Register an app at developers.tiktok.com
2. Get your `client_key` and `client_secret`
3. Request a client access token:
```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=YOUR_KEY&client_secret=YOUR_SECRET&grant_type=client_credentials
```

#### Query Videos by Keyword/Hashtag
```
POST https://open.tiktokapis.com/v2/research/video/query/?fields=id,like_count,view_count,share_count,create_time,hashtag_names
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request body:**
```json
{
  "query": {
    "and": [
      {
        "operation": "EQ",
        "field_name": "keyword",
        "field_values": ["your keyword"]
      },
      {
        "operation": "IN",
        "field_name": "region_code",
        "field_values": ["US"]
      }
    ]
  },
  "max_count": 100,
  "cursor": 0,
  "start_date": "20260401",
  "end_date": "20260412"
}
```

**Filterable fields:**
- `keyword`, `hashtag_name`, `region_code`
- `create_date`, `video_length`, `music_id`, `effect_id`

---

### Option B: TikTok API via RapidAPI (apibox)

**Best for:** Hackathons — no approval needed, free tier available  
**URL:** rapidapi.com → search "TikTok API" by apibox

#### Authentication
Sign up at rapidapi.com, subscribe to the API, use the `X-RapidAPI-Key` header.

#### Trending Videos Endpoint
```
GET https://tiktok-api6.p.rapidapi.com/feed/trending
  ?region=US
  &count=30

Headers:
  X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
  X-RapidAPI-Host: tiktok-api6.p.rapidapi.com
```

### Python Example (RapidAPI)
```python
import requests

url = "https://tiktok-api6.p.rapidapi.com/feed/trending"
headers = {
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "tiktok-api6.p.rapidapi.com"
}
params = {"region": "US", "count": "30"}

response = requests.get(url, headers=headers, params=params)
videos = response.json()

for video in videos:
    print(video.get("desc"), video.get("stats", {}).get("playCount"))
```

---

## 4. Reddit — Official API

**Why official:** Reddit's free API is genuinely good for trend detection. The `/rising` endpoint is purpose-built for catching things gaining velocity early.

**Docs:** https://www.reddit.com/dev/api  
**App registration:** https://www.reddit.com/prefs/apps  
**Free tier:** 100 requests/minute (personal use script)

### Authentication

1. Go to reddit.com/prefs/apps → Create a "script" type app
2. Note your `client_id` and `client_secret`
3. Get an access token:
```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

Use the returned `access_token` as a Bearer token in subsequent requests.

### Key Endpoints

#### Rising Posts (Best for early trend detection)
```
GET https://oauth.reddit.com/r/all/rising
  ?limit=100

Headers:
  Authorization: Bearer YOUR_TOKEN
  User-Agent: YourAppName/1.0
```

#### Hot Posts (Currently trending)
```
GET https://oauth.reddit.com/r/all/hot?limit=100
```

#### Top Posts (By time window)
```
GET https://oauth.reddit.com/r/all/top?t=day&limit=100
```
**`t` options:** `hour`, `day`, `week`, `month`, `year`, `all`

#### Search Posts by Keyword
```
GET https://oauth.reddit.com/search
  ?q=YOUR_KEYWORD
  &sort=new
  &limit=100
  &t=day
```

### Sample Response
```json
{
  "data": {
    "children": [
      {
        "data": {
          "title": "Post title",
          "subreddit": "technology",
          "score": 4821,
          "num_comments": 342,
          "created_utc": 1744486400,
          "url": "https://...",
          "ups": 4821,
          "upvote_ratio": 0.97
        }
      }
    ]
  }
}
```

### Python Example
```python
import requests
import base64
from datetime import datetime

# Auth
creds = base64.b64encode(b"CLIENT_ID:CLIENT_SECRET").decode()
token_res = requests.post(
    "https://www.reddit.com/api/v1/access_token",
    headers={
        "Authorization": f"Basic {creds}",
        "User-Agent": "TrendTracker/1.0"
    },
    data={"grant_type": "client_credentials"}
)
token = token_res.json()["access_token"]

# Fetch rising posts
headers = {
    "Authorization": f"Bearer {token}",
    "User-Agent": "TrendTracker/1.0"
}
response = requests.get(
    "https://oauth.reddit.com/r/all/rising",
    headers=headers,
    params={"limit": 100}
)

for post in response.json()["data"]["children"]:
    d = post["data"]
    ts = datetime.utcfromtimestamp(d["created_utc"])
    print(f"[{ts}] {d['title']} — Score: {d['score']}")
```

---

## 5. X / Twitter — RapidAPI

**Why RapidAPI:** The official X API requires a Pro plan ($5,000/month) for trends access. RapidAPI scrapers give similar data for free/cheap.

**Recommended API:** "Twttr API" by davethebeast on RapidAPI  
**URL:** rapidapi.com → search "Twttr API"

### Authentication
Sign up at rapidapi.com, subscribe to the Twttr API, use the `X-RapidAPI-Key` header.

### Key Endpoints

#### Trending Topics by Location
```
GET https://twttrapi.p.rapidapi.com/get-trends
  ?location=united states

Headers:
  X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
  X-RapidAPI-Host: twttrapi.p.rapidapi.com
```

#### Search Tweets (for keyword velocity)
```
GET https://twttrapi.p.rapidapi.com/search-top
  ?query=YOUR_KEYWORD

Headers:
  X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
  X-RapidAPI-Host: twttrapi.p.rapidapi.com
```

#### Latest Tweets (real-time signal)
```
GET https://twttrapi.p.rapidapi.com/search-latest
  ?query=YOUR_KEYWORD
```

### Python Example
```python
import requests

headers = {
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "twttrapi.p.rapidapi.com"
}

# Get trending topics
response = requests.get(
    "https://twttrapi.p.rapidapi.com/get-trends",
    headers=headers,
    params={"location": "united states"}
)
trends = response.json()

for trend in trends:
    print(trend.get("name"), trend.get("tweet_count"))
```

---

## 6. Instagram — RapidAPI

**Important limitation:** Instagram has no official trending endpoint. The best proxy for trend data is tracking hashtag post volume and engagement over time.

**Recommended API:** "Instagram Scraper Stable API" by RockSolid APIs on RapidAPI  
**URL:** rapidapi.com → search "Instagram Scraper Stable API"

### Authentication
Sign up at rapidapi.com, subscribe, use the `X-RapidAPI-Key` header.

### Key Endpoints for Trend Proxying

#### Hashtag Info + Post Count
```
GET https://instagram-scraper-stable-api.p.rapidapi.com/v1/hashtag
  ?hashtag=YOUR_HASHTAG

Headers:
  X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
  X-RapidAPI-Host: instagram-scraper-stable-api.p.rapidapi.com
```

Returns: total post count, recent posts, top posts — polling this over time shows if a hashtag is growing.

#### Recent Posts for a Hashtag
```
GET https://instagram-scraper-stable-api.p.rapidapi.com/v1/hashtag_posts_recent
  ?hashtag=YOUR_HASHTAG
```

### Trend Strategy for Instagram
Since there's no trending feed, use this approach:
1. Take a keyword/topic you're tracking on other platforms
2. Poll the hashtag endpoint every 30–60 minutes
3. Track the `media_count` over time — a rising count indicates trend emergence

### Python Example
```python
import requests

headers = {
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "instagram-scraper-stable-api.p.rapidapi.com"
}

response = requests.get(
    "https://instagram-scraper-stable-api.p.rapidapi.com/v1/hashtag",
    headers=headers,
    params={"hashtag": "yourkeyword"}
)
data = response.json()
print("Post count:", data.get("media_count"))
```

---

## Setup Summary

| Platform | API Provider | Auth Method | Free Tier | Best Trend Signal |
|---|---|---|---|---|
| Google Trends | SerpApi | API key (query param) | 250 req/month | `TIMESERIES` + Trending Now |
| YouTube | Google (Official) | API key (query param) | 10,000 units/day | `chart=mostPopular` |
| TikTok | RapidAPI (apibox) | RapidAPI key (header) | Limited free tier | `/feed/trending` |
| Reddit | Reddit (Official) | OAuth2 Bearer token | 100 req/min | `/r/all/rising` |
| X / Twitter | RapidAPI (Twttr) | RapidAPI key (header) | Limited free tier | `/get-trends` |
| Instagram | RapidAPI (RockSolid) | RapidAPI key (header) | Limited free tier | Hashtag post count (proxy) |

### Environment Variables (recommended setup)
```env
SERPAPI_KEY=your_serpapi_key
YOUTUBE_API_KEY=your_youtube_key
RAPIDAPI_KEY=your_rapidapi_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

### Install Dependencies
```bash
pip install requests python-dotenv
```

### Load Keys in Python
```python
import os
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
```

---

## Notes for Trend Speed Comparison

- **Timestamps matter most.** Always store the UTC timestamp alongside every data point you collect.
- **Poll on a consistent interval.** Every 30–60 minutes during your hackathon is sufficient to show velocity curves.
- **Normalize scores.** Each platform uses different scales (0–100, raw counts, scores). Normalize to % of peak for fair cross-platform comparison.
- **Reddit `created_utc`** gives you exact post creation time — the most precise timestamp of any platform here.
- **Google Trends `now 7-d`** gives hourly granularity — use this date range for the tightest time resolution.
- **TikTok and Reddit** will likely surface trends earliest. **Google Trends** will confirm them last.