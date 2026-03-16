"""
Scrapy Item definitions for ViralCommerce AI crawler
"""
import scrapy


class VideoItem(scrapy.Item):
    platform        = scrapy.Field()
    external_id     = scrapy.Field()
    url             = scrapy.Field()
    title           = scrapy.Field()
    caption         = scrapy.Field()
    hashtags        = scrapy.Field()
    views           = scrapy.Field()
    likes           = scrapy.Field()
    shares          = scrapy.Field()
    comments        = scrapy.Field()
    author_handle   = scrapy.Field()
    author_followers = scrapy.Field()
    thumbnail_url   = scrapy.Field()
    duration_sec    = scrapy.Field()
    published_at    = scrapy.Field()
    source          = scrapy.Field()
    viral_score     = scrapy.Field()  # computed by pipeline


class ProductDetectionItem(scrapy.Item):
    video_id        = scrapy.Field()
    product_name    = scrapy.Field()
    category        = scrapy.Field()
    confidence      = scrapy.Field()
    bbox            = scrapy.Field()
    frame_timestamp = scrapy.Field()
    embedding       = scrapy.Field()
