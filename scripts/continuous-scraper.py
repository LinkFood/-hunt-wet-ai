#!/usr/bin/env python3
"""
Hunt Wet AI - Continuous Data Collection
Runs 24/7 collecting hunting knowledge for LLM training
"""

import time
import schedule
import json
import os
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from hunt_wet_llm_scraper import HuntWetDataScraper

class ContinuousHuntingDataCollector:
    def __init__(self):
        self.scraper = HuntWetDataScraper()
        self.total_collected = 0
        self.target_entries = 100000  # 100K entries for world-class LLM

    def run_collection_cycle(self):
        """Run one complete collection cycle"""
        print(f"🦌 Starting collection cycle at {time.strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            # Run full data collection
            self.scraper.run_full_collection()

            # Update totals
            with open('hunt_wet_training_data.json', 'r') as f:
                data = json.load(f)
                current_count = len(data)
                self.total_collected = current_count

            print(f"📊 Total collected: {self.total_collected:,} / {self.target_entries:,}")
            print(f"📈 Progress: {(self.total_collected/self.target_entries)*100:.1f}%")

            # Save progress
            self.save_progress()

            if self.total_collected >= self.target_entries:
                print("🎉 TARGET REACHED! 100K hunting knowledge entries collected!")
                print("Ready to train Hunt Wet LLM!")
                return True

        except Exception as e:
            print(f"❌ Collection error: {e}")

        return False

    def save_progress(self):
        """Save collection progress"""
        progress = {
            'total_collected': self.total_collected,
            'target': self.target_entries,
            'progress_percent': (self.total_collected/self.target_entries)*100,
            'last_updated': time.strftime('%Y-%m-%d %H:%M:%S'),
            'ready_for_training': self.total_collected >= 10000  # Minimum for decent LLM
        }

        with open('hunt_wet_progress.json', 'w') as f:
            json.dump(progress, f, indent=2)

    def run_continuous(self):
        """Run continuous data collection"""
        print("🚀 HUNT WET CONTINUOUS DATA COLLECTION STARTING")
        print(f"🎯 Target: {self.target_entries:,} hunting knowledge entries")
        print("⏰ Collection schedule:")
        print("  • Every 2 hours: Forum posts")
        print("  • Every 6 hours: Research papers")
        print("  • Every 12 hours: Weather correlations")

        # Schedule different collection types
        schedule.every(2).hours.do(self.collect_forums)
        schedule.every(6).hours.do(self.collect_research)
        schedule.every(12).hours.do(self.collect_weather)

        # Run initial collection
        if self.run_collection_cycle():
            return

        print("🔄 Starting continuous collection...")

        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute

                # Check if target reached
                if self.total_collected >= self.target_entries:
                    print("🎉 100K HUNTING ENTRIES COLLECTED!")
                    print("🤖 Ready to train Hunt Wet LLM!")
                    break

            except KeyboardInterrupt:
                print("\n⛔ Collection stopped by user")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                time.sleep(300)  # Wait 5 minutes before retry

    def collect_forums(self):
        """Collect from hunting forums"""
        print("📝 Collecting from hunting forums...")
        self.scraper.scrape_hunting_forums()

    def collect_research(self):
        """Collect research papers"""
        print("🔬 Collecting research papers...")
        self.scraper.scrape_research_papers()

    def collect_weather(self):
        """Collect weather correlations"""
        print("🌤️ Collecting weather correlations...")
        self.scraper.scrape_weather_correlations()

if __name__ == "__main__":
    collector = ContinuousHuntingDataCollector()
    collector.run_continuous()