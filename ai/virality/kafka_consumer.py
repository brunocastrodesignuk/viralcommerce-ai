"""
Viral Score Kafka Consumer
Reads raw video events from Kafka, scores them, and publishes results.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timezone

from confluent_kafka import Consumer, KafkaError, Producer

from ai.virality.scorer import VideoSnapshot, ViralityScorer

log = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_IN = os.environ.get("KAFKA_TOPIC_VIDEOS", "viral.videos.raw")
TOPIC_OUT = os.environ.get("KAFKA_TOPIC_SCORES", "viral.scores.computed")
VIRAL_THRESHOLD = float(os.environ.get("VIRAL_SCORE_THRESHOLD", "70"))


def run_consumer():
    scorer = ViralityScorer()

    consumer = Consumer({
        "bootstrap.servers": KAFKA_BOOTSTRAP,
        "group.id": "virality-scorer-v1",
        "auto.offset.reset": "latest",
        "enable.auto.commit": True,
        "max.poll.interval.ms": 300000,
    })
    producer = Producer({"bootstrap.servers": KAFKA_BOOTSTRAP})

    consumer.subscribe([TOPIC_IN])
    log.info(f"Virality scorer consuming from {TOPIC_IN}")

    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                log.error(f"Kafka error: {msg.error()}")
                continue

            try:
                raw = json.loads(msg.value().decode("utf-8"))
                snapshot = VideoSnapshot(
                    video_id=f"{raw['platform']}:{raw['external_id']}",
                    platform=raw["platform"],
                    views=raw.get("views", 0),
                    likes=raw.get("likes", 0),
                    shares=raw.get("shares", 0),
                    comments=raw.get("comments", 0),
                    recorded_at=datetime.now(timezone.utc),
                    author_followers=raw.get("author_followers", 0),
                )

                score = scorer.score_single(snapshot)
                result = {**raw, **score.to_dict()}

                # Publish to scores topic
                producer.produce(
                    TOPIC_OUT,
                    key=msg.key(),
                    value=json.dumps(result).encode(),
                )
                producer.poll(0)

                if score.is_viral:
                    log.info(
                        f"VIRAL DETECTED platform={raw['platform']} "
                        f"score={score.total_score} views={raw.get('views')}"
                    )

            except (KeyError, ValueError, json.JSONDecodeError) as e:
                log.warning(f"Failed to process message: {e}")

    finally:
        consumer.close()
        producer.flush()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_consumer()
