import { NextResponse } from 'next/server'
import { initializeHuntingLLM, HuntingLLMTrainer } from '@/lib/llm-trainer'
import { HuntingDataScraper } from '@/lib/data-scraper'

export async function GET() {
  try {
    console.log('🚀 Starting Hunting LLM initialization...')

    // Initialize the training system
    await initializeHuntingLLM()

    // Get training requirements
    const trainer = new HuntingLLMTrainer()
    await trainer.prepareTrainingData()
    const requirements = trainer.getTrainingRequirements()

    return NextResponse.json({
      success: true,
      message: 'Hunting LLM training system initialized!',
      requirements,
      nextSteps: [
        'Data collection is ready',
        'Training data format prepared',
        'Ready to begin LLM training',
        'Contact Replicate/Modal for training setup'
      ],
      files: [
        '/tmp/claude/hunting-llm-training-data.json',
        '/tmp/claude/hunting-llm-training-data.jsonl'
      ]
    })

  } catch (error) {
    console.error('LLM initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize LLM system' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    console.log('🦌 Starting hunting knowledge data collection...')

    // Start data scraping process
    const scraper = new HuntingDataScraper()
    await scraper.scrapeAllSources()

    return NextResponse.json({
      success: true,
      message: 'Hunting knowledge collection started!',
      status: 'Data scraping in progress...',
      note: 'This will collect hunting knowledge from forums, research papers, and wildlife sources'
    })

  } catch (error) {
    console.error('Data collection error:', error)
    return NextResponse.json(
      { error: 'Failed to start data collection' },
      { status: 500 }
    )
  }
}