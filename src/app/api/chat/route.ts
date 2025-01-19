import { openai } from "@ai-sdk/openai"
import { anthropic } from '@ai-sdk/anthropic'
import { groq } from '@ai-sdk/groq'
import { mistral } from '@ai-sdk/mistral'
import { streamText, generateText } from "ai"
import { NextResponse } from "next/server"

// Types
type AIProvider = 'openai' | 'anthropic' | 'groq' | 'mistral'
type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string
  id?: string
}

interface ChatRequestBody {
  messages: Message[]
  provider?: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
}

// Configuration
const DEFAULT_PROVIDER = 'mistral'
const MODELS = {
  openai: 'gpt-4-turbo',
  anthropic: 'claude-3-opus-20240229',
  groq: 'mixtral-8x7b-32768',
  mistral: 'mistral-large-latest'
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Parse and validate request
    const body: ChatRequestBody = await req.json()
    const { 
      messages, 
      provider = DEFAULT_PROVIDER,
      model = MODELS[provider],
      temperature = 0.7,
      maxTokens = 4096
    } = body

    console.log(`Request: ${JSON.stringify({ messages, provider, model }, null, 2)}`)

    // Select provider
    const providerMap = {
      openai: () => openai(model),
      anthropic: () => anthropic(model),
      groq: () => groq(model),
      mistral: () => mistral(model)
    }

    const selectedProvider = providerMap[provider]()
    if (!selectedProvider) {
      throw new Error(`Invalid provider: ${provider}`)
    }

    // Stream response
    const result = await streamText({
      model: selectedProvider,
      messages,
      temperature,
      maxTokens
    })

    console.log('Response initiated from AI provider')

   

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('Error in chat endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}